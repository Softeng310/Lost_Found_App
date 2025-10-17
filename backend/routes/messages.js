const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const authenticate = require('../middleware/auth');

const db = admin.firestore();

// Helper: fetch item data by id (returns null if missing)
const getItemData = async (itemId) => {
  if (!itemId) return null;
  try {
    const itemDoc = await db.collection('items').doc(itemId).get();
    if (!itemDoc.exists) return null;
    return { id: itemDoc.id, ...itemDoc.data() };
  } catch (error) {
    console.error('Error fetching item:', error);
    return null;
  }
};

// Helper: fetch user display/name/email fallback
const getUserDisplayName = async (uid) => {
  if (!uid) return 'Unknown User';
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return 'Unknown User';
    const userData = userDoc.data();
    return userData.displayName || userData.name || userData.email || 'Unknown User';
  } catch (error) {
    console.error('Error fetching user:', error);
    return 'Unknown User';
  }
};

// Helper: collect item IDs that were found before the cutoff timestamp
const collectItemIdsToCleanup = (foundItemsSnapshot, cutoffTimestamp) => {
  const itemIds = [];
  for (const doc of foundItemsSnapshot.docs) {
    const data = doc.data();
    const foundDate = data.foundDate;
    if (foundDate && foundDate.seconds && foundDate.seconds <= cutoffTimestamp.seconds) {
      itemIds.push(doc.id);
    }
  }
  return itemIds;
};

// Helper: add deletions for conversations and messages related to the given item IDs to the provided batch
const addDeletionsForItemIds = async (itemIds, batch) => {
  for (const itemId of itemIds) {
    const conversationsQuery = db.collection('conversations').where('itemId', '==', itemId);
    const conversationsSnapshot = await conversationsQuery.get();

    for (const conversationDoc of conversationsSnapshot.docs) {
      // Delete messages for this conversation
      const messagesQuery = db.collection('messages').where('conversationId', '==', conversationDoc.id);
      const messagesSnapshot = await messagesQuery.get();

      for (const messageDoc of messagesSnapshot.docs) {
        batch.delete(messageDoc.ref);
      }

      // Delete the conversation
      batch.delete(conversationDoc.ref);
    }
  }
};

// Auto-cleanup function to delete conversations for items marked as found 24 hours ago
const autoCleanupFoundItems = async () => {
  // Disabled: auto-cleanup based on 'found' status is no longer performed.
  console.log('autoCleanupFoundItems: disabled by configuration (no-op)');
  return { cleaned: 0, items: [] };
};

// Get all conversations for a user
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const conversationsQuery = db.collection('conversations')
      .where('participants', 'array-contains', userId)
      .orderBy('lastMessageTime', 'desc');
    
    const snapshot = await conversationsQuery.get();
    const conversations = [];
    
    for (const doc of snapshot.docs) {
      const conversationData = doc.data();

      // Fetch related item and other participant's display name using helpers
      const itemData = conversationData.itemId ? await getItemData(conversationData.itemId) : null;
      const otherParticipantId = conversationData.participants.find(id => id !== userId);
      const otherParticipantName = otherParticipantId ? await getUserDisplayName(otherParticipantId) : 'Unknown User';

      conversations.push({
        id: doc.id,
        ...conversationData,
        item: itemData,
        otherParticipantName
      });
    }
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.uid;
    
    // Verify user is part of this conversation
    const conversationDoc = await db.collection('conversations').doc(conversationId).get();
    if (!conversationDoc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const conversationData = conversationDoc.data();
    if (!conversationData.participants.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const messagesQuery = db.collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('timestamp', 'asc');
    
    const snapshot = await messagesQuery.get();
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const userId = req.user.uid;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    // Verify user is part of this conversation
    const conversationDoc = await db.collection('conversations').doc(conversationId).get();
    if (!conversationDoc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const conversationData = conversationDoc.data();
    if (!conversationData.participants.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get user info for the message
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const senderName = userData.displayName || userData.name || userData.email || 'Anonymous';
    
    const batch = db.batch();
    
    // Add the message
    const messageRef = db.collection('messages').doc();
    batch.set(messageRef, {
      conversationId,
      senderId: userId,
      senderName,
      text: text.trim(),
      timestamp: admin.firestore.Timestamp.now()
    });
    
    // Update conversation's last message info
    const conversationRef = db.collection('conversations').doc(conversationId);
    batch.update(conversationRef, {
      lastMessage: text.trim(),
      lastMessageTime: admin.firestore.Timestamp.now(),
      lastMessageSender: userId
    });
    
    await batch.commit();
    
    res.json({ success: true, messageId: messageRef.id });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Start a conversation about an item
router.post('/conversations', authenticate, async (req, res) => {
  try {
    const { itemId, otherUserId } = req.body;
    const userId = req.user.uid;
    
    if (!itemId || !otherUserId) {
      return res.status(400).json({ error: 'itemId and otherUserId are required' });
    }
    
    if (userId === otherUserId) {
      return res.status(400).json({ error: 'Cannot start conversation with yourself' });
    }
    
    // Check if conversation already exists
    const existingConversationQuery = db.collection('conversations')
      .where('itemId', '==', itemId)
      .where('participants', 'array-contains', userId);
    
    const existingSnapshot = await existingConversationQuery.get();
    
    for (const doc of existingSnapshot.docs) {
      const data = doc.data();
      if (data.participants.includes(otherUserId)) {
        return res.json({ conversationId: doc.id, exists: true });
      }
    }
    
    // Create new conversation
    const conversationRef = db.collection('conversations').doc();
    await conversationRef.set({
      itemId,
      participants: [userId, otherUserId],
      createdAt: admin.firestore.Timestamp.now(),
      lastMessage: '',
      lastMessageTime: admin.firestore.Timestamp.now(),
      lastMessageSender: null
    });
    
    res.json({ conversationId: conversationRef.id, exists: false });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// Mark item as retrieved and cleanup conversation
router.delete('/conversations/:conversationId/mark-retrieved', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.uid;
    
    // Verify user is part of this conversation
    const conversationDoc = await db.collection('conversations').doc(conversationId).get();
    if (!conversationDoc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const conversationData = conversationDoc.data();
    if (!conversationData.participants.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Feature disabled: marking retrieved / deleting conversations is not supported.
    // Return 204 No Content to indicate action is intentionally ignored.
    return res.status(204).json({ success: false, message: 'mark-retrieved disabled by server configuration' });
  } catch (error) {
    console.error('Error marking item as retrieved:', error);
    res.status(500).json({ error: 'Failed to mark item as retrieved' });
  }
});

// Auto-cleanup of 'found' items has been disabled because items are marked 'found' only at creation time.

module.exports = router;
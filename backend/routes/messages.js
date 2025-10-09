const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const authenticate = require('../middleware/auth');

const db = admin.firestore();

// Auto-cleanup function to delete conversations for items marked as found 24 hours ago
const autoCleanupFoundItems = async () => {
  try {
    const twentyFourHoursAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    // First, find items that are marked as found (without the compound query)
    const foundItemsQuery = db.collection('items').where('status', '==', 'found');
    const foundItemsSnapshot = await foundItemsQuery.get();
    
    if (foundItemsSnapshot.empty) {
      return;
    }

    const batch = db.batch();
    const itemIds = [];

    // Filter items that were found 5+ minutes ago
    foundItemsSnapshot.forEach(doc => {
      const data = doc.data();
      const foundDate = data.foundDate;
      
      // Check if foundDate exists and is older than 24 hours
      if (foundDate && foundDate.seconds && foundDate.seconds <= twentyFourHoursAgo.seconds) {
        itemIds.push(doc.id);
      }
    });

    if (itemIds.length === 0) {
      return;
    }

    // Find conversations for these items and delete them
    for (const itemId of itemIds) {
      const conversationsQuery = db.collection('conversations').where('itemId', '==', itemId);
      const conversationsSnapshot = await conversationsQuery.get();
      
      for (const conversationDoc of conversationsSnapshot.docs) {
        // Delete messages for this conversation
        const messagesQuery = db.collection('messages').where('conversationId', '==', conversationDoc.id);
        const messagesSnapshot = await messagesQuery.get();
        
        messagesSnapshot.forEach(messageDoc => {
          batch.delete(messageDoc.ref);
        });
        
        // Delete the conversation
        batch.delete(conversationDoc.ref);
      }
    }

    await batch.commit();
    if (itemIds.length > 0) {
      console.log(`Cleaned up ${itemIds.length} conversation(s) for items found 24+ hours ago`);
    }
  } catch (error) {
    console.error('Error in auto cleanup:', error);
  }
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
      
      // Get item details
      let itemData = null;
      if (conversationData.itemId) {
        try {
          const itemDoc = await db.collection('items').doc(conversationData.itemId).get();
          if (itemDoc.exists) {
            itemData = { id: itemDoc.id, ...itemDoc.data() };
          }
        } catch (error) {
          console.error('Error fetching item:', error);
        }
      }
      
      // Get other participant's info
      const otherParticipantId = conversationData.participants.find(id => id !== userId);
      let otherParticipantName = 'Unknown User';
      
      if (otherParticipantId) {
        try {
          const userDoc = await db.collection('users').doc(otherParticipantId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            otherParticipantName = userData.displayName || userData.name || userData.email || 'Unknown User';
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }
      
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
    
    const batch = db.batch();
    
    // Update item status if it exists
    if (conversationData.itemId) {
      const itemRef = db.collection('items').doc(conversationData.itemId);
      batch.update(itemRef, {
        status: 'found',
        kind: 'found',
        foundDate: admin.firestore.Timestamp.now()
      });
    }
    
    // Delete all messages in this conversation
    const messagesQuery = db.collection('messages').where('conversationId', '==', conversationId);
    const messagesSnapshot = await messagesQuery.get();
    messagesSnapshot.forEach(messageDoc => {
      batch.delete(messageDoc.ref);
    });
    
    // Delete the conversation
    batch.delete(conversationDoc.ref);
    
    await batch.commit();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking item as retrieved:', error);
    res.status(500).json({ error: 'Failed to mark item as retrieved' });
  }
});

// Run cleanup every hour
setInterval(autoCleanupFoundItems, 60 * 60 * 1000); // 1 hour

// Also run cleanup on startup
autoCleanupFoundItems();

module.exports = router;
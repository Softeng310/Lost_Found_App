const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const authenticateToken = require('../middleware/auth');

// Get user's notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const db = admin.firestore();
    const prefsDoc = await db.collection('notificationPreferences').doc(req.user.uid).get();
    
    if (!prefsDoc.exists) {
      return res.json({ keywords: [], categories: [], emailEnabled: false });
    }
    
    res.json(prefsDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification preferences
router.post('/preferences', authenticateToken, async (req, res) => {
  try {
    const db = admin.firestore();
    const { keywords, categories, emailEnabled } = req.body;
    
    await db.collection('notificationPreferences').doc(req.user.uid).set({
      keywords: keywords || [],
      categories: categories || [],
      emailEnabled: emailEnabled || false,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('notifications')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const db = admin.firestore();
    await db.collection('notifications').doc(req.params.id).update({
      read: true,
      readAt: new Date().toISOString()
    });
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dismiss notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = admin.firestore();
    await db.collection('notifications').doc(req.params.id).delete();
    res.json({ message: 'Notification dismissed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
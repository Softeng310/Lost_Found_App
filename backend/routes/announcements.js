const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const authenticate = require('../middleware/auth');

// Middleware to check if user has staff role
const checkStaffRole = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const uid = req.user.uid;
    
    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User profile does not exist'
      });
    }
    
    const userData = userDoc.data();
    
    // Check if user has staff role
    if (userData.role !== 'staff') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Only staff members can perform this action'
      });
    }
    
    next();
  } catch (error) {
    console.error('❌ Error checking staff role:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to verify permissions'
    });
  }
};

// Validation for announcement input
const validateAnnouncementInput = (req, res, next) => {
  const { title, announcement } = req.body;
  const validationErrors = [];

  if (!title || typeof title !== 'string') {
    validationErrors.push('Title is required and must be a string');
  } else if (title.trim().length < 3) {
    validationErrors.push('Title must be at least 3 characters long');
  } else if (title.trim().length > 100) {
    validationErrors.push('Title must be no more than 100 characters long');
  }

  if (!announcement || typeof announcement !== 'string') {
    validationErrors.push('Announcement is required and must be a string');
  } else if (announcement.trim().length < 10) {
    validationErrors.push('Announcement must be at least 10 characters long');
  } else if (announcement.trim().length > 1000) {
    validationErrors.push('Announcement must be no more than 1000 characters long');
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: 'Please check your input',
      details: validationErrors
    });
  }

  next();
};

// GET /api/announcements - Get all announcements (public)
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const announcementsSnapshot = await db.collection('announcements')
      .orderBy('datePosted', 'desc')
      .limit(50)
      .get();

    const announcements = announcementsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ 
      announcements,
      count: announcements.length
    });
  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to fetch announcements'
    });
  }
});

// GET /api/announcements/:id - Get a specific announcement (public)
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    const announcementDoc = await db.collection('announcements').doc(id).get();
    
    if (!announcementDoc.exists) {
      return res.status(404).json({ 
        error: 'Announcement not found',
        message: 'The requested announcement does not exist'
      });
    }

    res.json({
      id: announcementDoc.id,
      ...announcementDoc.data()
    });
  } catch (error) {
    console.error('❌ Error fetching announcement:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to fetch announcement'
    });
  }
});

// POST /api/announcements - Create a new announcement (staff only)
router.post('/', 
  authenticate,
  checkStaffRole,
  validateAnnouncementInput,
  async (req, res) => {
    try {
      const db = req.app.locals.db;
      const { title, announcement } = req.body;
      const uid = req.user.uid;

      console.log('📝 Creating new announcement:', { title, uid });

      const announcementData = {
        title: title.trim(),
        announcement: announcement.trim(),
        datePosted: new Date().toISOString(),
        postedBy: uid,
        postedByEmail: req.user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('announcements').add(announcementData);

      console.log('✅ Announcement created successfully:', docRef.id);

      res.status(201).json({ 
        message: 'Announcement created successfully!',
        id: docRef.id
      });

    } catch (error) {
      console.error('❌ Error creating announcement:', error);
      res.status(500).json({ 
        error: 'Server error',
        message: 'Failed to create announcement. Please try again.'
      });
    }
  }
);

// PUT /api/announcements/:id - Update an announcement (staff only)
router.put('/:id', 
  authenticate,
  checkStaffRole,
  validateAnnouncementInput,
  async (req, res) => {
    try {
      const db = req.app.locals.db;
      const { id } = req.params;
      const { title, announcement } = req.body;
      const uid = req.user.uid;

      console.log('📝 Updating announcement:', { id, title, uid });

      const announcementRef = db.collection('announcements').doc(id);
      const announcementDoc = await announcementRef.get();

      if (!announcementDoc.exists) {
        return res.status(404).json({ 
          error: 'Announcement not found',
          message: 'The announcement you are trying to update does not exist'
        });
      }

      await announcementRef.update({
        title: title.trim(),
        announcement: announcement.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: uid
      });

      console.log('✅ Announcement updated successfully:', id);

      res.json({ 
        message: 'Announcement updated successfully!',
        id
      });

    } catch (error) {
      console.error('❌ Error updating announcement:', error);
      res.status(500).json({ 
        error: 'Server error',
        message: 'Failed to update announcement. Please try again.'
      });
    }
  }
);

// DELETE /api/announcements/:id - Delete an announcement (staff only)
router.delete('/:id', 
  authenticate,
  checkStaffRole,
  async (req, res) => {
    try {
      const db = req.app.locals.db;
      const { id } = req.params;
      const uid = req.user.uid;

      console.log('🗑️ Deleting announcement:', { id, uid });

      const announcementRef = db.collection('announcements').doc(id);
      const announcementDoc = await announcementRef.get();

      if (!announcementDoc.exists) {
        return res.status(404).json({ 
          error: 'Announcement not found',
          message: 'The announcement you are trying to delete does not exist'
        });
      }

      await announcementRef.delete();

      console.log('✅ Announcement deleted successfully:', id);

      res.json({ 
        message: 'Announcement deleted successfully!',
        id
      });

    } catch (error) {
      console.error('❌ Error deleting announcement:', error);
      res.status(500).json({ 
        error: 'Server error',
        message: 'Failed to delete announcement. Please try again.'
      });
    }
  }
);

module.exports = router;

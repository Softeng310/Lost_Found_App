const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const cloudinary = require('../cloudinary');
const authenticate = require('../middleware/auth');

// Configuration constants
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  CLOUDINARY_FOLDER: 'lost-and-found'
};

const VALIDATION_RULES = {
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 1000
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE
  },
  fileFilter: (req, file, callback) => {
    if (UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error(`Invalid file type. Allowed types: ${UPLOAD_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`));
    }
  }
});

// Input validation middleware
const validateItemInput = (req, res, next) => {
  const { title, description, type, location, date, status } = req.body;
  const validationErrors = [];

  // Validate title
  if (!title || typeof title !== 'string') {
    validationErrors.push('Title is required and must be a string');
  } else if (title.trim().length < VALIDATION_RULES.TITLE_MIN_LENGTH) {
    validationErrors.push(`Title must be at least ${VALIDATION_RULES.TITLE_MIN_LENGTH} characters long`);
  } else if (title.trim().length > VALIDATION_RULES.TITLE_MAX_LENGTH) {
    validationErrors.push(`Title must be no more than ${VALIDATION_RULES.TITLE_MAX_LENGTH} characters long`);
  }

  // Validate description
  if (!description || typeof description !== 'string') {
    validationErrors.push('Description is required and must be a string');
  } else if (description.trim().length < VALIDATION_RULES.DESCRIPTION_MIN_LENGTH) {
    validationErrors.push(`Description must be at least ${VALIDATION_RULES.DESCRIPTION_MIN_LENGTH} characters long`);
  } else if (description.trim().length > VALIDATION_RULES.DESCRIPTION_MAX_LENGTH) {
    validationErrors.push(`Description must be no more than ${VALIDATION_RULES.DESCRIPTION_MAX_LENGTH} characters long`);
  }

  // Validate type/category
  if (!type || typeof type !== 'string') {
    validationErrors.push('Category is required and must be a string');
  }

  // Validate location
  if (!location || typeof location !== 'string') {
    validationErrors.push('Location is required and must be a string');
  }

  // Validate date
  if (!date || typeof date !== 'string') {
    validationErrors.push('Date is required and must be a string');
  } else {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      validationErrors.push('Date must be a valid date string');
    } else if (parsedDate > new Date()) {
      validationErrors.push('Date cannot be in the future');
    }
  }

  // Validate status
  if (!status || !['lost', 'found'].includes(status)) {
    validationErrors.push('Status must be either "lost" or "found"');
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

// Cloudinary upload utility function
const uploadToCloudinary = async (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: UPLOAD_CONFIG.CLOUDINARY_FOLDER,
        public_id: uuidv4(),
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary upload successful:', result.public_id);
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
};

// Get user document reference
const getUserDocumentRef = async (db, uid) => {
  try {
    // Try to get user by document ID first
    let userDocRef = db.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    if (userSnap.exists) {
      return userDocRef;
    }

    // Fallback: search by uid field
    const userQuery = await db.collection('users').where('uid', '==', uid).limit(1).get();
    
    if (userQuery.empty) {
      throw new Error('User profile not found');
    }
    
    return userQuery.docs[0].ref;
  } catch (error) {
    console.error('Error getting user document reference:', error);
    throw new Error('Failed to retrieve user profile');
  }
};

// POST /api/items - Create new item
router.post('/', 
  authenticate, 
  upload.single('image'), 
  validateItemInput,
  async (req, res) => {
    try {
      const db = req.app.locals.db;
      const { title, description, type, location, date, status } = req.body;
      const uid = req.user.uid;

      console.log('📝 Creating new item:', { title, type, location, status, uid });

      // Validate image upload
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Image required',
          message: 'Please upload an image for the item'
        });
      }

      // Get user document reference
      const userDocRef = await getUserDocumentRef(db, uid);

      // Upload image to Cloudinary
      let imageURL = null;
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        imageURL = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError);
        return res.status(500).json({ 
          error: 'Image upload failed',
          message: 'Failed to upload image. Please try again.'
        });
      }

      // Create Firestore timestamp
      const timestamp = admin.firestore.Timestamp.fromDate(new Date(date));

      // Prepare item data
      const itemData = {
        title: title.trim(),
        description: description.trim(),
        type,
        location,
        date: timestamp,
        status,
        imageURL,
        postedBy: userDocRef,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Save to Firestore
      const docRef = await db.collection('items').add(itemData);

      console.log('✅ Item created successfully:', docRef.id);

      res.status(201).json({ 
        message: 'Item created successfully!',
        id: docRef.id,
        imageURL
      });

    } catch (error) {
      console.error('❌ Error creating item:', error);
      
      if (error.message === 'User profile not found') {
        return res.status(400).json({ 
          error: 'User profile not found',
          message: 'Please complete your profile before posting items'
        });
      }

      if (error.message === 'Failed to retrieve user profile') {
        return res.status(500).json({ 
          error: 'Database error',
          message: 'Failed to retrieve user information. Please try again.'
        });
      }

      res.status(500).json({ 
        error: 'Server error',
        message: 'Failed to create item. Please try again.'
      });
    }
  }
);

// GET /api/items - Get all items (for future use)
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const itemsSnapshot = await db.collection('items')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const items = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ 
      items,
      count: items.length
    });
  } catch (error) {
    console.error('❌ Error fetching items:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to fetch items'
    });
  }
});

// GET /api/items/:id - Get specific item (for future use)
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    const itemDoc = await db.collection('items').doc(id).get();
    
    if (!itemDoc.exists) {
      return res.status(404).json({ 
        error: 'Item not found',
        message: 'The requested item does not exist'
      });
    }

    res.json({
      id: itemDoc.id,
      ...itemDoc.data()
    });
  } catch (error) {
    console.error('❌ Error fetching item:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to fetch item'
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../cloudinary');
const authenticate = require('../middleware/auth');

// Configurations for profile pic uploads
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB max for profile pics
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  CLOUDINARY_FOLDER: 'profile-pictures'
};

// Multer to handle file uploads from users with multipart/form-data
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE
  },
  fileFilter: (req, file, callback) => {
    if (UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error(`Invalid file type. Allowed: ${UPLOAD_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`));
    }
  }
});

// Upload profile pic to Cloudinary
const uploadToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: UPLOAD_CONFIG.CLOUDINARY_FOLDER,
        public_id: uuidv4(),
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Profile picture uploaded:', result.public_id);
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
};

// POST /api/users/upload-profile-picture - Upload profile pic
router.post('/upload-profile-picture', upload.single('profilePic'), async (req, res) => {
  try {
    console.log('Profile picture upload request received');
    
    // File validation
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ 
        error: 'No file provided',
        message: 'Please select an image to upload'
      });
    }

    console.log('File received:', {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const result = await uploadToCloudinary(req.file.buffer);
    console.log('Upload successful:', result.secure_url);

    // Return OK with image URL and public ID
    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ 
        error: 'Invalid file type',
        message: error.message
      });
    }
    
    if (error.message.includes('File too large')) {
      return res.status(400).json({ 
        error: 'File too large',
        message: `Maximum file size is ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    
    // Return detailed error message
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message || 'Failed to upload profile picture. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

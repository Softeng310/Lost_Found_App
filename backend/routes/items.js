const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const cloudinary = require('../cloudinary');
const authenticate = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit to 5MB
  }
});

router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const db = req.app.locals.db;

    const {
      title,
      description,
      type,
      location,
      date,
      status
    } = req.body;

    if (!title || !description || !type || !location || !date || !status) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const timestamp = admin.firestore.Timestamp.fromDate(new Date(date));
    let imageURL = "https://via.placeholder.com/300"; // default fallback

    const uid = req.user.uid;

    // If your users collection uses doc IDs == uid (recommended):
    let userDocRef = db.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      // Fallback if your users docs have random IDs but store { uid: <uid> } (matches your screenshot)
      const q = await db.collection('users').where('uid', '==', uid).limit(1).get();
      if (q.empty) {
        return res.status(400).json({ message: 'User profile not found for current user.' });
      }
      userDocRef = q.docs[0].ref;
    }

    if (req.file) {
      console.log("📷 Received file:", req.file.originalname);

      const buffer = req.file.buffer;

      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "lost-and-found",
              public_id: uuidv4(),
              resource_type: "image"
            },
            (error, result) => {
              if (error) {
                console.error("❌ Cloudinary upload error:", error);
                reject(error);
              } else {
                console.log("✅ Cloudinary upload result:", result);
                resolve(result);
              }
            }
          );
          stream.end(buffer);
        });
      };

      try {
        const result = await streamUpload(buffer);
        imageURL = result.secure_url; 
      } catch (uploadError) {
        console.error("❌ Error uploading to Cloudinary:", uploadError);
        return res.status(500).json({ message: 'Image upload failed.' });
      }
    } else {
      console.warn("⚠️ No file uploaded");
    }
    // Submit to Firestore
    const docRef = await db.collection('items').add({
      title,
      description,
      type,
      location,
      date: timestamp,
      status,
      imageURL,
      postedBy: userDocRef 
    });

    res.status(201).json({ message: 'Item added!', id: docRef.id });

  } catch (err) {
    console.error("Error saving item:", err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;

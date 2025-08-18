const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('image'), async (req, res) => {
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

    // You can log or validate these
    if (!title || !description || !type || !location || !date || !status) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Optional: convert date to Firestore Timestamp
    const timestamp = admin.firestore.Timestamp.fromDate(new Date(date));

    // For now, use a placeholder imageURL (Imgur or Firebase Storage later)
    const imageURL = "https://via.placeholder.com/300"; // Or generate from Imgur/Firebase

    // Submit to Firestore
    const docRef = await db.collection('items').add({
      title,
      description,
      type,
      location,
      date: timestamp,
      status,
      imageURL,
      postedBy: null // Add user reference later
    });

    res.status(201).json({ message: 'Item added!', id: docRef.id });

  } catch (err) {
    console.error("Error saving item:", err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;

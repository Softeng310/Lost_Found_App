const express = require('express');
const router = express.Router();
const multer = require('multer');
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

    if (!title || !description || !type || !location || !date || !status) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const timestamp = admin.firestore.Timestamp.fromDate(new Date(date));

    // Temporary placeholder — replace with uploaded imageURL later
    const imageURL = "https://via.placeholder.com/300";

    const item = {
      title,
      description,
      type,
      location,
      date: timestamp,
      status,
      imageURL,
      postedBy: null // replace with user ref if login is added
    };

    // ✅ THIS is where the item is uploaded to Firestore:
    const docRef = await db.collection('items').add(item);

    res.status(201).json({ message: 'Item added!', id: docRef.id });
  } catch (error) {
    console.error("Error uploading item:", error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;

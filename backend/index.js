const express = require('express');
const cors = require('cors');
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lost-no-more-3b0d6-default-rtdb.firebaseio.com",
  storageBucket: "lost-no-more-3b0d6.appspot.com"
});


const db = admin.firestore();
app.locals.db = db;


app.use('/api/items', require('./routes/items'));

const PORT = process.env.PORT || 5876;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

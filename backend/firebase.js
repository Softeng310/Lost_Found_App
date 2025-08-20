var admin = require("firebase-admin");

var serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://lost-no-more-3b0d6-default-rtdb.firebaseio.com"
});
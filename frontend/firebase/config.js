// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCrws5-uBthj4GuXPu4CF4Qv4MZ7meepCU",
    authDomain: "lost-no-more-3b0d6.firebaseapp.com",
    databaseURL: "https://lost-no-more-3b0d6-default-rtdb.firebaseio.com",
    projectId: "lost-no-more-3b0d6",
    storageBucket: "lost-no-more-3b0d6.firebasestorage.app",
    messagingSenderId: "449080002390",
    appId: "1:449080002390:web:86e6f45c91e363713038f7",
    measurementId: "G-PE6XPVZZTV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
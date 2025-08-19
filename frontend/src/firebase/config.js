import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration for the web app
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

// Initialize Firebase and Firestore
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);




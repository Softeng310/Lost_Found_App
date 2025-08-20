// modular v9
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// (optional) only if you actually use Firestore in frontend
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCrws5-uBthj4GuXPu4CF4Qv4MZ7meepCU",
  authDomain: "lost-no-more-3b0d6.firebaseapp.com",
  databaseURL: "https://lost-no-more-3b0d6-default-rtdb.firebaseio.com",
  projectId: "lost-no-more-3b0d6",
  storageBucket: "lost-no-more-3b0d6.appspot.com", 
  messagingSenderId: "449080002390",
  appId: "1:449080002390:web:86e6f45c91e363713038f7",
  measurementId: "G-PE6XPVZZTV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);        
const analytics = getAnalytics(app); 

export { app, auth, db, analytics };

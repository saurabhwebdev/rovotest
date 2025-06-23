// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA-BfL2-SfjuJAcIZdD_tSBbgjp4Ci7W1Q",
  authDomain: "truckflow-df4dd.firebaseapp.com",
  projectId: "truckflow-df4dd",
  storageBucket: "truckflow-df4dd.firebasestorage.app",
  messagingSenderId: "407892714504",
  appId: "1:407892714504:web:8e8832176b0a2cf5609dbd",
  measurementId: "G-BMF4BNR7FX"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Analytics conditionally (only in browser)
const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export { app, auth, db, analytics, googleProvider };
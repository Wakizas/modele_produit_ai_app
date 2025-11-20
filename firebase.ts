import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2wWYQjEkJn55tdvxzABtyMseOPXYTDgE",
  authDomain: "afrovibe-aura-studio.firebaseapp.com",
  projectId: "afrovibe-aura-studio",
  storageBucket: "afrovibe-aura-studio.firebasestorage.app",
  messagingSenderId: "637913987014",
  appId: "1:637913987014:web:44b2b78cab38d8f61da4c7",
  measurementId: "G-4H8SDXPRBD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
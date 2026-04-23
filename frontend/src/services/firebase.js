import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const getPapers = async () => {
  try {
    const snapshot = await getDocs(collection(db, "papers"));
    
    // BUG FIX: Spread the data AND include the document ID 
    // This ensures your frontend has a unique key for mapping and filtering
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    // BUG FIX: Catching errors to prevent the app from crashing on network failure
    console.error("Firebase Fetch Error:", error);
    return []; // Return empty array so frontend .map() calls don't fail
  }
};
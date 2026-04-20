import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase"; 

export const fetchPapers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "papers"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error Fetching Papers:", error);
    return [];
  }
};
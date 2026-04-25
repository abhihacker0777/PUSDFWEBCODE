import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase"; 

export const fetchPapers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "papers"));
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        name: data.name || data.title || data.subject || "Untitled Paper",
        specialization: data.specialization || data.spec || "", 
        course: data.course || "",
        year: data.year || "",
        sem: data.sem || data.semester || "",
        exam: data.exam || "",
        link: data.link || data.url || data.driveLink || "#"
      };
    });
  } catch (error) {
    console.error("Error Fetching Papers:", error);
    return [];
  }
};
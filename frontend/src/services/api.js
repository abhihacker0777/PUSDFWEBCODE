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
        // BUG FIX: Standardize 'name' so PaperList links always have text
        name: data.name || data.title || data.subject || "Untitled Paper",
        // BUG FIX: Standardize specialization/spec so Home.jsx filters work
        specialization: data.specialization || data.spec || "", 
        course: data.course || "",
        year: data.year || "",
        // BUG FIX: Standardize 'sem' vs 'semester' naming consistency
        sem: data.sem || data.semester || "",
        exam: data.exam || "",
        // BUG FIX: Ensure 'link' property exists so the PDF buttons work
        link: data.link || data.url || data.driveLink || "#"
      };
    });
  } catch (error) {
    console.error("Error Fetching Papers:", error);
    // Returning an empty array ensures the frontend "Loading" state resolves correctly
    return [];
  }
};
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedAIIntent } from "@/types/paper";

let genAIClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

export async function parseQueryWithGemini(query: string): Promise<ExtractedAIIntent> {
  const client = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "";

  if (!client) {
    throw new Error("Gemini AI client is not configured (GEMINI_API_KEY missing).");
  }

  if (!query.trim()) {
    return {
      intentType: "ADMISSION_OR_GENERAL",
      conversationalReply: "Please enter your query to begin.",
      subjectKeywords: [],
    };
  }

  const prompt = `You are the Official Academic Query Assistant for Poornima University Previous Year Question Paper (PYQP) Portal.
Analyze the student's natural language input: "${query}".

Classify the intent into one of the following:
- "GREETING": User is greeting (e.g. "hello", "hi", "hey", "hyy", "hy", "good morning", "good evening", "namaste", "hola", etc.).
- "ABOUT": User is asking who you are or what you do (e.g. "who are you", "what can you do", "help", "what is this", etc.).
- "ADMISSION_OR_GENERAL": User is asking questions about university courses, degrees offered, top courses, recommendations, eligibility, fees, admission criteria, scholarships, hostel, campus details, academic guidance, syllabus, or general queries (e.g. "give me top 3 course", "what courses are available", "which course is best", "tell me about BCA", "fees structure", "how to prepare").
- "PAPER_SEARCH": User is SPECIFICALLY asking for question papers, previous year papers, mid-term or end-term exam papers, test papers, or downloading papers (e.g. "bca cyber security 2nd sem operating system mid term paper", "btech 1 year math paper", "os paper", "dsa ese paper", "ethical hacking paper").

CRITICAL: If the user is asking questions, requesting recommendations (like "give me top 3 course", "best courses", "eligibility", "branches"), or asking conversational questions, classify as "ADMISSION_OR_GENERAL" or "ABOUT". DO NOT classify as "PAPER_SEARCH" unless they explicitly want question papers!

If intentType is NOT "PAPER_SEARCH":
- Provide a comprehensive, accurate, polite, friendly, and helpful response in "conversationalReply".
- If asking about courses/top courses at Poornima University: Highlight top courses such as B.Tech (Computer Science, AI & DS, Cyber Security), BCA (AI & ML, Cloud, Cyber Security), and MBA / MCA, explaining why they are popular.
- If it's a greeting: Welcome them to Poornima University Academic Portal and ask how you can help them find question papers or explore their course.
- If it's "ABOUT": Explain that you are the Poornima University Academic & Exam Paper Assistant, ready to help find question papers for any course (B.Tech, BCA, MCA, MBA, etc.) or answer academic queries.
- If it's "ADMISSION_OR_GENERAL": Provide relevant information about Poornima University and offer to search for academic papers.
- Set subjectKeywords to empty array [].

If intentType is "PAPER_SEARCH":
- course: Standard course code ("B.Tech", "BCA", "MCA", "MBA", "BBA", "B.Sc", "B.Des", "B.Arch", "BPH", "M.Tech") or null if not specified.
- specialization: Exact department/branch (e.g. "CYBER SECURITY", "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE", "COMPUTER SCIENCE & ENGINEERING", "CLOUD TECHNOLOGY", "DATA SCIENCE", "CIVIL ENGINEERING", "MECHANICAL ENGINEERING") or null. Note: "aids" or "ai ds" means "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE", "aiml" means "ARTIFICIAL INTELLIGENCE & MACHINE LEARNING", "cyber" means "CYBER SECURITY".
- semester: Standard semester code e.g. "Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8" or null. Note: "1 year" or "1st year" refers to "Sem 1" or "Sem 2".
- exam: "MSE" (Mid Term / Mid Semester Exam / MTE), "ESE" (End Term / Final Exam / ETE), or null.
- subjectKeywords: Array of subject name keywords mentioned (e.g. ["mathematics"], ["operating system"], ["cyber security"]). Normalize abbreviations (e.g. "math" or "maths" -> "mathematics", "os" -> "operating system", "dbms" or "rdbms" -> "database management", "cn" -> "computer networks", "dsa" -> "data structures", "se" -> "software engineering"). Keep words lowercase and concise.
- academicYear: E.g. "2023-24", "2024-25" or null if not mentioned.`;

  const response = await client.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intentType: { type: Type.STRING },
          conversationalReply: { type: Type.STRING, nullable: true },
          course: { type: Type.STRING, nullable: true },
          specialization: { type: Type.STRING, nullable: true },
          semester: { type: Type.STRING, nullable: true },
          exam: { type: Type.STRING, nullable: true },
          subjectKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          academicYear: { type: Type.STRING, nullable: true },
        },
        required: ["intentType", "subjectKeywords"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response returned from Gemini AI.");
  }

  const parsed = JSON.parse(text) as ExtractedAIIntent;
  return parsed;
}

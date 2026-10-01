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
  const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  if (!client || !query.trim()) {
    return extractRuleBasedIntent(query);
  }

  try {
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
    if (!text) return extractRuleBasedIntent(query);
    const parsed = JSON.parse(text) as ExtractedAIIntent;
    return parsed;
  } catch (error) {
    console.error("Gemini query parsing error, falling back to rule extraction:", error);
    return extractRuleBasedIntent(query);
  }
}

const COURSE_PATTERNS: Array<[RegExp, string]> = [
  [/\bbca\b/i, "BCA"],
  [/\bmca\b/i, "MCA"],
  [/\b(btech|b\.tech|b\s*tech)\b/i, "B.Tech"],
  [/\bmba\b/i, "MBA"],
  [/\bbba\b/i, "BBA"],
  [/\b(bsc|b\.sc)\b/i, "B.Sc"],
  [/\b(bdes|b\.des)\b/i, "B.Des"],
  [/\b(barch|b\.arch)\b/i, "B.Arch"],
  [/\bbph\b/i, "BPH"],
];

const SPEC_PATTERNS: Array<[string[], string]> = [
  [["cyber"], "CYBER SECURITY"],
  [["aids", "data science"], "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE"],
  [["aiml", "machine learning"], "ARTIFICIAL INTELLIGENCE & MACHINE LEARNING"],
  [["cloud"], "CLOUD TECHNOLOGY"],
  [["cse", "computer science"], "COMPUTER SCIENCE & ENGINEERING"],
  [["civil"], "CIVIL ENGINEERING"],
  [["mechanical"], "MECHANICAL ENGINEERING"],
];

function parseCourse(norm: string): string | null {
  for (const [pattern, course] of COURSE_PATTERNS) {
    if (pattern.test(norm)) return course;
  }
  return null;
}

function parseSpecialization(norm: string): string | null {
  for (const [keywords, spec] of SPEC_PATTERNS) {
    if (keywords.some((k) => norm.includes(k))) return spec;
  }
  return null;
}

function parseCourseAndSpec(norm: string) {
  return {
    course: parseCourse(norm),
    specialization: parseSpecialization(norm),
  };
}

function parseSemesterAndExam(norm: string) {
  let semester: string | null = null;
  let exam: string | null = null;

  const semMatch = /(?:sem|semester)\s*([1-8])|([1-8])(?:st|nd|rd|th)?\s*(?:sem|semester)/i.exec(norm);
  if (semMatch) {
    const s = semMatch[1] || semMatch[2];
    semester = `Sem ${s}`;
  } else {
    const yearMatch = /([1-4])(?:st|nd|rd|th)?\s*year/i.exec(norm);
    if (yearMatch) {
      const yr = Number(yearMatch[1]);
      semester = `Sem ${yr * 2 - 1}`;
    }
  }

  if (norm.includes("mte") || norm.includes("mid") || norm.includes("mse")) exam = "MSE";
  else if (norm.includes("ete") || norm.includes("end") || norm.includes("final") || norm.includes("ese")) exam = "ESE";

  return { semester, exam };
}

const STOPWORD_PATTERN_1 = /\b(bca|mca|bba|mba|b\.?tech|year|mte|ete|mse|ese|papers?|exam|previous|university|poornima)\b/gi;
const STOPWORD_PATTERN_2 = /\b(semester|sem\s*\d|\d\s*(?:sem|year))\b/gi;

function extractSubjectKeywords(norm: string) {
  const keywords: string[] = [];
  if (norm.includes("math") || norm.includes("maths") || norm.includes("mathematics")) keywords.push("mathematics");
  if (norm.includes("os") || norm.includes("operating system")) keywords.push("operating system");
  if (norm.includes("dbms") || norm.includes("rdbms") || norm.includes("database")) keywords.push("database");
  if (norm.includes("cn") || norm.includes("network") || norm.includes("networking")) keywords.push("network");
  if (norm.includes("dsa") || norm.includes("data structure")) keywords.push("data structures");
  if (norm.includes("cyber")) keywords.push("cyber security");
  if (norm.includes("python")) keywords.push("python");
  if (norm.includes("java")) keywords.push("java");
  if (norm.includes("physics")) keywords.push("physics");
  if (norm.includes("chemistry")) keywords.push("chemistry");

  const subjectTokens = norm
    .replace(STOPWORD_PATTERN_1, "")
    .replace(STOPWORD_PATTERN_2, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["for", "and", "the", "get", "show", "give", "want", "need"].includes(w));

  return Array.from(new Set([...keywords, ...subjectTokens]));
}

function isCoursesQuery(norm: string): boolean {
  if (norm.includes("courses available") || norm.includes("available courses")) return true;
  return /\b(top(?:\s+\d+)?|best|which|list)\s+course/i.test(norm);
}

export function extractRuleBasedIntent(query: string): ExtractedAIIntent {
  const norm = query.toLowerCase().trim();

  // 1. Detect greetings
  if (/^(hi|hello|hey|hyy|hy|namaste|good\s*(?:morning|afternoon|evening)|hola)[!\s]*$/i.test(norm)) {
    return {
      intentType: "GREETING",
      conversationalReply: "Hello! Welcome to Poornima University Academic Portal. How can I help you today? 😊",
      subjectKeywords: [],
    };
  }

  // 2. Detect "who are you" / "help"
  if (/who\s+are\s+you|what\s+can\s+you\s+do|help\s*me|what\s+is\s+this/i.test(norm)) {
    return {
      intentType: "ABOUT",
      conversationalReply: "I'm your Poornima University Academic & Exam Assistant! 🎓 I can help you find previous year question papers, mid-term & end-term exams across all courses (BCA, B.Tech, MBA, etc.), and answer university academic queries. What paper are you looking for?",
      subjectKeywords: [],
    };
  }

  // 3. Detect top courses / general questions
  if (isCoursesQuery(norm)) {
    return {
      intentType: "ADMISSION_OR_GENERAL",
      conversationalReply: "Poornima University offers top-tier, industry-recognized programs! The top 3 most popular and high-demand courses are:\n1. B.Tech in Computer Science & Engineering (Specializations: AI & ML, Data Science, Cyber Security, Cloud Technology)\n2. BCA (Bachelor of Computer Applications) with advanced industry specializations in AI, Cloud, and Full-Stack Development\n3. MBA & MCA for professional management and advanced computing careers.\n\nLet me know if you would like previous year question papers or semester syllabus for any of these courses! 😊",
      subjectKeywords: [],
    };
  }

  // 4. Detect general university queries (fees, admission, hostel)
  if (/fee|fees|admission|hostel|scholarship/i.test(norm)) {
    return {
      intentType: "ADMISSION_OR_GENERAL",
      conversationalReply: "For admissions, fee structure, and scholarships, please visit the official Poornima University portal at https://poornima.edu.in/. If you need exam question papers for any course, just let me know your course and semester! 😊",
      subjectKeywords: [],
    };
  }

  const { course, specialization } = parseCourseAndSpec(norm);
  const { semester, exam } = parseSemesterAndExam(norm);
  const allKeywords = extractSubjectKeywords(norm);

  const hasPaperIntent = Boolean(
    course || semester || exam || allKeywords.length > 0 ||
    /\b(paper|papers|pyqp|exam|question|test|mid\s*term|end\s*term|syllabus)\b/i.test(norm)
  );

  if (!hasPaperIntent) {
    return {
      intentType: "ADMISSION_OR_GENERAL",
      conversationalReply: "I'm here to help with your academic queries and question papers! You can search for question papers by specifying your course, semester, or subject (e.g., 'BCA 1st sem OS paper' or 'B.Tech CSE mid-term papers'), or ask any academic question. How can I help you today? 😊",
      subjectKeywords: [],
    };
  }

  return {
    intentType: "PAPER_SEARCH",
    course,
    specialization,
    semester,
    exam,
    subjectKeywords: allKeywords,
  };
}

/**
 * Pure client-side search over papersData.
 * STRICT REQUIREMENT: Does NOT use Gemini API key or any external API.
 */

const STOP_WORDS = new Set([
  "paper", "papers", "question", "questions", "pyqp", "pyqps",
  "pu", "poornima", "university", "for", "of", "in", "the", "a", "an", "and", "or", "to", "exam", "test"
]);

const COURSE_MAP = {
  "btech": "B.Tech",
  "b tech": "B.Tech",
  "b.tech": "B.Tech",
  "mtech": "M.Tech",
  "m tech": "M.Tech",
  "m.tech": "M.Tech",
  "bca": "BCA",
  "mca": "MCA",
  "bba": "BBA",
  "mba": "MBA",
  "bcom": "B.Com",
  "b com": "B.Com",
  "b.com": "B.Com",
  "bsc": "B.Sc",
  "b sc": "B.Sc",
  "b.sc": "B.Sc",
  "ba": "BA",
  "b.a": "BA",
  "ma": "MA",
  "m.a": "MA",
  "bph": "BPH",
  "b.ph": "BPH",
  "bva": "BVA",
  "mva": "MVA",
  "mdes": "M.Des",
  "m des": "M.Des",
  "m.des": "M.Des",
  "bdes": "B.Des",
  "b des": "B.Des",
  "b.des": "B.Des",
  "barch": "B.Arch",
  "b arch": "B.Arch",
  "b.arch": "B.Arch",
  "mplan": "M.Plan",
  "m plan": "M.Plan",
  "m.plan": "M.Plan",
  "mha": "MHA",
  "mph": "MPH",
  "phd": "Ph.D",
  "ph.d": "Ph.D",
  "pihm": "PIHM"
};

const SUBJECT_SYNONYMS = {
  "rdbms": ["relational database management system", "database management", "dbms"],
  "dbms": ["database management system", "database", "rdbms"],
  "os": ["operating system"],
  "cn": ["computer networks", "networking"],
  "dsa": ["data structures", "algorithms"],
  "oops": ["object oriented programming", "oop"],
  "ai": ["artificial intelligence"],
  "ml": ["machine learning"],
  "aiml": ["artificial intelligence & machine learning", "ai & ml"],
  "aids": ["artificial intelligence and data science", "ai & ds"],
  "math": ["mathematics", "engineering mathematics"],
  "maths": ["mathematics", "engineering mathematics"],
  "physics": ["engineering physics"],
  "chemistry": ["engineering chemistry"]
};

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchLocalPapers(papers, rawQuery) {
  const query = String(rawQuery || "").trim();
  if (!query) return [];

  const normQuery = normalize(query);
  if (!normQuery) return [];

  // Extract explicit semester e.g. "1 sem", "1sem", "sem 1", "1st sem"
  let parsedSem = null;
  const semMatch = normQuery.match(/\b(10|[1-9])\s*(?:st|nd|rd|th)?\s*(?:sem|semester)\b/) ||
                   normQuery.match(/\b(?:sem|semester)\s*(10|[1-9])\b/);
  if (semMatch) {
    parsedSem = `${Number(semMatch[1])} Sem`;
  }

  // Extract explicit exam e.g. "mse", "ese"
  let parsedExam = null;
  const examMatch = normQuery.match(/\b(mse|ese)\b/);
  if (examMatch) {
    parsedExam = examMatch[1].toUpperCase();
  }

  // Extract explicit course e.g. "b tech", "btech", "bca"
  let parsedCourse = null;
  for (const [alias, canonical] of Object.entries(COURSE_MAP)) {
    const regex = new RegExp(`\\b${alias.replace(/\./g, "\\.")}\\b`, "i");
    if (regex.test(normQuery)) {
      parsedCourse = canonical;
      break;
    }
  }

  // Extract tokens excluding stopwords and parsed course/sem/exam
  const rawTokens = normQuery.split(" ").filter(Boolean);
  const searchTokens = [];
  for (const token of rawTokens) {
    if (STOP_WORDS.has(token)) continue;
    if (token === "sem" || token === "semester") continue;
    if (parsedSem && token === parsedSem.split(" ")[0]) continue;
    if (parsedExam && token.toUpperCase() === parsedExam) continue;
    if (parsedCourse && normalize(parsedCourse).split(" ").includes(token)) continue;
    searchTokens.push(token);
  }

  // Expand synonyms for tokens
  const expandedTokens = [...searchTokens];
  for (const t of searchTokens) {
    if (SUBJECT_SYNONYMS[t]) {
      for (const syn of SUBJECT_SYNONYMS[t]) {
        expandedTokens.push(...syn.split(" "));
      }
    }
  }

  const scoredPapers = [];

  for (const paper of papers || []) {
    const pCourse = String(paper.course || "");
    const pYear = String(paper.year || "");
    const pSpec = String(paper.spec || paper.specialization || "");
    const pSem = String(paper.sem || paper.semester || "");
    const pExam = String(paper.exam || "");
    const pName = String(paper.name || paper.title || paper.subject || "");

    const normName = normalize(pName);
    const normSpec = normalize(pSpec);
    const normCourse = normalize(pCourse);
    const normSem = normalize(pSem);
    const normExam = normalize(pExam);

    const fullPaperText = `${normCourse} ${normSpec} ${normYear(pYear)} ${normSem} ${normExam} ${normName}`;

    // Filter constraint: Course
    if (parsedCourse) {
      if (normCourse !== normalize(parsedCourse)) {
        continue;
      }
    }

    // Filter constraint: Semester
    if (parsedSem) {
      if (normSem !== normalize(parsedSem)) {
        continue;
      }
    }

    // Filter constraint: Exam
    if (parsedExam) {
      if (normExam !== normalize(parsedExam)) {
        continue;
      }
    }

    let score = 0;
    let tokensMatched = 0;

    // Check query tokens against the paper text and name
    for (const token of searchTokens) {
      const isNameMatch = normName.includes(token);
      const isSpecMatch = normSpec.includes(token);
      const isFullMatch = fullPaperText.includes(token);

      if (isNameMatch) {
        score += 30;
        tokensMatched++;
      } else if (isSpecMatch) {
        score += 20;
        tokensMatched++;
      } else if (isFullMatch) {
        score += 10;
        tokensMatched++;
      } else {
        // Check synonym matches
        const syns = SUBJECT_SYNONYMS[token] || [];
        const synMatch = syns.some((syn) => normName.includes(normalize(syn)) || normSpec.includes(normalize(syn)));
        if (synMatch) {
          score += 25;
          tokensMatched++;
        }
      }
    }

    // If query had tokens but NONE matched, skip this paper
    if (searchTokens.length > 0 && tokensMatched === 0) {
      continue;
    }

    // Exact name bonus
    if (searchTokens.length > 0 && normName.includes(searchTokens.join(" "))) {
      score += 50;
    }

    // Base match score if filtered by course/sem/exam
    if (parsedCourse) score += 20;
    if (parsedSem) score += 15;
    if (parsedExam) score += 10;

    scoredPapers.push({
      ...paper,
      _score: score
    });
  }

  // Sort by score descending, then alphabetically by paper name
  scoredPapers.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    const nameA = (a.name || a.title || "").toLowerCase();
    const nameB = (b.name || b.title || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return scoredPapers;
}

function normYear(year) {
  return normalize(year);
}

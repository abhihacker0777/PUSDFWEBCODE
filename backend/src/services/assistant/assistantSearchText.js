const { normalizeText } = require("../../utils/helpers");
const { MAX_ASSISTANT_TEXT_LENGTH } = require("../../config/env");

const COURSE_QUERY_ALIASES = [
  { value: "B.Arch", terms: ["barch", "b arch", "b.arch", "architecture"] },
  { value: "B.Com", terms: ["bcom", "b com", "b.com"] },
  { value: "B.Des", terms: ["bdes", "b des", "b.des"] },
  { value: "B.Sc", terms: ["bsc", "b sc", "b.sc"] },
  { value: "B.Tech", terms: ["btech", "b tech", "b.tech", "bachelor of technology"] },
  { value: "BBA", terms: ["bba", "b b a", "b.b.a"] },
  { value: "BCA", terms: ["bca", "b c a", "b.c.a"] },
  { value: "BVA", terms: ["bva", "b v a", "b.v.a"] },
  { value: "M.Plan", terms: ["mplan", "m plan", "m.plan"] },
  { value: "M.Tech", terms: ["mtech", "m tech", "m.tech"] },
  { value: "MBA", terms: ["mba", "m b a", "m.b.a"] },
  { value: "MCA", terms: ["mca", "m c a", "m.c.a"] },
  { value: "Ph.D", terms: ["phd", "ph d", "ph.d", "doctorate"] }
];

const SPEC_QUERY_ALIASES = [
  { value: "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE", terms: ["aids", "ai ds", "ai and ds", "ai & ds", "ai and data science", "ai & data science"] },
  { value: "ARTIFICIAL INTELLIGENCE & MACHINE LEARNING", terms: ["aiml", "ai ml", "ai and ml", "ai & ml", "ai and machine learning", "ai & machine learning"] },
  { value: "COMPUTER SCIENCE & ENGINEERING", terms: ["cse", "cs"] },
  { value: "INFORMATION TECHNOLOGY", terms: ["it"] },
  { value: "MECHANICAL ENGINEERING", terms: ["me", "mech"] },
  { value: "CIVIL ENGINEERING", terms: ["ce", "civil"] },
  { value: "ELECTRICAL ENGINEERING", terms: ["ee", "electrical"] },
  { value: "ELECTRONICS & COMMUNICATION ENGINEERING", terms: ["ec", "ece"] },
  { value: "CYBER SECURITY", terms: ["cyber", "cyber security", "cybersecurity", "cyber sec"] },
  { value: "DATA SCIENCE", terms: ["data science", "ds"] },
  { value: "CLOUD TECHNOLOGY", terms: ["cloud", "cloud computing"] }
];

function normalizeSearchText(value, maxLength = MAX_ASSISTANT_TEXT_LENGTH) {
  return normalizeText(value, maxLength)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSearchText(value) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

function sameSearchValue(left, right) {
  return normalizeSearchText(left) === normalizeSearchText(right);
}

function uniqueStrings(values) {
  return [...new Set((values || []).filter(Boolean).map(String))];
}

function getUniquePaperValues(papers, field) {
  return [...new Set((papers || []).map((paper) => paper?.[field]).filter(Boolean))];
}

function findKnownValueInQuery(query, values) {
  const normalizedQuery = normalizeSearchText(query);
  const compactQuery = compactSearchText(query);

  return [...new Set(values || [])]
    .sort((a, b) => String(b).length - String(a).length)
    .find((value) => {
      const normalizedValue = normalizeSearchText(value);
      if (!normalizedValue) return false;
      return ` ${normalizedQuery} `.includes(` ${normalizedValue} `) ||
        compactQuery.includes(compactSearchText(value));
    }) || "";
}

function findKnownCourseInQuery(query, values) {
  const directMatch = findKnownValueInQuery(query, values);
  if (directMatch) return directMatch;

  const availableCourses = [...new Set(values || [])];
  const normalizedQuery = ` ${normalizeSearchText(query)} `;
  const compactQuery = compactSearchText(query);

  for (const alias of COURSE_QUERY_ALIASES) {
    const course = availableCourses.find((value) => sameSearchValue(value, alias.value) ||
      compactSearchText(value) === compactSearchText(alias.value));
    if (!course) continue;

    const terms = [alias.value, ...(alias.terms || [])];
    if (terms.some((term) => {
      const normalizedTerm = normalizeSearchText(term);
      return normalizedTerm && (
        normalizedQuery.includes(` ${normalizedTerm} `) ||
        compactQuery.includes(compactSearchText(term))
      );
    })) {
      return course;
    }
  }

  return "";
}

function findKnownSpecInQuery(query, values) {
  const directMatch = findKnownValueInQuery(query, values);
  if (directMatch) return directMatch;

  const availableSpecs = [...new Set(values || [])];
  const normalizedQuery = ` ${normalizeSearchText(query)} `;
  const compactQuery = compactSearchText(query);

  for (const alias of SPEC_QUERY_ALIASES) {
    const spec = availableSpecs.find((value) => sameSearchValue(value, alias.value) ||
      compactSearchText(value) === compactSearchText(alias.value));
    if (!spec) continue;

    const terms = [alias.value, ...(alias.terms || [])];
    if (terms.some((term) => {
      const normalizedTerm = normalizeSearchText(term);
      return normalizedTerm && (
        normalizedQuery.includes(` ${normalizedTerm} `) ||
        compactQuery.includes(compactSearchText(term))
      );
    })) {
      return spec;
    }
  }

  return "";
}

function getAssistantQueryTokens(query) {
  const ignored = new Set([
    "a", "an", "and", "are", "by", "find", "for", "from", "give", "i", "in", "is", "link",
    "me", "need", "of", "paper", "papers", "pdf", "please", "poornima", "previous", "pu",
    "pyqp", "question", "questions", "semester", "show", "the", "to", "university", "with",
    "year", "yr", "sem", "exam", "assistant", "can", "could", "hello", "help", "hey", "hi",
    "name", "what", "who", "would", "you", "your"
  ]);

  return normalizeSearchText(query)
    .split(" ")
    .filter((token) => token.length > 1 && !ignored.has(token));
}

function getAssistantTokenVariants(token) {
  const normalized = normalizeSearchText(token, 40);
  const variants = new Set([normalized]);
  if (normalized === "maths") variants.add("math");
  if (normalized === "math") variants.add("mathematics");
  if (normalized.endsWith("s") && normalized.length > 4) variants.add(normalized.slice(0, -1));
  return [...variants].filter(Boolean);
}

function assistantTokenMatches(text, token) {
  const normText = normalizeSearchText(text);
  const normToken = normalizeSearchText(token, 40);
  if (!normToken) return false;

  if (` ${normText} `.includes(` ${normToken} `)) return true;

  const words = normText.split(" ").filter(Boolean);
  const compToken = compactSearchText(token);

  // Match whole compact word or exact match (prevents mid-word substring bugs like "gand" matching "Design and")
  if (compToken.length >= 3) {
    if (compactSearchText(text) === compToken) return true;
    if (words.some((word) => compactSearchText(word) === compToken)) return true;
  }

  return getAssistantTokenVariants(normToken).some((variant) => {
    if (!variant) return false;
    return words.some((word) => word === variant || (variant.length >= 4 && word.startsWith(variant)));
  });
}

module.exports = {
  COURSE_QUERY_ALIASES,
  SPEC_QUERY_ALIASES,
  normalizeSearchText,
  compactSearchText,
  sameSearchValue,
  uniqueStrings,
  getUniquePaperValues,
  findKnownValueInQuery,
  findKnownCourseInQuery,
  findKnownSpecInQuery,
  getAssistantQueryTokens,
  assistantTokenMatches
};

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

function assistantTokenMatches(text, compactText, token) {
  return getAssistantTokenVariants(token).some((variant) =>
    text.includes(variant) || compactText.includes(variant)
  );
}

module.exports = {
  COURSE_QUERY_ALIASES,
  normalizeSearchText,
  compactSearchText,
  sameSearchValue,
  uniqueStrings,
  getUniquePaperValues,
  findKnownValueInQuery,
  findKnownCourseInQuery,
  getAssistantQueryTokens,
  assistantTokenMatches
};

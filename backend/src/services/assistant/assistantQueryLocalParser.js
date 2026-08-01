const { normalizeText } = require("../../utils/helpers");
const {
  COURSE_QUERY_ALIASES,
  compactSearchText,
  findKnownCourseInQuery,
  findKnownValueInQuery,
  getAssistantQueryTokens,
  getUniquePaperValues,
  normalizeSearchText,
  sameSearchValue,
  uniqueStrings
} = require("./assistantSearchText");

function parseNumberedField(query, labelPattern, max) {
  const normalizedQuery = normalizeSearchText(query);
  const numberPattern = max === 10 ? "10|[1-9]" : `[1-${max}]`;
  const match = normalizedQuery.match(new RegExp(`\\b(${numberPattern})(?:st|nd|rd|th)?\\s*(?:${labelPattern})\\b`));
  return match ? Number(match[1]) : null;
}

function normalizeKnownPaperValue(value, values) {
  const text = normalizeText(value, 160);
  if (!text) return "";
  return findKnownValueInQuery(text, values) || "";
}

function normalizeAssistantYear(value, values) {
  const text = normalizeText(value, 30);
  if (!text) return "";
  const numbered = normalizeSearchText(text).match(/\b([1-5])\b/);
  if (numbered) return `${Number(numbered[1])} Year`;
  return normalizeKnownPaperValue(text, values);
}

function normalizeAssistantSemester(value, values) {
  const text = normalizeText(value, 30);
  if (!text) return "";
  const numbered = normalizeSearchText(text).match(/\b(10|[1-9])\b/);
  if (numbered) return `${Number(numbered[1])} Sem`;
  return normalizeKnownPaperValue(text, values);
}

function getCourseStructuredTokens(course) {
  if (!course) return [];

  const tokens = new Set([
    ...getAssistantQueryTokens(course),
    compactSearchText(course)
  ].filter((token) => token && token.length > 1));

  const alias = COURSE_QUERY_ALIASES.find((item) => sameSearchValue(item.value, course) ||
    compactSearchText(item.value) === compactSearchText(course));
  if (alias) {
    for (const term of alias.terms || []) {
      tokens.add(compactSearchText(term));
      getAssistantQueryTokens(term).forEach((token) => tokens.add(token));
    }
  }

  return [...tokens];
}

function getRequiredAssistantTokens(parsedQuery) {
  const required = [];
  if (parsedQuery.course) required.push(...getCourseStructuredTokens(parsedQuery.course));
  if (parsedQuery.year) required.push(...getAssistantQueryTokens(parsedQuery.year));
  if (parsedQuery.sem) required.push(...getAssistantQueryTokens(parsedQuery.sem));
  if (parsedQuery.exam) required.push(...getAssistantQueryTokens(parsedQuery.exam));
  return uniqueStrings(required);
}

function getAssistantSubjectTokens(tokens, parsedQuery) {
  const structured = new Set([
    ...(parsedQuery.requiredTokens || getRequiredAssistantTokens(parsedQuery)),
    ...getCourseStructuredTokens(parsedQuery.course),
    ...getAssistantQueryTokens(parsedQuery.spec || ""),
    ...getAssistantQueryTokens(parsedQuery.year || ""),
    ...getAssistantQueryTokens(parsedQuery.sem || ""),
    ...getAssistantQueryTokens(parsedQuery.exam || "")
  ]);

  return uniqueStrings(tokens || [])
    .map((token) => normalizeSearchText(token, 40))
    .filter((token) => token && !structured.has(token));
}

function finalizeAssistantQuery(query) {
  const requiredTokens = getRequiredAssistantTokens(query);
  return {
    ...query,
    requiredTokens,
    subjectTokens: getAssistantSubjectTokens(query.tokens || [], { ...query, requiredTokens })
  };
}

function mergeAssistantQuery(localQuery, aiQuery, papers) {
  if (!aiQuery || typeof aiQuery !== "object") return finalizeAssistantQuery(localQuery);

  const courses = getUniquePaperValues(papers, "course");
  const specs = getUniquePaperValues(papers, "spec");
  const years = getUniquePaperValues(papers, "year");
  const semesters = getUniquePaperValues(papers, "sem");
  const aiTokens = [
    ...getAssistantQueryTokens(aiQuery.paper || ""),
    ...getAssistantQueryTokens(aiQuery.subject || ""),
    ...getAssistantQueryTokens(aiQuery.specialization || aiQuery.spec || "")
  ];

  if (Array.isArray(aiQuery.tokens)) {
    aiTokens.push(...aiQuery.tokens.map((token) => normalizeSearchText(token, 40)).filter(Boolean));
  }

  return finalizeAssistantQuery({
    course: localQuery.course || findKnownCourseInQuery(aiQuery.course, courses),
    spec: localQuery.spec || normalizeKnownPaperValue(aiQuery.spec || aiQuery.specialization, specs),
    year: localQuery.year || normalizeAssistantYear(aiQuery.year, years),
    sem: localQuery.sem || normalizeAssistantSemester(aiQuery.sem || aiQuery.semester, semesters),
    exam: localQuery.exam,
    tokens: uniqueStrings([...(localQuery.tokens || []), ...aiTokens])
  });
}

function parseAssistantQuery(query, papers) {
  const yearNumber = parseNumberedField(query, "year|yr", 5);
  const semNumber = parseNumberedField(query, "sem|semester", 10);
  const examMatch = normalizeSearchText(query).match(/\b(mse|ese)\b/);

  return {
    course: findKnownCourseInQuery(query, getUniquePaperValues(papers, "course")),
    spec: findKnownValueInQuery(query, getUniquePaperValues(papers, "spec")),
    year: yearNumber ? `${yearNumber} Year` : "",
    sem: semNumber ? `${semNumber} Sem` : "",
    exam: examMatch ? examMatch[1].toUpperCase() : "",
    tokens: getAssistantQueryTokens(query)
  };
}

module.exports = {
  mergeAssistantQuery,
  parseAssistantQuery
};

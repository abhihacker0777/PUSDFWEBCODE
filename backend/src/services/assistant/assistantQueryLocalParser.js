const { normalizeText } = require("../../utils/helpers");
const {
  COURSE_QUERY_ALIASES,
  SPEC_QUERY_ALIASES,
  compactSearchText,
  findKnownCourseInQuery,
  findKnownSpecInQuery,
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

function getSpecStructuredTokens(spec) {
  if (!spec) return [];

  const tokens = new Set([
    ...getAssistantQueryTokens(spec),
    compactSearchText(spec)
  ].filter((token) => token && token.length > 1));

  const alias = SPEC_QUERY_ALIASES.find((item) => sameSearchValue(item.value, spec) ||
    compactSearchText(item.value) === compactSearchText(spec));
  if (alias) {
    for (const term of alias.terms || []) {
      tokens.add(compactSearchText(term));
      getAssistantQueryTokens(term).forEach((token) => tokens.add(token));
    }
  }

  return [...tokens];
}

const NON_SUBJECT_WORDS = new Set([
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
  "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth",
  "sem", "semester", "semesters", "year", "years", "yr", "yrs",
  "exam", "exams", "paper", "papers", "question", "questions", "pyqp", "pdf", "link",
  "mse", "ese", "mid", "end", "term", "midterm", "endterm",
  "all", "give", "show", "need", "find", "get", "list", "please", "poornima", "pu",
  "branch", "course", "subject", "subjects", "syllabus", "notes"
]);

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
    ...getSpecStructuredTokens(parsedQuery.spec),
    ...getAssistantQueryTokens(parsedQuery.year || ""),
    ...getAssistantQueryTokens(parsedQuery.sem || ""),
    ...getAssistantQueryTokens(parsedQuery.exam || "")
  ]);

  return uniqueStrings(
    (tokens || [])
      .flatMap((token) => getAssistantQueryTokens(token))
      .map((token) => normalizeSearchText(token, 40))
  ).filter((token) => token && !structured.has(token) && !NON_SUBJECT_WORDS.has(token) && !/^\d+(st|nd|rd|th)?$/i.test(token));
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

  const resolvedCourse = localQuery.course || findKnownCourseInQuery(aiQuery.course, courses);
  const resolvedSpec = localQuery.spec || findKnownSpecInQuery(aiQuery.spec || aiQuery.specialization, specs);
  const resolvedYear = localQuery.year || normalizeAssistantYear(aiQuery.year, years);
  const resolvedSem = localQuery.sem || normalizeAssistantSemester(aiQuery.sem || aiQuery.semester, semesters);

  const aiTokens = [];
  if (aiQuery.paper) {
    getAssistantQueryTokens(aiQuery.paper).forEach((t) => aiTokens.push(t));
  }
  if (aiQuery.subject) {
    getAssistantQueryTokens(aiQuery.subject).forEach((t) => aiTokens.push(t));
  }
  if (Array.isArray(aiQuery.tokens)) {
    for (const t of aiQuery.tokens) {
      getAssistantQueryTokens(t).forEach((tok) => aiTokens.push(tok));
    }
  }

  return finalizeAssistantQuery({
    course: resolvedCourse,
    spec: resolvedSpec,
    year: resolvedYear,
    sem: resolvedSem,
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
    spec: findKnownSpecInQuery(query, getUniquePaperValues(papers, "spec")),
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

const { ASSISTANT_MAX_RESULTS } = require("../../config/env");
const { sanitizePaperText, safePaperUrl } = require("../../utils/helpers");
const { mergeAssistantQuery, parseAssistantQuery } = require("./assistantQueryParser");
const {
  assistantTokenMatches,
  compactSearchText,
  normalizeSearchText,
  sameSearchValue
} = require("./assistantSearchText");

function assistantPaperText(paper) {
  return normalizeSearchText([
    paper.course, paper.year, paper.spec, paper.specialization,
    paper.sem, paper.semester, paper.exam, paper.name
  ].filter(Boolean).join(" "));
}

function scoreAssistantPaper(paper, parsedQuery) {
  if (parsedQuery.course && !sameSearchValue(paper.course, parsedQuery.course)) return 0;
  if (parsedQuery.spec && !sameSearchValue(paper.spec, parsedQuery.spec)) return 0;
  if (parsedQuery.year && !sameSearchValue(paper.year, parsedQuery.year)) return 0;
  if (parsedQuery.sem && !sameSearchValue(paper.sem, parsedQuery.sem)) return 0;
  if (parsedQuery.exam && !sameSearchValue(paper.exam, parsedQuery.exam)) return 0;

  let score = 0;
  if (parsedQuery.course) score += 40;
  if (parsedQuery.spec) score += 30;
  if (parsedQuery.year) score += 16;
  if (parsedQuery.sem) score += 14;
  if (parsedQuery.exam) score += 14;

  const text = assistantPaperText(paper);
  const compactText = compactSearchText(text);
  const subjectText = normalizeSearchText([paper.spec, paper.specialization, paper.name].filter(Boolean).join(" "));
  const compactSubjectText = compactSearchText(subjectText);
  const tokens = parsedQuery.tokens || [];
  const requiredTokens = parsedQuery.requiredTokens || [];
  const subjectTokens = parsedQuery.subjectTokens || [];
  let matchedTokens = 0;
  let matchedRequiredTokens = 0;
  let matchedSubjectTokens = 0;

  for (const token of tokens) {
    if (assistantTokenMatches(text, compactText, token)) {
      score += token.length > 3 ? 6 : 3;
      matchedTokens++;
      if (requiredTokens.includes(token)) matchedRequiredTokens++;
    }
    if (subjectTokens.includes(token) && assistantTokenMatches(subjectText, compactSubjectText, token)) {
      matchedSubjectTokens++;
    }
  }

  if (requiredTokens.length > 0 && matchedRequiredTokens === 0) return 0;
  if (subjectTokens.length > 0 && matchedSubjectTokens === 0) return 0;
  if (tokens.length > 0 && matchedTokens === 0 && score === 0) return 0;
  return score;
}

function formatAssistantResult(paper) {
  return {
    course: sanitizePaperText(paper.course, 60),
    year: sanitizePaperText(paper.year, 30),
    specialization: sanitizePaperText(paper.spec || paper.specialization || "", 100),
    sem: sanitizePaperText(paper.sem || paper.semester || "", 30),
    exam: sanitizePaperText(paper.exam, 30),
    name: sanitizePaperText(paper.name, 160),
    link: safePaperUrl(paper.link)
  };
}

function publicPaperDedupeKey(paper) {
  return [
    normalizeSearchText(paper.course),
    normalizeSearchText(paper.year),
    normalizeSearchText(paper.spec || paper.specialization),
    normalizeSearchText(paper.sem || paper.semester),
    normalizeSearchText(paper.exam),
    normalizeSearchText(paper.name),
    safePaperUrl(paper.link).toLowerCase()
  ].join("|");
}

function assistantPaperDedupeKey(paper) {
  return [
    normalizeSearchText(paper.course),
    normalizeSearchText(paper.year),
    normalizeSearchText(paper.spec || paper.specialization),
    normalizeSearchText(paper.sem || paper.semester),
    normalizeSearchText(paper.exam),
    normalizeSearchText(paper.name)
  ].join("|");
}

function dedupePapers(papers, getKey = publicPaperDedupeKey) {
  const seen = new Set();
  const result = [];

  for (const paper of papers || []) {
    const key = getKey(paper);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(paper);
  }

  return result;
}

function dedupeScoredAssistantPapers(items) {
  const seen = new Set();
  const result = [];

  for (const item of items || []) {
    const key = assistantPaperDedupeKey(item.paper);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function searchAssistantPapers(papers, question, aiQuery = null) {
  const parsedQuery = mergeAssistantQuery(parseAssistantQuery(question, papers), aiQuery, papers);
  const hasStructuredHint = Boolean(parsedQuery.course || parsedQuery.spec || parsedQuery.year || parsedQuery.sem || parsedQuery.exam);
  const hasUsefulText = parsedQuery.tokens.length > 0;

  if (!hasStructuredHint && !hasUsefulText) {
    return {
      status: "need_more",
      results: [],
      message: "Please type course, year, semester, exam, or paper name."
    };
  }

  const scoredResults = (papers || [])
    .map((paper) => ({ paper, score: scoreAssistantPaper(paper, parsedQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.paper.name.localeCompare(b.paper.name));

  const results = dedupeScoredAssistantPapers(scoredResults)
    .slice(0, ASSISTANT_MAX_RESULTS)
    .map((item) => formatAssistantResult(item.paper));

  if (results.length === 0) {
    return {
      status: "not_found",
      results,
      message: "Paper not available. Please send feedback to Central Library to add this paper."
    };
  }

  return {
    status: "found",
    results,
    message: results.length === 1 ? "I found this paper." : `I found ${results.length} matching papers.`
  };
}

module.exports = {
  dedupePapers,
  searchAssistantPapers
};

const PAPERS_CACHE_KEY = "papersCache";
const PAPERS_CACHE_TIME_KEY = "papersCacheTime";
const PAPER_OPTIONS_CACHE_KEY = "paperOptionsCache";
const PAPER_OPTIONS_CACHE_TIME_KEY = "paperOptionsCacheTime";
const PAPERS_UPDATED_KEY = "papers.updated";
const PAPERS_CACHE_TTL_MS = 5 * 60 * 1000;
const PAPER_OPTIONS_CACHE_TTL_MS = 10 * 60 * 1000;

export const normalizePapers = (data) => (Array.isArray(data) ? data : [])
  .map(item => ({
    ...item,
    id: item.index || item.id || Math.random().toString(),
    name: item.name || "",
    specialization: item.spec || item.specialization || "",
    course: item.course || "",
    year: item.year || "",
    sem: item.sem || item.semester || "",
    exam: item.exam || "",
    link: item.link || ""
  }))
  .filter(item => item.course && item.year && item.sem && item.exam && item.name && item.link);

export const normalizePaperOptions = (data) => (Array.isArray(data) ? data : [])
  .map(item => ({
    course: item.course || "",
    year: item.year || "",
    specialization: item.spec || item.specialization || "",
    spec: item.spec || item.specialization || "",
    sem: item.sem || item.semester || "",
    semester: item.sem || item.semester || "",
    exam: item.exam || "",
  }))
  .filter(item => item.course && item.year && item.sem && item.exam);

export const getPapersUpdatedAt = () => {
  try {
    return Number(localStorage.getItem(PAPERS_UPDATED_KEY) || 0);
  } catch {
    return 0;
  }
};

export const readJsonCache = (cacheKey, timeKey, ttlMs, allowExpired = false, minCacheTime = 0) => {
  try {
    const cachedAt = Number(sessionStorage.getItem(timeKey) || 0);
    if (!allowExpired && minCacheTime && cachedAt < minCacheTime) return null;
    if (!allowExpired && Date.now() - cachedAt > ttlMs) return null;
    const cached = sessionStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export const writeJsonCache = (cacheKey, timeKey, data) => {
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    sessionStorage.setItem(timeKey, String(Date.now()));
  } catch {
    // Storage can be unavailable in private/restricted browser modes.
  }
};

export const readPapersCache = (allowExpired = false) =>
  readJsonCache(PAPERS_CACHE_KEY, PAPERS_CACHE_TIME_KEY, PAPERS_CACHE_TTL_MS, allowExpired, getPapersUpdatedAt());

export const writePapersCache = (papers) =>
  writeJsonCache(PAPERS_CACHE_KEY, PAPERS_CACHE_TIME_KEY, papers);

export const readPaperOptionsCache = (allowExpired = false) =>
  readJsonCache(PAPER_OPTIONS_CACHE_KEY, PAPER_OPTIONS_CACHE_TIME_KEY, PAPER_OPTIONS_CACHE_TTL_MS, allowExpired, getPapersUpdatedAt());

export const writePaperOptionsCache = (options) =>
  writeJsonCache(PAPER_OPTIONS_CACHE_KEY, PAPER_OPTIONS_CACHE_TIME_KEY, options);

export const paperSearchCacheKey = (filters = {}) => `papersSearch:${[
  filters.course || "",
  filters.year || "",
  filters.specialization || filters.spec || "",
  filters.sem || filters.semester || "",
  filters.exam || ""
].join("|")}`;

export const clearPaperCaches = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key?.startsWith("papersSearch:")) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    sessionStorage.removeItem(PAPERS_CACHE_KEY);
    sessionStorage.removeItem(PAPERS_CACHE_TIME_KEY);
    sessionStorage.removeItem(PAPER_OPTIONS_CACHE_KEY);
    sessionStorage.removeItem(PAPER_OPTIONS_CACHE_TIME_KEY);
  } catch {
    // Ignore storage cleanup errors.
  }
};

export {
  PAPERS_CACHE_TTL_MS
};

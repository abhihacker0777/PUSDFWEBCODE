const configuredBackendUrl = (import.meta.env.VITE_API_URL || "").trim();
const isVercelFrontend = typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app");
const shouldUseVercelProxy = import.meta.env.PROD && isVercelFrontend && (
  !configuredBackendUrl ||
  configuredBackendUrl.includes("onrender.com") ||
  configuredBackendUrl.includes("localhost") ||
  configuredBackendUrl.includes("127.0.0.1")
);
const DEFAULT_BACKEND_URL = import.meta.env.PROD ? "/api" : "http://localhost:3000";
export const BACKEND_URL = shouldUseVercelProxy ? "/api" : configuredBackendUrl || DEFAULT_BACKEND_URL;
const PAPERS_CACHE_KEY = "papersCache";
const PAPERS_CACHE_TIME_KEY = "papersCacheTime";
const PAPER_OPTIONS_CACHE_KEY = "paperOptionsCache";
const PAPER_OPTIONS_CACHE_TIME_KEY = "paperOptionsCacheTime";
const PAPERS_UPDATED_KEY = "papers.updated";
const PAPERS_CACHE_TTL_MS = 5 * 60 * 1000;
const PAPER_OPTIONS_CACHE_TTL_MS = 10 * 60 * 1000;
let csrfToken = "";
let csrfTokenPromise = null;

export const getCsrfToken = async ({ force = false } = {}) => {
  if (!force && csrfToken) return csrfToken;
  if (!force && csrfTokenPromise) return csrfTokenPromise;

  csrfTokenPromise = fetch(`${BACKEND_URL}/csrf-token`, {
    method: "GET",
    cache: "no-store",
    credentials: "include"
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.csrfToken) {
        throw new Error(data.message || "CSRF token request failed");
      }
      csrfToken = data.csrfToken;
      return csrfToken;
    })
    .finally(() => {
      csrfTokenPromise = null;
    });

  return csrfTokenPromise;
};

export const csrfFetch = async (url, options = {}) => {
  const send = async (token) => {
    const headers = new Headers(options.headers || {});
    headers.set("X-CSRF-Token", token);

    return fetch(url, {
      ...options,
      credentials: options.credentials || "include",
      headers
    });
  };

  let response = await send(await getCsrfToken());

  if (response.status === 403) {
    const cloned = response.clone();
    const data = await cloned.json().catch(() => ({}));
    if (data.code === "CSRF_REQUIRED") {
      csrfToken = "";
      response = await send(await getCsrfToken({ force: true }));
    }
  }

  return response;
};

const normalizePapers = (data) => (Array.isArray(data) ? data : [])
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

const normalizePaperOptions = (data) => (Array.isArray(data) ? data : [])
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

const getPapersUpdatedAt = () => {
  try {
    return Number(localStorage.getItem(PAPERS_UPDATED_KEY) || 0);
  } catch {
    return 0;
  }
};

const readJsonCache = (cacheKey, timeKey, ttlMs, allowExpired = false, minCacheTime = 0) => {
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

const writeJsonCache = (cacheKey, timeKey, data) => {
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    sessionStorage.setItem(timeKey, String(Date.now()));
  } catch {
    // Storage can be unavailable in private/restricted browser modes.
  }
};

const readPapersCache = (allowExpired = false) =>
  readJsonCache(PAPERS_CACHE_KEY, PAPERS_CACHE_TIME_KEY, PAPERS_CACHE_TTL_MS, allowExpired, getPapersUpdatedAt());

const writePapersCache = (papers) =>
  writeJsonCache(PAPERS_CACHE_KEY, PAPERS_CACHE_TIME_KEY, papers);

const readPaperOptionsCache = (allowExpired = false) =>
  readJsonCache(PAPER_OPTIONS_CACHE_KEY, PAPER_OPTIONS_CACHE_TIME_KEY, PAPER_OPTIONS_CACHE_TTL_MS, allowExpired, getPapersUpdatedAt());

const writePaperOptionsCache = (options) =>
  writeJsonCache(PAPER_OPTIONS_CACHE_KEY, PAPER_OPTIONS_CACHE_TIME_KEY, options);

const paperSearchCacheKey = (filters = {}) => `papersSearch:${[
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

export const fetchPapers = async ({ force = false } = {}) => {
  const cachedPapers = !force ? readPapersCache(false) : null;
  if (cachedPapers) return cachedPapers;

  try {
    // Use the backend API instead of direct database access.
    // credentials: 'include' ensures the browser sends the secure cookie
    const response = await fetch(force ? `${BACKEND_URL}/papers?t=${Date.now()}` : `${BACKEND_URL}/papers`, {
      method: "GET",
      cache: force ? "no-store" : "default",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    const papers = normalizePapers(data);
    writePapersCache(papers);
    return papers;

  } catch (error) {
    console.error("Error Fetching Papers:", error);
    return readPapersCache(true) || [];
  }
};

export const fetchPaperOptions = async ({ force = false } = {}) => {
  const cachedOptions = !force ? readPaperOptionsCache(false) : null;
  if (cachedOptions) return cachedOptions;

  try {
    const response = await fetch(force ? `${BACKEND_URL}/paper-options?t=${Date.now()}` : `${BACKEND_URL}/paper-options`, {
      method: "GET",
      cache: force ? "no-store" : "default",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch options: ${response.status}`);
    }

    const options = normalizePaperOptions(await response.json());
    writePaperOptionsCache(options);
    return options;
  } catch (error) {
    console.error("Error Fetching Paper Options:", error);
    return readPaperOptionsCache(true) || [];
  }
};

export const searchPapers = async (filters = {}, { force = false } = {}) => {
  const cacheKey = paperSearchCacheKey(filters);
  const cachedPapers = !force ? readJsonCache(cacheKey, `${cacheKey}:time`, PAPERS_CACHE_TTL_MS, false, getPapersUpdatedAt()) : null;
  if (cachedPapers) return cachedPapers;

  const params = new URLSearchParams();
  if (filters.course) params.set("course", filters.course);
  if (filters.year) params.set("year", filters.year);
  if (filters.specialization || filters.spec) params.set("specialization", filters.specialization || filters.spec);
  if (filters.sem || filters.semester) params.set("sem", filters.sem || filters.semester);
  if (filters.exam) params.set("exam", filters.exam);

  try {
    const url = `${BACKEND_URL}/papers/search?${params.toString()}${force ? `&t=${Date.now()}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      cache: force ? "no-store" : "default",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search papers: ${response.status}`);
    }

    const papers = normalizePapers(await response.json());
    writeJsonCache(cacheKey, `${cacheKey}:time`, papers);
    return papers;
  } catch (error) {
    console.error("Error Searching Papers:", error);
    return readJsonCache(cacheKey, `${cacheKey}:time`, PAPERS_CACHE_TTL_MS, true) || [];
  }
};

export const fetchAssistantConfig = async () => {
  const response = await fetch(`${BACKEND_URL}/assistant/config`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Assistant configuration failed");
  }

  return data;
};

export const verifyAssistantGoogleCredential = async (credential) => {
  const response = await fetch(`${BACKEND_URL}/assistant/google/verify`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Google sign-in failed");
    error.code = data.code;
    throw error;
  }

  return data;
};

export const askPaperAssistant = async ({ credential, question }) => {
  const response = await fetch(`${BACKEND_URL}/assistant/search`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential, question }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Assistant request failed");
    error.code = data.code;
    throw error;
  }

  return data;
};

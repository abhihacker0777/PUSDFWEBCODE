export interface NormalizedPaper {
  id: string | number;
  name: string;
  title: string;
  subject: string;
  specialization: string;
  spec: string;
  course: string;
  year: string;
  sem: string;
  semester: string;
  exam: string;
  link: string;
  drive_url: string;
  index?: number | string;
  [key: string]: any;
}

export interface PaperOption {
  course: string;
  year: string;
  specialization: string;
  spec: string;
  sem: string;
  semester: string;
  exam: string;
}

const PAPERS_CACHE_KEY = "papersCache";
const PAPERS_CACHE_TIME_KEY = "papersCacheTime";
const PAPER_OPTIONS_CACHE_KEY = "paperOptionsCache";
const PAPER_OPTIONS_CACHE_TIME_KEY = "paperOptionsCacheTime";
const PAPERS_UPDATED_KEY = "papers.updated";
const PAPERS_CACHE_TTL_MS = 5 * 60 * 1000;
const PAPER_OPTIONS_CACHE_TTL_MS = 10 * 60 * 1000;

export const normalizePapers = (data: any): NormalizedPaper[] => {
  const items: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return items
    .map(item => {
      const name = item.name || item.title || item.subject || "";
      const link = item.link || item.drive_url || "";
      const specialization = item.spec || item.specialization || "";
      const sem = item.sem || item.semester || "";

      return {
        ...item,
        id: item.index || item.id || Math.random().toString(),
        name,
        title: name,
        subject: name,
        specialization,
        spec: specialization,
        course: item.course || "",
        year: item.year || "",
        sem,
        semester: sem,
        exam: item.exam || "",
        link,
        drive_url: link
      };
    })
    .filter(item => item.course && item.year && item.sem && item.exam && item.name && item.link);
};

export const normalizePaperOptions = (data: any): PaperOption[] => (Array.isArray(data) ? data : [])
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

export const getPapersUpdatedAt = (): number => {
  try {
    return Number(localStorage.getItem(PAPERS_UPDATED_KEY) || 0);
  } catch {
    return 0;
  }
};

export const readJsonCache = <T = any>(
  cacheKey: string,
  timeKey: string,
  ttlMs: number,
  allowExpired = false,
  minCacheTime = 0
): T | null => {
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

export const writeJsonCache = (cacheKey: string, timeKey: string, data: any): void => {
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    sessionStorage.setItem(timeKey, String(Date.now()));
  } catch {
    // Storage can be unavailable in private/restricted browser modes.
  }
};

export const readPapersCache = (allowExpired = false): NormalizedPaper[] | null => {
  const data = readJsonCache<NormalizedPaper[]>(PAPERS_CACHE_KEY, PAPERS_CACHE_TIME_KEY, PAPERS_CACHE_TTL_MS, allowExpired, getPapersUpdatedAt());
  return Array.isArray(data) && data.length > 0 ? data : null;
};

export const writePapersCache = (papers: NormalizedPaper[]): void => {
  if (Array.isArray(papers) && papers.length > 0) {
    writeJsonCache(PAPERS_CACHE_KEY, PAPERS_CACHE_TIME_KEY, papers);
  }
};

export const readPaperOptionsCache = (allowExpired = false): PaperOption[] | null => {
  const data = readJsonCache<PaperOption[]>(PAPER_OPTIONS_CACHE_KEY, PAPER_OPTIONS_CACHE_TIME_KEY, PAPER_OPTIONS_CACHE_TTL_MS, allowExpired, getPapersUpdatedAt());
  return Array.isArray(data) && data.length > 0 ? data : null;
};

export const writePaperOptionsCache = (options: PaperOption[]): void => {
  if (Array.isArray(options) && options.length > 0) {
    writeJsonCache(PAPER_OPTIONS_CACHE_KEY, PAPER_OPTIONS_CACHE_TIME_KEY, options);
  }
};

export const paperSearchCacheKey = (filters: Record<string, any> = {}): string => `papersSearch:${[
  filters.course || "",
  filters.year || "",
  filters.specialization || filters.spec || "",
  filters.sem || filters.semester || "",
  filters.exam || ""
].join("|")}`;

export const clearPaperCaches = (): void => {
  try {
    const keysToRemove: string[] = [];
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

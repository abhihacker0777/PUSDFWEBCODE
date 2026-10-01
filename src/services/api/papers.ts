import { BACKEND_URL } from "./backendConfig";
export { clearPaperCaches } from "./paperCache";
import {
  getPapersUpdatedAt,
  normalizePaperOptions,
  normalizePapers,
  paperSearchCacheKey,
  PAPERS_CACHE_TTL_MS,
  readJsonCache,
  readPaperOptionsCache,
  readPapersCache,
  writeJsonCache,
  writePaperOptionsCache,
  writePapersCache,
  NormalizedPaper,
  PaperOption
} from "./paperCache";

export const fetchPapers = async ({ force = false }: { force?: boolean } = {}): Promise<NormalizedPaper[]> => {
  const cachedPapers = !force ? readPapersCache(false) : null;
  if (cachedPapers) return cachedPapers;

  try {
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

    const papers = normalizePapers(await response.json());
    if (papers.length > 0) {
      writePapersCache(papers);
    }
    return papers;
  } catch (error) {
    console.error("Error Fetching Papers:", error);
    return readPapersCache(true) || [];
  }
};

export const fetchPaperOptions = async ({ force = false }: { force?: boolean } = {}): Promise<PaperOption[]> => {
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

export const searchPapers = async (filters: Record<string, any> = {}, { force = false }: { force?: boolean } = {}): Promise<NormalizedPaper[]> => {
  const cacheKey = paperSearchCacheKey(filters);
  const cachedPapers = !force
    ? readJsonCache<NormalizedPaper[]>(cacheKey, `${cacheKey}:time`, PAPERS_CACHE_TTL_MS, false, getPapersUpdatedAt())
    : null;
  if (cachedPapers) return cachedPapers;

  const params = new URLSearchParams();
  if (filters.course) params.set("course", filters.course);
  if (filters.year) params.set("year", filters.year);
  if (filters.specialization || filters.spec) params.set("specialization", filters.specialization || filters.spec);
  if (filters.sem || filters.semester) params.set("sem", filters.sem || filters.semester);
  if (filters.exam) params.set("exam", filters.exam);

  try {
    const queryString = params.toString();
    const cacheBuster = force ? `&t=${Date.now()}` : "";
    const url = `${BACKEND_URL}/papers/search?${queryString}${cacheBuster}`;
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
    return readJsonCache<NormalizedPaper[]>(cacheKey, `${cacheKey}:time`, PAPERS_CACHE_TTL_MS, true, getPapersUpdatedAt()) || [];
  }
};

import { fetchPapersAction } from "@/actions/paperActions";
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

/**
 * Modern Next.js 16 Direct Server Action Service
 * Eliminates legacy 4-layer HTTP rewrite hop (client fetch -> rewrite -> route handler -> action -> DB)
 * Direct RPC call to fetchPapersAction with local caching.
 */
export const fetchPapers = async ({ force = false }: { force?: boolean } = {}): Promise<NormalizedPaper[]> => {
  const cachedPapers = !force ? readPapersCache(false) : null;
  if (cachedPapers) return cachedPapers;

  try {
    const res = await fetchPapersAction({ force });
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      const normalized = normalizePapers(res.data);
      writePapersCache(normalized);
      return normalized;
    }
    return [];
  } catch (error) {
    console.error("Error fetching papers via Server Action:", error);
    return [];
  }
};

export const fetchPaperOptions = async ({ force = false }: { force?: boolean } = {}): Promise<PaperOption[]> => {
  const cachedOptions = !force ? readPaperOptionsCache(false) : null;
  if (cachedOptions) return cachedOptions;

  try {
    const res = await fetchPapersAction({ force });
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      const options = normalizePaperOptions(
        res.data.map((p) => ({
          course: p.course || "",
          year: p.year || "",
          specialization: p.specialization || p.spec || "",
          spec: p.specialization || p.spec || "",
          sem: p.semester || p.sem || "",
          semester: p.semester || p.sem || "",
          exam: p.exam || "",
        }))
      );
      writePaperOptionsCache(options);
      return options;
    }
    return [];
  } catch (error) {
    console.error("Error fetching paper options via Server Action:", error);
    return [];
  }
};

export const searchPapers = async (filters: Record<string, any> = {}, { force = false }: { force?: boolean } = {}): Promise<NormalizedPaper[]> => {
  const cacheKey = paperSearchCacheKey(filters);
  const cachedPapers = !force
    ? readJsonCache<NormalizedPaper[]>(cacheKey, `${cacheKey}:time`, PAPERS_CACHE_TTL_MS, false, getPapersUpdatedAt())
    : null;
  if (cachedPapers) return cachedPapers;

  try {
    const res = await fetchPapersAction({ force });
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      const all = normalizePapers(res.data);
      const filtered = all.filter((p) => {
        if (filters.course && p.course?.toLowerCase() !== filters.course.toLowerCase()) return false;
        if (filters.year && p.year?.toLowerCase() !== filters.year.toLowerCase()) return false;
        const s = (filters.specialization || filters.spec || "").toLowerCase();
        if (s && (p.specialization || p.spec || "").toLowerCase() !== s) return false;
        const sem = (filters.sem || filters.semester || "").toLowerCase();
        if (sem && (p.semester || p.sem || "").toLowerCase() !== sem) return false;
        if (filters.exam && p.exam?.toLowerCase() !== filters.exam.toLowerCase()) return false;
        return true;
      });
      writeJsonCache(cacheKey, `${cacheKey}:time`, filtered);
      return filtered;
    }
    return [];
  } catch (error) {
    console.error("Error searching papers via Server Action:", error);
    return [];
  }
};

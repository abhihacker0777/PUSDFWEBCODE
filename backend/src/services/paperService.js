const {
  PUBLIC_PAPERS_CACHE_MS,
  PUBLIC_PAPERS_STALE_CACHE_MS
} = require("../config/env");
const { isSupabaseConfigured } = require("./supabaseService");
const { sanitizePaperText } = require("../utils/helpers");
const {
  getPaperPayload,
  getExpectedPaperPayload,
  hasAllPaperFields,
  paperMatchesExpectedSnapshot,
  rowMatchesPaper,
  rowMatchesPaperSlot,
  resolveExpectedSheetRowIndex,
  rowHasBlankPaperData,
  paperFromSheetRow,
  isAdminSheetRow,
  normalizePaperFilters,
  buildPaperOptions
} = require("../models/paperModel");
const { createPaperSheetService } = require("./papers/paperSheetService");
const paperRepository = require("./papers/paperSupabaseRepository");

function createPaperService() {
  const sheetService = createPaperSheetService();
  let papersCache = { expiresAt: 0, data: [] };
  let paperOptionsCache = { expiresAt: 0, data: [] };

  function invalidatePapersCache() {
    papersCache = { expiresAt: 0, data: [] };
    paperOptionsCache = { expiresAt: 0, data: [] };
  }

  function cachePapers(data, ttl = PUBLIC_PAPERS_CACHE_MS) {
    papersCache = { expiresAt: Date.now() + ttl, data };
    return data;
  }

  function cachePaperOptions(data, ttl = PUBLIC_PAPERS_CACHE_MS) {
    paperOptionsCache = { expiresAt: Date.now() + ttl, data };
    return data;
  }

  async function fetchPublicPapers() {
    if (Date.now() < papersCache.expiresAt) return papersCache.data;

    if (isSupabaseConfigured()) {
      try {
        return cachePapers(await paperRepository.fetchSupabasePapers({ publicOnly: true }));
      } catch (supabaseErr) {
        console.error("Supabase papers fetch failed:", supabaseErr.message);
        if (papersCache.data.length > 0) return cachePapers(papersCache.data, PUBLIC_PAPERS_STALE_CACHE_MS);
        return cachePapers([], PUBLIC_PAPERS_STALE_CACHE_MS);
      }
    }

    try {
      return cachePapers(await sheetService.fetchPublicPapersFromSheet());
    } catch (sheetErr) {
      console.error("Sheet papers fetch failed:", sheetErr.message);
      if (papersCache.data.length > 0) return cachePapers(papersCache.data, PUBLIC_PAPERS_STALE_CACHE_MS);
      return cachePapers([], PUBLIC_PAPERS_STALE_CACHE_MS);
    }
  }

  async function fetchPaperOptions() {
    if (Date.now() < paperOptionsCache.expiresAt) return paperOptionsCache.data;

    if (isSupabaseConfigured()) {
      try {
        return cachePaperOptions(await paperRepository.fetchPaperOptionsFromSupabase());
      } catch (supabaseErr) {
        console.error("Supabase paper options fetch failed:", supabaseErr.message);
        if (paperOptionsCache.data.length > 0) {
          return cachePaperOptions(paperOptionsCache.data, PUBLIC_PAPERS_STALE_CACHE_MS);
        }
        return cachePaperOptions([], PUBLIC_PAPERS_STALE_CACHE_MS);
      }
    }

    return cachePaperOptions(buildPaperOptions(await fetchPublicPapers()));
  }

  async function fetchPublicPapersByFilter(filters = {}) {
    const cleanFilters = normalizePaperFilters(filters);

    if (!cleanFilters.course || !cleanFilters.year || !cleanFilters.sem || !cleanFilters.exam) {
      return [];
    }

    if (isSupabaseConfigured()) {
      return paperRepository.fetchPublicPapersByFilterFromSupabase(cleanFilters);
    }

    const papers = await fetchPublicPapers();
    return papers.filter((paper) =>
      Object.entries(cleanFilters).every(([key, value]) => {
        if (!value) return true;
        const paperValue = key === "specialization"
          ? paper.specialization || paper.spec
          : key === "sem"
          ? paper.sem || paper.semester
          : paper[key];
        return sanitizePaperText(paperValue, 160) === value;
      })
    );
  }

  async function replaceSupabasePapers(papers) {
    const updatedCount = await paperRepository.replaceSupabasePapers(papers);
    invalidatePapersCache();
    return updatedCount;
  }

  return {
    ...sheetService,
    ...paperRepository,
    getPaperPayload,
    getExpectedPaperPayload,
    hasAllPaperFields,
    paperMatchesExpectedSnapshot,
    rowMatchesPaper,
    rowMatchesPaperSlot,
    rowHasBlankPaperData,
    paperFromSheetRow,
    isAdminSheetRow,
    resolveExpectedSheetRowIndex,
    invalidatePapersCache,
    fetchPublicPapers,
    fetchPaperOptions,
    fetchPublicPapersByFilter,
    replaceSupabasePapers
  };
}

module.exports = { createPaperService };

function setPublicPaperCacheHeaders(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
}

function createPaperController({
  fetchPublicPapers,
  fetchPaperOptions,
  fetchPublicPapersByFilter
}) {
  async function listPublicPapers(req, res) {
    try {
      setPublicPaperCacheHeaders(res);
      res.json(await fetchPublicPapers());
    } catch (err) {
      console.error("Papers fetch failed:", err.message);
      res.json([]);
    }
  }

  async function listPaperOptions(req, res) {
    try {
      setPublicPaperCacheHeaders(res);
      res.json(await fetchPaperOptions());
    } catch (err) {
      console.error("Paper options fetch failed:", err.message);
      res.json([]);
    }
  }

  async function searchPapers(req, res) {
    try {
      res.json(await fetchPublicPapersByFilter(req.query || {}));
    } catch (err) {
      console.error("Filtered papers fetch failed:", err.message);
      res.json([]);
    }
  }

  return {
    listPublicPapers,
    listPaperOptions,
    searchPapers
  };
}

module.exports = { createPaperController };

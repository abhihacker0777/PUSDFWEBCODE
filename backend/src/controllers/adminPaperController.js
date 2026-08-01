const {
  createAdminPaperJobs,
  removeUploadedFile
} = require("./adminPaperJobs");

function createAdminPaperController(dependencies) {
  const {
    upload,
    validateUploadedFile,
    getPaperPayload,
    getExpectedPaperPayload,
    hasAdminPermission,
    isSupabaseConfigured,
    getSupabasePaperById,
    paperMatchesExpectedSnapshot,
    getSheetRows,
    paperFromSheetRow,
    isAdminSheetRow,
    fetchAdminPapersFromPublishedSheet,
    fetchSupabasePapers,
    replaceSupabasePapers
  } = dependencies;
  const jobs = createAdminPaperJobs(dependencies);

  function uploadPaper(req, res) {
    upload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).send("Upload Error");

      try {
        if (req.file) validateUploadedFile(req.file);
        const { index } = req.body;
        const paper = getPaperPayload(req.body);
        const expectedPaper = getExpectedPaperPayload(req.body);

        if (!index && !hasAdminPermission(req.admin, "papers:create")) {
          removeUploadedFile(req.file);
          return res.status(403).send("New paper upload not permitted");
        }

        if (req.file && !hasAdminPermission(req.admin, "papers:file")) {
          removeUploadedFile(req.file);
          return res.status(403).send("File upload not permitted");
        }

        if (index && isSupabaseConfigured()) {
          const existingPaper = await getSupabasePaperById(index);
          if (!existingPaper) return res.status(404).send("Paper Not Found");
          if (!paperMatchesExpectedSnapshot(existingPaper, expectedPaper)) {
            return res.status(409).send("Paper changed. Refresh and try again.");
          }
        }

        res.status(202).send("Background Processing Started");
        jobs.runUploadPaperJob({ file: req.file, index, paper, expectedPaper });
      } catch (validationErr) {
        console.error("Upload validation failed:", validationErr.message);
        res.status(400).send("Upload Error");
        removeUploadedFile(req.file);
      }
    });
  }

  async function deletePaper(req, res) {
    try {
      const { index } = req.body;
      if (!index) return res.status(400).send("No Index Provided");

      const expectedPaper = getExpectedPaperPayload(req.body);

      if (isSupabaseConfigured()) {
        const existingPaper = await getSupabasePaperById(index);
        if (!existingPaper) return res.status(404).send("Paper Not Found");
        if (!paperMatchesExpectedSnapshot(existingPaper, expectedPaper)) {
          return res.status(409).send("Paper changed. Refresh and try again.");
        }
      }

      res.status(202).send("Background Deletion Started");
      jobs.runDeletePaperJob({ index, expectedPaper });
    } catch (err) {
      console.error("Delete failed:", err.message);
      res.status(500).send("Delete Failed");
    }
  }

  async function listAdminPapers(req, res) {
    try {
      if (isSupabaseConfigured()) {
        return res.json(await fetchSupabasePapers({ publicOnly: false }));
      }

      const { rows } = await getSheetRows();
      const data = rows
        .slice(1)
        .map((row, i) => paperFromSheetRow(row, i + 2))
        .filter(isAdminSheetRow);

      res.json(data);
    } catch (err) {
      console.error("Admin papers fetch failed:", err.message);
      res.status(500).json([]);
    }
  }

  async function syncPapers(req, res) {
    try {
      const papers = await fetchAdminPapersFromPublishedSheet();

      if (!isSupabaseConfigured()) {
        return res.status(503).json({ success: false, message: "Supabase is not configured." });
      }

      const updatedCount = await replaceSupabasePapers(papers);
      res.json({ success: true, message: `Data Imported From Google Sheet. ${updatedCount}` });
    } catch {
      res.status(500).json({ success: false, message: "Sync Failed." });
    }
  }

  return {
    uploadPaper,
    deletePaper,
    listAdminPapers,
    syncPapers
  };
}

module.exports = { createAdminPaperController };

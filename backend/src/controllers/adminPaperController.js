const {
  createAdminPaperJobs,
  removeUploadedFile,
  PaperConflictError,
  PaperNotFoundError
} = require("./adminPaperJobs");

function createAdminPaperController(dependencies) {
  const {
    upload,
    validateUploadedFile,
    getPaperPayload,
    getExpectedPaperPayload,
    hasAdminPermission,
    hasAllPaperFields,
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

        if (!hasAllPaperFields(paper)) {
          removeUploadedFile(req.file);
          return res.status(400).send("Course, year, specialization, semester, exam and paper name are all required.");
        }

        if (index && isSupabaseConfigured()) {
          const existingPaper = await getSupabasePaperById(index);
          if (!existingPaper) {
            removeUploadedFile(req.file);
            return res.status(404).send("Paper Not Found");
          }
          if (!paperMatchesExpectedSnapshot(existingPaper, expectedPaper)) {
            removeUploadedFile(req.file);
            return res.status(409).send("Paper changed. Refresh and try again.");
          }
        }

        const result = await jobs.runUploadPaperJob({ file: req.file, index, paper, expectedPaper, adminName: req.admin?.displayName });
        return res.status(200).json({
          success: true,
          message: result.status === "Uploaded" ? "Paper uploaded successfully." : "Paper updated successfully.",
          status: result.status,
          paper: result.paper
        });
      } catch (uploadErr) {
        removeUploadedFile(req.file);
        if (uploadErr instanceof PaperConflictError) return res.status(409).send(uploadErr.message);
        if (uploadErr instanceof PaperNotFoundError) return res.status(404).send(uploadErr.message);
        console.error("Upload failed:", uploadErr.message);
        return res.status(500).send("Upload failed. Please try again.");
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

      await jobs.runDeletePaperJob({ index, expectedPaper, adminName: req.admin?.displayName });
      return res.status(200).json({ success: true, message: "Paper deleted successfully." });
    } catch (err) {
      if (err instanceof PaperConflictError) return res.status(409).send(err.message);
      if (err instanceof PaperNotFoundError) return res.status(404).send(err.message);
      console.error("Delete failed:", err.message);
      return res.status(500).send("Delete Failed");
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

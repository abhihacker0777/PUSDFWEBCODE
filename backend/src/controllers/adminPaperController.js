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
    replaceSupabasePapers,
    appendAdminLogToSupabase,
    appendAdminLogToSheet,
    generateLogId,
    formatLogDate
  } = dependencies;
  const jobs = createAdminPaperJobs(dependencies);

  // BUG FIX: paper uploads/edits/deletes never wrote anything to
  // admin_logs - appendAdminLogToSupabase existed and worked but was never
  // called from anywhere, so "Recent Action" only ever showed whatever was
  // written by some other, unrelated path. Fire-and-forget (like the
  // existing Sheet-mirror calls elsewhere) so a slow log write never
  // delays the actual response to the admin.
  function writeAdminActionLog({ status, paper, adminName }) {
    const logData = {
      id: generateLogId(),
      date: formatLogDate(),
      status,
      course: paper?.course || "-",
      year: paper?.year || "-",
      spec: paper?.spec || paper?.specialization || "-",
      semester: paper?.sem || paper?.semester || "-",
      exam: paper?.exam || "-",
      name: paper?.name || paper?.title || "-",
      adminName: adminName || "-"
    };
    appendAdminLogToSupabase(logData).catch((err) => console.error("Admin log write failed:", err.message));
    appendAdminLogToSheet(logData).catch((err) => console.error("Admin log sheet write failed:", err.message));
  }

  function uploadPaper(req, res) {
    upload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).send("Upload Error");

      try {
        if (req.file) validateUploadedFile(req.file);
        const { index, directLink, paperLink } = req.body;
        const linkInput = String(directLink || paperLink || "").trim();
        const paper = getPaperPayload(req.body);
        const expectedPaper = getExpectedPaperPayload(req.body);

        if (!index && !hasAdminPermission(req.admin, "papers:create")) {
          removeUploadedFile(req.file);
          return res.status(403).send("New paper upload not permitted");
        }

        // SECURITY FIX: editing an *existing* paper's metadata (index set,
        // no file attached) hit neither check above, so any authenticated
        // admin - including a "view" role with zero write permissions -
        // could silently update any paper's data. papers:update is exactly
        // what "editor" has and "view" doesn't, so this is the correct gate.
        if (index && !hasAdminPermission(req.admin, "papers:update")) {
          removeUploadedFile(req.file);
          return res.status(403).send("Paper update not permitted");
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

        const result = await jobs.runUploadPaperJob({ file: req.file, directLink: linkInput, index, paper, expectedPaper, adminName: req.admin?.displayName });
        writeAdminActionLog({ status: result.status, paper: result.paper, adminName: req.admin?.displayName });
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
      writeAdminActionLog({ status: "Deleted", paper: expectedPaper, adminName: req.admin?.displayName });
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

  async function bulkDeletePapers(req, res) {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "No papers provided for deletion." });
      }

      let deletedCount = 0;
      const errors = [];

      for (const item of items) {
        try {
          const index = item.index || item.id;
          const expectedPaper = item.expectedPaper || item;
          await jobs.runDeletePaperJob({ index, expectedPaper, adminName: req.admin?.displayName });
          writeAdminActionLog({ status: "Deleted", paper: expectedPaper, adminName: req.admin?.displayName });
          deletedCount++;
        } catch (err) {
          errors.push(err.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedCount} paper${deletedCount > 1 ? "s" : ""}.`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (err) {
      console.error("Bulk delete failed:", err.message);
      return res.status(500).json({ success: false, message: "Bulk delete failed." });
    }
  }

  async function bulkEditPapers(req, res) {
    try {
      const { items, updates } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "No papers provided for edit." });
      }

      let updatedCount = 0;
      const errors = [];

      for (const item of items) {
        try {
          const index = item.index || item.id;
          const existing = isSupabaseConfigured() ? await getSupabasePaperById(index) : null;
          const updatedPaper = {
            course: updates.course || item.course,
            year: updates.year || item.year,
            spec: updates.spec || updates.specialization || item.spec || item.specialization,
            sem: updates.sem || updates.semester || item.sem || item.semester,
            exam: updates.exam || item.exam,
            name: updates.name || item.name,
            link: item.link || ""
          };

          const result = await jobs.runUploadPaperJob({
            file: null,
            directLink: item.link || null,
            index,
            paper: updatedPaper,
            expectedPaper: existing || item,
            adminName: req.admin?.displayName
          });
          writeAdminActionLog({ status: "Updated", paper: result.paper, adminName: req.admin?.displayName });
          updatedCount++;
        } catch (err) {
          errors.push(err.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Successfully updated ${updatedCount} paper${updatedCount > 1 ? "s" : ""}.`,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (err) {
      console.error("Bulk edit failed:", err.message);
      return res.status(500).json({ success: false, message: "Bulk edit failed." });
    }
  }

  return {
    uploadPaper,
    deletePaper,
    bulkDeletePapers,
    bulkEditPapers,
    listAdminPapers,
    syncPapers
  };
}

module.exports = { createAdminPaperController };

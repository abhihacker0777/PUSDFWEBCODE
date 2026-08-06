const { normalizeText, sanitizeFreeText } = require("../utils/helpers");

function createAdminLogController({
  getAdminLogsFromSupabase,
  supabaseSelectAll,
  appendAdminLogToSupabase,
  appendAdminLogToSheet,
  supabaseRequest,
  getStudentQueryInsights
}) {
  async function listLogs(req, res) {
    try {
      res.json(await getAdminLogsFromSupabase());
    } catch (err) {
      console.error("Log fetch failed:", err.message);
      res.json([]);
    }
  }

  async function listStudentQueries(req, res) {
    try {
      const rows = await supabaseSelectAll("student_queries", {
        select: "id,email,question,status,message,paper_name,created_at",
        order: "created_at.desc"
      });
      const queries = (rows || []).map((row) => ({
        id: row.id,
        date: row.created_at ? new Date(row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-",
        email: row.email,
        question: sanitizeFreeText(row.question, 500),
        status: row.status,
        paperName: row.paper_name
      }));
      res.json(queries);
    } catch {
      res.status(500).json([]);
    }
  }

  async function getQueryInsights(req, res) {
    try {
      const requestedDays = Number(req.query.days);
      const days = Number.isSafeInteger(requestedDays) && requestedDays > 0 && requestedDays <= 365 ? requestedDays : 30;
      res.json(await getStudentQueryInsights({ days }));
    } catch (err) {
      console.error("Query insights fetch failed:", err.message);
      res.status(500).json({ totalQueries: 0, statusCounts: {}, notFoundRate: 0, topNotFoundQuestions: [], topFoundPapers: [] });
    }
  }

  async function saveLog(req, res) {
    try {
      const id = Number(req.body.id);
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).send("Invalid log id");
      }

      const allowedStatuses = new Set(["Uploaded", "Updated", "Deleted"]);
      const logData = {
        id,
        index: req.body.index ? String(req.body.index) : null,
        date: normalizeText(req.body.date, 40),
        status: allowedStatuses.has(req.body.status) ? req.body.status : "Updated",
        course: normalizeText(req.body.course, 60),
        year: normalizeText(req.body.year, 30),
        spec: normalizeText(req.body.spec, 100),
        semester: normalizeText(req.body.semester, 30),
        exam: normalizeText(req.body.exam, 30),
        name: normalizeText(req.body.name, 160),
        adminName: req.admin?.displayName
      };

      await appendAdminLogToSupabase(logData);

      try {
        await appendAdminLogToSheet(logData);
      } catch (sheetErr) {
        console.error("Sheet backup failed:", sheetErr.message);
      }

      res.status(200).send("Log Saved Successfully");
    } catch (err) {
      console.error("Log save failed:", err.message);
      res.status(500).send("Error saving log");
    }
  }

  async function clearLogs(req, res) {
    try {
      res.send("Processing log clear in background...");

      (async () => {
        try {
          await supabaseRequest("admin_logs", { method: "DELETE", query: "id=not.is.null" });
        } catch (error) {
          console.error("Background log clear failed:", error.message);
        }
      })();
    } catch {
      res.status(500).send("Server failed to wipe database");
    }
  }

  async function deleteLogs(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
        return res.status(400).send("Invalid ID array");
      }
      const cleanIds = ids
        .map((id) => Number(id))
        .filter((id) => Number.isSafeInteger(id) && id > 0);

      if (cleanIds.length !== ids.length) {
        return res.status(400).send("Invalid ID array");
      }

      res.send("Processing deletion in background...");

      (async () => {
        try {
          for (const id of cleanIds) {
            await supabaseRequest("admin_logs", { method: "DELETE", query: `id=eq.${id}` });
          }
        } catch (error) {
          console.error("Background log delete failed:", error.message);
        }
      })();
    } catch {
      res.status(500).send("Server failed to delete specific logs");
    }
  }

  return {
    listLogs,
    listStudentQueries,
    getQueryInsights,
    saveLog,
    clearLogs,
    deleteLogs
  };
}

module.exports = { createAdminLogController };

const {
  SHEET_ID,
  ASSISTANT_REQUESTS_SHEET,
  MAX_TEXT_LENGTH,
  ADMIN_LOG_RETENTION_MS,
  SHEET_WRITE_MODE
} = require("../config/env");
const { normalizeText, sanitizeFreeText } = require("../utils/helpers");
const {
  supabaseRequest,
  supabaseSelectAll
} = require("./supabaseService");
const { getServiceSheets } = require("./googleService");

function sheetCell(value, maxLength = MAX_TEXT_LENGTH) {
  const text = normalizeText(value, maxLength);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function sheetRange(tabName, range) {
  const safeTabName = String(tabName || "").replace(/'/g, "''");
  return `'${safeTabName}'!${range}`;
}

// Pure function: given raw student_queries rows, compute the insights
// summary. Kept separate from the Supabase fetch so it can be tested with
// plain arrays, no network access needed.
function computeStudentQueryInsights(rows = []) {
  const statusCounts = {};
  const notFoundCounts = new Map();
  const foundPaperCounts = new Map();

  for (const row of rows) {
    const status = normalizeText(row.status, 30) || "unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    if (status === "not_found") {
      const key = normalizeText(row.question, 200).toLowerCase().trim();
      if (key) notFoundCounts.set(key, (notFoundCounts.get(key) || 0) + 1);
    }

    if (status === "found") {
      const key = normalizeText(row.paper_name || row.paperName, 160).trim();
      if (key) foundPaperCounts.set(key, (foundPaperCounts.get(key) || 0) + 1);
    }
  }

  const sortDescByCount = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]);

  return {
    totalQueries: rows.length,
    statusCounts,
    notFoundRate: rows.length > 0 ? Math.round(((statusCounts.not_found || 0) / rows.length) * 100) : 0,
    topNotFoundQuestions: sortDescByCount(notFoundCounts).slice(0, 15).map(([question, count]) => ({ question, count })),
    topFoundPapers: sortDescByCount(foundPaperCounts).slice(0, 15).map(([paperName, count]) => ({ paperName, count }))
  };
}

function createAdminLogService() {
  let assistantSheetReady = false;
  let assistantSheetLogDisabled = false;

  async function saveAssistantRequestLog(logData) {
    try {
      await supabaseRequest("student_queries", {
        method: "POST",
        body: {
          email: normalizeText(logData.email, 254),
          question: sanitizeFreeText(logData.question, 500),
          status: normalizeText(logData.status, 30),
          message: normalizeText(logData.message, 200),
          paper_name: normalizeText(logData.topResult?.name || "", 160)
        }
      });
    } catch (err) {
      console.error("Supabase student_queries logging write crash:", err.message);
    }

    if (!assistantSheetLogDisabled) {
      appendAssistantRequestToSheet(logData).catch((err) => {
        console.error("Assistant sheet append failed:", err.message);
        if (/permission|forbidden|403/i.test(err.message || "")) assistantSheetLogDisabled = true;
      });
    }
  }

  async function getAdminLogsFromSupabase() {
    try {
      // IDs are generated as Date.now() * 1000 + a small random offset (see
      // generateLogId in adminPaperJobs.js), so the cutoff must be scaled the
      // same way - otherwise every id looks "newer" than the cutoff forever,
      // regardless of true age, and nothing ever gets cleaned up.
      const cutoffId = (Date.now() - ADMIN_LOG_RETENTION_MS) * 1000;
      supabaseRequest("admin_logs", { method: "DELETE", query: `id=lt.${cutoffId}` })
        .catch((err) => console.error("Old Supabase log cleanup failed:", err.message));

      const rows = await supabaseSelectAll("admin_logs", {
        select: "*",
        query: `id=gte.${cutoffId}`,
        order: "id.desc"
      });

      return (rows || []).map((row) => ({
        id: Number(row.id) || 0,
        index: row.index || null,
        date: normalizeText(row.date, 40),
        status: normalizeText(row.status, 30),
        course: normalizeText(row.course, 60),
        year: normalizeText(row.year, 30),
        spec: normalizeText(row.spec, 100),
        semester: normalizeText(row.semester, 30),
        exam: normalizeText(row.exam, 30),
        name: normalizeText(row.name, 160),
        adminName: normalizeText(row.admin_name, 100)
      }));
    } catch (err) {
      console.error("Supabase logs fetch failed:", err.message);
      return [];
    }
  }

  async function appendAdminLogToSupabase(logData) {
    try {
      await supabaseRequest("admin_logs", {
        method: "POST",
        body: {
          id: logData.id,
          index: logData.index ? String(logData.index) : null,
          date: normalizeText(logData.date, 40),
          status: normalizeText(logData.status, 30),
          course: normalizeText(logData.course || "-", 60),
          year: normalizeText(logData.year || "-", 30),
          spec: normalizeText(logData.spec || "-", 100),
          semester: normalizeText(logData.semester || "-", 30),
          exam: normalizeText(logData.exam || "-", 30),
          name: normalizeText(logData.name || "-", 160),
          admin_name: normalizeText(logData.adminName || "-", 100)
        }
      });
    } catch (err) {
      console.error("Supabase log insert crash:", err.message);
    }
  }

  // Column order MUST match the "Logs" tab header row exactly:
  // ID | Course | Year | Spec | Sem | Exam | Status | Date | Name | Admin
  async function appendAdminLogToSheet(logData) {
    const sheets = await getServiceSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Logs!A:J",
      valueInputOption: SHEET_WRITE_MODE,
      requestBody: {
        values: [[
          logData.id,
          sheetCell(logData.course || "-", 60),
          sheetCell(logData.year || "-", 30),
          sheetCell(logData.spec || "-", 100),
          sheetCell(logData.semester || "-", 30),
          sheetCell(logData.exam || "-", 30),
          sheetCell(logData.status || "-", 30),
          sheetCell(logData.date || "-", 40),
          sheetCell(logData.name || "-", 160),
          sheetCell(logData.adminName || "-", 100)
        ]]
      }
    });
  }

  async function ensureAssistantSheetTab(sheets) {
    if (assistantSheetReady) return;
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
      fields: "sheets.properties.title"
    });
    const exists = (spreadsheet.data.sheets || []).some((sheet) => sheet.properties?.title === ASSISTANT_REQUESTS_SHEET);
    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: ASSISTANT_REQUESTS_SHEET } } }] }
      });
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: sheetRange(ASSISTANT_REQUESTS_SHEET, "A1:J1"),
      valueInputOption: SHEET_WRITE_MODE,
      requestBody: { values: [["Date", "Email", "Question", "Status", "Message", "Paper Name", "Course", "Year", "Semester", "Link"]] }
    });
    assistantSheetReady = true;
  }

  async function appendAssistantRequestToSheet(logData) {
    const sheets = await getServiceSheets();
    await ensureAssistantSheetTab(sheets);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: sheetRange(ASSISTANT_REQUESTS_SHEET, "A:J"),
      valueInputOption: SHEET_WRITE_MODE,
      requestBody: {
        values: [[
          sheetCell(logData.date, 40),
          sheetCell(logData.email, 254),
          sheetCell(sanitizeFreeText(logData.question, 500), 500),
          sheetCell(logData.status, 30),
          sheetCell(logData.message, 200),
          sheetCell(logData.topResult?.name || "", 160),
          sheetCell(logData.course || logData.topResult?.course || "", 60),
          sheetCell(logData.year || logData.topResult?.year || "", 30),
          sheetCell(logData.semester || logData.topResult?.sem || "", 30),
          sheetCell(logData.topResult?.link || "", 500)
        ]]
      }
    });
  }

  async function clearAdminLogsSheet() {
    const sheets = await getServiceSheets();
    await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: "Logs!A2:J" });
  }

  async function deleteAdminLogsFromSheet(ids) {
    const safeIds = new Set(ids
      .map((id) => Number(id))
      .filter((id) => Number.isSafeInteger(id) && id > 0)
      .map(String));
    if (safeIds.size === 0) return;

    const sheets = await getServiceSheets();
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Logs!A2:J" });
    const remainingRows = (response.data.values || []).filter((row) => !safeIds.has(String(Number(row[0]) || 0)));
    await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: "Logs!A2:J" });
    if (remainingRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: "Logs!A2",
        valueInputOption: SHEET_WRITE_MODE,
        requestBody: { values: remainingRows }
      });
    }
  }

  async function getStudentQueryInsights({ days = 30 } = {}) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const rows = await supabaseSelectAll("student_queries", {
      select: "question,status,paper_name,created_at",
      query: `created_at=gte.${cutoffDate}`,
      order: "created_at.desc"
    });
    return { windowDays: days, ...computeStudentQueryInsights(rows || []) };
  }

  return {
    sheetCell,
    saveAssistantRequestLog,
    getAdminLogsFromSupabase,
    appendAdminLogToSupabase,
    appendAdminLogToSheet,
    clearAdminLogsSheet,
    deleteAdminLogsFromSheet,
    getStudentQueryInsights
  };
}

module.exports = { createAdminLogService, sheetCell, sheetRange, computeStudentQueryInsights };

const {
  SHEET_ID,
  SHEET_URL,
  SHEET_WRITE_MODE
} = require("../../config/env");
const { getServiceSheets } = require("../googleService");
const {
  hasPaperSlotFields,
  resolveExpectedSheetRowIndex,
  paperFromSheetRow,
  isPublicPaper,
  isAdminSheetRow,
  sortPublicPapers,
  parsePublishedSheetRows
} = require("../../models/paperModel");
const { dedupePapers } = require("../assistantService");

function createPaperSheetService() {
  async function getSheetRows() {
    const sheets = await getServiceSheets();
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:G"
    });
    return { sheets, rows: sheetData.data.values || [] };
  }

  async function mirrorPaperToSheet(paper) {
    if (!paper) return;
    const { sheets } = await getSheetRows();
    const rowValues = [
      paper.course,
      paper.year,
      paper.spec || paper.specialization,
      paper.sem || paper.semester,
      paper.exam,
      paper.name || "",
      paper.link || ""
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:G",
      valueInputOption: SHEET_WRITE_MODE,
      requestBody: { values: [rowValues] }
    });
  }

  async function mirrorDeletePaperFromSheet(expectedPaper) {
    if (!hasPaperSlotFields(expectedPaper)) return;
    const { sheets, rows } = await getSheetRows();
    const rowIndex = resolveExpectedSheetRowIndex(null, rows, expectedPaper);
    if (!rowIndex) return;

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId;
    if (sheetId === undefined) return;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: rowIndex - 1, endIndex: rowIndex }
          }
        }]
      }
    });
  }

  async function fetchAdminPapersFromPublishedSheet() {
    const { rows } = await getSheetRows();
    return sortPublicPapers(rows.slice(1).map((row, i) => paperFromSheetRow(row, i + 2)).filter(isAdminSheetRow));
  }

  async function fetchPublicPapersFromSheet() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(SHEET_URL, { signal: controller.signal });
      if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}`);
      const text = await response.text();
      if (text.length > 5 * 1024 * 1024) throw new Error("Sheet response too large");

      const rows = parsePublishedSheetRows(text);
      return sortPublicPapers(dedupePapers(rows
        .map((row) => paperFromSheetRow((row.c || []).map((cell) => cell?.v || "")))
        .filter(isPublicPaper)));
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    getSheetRows,
    mirrorPaperToSheet,
    mirrorDeletePaperFromSheet,
    fetchAdminPapersFromPublishedSheet,
    fetchPublicPapersFromSheet
  };
}

module.exports = { createPaperSheetService };

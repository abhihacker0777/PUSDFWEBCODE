import { getServiceSheets } from "./googleAuth";
import { Paper } from "@/types/paper";

const SHEET_ID = process.env.SHEET_ID || "";
const SHEET_URL = process.env.SHEET_URL || "";
const SHEET_WRITE_MODE = process.env.SHEET_WRITE_MODE || "USER_ENTERED";

function sanitize(str: any, maxLen = 160): string {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

function safeUrl(url: any): string {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return "";
}

export function parsePublishedSheetRows(text: string): any[] {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;
  if (start < 0 || end <= start) throw new Error("Missing sheet JSON wrapper");
  const json = JSON.parse(text.slice(start, end));
  return Array.isArray(json.table?.rows) ? json.table.rows : [];
}

export function paperFromSheetRow(row: any[] = [], index: string | number | null = null): Paper {
  const spec = sanitize(row[2], 100);
  const sem = sanitize(row[3], 30);
  const name = sanitize(row[5], 160);
  const link = safeUrl(row[6]);
  const id = String(index || "");

  return {
    id,
    index: id,
    course: sanitize(row[0], 60),
    year: sanitize(row[1], 30),
    spec,
    specialization: spec,
    sem,
    semester: sem,
    exam: sanitize(row[4], 30),
    name,
    title: name,
    subject: name,
    link,
    drive_url: link,
    driveFileId: "",
    drive_file_id: "",
  };
}

export async function fetchPublicPapersFromSheet(): Promise<Paper[]> {
  if (!SHEET_URL) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(SHEET_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}`);
    const text = await response.text();
    if (text.length > 5 * 1024 * 1024) throw new Error("Sheet response too large");

    const rows = parsePublishedSheetRows(text);
    return rows
      .map((row, idx) => {
        const cells = (row.c || []).map((cell: any) => cell?.v || "");
        return paperFromSheetRow(cells, idx + 2);
      })
      .filter((p) => p.course && p.year && p.sem && p.exam && p.name && p.link);
  } finally {
    clearTimeout(timeout);
  }
}

export async function getSheetRows() {
  if (!SHEET_ID) return { sheets: null, rows: [] };
  const sheets = await getServiceSheets();
  const sheetData = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A:G"
  });
  return { sheets, rows: sheetData.data.values || [] };
}

export async function mirrorPaperToSheet(paper: Partial<Paper>, expectedPaper?: Partial<Paper> | null) {
  if (!SHEET_ID || !paper) return;
  try {
    const { sheets, rows } = await getSheetRows();
    if (!sheets) return;

    const rowValues = [
      paper.course || "",
      paper.year || "",
      paper.spec || paper.specialization || "",
      paper.sem || paper.semester || "",
      paper.exam || "",
      paper.name || paper.title || paper.subject || "",
      paper.link || paper.drive_url || ""
    ];

    // If updating an expected paper, find matching row
    if (expectedPaper) {
      const matchIdx = rows.findIndex((r, idx) =>
        idx > 0 &&
        sanitize(r[0], 60) === expectedPaper.course &&
        sanitize(r[1], 30) === expectedPaper.year &&
        sanitize(r[3], 30) === (expectedPaper.sem || expectedPaper.semester) &&
        sanitize(r[4], 30) === expectedPaper.exam &&
        sanitize(r[5], 160) === (expectedPaper.name || expectedPaper.title || expectedPaper.subject)
      );

      if (matchIdx > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Sheet1!A${matchIdx + 1}:G${matchIdx + 1}`,
          valueInputOption: SHEET_WRITE_MODE,
          requestBody: { values: [rowValues] }
        });
        return;
      }
    }

    // Check if exact paper already exists
    const existingIdx = rows.findIndex((r, idx) =>
      idx > 0 &&
      sanitize(r[0], 60) === paper.course &&
      sanitize(r[1], 30) === paper.year &&
      sanitize(r[3], 30) === (paper.sem || paper.semester) &&
      sanitize(r[4], 30) === paper.exam &&
      sanitize(r[5], 160) === (paper.name || paper.title || paper.subject)
    );

    if (existingIdx > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Sheet1!A${existingIdx + 1}:G${existingIdx + 1}`,
        valueInputOption: SHEET_WRITE_MODE,
        requestBody: { values: [rowValues] }
      });
      return;
    }

    // Append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:G",
      valueInputOption: SHEET_WRITE_MODE,
      requestBody: { values: [rowValues] }
    });
  } catch (err) {
    console.error("mirrorPaperToSheet error:", err);
  }
}

export async function mirrorDeletePaperFromSheet(expectedPaper: Partial<Paper>) {
  if (!SHEET_ID || !expectedPaper) return;
  try {
    const { sheets, rows } = await getSheetRows();
    if (!sheets) return;

    const rowIndex = rows.findIndex((r, idx) =>
      idx > 0 &&
      sanitize(r[0], 60) === expectedPaper.course &&
      sanitize(r[1], 30) === expectedPaper.year &&
      sanitize(r[3], 30) === (expectedPaper.sem || expectedPaper.semester) &&
      sanitize(r[4], 30) === expectedPaper.exam &&
      sanitize(r[5], 160) === (expectedPaper.name || expectedPaper.title || expectedPaper.subject)
    );

    if (rowIndex <= 0) return;

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId;
    if (sheetId === undefined) return;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 }
          }
        }]
      }
    });
  } catch (err) {
    console.error("mirrorDeletePaperFromSheet error:", err);
  }
}

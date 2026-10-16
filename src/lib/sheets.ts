import { getServiceSheets } from "./googleAuth";
import { Paper } from "@/types/paper";

const SHEET_ID = process.env.SHEET_ID || "";
const SHEET_URL = process.env.SHEET_URL || "";
const SHEET_WRITE_MODE = "RAW" as const;

function sanitize(str: any, maxLen = 160): string {
  if (typeof str !== "string") return "";
  let trimmed = str.trim().slice(0, maxLen);
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    trimmed = `'${trimmed}`;
  }
  return trimmed;
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

function isPaperMatch(r: any[], paper: Partial<Paper>): boolean {
  if (!r || r.length === 0 || !paper) return false;
  const sheetDriveUrl = String(r[6] || "").trim();
  const paperDriveUrl = String(paper.drive_url || paper.link || "").trim();

  // 1. Exact or normalized drive URL match (primary reliable identifier)
  if (paperDriveUrl && sheetDriveUrl) {
    if (sheetDriveUrl === paperDriveUrl) return true;
    const cleanUrl = (u: string) => u.split("?")[0].replace(/\/+$/, "");
    if (cleanUrl(sheetDriveUrl) === cleanUrl(paperDriveUrl)) return true;
  }

  // 2. Drive file ID match in link
  const fileId = String(paper.drive_file_id || paper.driveFileId || "").trim();
  if (fileId && sheetDriveUrl.includes(fileId)) {
    return true;
  }

  // 3. Fallback: Normalized metadata match (case-insensitive, trimmed)
  const norm = (s: any) => String(s || "").trim().toLowerCase();
  const courseMatch = norm(r[0]) === norm(paper.course);
  const semMatch = norm(r[3]) === norm(paper.sem || paper.semester);
  const examMatch = norm(r[4]) === norm(paper.exam);
  const titleMatch = norm(r[5]) === norm(paper.name || paper.title || paper.subject);

  return courseMatch && semMatch && examMatch && titleMatch;
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

    if (expectedPaper) {
      const matchIdx = rows.findIndex((r, idx) => idx > 0 && isPaperMatch(r, expectedPaper));
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

    const existingIdx = rows.findIndex((r, idx) => idx > 0 && isPaperMatch(r, paper));
    if (existingIdx > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Sheet1!A${existingIdx + 1}:G${existingIdx + 1}`,
        valueInputOption: SHEET_WRITE_MODE,
        requestBody: { values: [rowValues] }
      });
      return;
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:G",
      valueInputOption: SHEET_WRITE_MODE,
      requestBody: { values: [rowValues] }
    });
  } catch (err) {
    console.error("Mirror Paper To Sheet Error:", err);
  }
}

export async function mirrorDeletePaperFromSheet(expectedPaper: Partial<Paper>) {
  if (!SHEET_ID || !expectedPaper) return;
  try {
    const { sheets, rows } = await getSheetRows();
    if (!sheets || !rows || rows.length <= 1) return;

    const rowIndex = rows.findIndex((r, idx) => idx > 0 && isPaperMatch(r, expectedPaper));
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
    console.error("Mirror Delete Paper From Sheet Error:", err);
  }
}

export async function mirrorBulkDeletePapersFromSheet(papers: Partial<Paper>[]) {
  if (!SHEET_ID || !papers || papers.length === 0) return;
  try {
    const { sheets, rows } = await getSheetRows();
    if (!sheets || !rows || rows.length <= 1) return;

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId;
    if (sheetId === undefined) return;

    // Find all matching row indices
    const indicesToDelete = new Set<number>();
    for (const paper of papers) {
      const idx = rows.findIndex((r, rIdx) =>
        rIdx > 0 &&
        !indicesToDelete.has(rIdx) &&
        isPaperMatch(r, paper)
      );
      if (idx > 0) {
        indicesToDelete.add(idx);
      }
    }

    if (indicesToDelete.size === 0) return;

    // Delete in reverse order so row indices don't shift
    const sortedIndices = Array.from(indicesToDelete).sort((a, b) => b - a);
    const requests = sortedIndices.map((rowIndex) => ({
      deleteDimension: {
        range: { sheetId, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 }
      }
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests }
    });
  } catch (err) {
    console.error("Mirror Bulk Delete Papers From Sheet Error:", err);
  }
}

export async function mirrorAdminLogToSheet(log: {
  id?: any;
  course?: string;
  year?: string;
  spec?: string;
  semester?: string;
  exam?: string;
  status: string;
  date: string;
  name: string;
}) {
  if (!SHEET_ID) return;
  try {
    const sheets = await getServiceSheets();
    const rowValues = [
      String(log.id || Date.now()),
      log.course || "",
      log.year || "",
      log.spec || "",
      log.semester || "",
      log.exam || "",
      log.status || "",
      log.date || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      log.name || ""
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Logs!A:I",
      valueInputOption: SHEET_WRITE_MODE,
      requestBody: { values: [rowValues] }
    });
  } catch (err) {
    console.error("Mirror Admin Log To Sheet Error:", err);
  }
}

export async function mirrorStudentQueryToSheet(query: {
  date?: string;
  email?: string;
  question: string;
  status: string;
  message: string;
  paperName?: string;
  course?: string;
  year?: string;
  semester?: string;
  link?: string;
}) {
  if (!SHEET_ID) return;
  try {
    const sheets = await getServiceSheets();
    const rowValues = [
      query.date || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      query.email || "anonymous",
      query.question || "",
      query.status || "",
      query.message || "",
      query.paperName || "",
      query.course || "",
      query.year || "",
      query.semester || "",
      query.link || ""
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "AI Requests!A:J",
      valueInputOption: SHEET_WRITE_MODE,
      requestBody: { values: [rowValues] }
    });
  } catch (err) {
    console.error("Mirror Student Query To Sheet Error:", err);
  }
}

export async function mirrorBlockedUserToSheet(email: string, date?: string) {
  if (!SHEET_ID || !email) return;
  try {
    const sheets = await getServiceSheets();
    const cleanEmail = email.trim().toLowerCase();
    const logDate = date || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // Check if already in Blocked Users tab
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Blocked Users!A:B"
    });
    const rows = existing.data.values || [];
    const alreadyBlocked = rows.some((r, idx) => idx > 0 && String(r[0] || "").trim().toLowerCase() === cleanEmail);
    if (alreadyBlocked) return;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Blocked Users!A:B",
      valueInputOption: SHEET_WRITE_MODE,
      requestBody: { values: [[cleanEmail, logDate]] }
    });
  } catch (err) {
    console.error("Mirror Blocked User To Sheet Error:", err);
  }
}

export async function mirrorUnblockUserInSheet(email: string) {
  if (!SHEET_ID || !email) return;
  try {
    const sheets = await getServiceSheets();
    const cleanEmail = email.trim().toLowerCase();

    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Blocked Users!A:B"
    });
    const rows = sheetData.data.values || [];
    const rowIndex = rows.findIndex((r, idx) => idx > 0 && String(r[0] || "").trim().toLowerCase() === cleanEmail);
    if (rowIndex <= 0) return;

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const blockedSheet = spreadsheet.data.sheets?.find(s => s.properties?.title === "Blocked Users");
    const sheetId = blockedSheet?.properties?.sheetId;
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
    console.error("Mirror Unblock User In Sheet Error:", err);
  }
}

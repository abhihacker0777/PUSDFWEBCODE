const { SHEET_ID } = require("../../config/env");
const { getServiceSheets } = require("../googleService");

async function ensureAdminSettingsSheets(sheets) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets.properties.title"
  });
  const existsBlocked = spreadsheet.data.sheets.some((sheet) => sheet.properties.title === "Blocked Users");
  const existsReplies = spreadsheet.data.sheets.some((sheet) => sheet.properties.title === "Custom Replies");

  const requests = [];
  if (!existsBlocked) requests.push({ addSheet: { properties: { title: "Blocked Users" } } });
  if (!existsReplies) requests.push({ addSheet: { properties: { title: "Custom Replies" } } });

  if (requests.length === 0) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests }
  });

  if (!existsBlocked) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "'Blocked Users'!A1:B1",
      valueInputOption: "RAW",
      requestBody: { values: [["Email", "Date"]] }
    });
  }
  if (!existsReplies) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "'Custom Replies'!A1:B1",
      valueInputOption: "RAW",
      requestBody: { values: [["Keyword", "Reply"]] }
    });
  }
}

async function appendBlockedUserToSheet(email) {
  const sheets = await getServiceSheets();
  await ensureAdminSettingsSheets(sheets);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "'Blocked Users'!A:B",
    valueInputOption: "RAW",
    requestBody: { values: [[email, new Date().toLocaleString()]] }
  });
}

async function deleteSettingsSheetRow(sheetTitle, rowIndex) {
  const sheets = await getServiceSheets();
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = spreadsheet.data.sheets.find((item) => item.properties.title === sheetTitle);
  const sheetId = sheet?.properties?.sheetId;
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
}

async function findSettingsSheetRow(sheetTitle, columnRange, value) {
  const sheets = await getServiceSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${sheetTitle}'!${columnRange}`
  });
  const rows = res.data.values || [];
  return {
    sheets,
    rowIndex: rows.findIndex((row) => (row[0] || "").toLowerCase() === value)
  };
}

async function removeBlockedUserFromSheet(email) {
  const { rowIndex } = await findSettingsSheetRow("Blocked Users", "A:A", email);
  if (rowIndex > 0) await deleteSettingsSheetRow("Blocked Users", rowIndex);
}

async function upsertCustomReplyToSheet(keyword, reply) {
  const sheets = await getServiceSheets();
  await ensureAdminSettingsSheets(sheets);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Custom Replies'!A:A"
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row) => (row[0] || "").toLowerCase() === keyword);

  if (rowIndex > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'Custom Replies'!A${rowIndex + 1}:B${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [[keyword, reply]] }
    });
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "'Custom Replies'!A:B",
    valueInputOption: "RAW",
    requestBody: { values: [[keyword, reply]] }
  });
}

async function deleteCustomReplyFromSheet(keyword) {
  const { rowIndex } = await findSettingsSheetRow("Custom Replies", "A:A", keyword);
  if (rowIndex > 0) await deleteSettingsSheetRow("Custom Replies", rowIndex);
}

module.exports = {
  appendBlockedUserToSheet,
  deleteCustomReplyFromSheet,
  removeBlockedUserFromSheet,
  upsertCustomReplyToSheet
};

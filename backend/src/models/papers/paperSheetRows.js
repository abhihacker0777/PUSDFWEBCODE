const { sanitizePaperText, safePaperUrl } = require("../../utils/helpers");
const { hasAllPaperFields, hasPaperSlotFields } = require("./paperFields");

function parseSheetRowIndex(index, rows = []) {
  const rowIndex = Number(index);
  if (!Number.isSafeInteger(rowIndex) || rowIndex < 2 || rowIndex > rows.length) return null;
  return rowIndex;
}

function parseUpdatedRangeRow(range) {
  const match = String(range || "").match(/![A-Z]+(\d+):/);
  const rowIndex = Number(match?.[1]);
  return Number.isSafeInteger(rowIndex) ? rowIndex : null;
}

function rowMatchesPaper(row = [], paper = {}) {
  return sanitizePaperText(row[0], 60) === paper.course &&
    sanitizePaperText(row[1], 30) === paper.year &&
    sanitizePaperText(row[2], 100) === paper.spec &&
    sanitizePaperText(row[3], 30) === paper.sem &&
    sanitizePaperText(row[4], 30) === paper.exam &&
    sanitizePaperText(row[5], 160) === paper.name;
}

function rowMatchesPaperSlot(row = [], paper = {}) {
  return sanitizePaperText(row[0], 60) === paper.course &&
    sanitizePaperText(row[1], 30) === paper.year &&
    sanitizePaperText(row[2], 100) === paper.spec &&
    sanitizePaperText(row[3], 30) === paper.sem &&
    sanitizePaperText(row[4], 30) === paper.exam;
}

function resolveExpectedSheetRowIndex(index, rows = [], expectedPaper = {}) {
  if (!hasPaperSlotFields(expectedPaper)) return null;

  const rowIndex = parseSheetRowIndex(index, rows);
  if (rowIndex && rowMatchesPaperSlot(rows[rowIndex - 1], expectedPaper)) return rowIndex;

  if (!hasAllPaperFields(expectedPaper)) return null;
  for (let i = 1; i < rows.length; i++) {
    if (rowMatchesPaper(rows[i], expectedPaper)) return i + 1;
  }

  return null;
}

function paperMatchesExpectedSnapshot(existingPaper, expectedPaper) {
  if (!existingPaper || !hasAllPaperFields(expectedPaper)) return false;
  return rowMatchesPaper([
    existingPaper.course,
    existingPaper.year,
    existingPaper.spec || existingPaper.specialization,
    existingPaper.sem || existingPaper.semester,
    existingPaper.exam,
    existingPaper.name
  ], expectedPaper);
}

function rowHasBlankPaperData(row = []) {
  return !sanitizePaperText(row[5], 160) && !safePaperUrl(row[6]);
}

function paperFromSheetRow(row = [], index = null) {
  const spec = sanitizePaperText(row[2], 100);
  const sem = sanitizePaperText(row[3], 30);
  return {
    index,
    course: sanitizePaperText(row[0], 60),
    year: sanitizePaperText(row[1], 30),
    spec,
    specialization: spec,
    sem,
    semester: sem,
    exam: sanitizePaperText(row[4], 30),
    name: sanitizePaperText(row[5], 160),
    link: safePaperUrl(row[6])
  };
}

function isPublicPaper(paper = {}) {
  return paper.course && paper.year && paper.sem && paper.exam && paper.name && paper.link;
}

function isAdminSheetRow(paper = {}) {
  return paper.course && paper.year && paper.sem && paper.exam;
}

function parsePublishedSheetRows(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;
  if (start < 0 || end <= start) throw new Error("Missing sheet JSON wrapper");
  const json = JSON.parse(text.slice(start, end));
  return Array.isArray(json.table?.rows) ? json.table.rows : [];
}

module.exports = {
  parseSheetRowIndex,
  parseUpdatedRangeRow,
  rowMatchesPaper,
  rowMatchesPaperSlot,
  resolveExpectedSheetRowIndex,
  paperMatchesExpectedSnapshot,
  rowHasBlankPaperData,
  paperFromSheetRow,
  isPublicPaper,
  isAdminSheetRow,
  parsePublishedSheetRows
};

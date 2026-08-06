const fs = require("fs");
const { SHEET_ID, SHEET_WRITE_MODE, DISABLE_INLINE_SHEET_MIRROR } = require("../config/env");

function removeUploadedFile(file) {
  if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
}

function createAdminPaperJobs({
  isSupabaseConfigured,
  getSupabasePaperById,
  paperMatchesExpectedSnapshot,
  uploadFileToDrive,
  fetchSupabasePapers,
  updateSupabasePaper,
  extractDriveFileId,
  rowMatchesPaper,
  rowMatchesPaperSlot,
  rowHasBlankPaperData,
  insertSupabasePaper,
  invalidatePapersCache,
  mirrorPaperToSheet,
  getSheetRows,
  resolveExpectedSheetRowIndex,
  deleteSupabasePaper,
  mirrorDeletePaperFromSheet
}) {
  async function runSupabaseUpload({ fileLink, driveFileId, index, paper, expectedPaper }) {
    let savedPaper = null;
    let logStatus = "Updated";
    const allPapers = await fetchSupabasePapers({ publicOnly: false });

    if (index) {
      const existingPaper = await getSupabasePaperById(index);
      if (!existingPaper) throw new PaperNotFoundError("Paper Not Found");
      if (!paperMatchesExpectedSnapshot(existingPaper, expectedPaper)) {
        throw new PaperConflictError("Paper changed. Refresh and try again.");
      }

      savedPaper = await updateSupabasePaper(index, paper, {
        link: fileLink || existingPaper.link || "",
        driveFileId: driveFileId || existingPaper.driveFileId || extractDriveFileId(existingPaper.link)
      });
    } else {
      const exactPaper = allPapers.find((item) => rowMatchesPaper([
        item.course, item.year, item.spec, item.sem, item.exam, item.name, item.link
      ], paper));
      const blankSlot = allPapers.find((item) => rowMatchesPaperSlot([
        item.course, item.year, item.spec, item.sem, item.exam
      ], paper) && !item.name && !item.link);

      if (exactPaper) {
        savedPaper = await updateSupabasePaper(exactPaper.id, paper, {
          link: fileLink || exactPaper.link || "",
          driveFileId: driveFileId || exactPaper.driveFileId || extractDriveFileId(exactPaper.link)
        });
      } else if (blankSlot) {
        savedPaper = await updateSupabasePaper(blankSlot.id, paper, {
          link: fileLink || "",
          driveFileId: driveFileId || ""
        });
      } else {
        savedPaper = await insertSupabasePaper(paper, {
          link: fileLink || "",
          driveFileId: driveFileId || ""
        });
        logStatus = "Uploaded";
      }
    }

    invalidatePapersCache();
    const paperToMirror = savedPaper || { ...paper, link: fileLink || "", driveFileId: driveFileId || "" };
    mirrorPaperToSheet(paperToMirror, index ? expectedPaper : null).catch(console.error);
  }

  async function runSheetUpload({ fileLink, index, paper, expectedPaper, adminName }) {
    const { sheets, rows } = await getSheetRows();

    if (index) {
      const rowIndex = resolveExpectedSheetRowIndex(index, rows, expectedPaper);
      if (!rowIndex) throw new PaperConflictError("Paper changed. Refresh and try again.");

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Sheet1!A${rowIndex}:G${rowIndex}`,
        valueInputOption: SHEET_WRITE_MODE,
        requestBody: { values: [[paper.course, paper.year, paper.spec, paper.sem, paper.exam, paper.name, fileLink || rows[rowIndex - 1][6] || ""]] }
      });
      invalidatePapersCache();
      return;
    }

    let found = false;
    let foundRowIndex = null;
    const blankSlotExists = rows.some((row, i) => i > 0 && rowMatchesPaperSlot(row, paper) && rowHasBlankPaperData(row));
    const duplicateRowIndexes = [];

    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (rowMatchesPaper(row, paper)) {
        if (blankSlotExists) {
          duplicateRowIndexes.push(i + 1);
          continue;
        }
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Sheet1!G${i + 1}`,
          valueInputOption: SHEET_WRITE_MODE,
          requestBody: { values: [[fileLink || row[6]]] }
        });
        found = true;
        foundRowIndex = i + 1;
        break;
      }
    }

    if (!found) {
      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i];
        if (rowMatchesPaperSlot(row, paper) && rowHasBlankPaperData(row)) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `Sheet1!A${i + 1}:G${i + 1}`,
            valueInputOption: SHEET_WRITE_MODE,
            requestBody: { values: [[paper.course, paper.year, paper.spec, paper.sem, paper.exam, paper.name, fileLink || ""]] }
          });
          for (const duplicateRowIndex of duplicateRowIndexes) {
            await sheets.spreadsheets.values.clear({
              spreadsheetId: SHEET_ID,
              range: `Sheet1!A${duplicateRowIndex}:G${duplicateRowIndex}`
            });
          }
          found = true;
          foundRowIndex = i + 1;
          break;
        }
      }
    }

    if (!found) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A:G",
        valueInputOption: SHEET_WRITE_MODE,
        requestBody: { values: [[paper.course, paper.year, paper.spec, paper.sem, paper.exam, paper.name, fileLink || ""]] }
      });
    }
    invalidatePapersCache();
  }



  async function runUploadPaperJob({ file, index, paper, expectedPaper, adminName }) {
    try {
      let fileLink = null;
      let driveFileId = null;

      if (file) {
        const uploadedDriveFile = await uploadFileToDrive(file);
        fileLink = uploadedDriveFile.link;
        driveFileId = uploadedDriveFile.id;
      }

      if (isSupabaseConfigured()) {
        return await runSupabaseUpload({ fileLink, driveFileId, index, paper, expectedPaper, adminName });
      }
      return await runSheetUpload({ fileLink, index, paper, expectedPaper, adminName });
    } finally {
      removeUploadedFile(file);
    }
  }

  async function runDeletePaperJob({ index, expectedPaper, adminName }) {
    if (isSupabaseConfigured()) {
      const existingPaper = await getSupabasePaperById(index);
      if (!existingPaper) throw new PaperNotFoundError("Paper Not Found");
      if (!paperMatchesExpectedSnapshot(existingPaper, expectedPaper)) {
        throw new PaperConflictError("Paper changed. Refresh and try again.");
      }

      await deleteSupabasePaper(index);
      if (!DISABLE_INLINE_SHEET_MIRROR) {
        mirrorDeletePaperFromSheet(expectedPaper).catch(console.error);
        invalidatePapersCache();
        return;
      }

    const { sheets, rows } = await getSheetRows();
    const rowIndex = resolveExpectedSheetRowIndex(index, rows, expectedPaper);
    if (!rowIndex) throw new PaperConflictError("Paper changed. Refresh and try again.");

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheetId = spreadsheet.data.sheets[0].properties.sheetId;

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
      invalidatePapersCache();
    } catch (backgroundErr) {
      console.error("Background Delete failed:", backgroundErr.message);
    }
  }

  return {
    runUploadPaperJob,
    runDeletePaperJob
  };
}

module.exports = { createAdminPaperJobs, removeUploadedFile, PaperConflictError, PaperNotFoundError, generateLogId, formatLogDate };

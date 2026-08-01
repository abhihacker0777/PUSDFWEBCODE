const {
  normalizeText,
  sanitizePaperText,
  safePaperUrl
} = require("../../utils/helpers");

function toSupabasePaperRow(paper = {}, extras = {}) {
  return {
    course: sanitizePaperText(paper.course, 60),
    year: sanitizePaperText(paper.year, 30),
    specialization: sanitizePaperText(paper.spec || paper.specialization, 100),
    semester: sanitizePaperText(paper.sem || paper.semester, 30),
    exam: sanitizePaperText(paper.exam, 30),
    title: sanitizePaperText(paper.name, 160),
    drive_url: safePaperUrl(extras.link ?? paper.link),
    drive_file_id: normalizeText(extras.driveFileId ?? paper.driveFileId, 160),
    updated_at: new Date().toISOString()
  };
}

function paperFromSupabaseRow(row = {}) {
  const spec = sanitizePaperText(row.specialization || row.spec, 100);
  const sem = sanitizePaperText(row.semester || row.sem, 30);
  return {
    id: row.id,
    index: row.id,
    course: sanitizePaperText(row.course, 60),
    year: sanitizePaperText(row.year, 30),
    spec,
    specialization: spec,
    sem,
    semester: sem,
    exam: sanitizePaperText(row.exam, 30),
    name: sanitizePaperText(row.title || row.name, 160),
    link: safePaperUrl(row.drive_url || row.link),
    driveFileId: normalizeText(row.drive_file_id || row.driveFileId, 160)
  };
}

function paperOptionFromSupabaseRow(row = {}) {
  return {
    course: sanitizePaperText(row.course, 60),
    year: sanitizePaperText(row.year, 30),
    specialization: sanitizePaperText(row.specialization || row.spec, 100),
    sem: sanitizePaperText(row.semester || row.sem, 30),
    semester: sanitizePaperText(row.semester || row.sem, 30),
    exam: sanitizePaperText(row.exam, 30)
  };
}

module.exports = {
  toSupabasePaperRow,
  paperFromSupabaseRow,
  paperOptionFromSupabaseRow
};

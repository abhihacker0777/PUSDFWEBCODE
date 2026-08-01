const { sanitizePaperText } = require("../../utils/helpers");

function getPaperPayload(body = {}) {
  return {
    course: sanitizePaperText(body.course, 60),
    year: sanitizePaperText(body.year, 30),
    spec: sanitizePaperText(body.spec, 100),
    sem: sanitizePaperText(body.sem, 30),
    exam: sanitizePaperText(body.exam, 30),
    name: sanitizePaperText(body.name, 160)
  };
}

function getExpectedPaperPayload(body = {}) {
  return {
    course: sanitizePaperText(body.expectedCourse, 60),
    year: sanitizePaperText(body.expectedYear, 30),
    spec: sanitizePaperText(body.expectedSpec, 100),
    sem: sanitizePaperText(body.expectedSem, 30),
    exam: sanitizePaperText(body.expectedExam, 30),
    name: sanitizePaperText(body.expectedName, 160)
  };
}

function hasAllPaperFields(paper = {}) {
  return paper.course && paper.year && paper.spec && paper.sem && paper.exam && paper.name;
}

function hasPaperSlotFields(paper = {}) {
  return paper.course && paper.year && paper.spec && paper.sem && paper.exam;
}

function normalizePaperFilters(source = {}) {
  return {
    course: sanitizePaperText(source.course, 60),
    year: sanitizePaperText(source.year, 30),
    specialization: sanitizePaperText(source.specialization || source.spec, 100),
    sem: sanitizePaperText(source.sem || source.semester, 30),
    exam: sanitizePaperText(source.exam, 30)
  };
}

function sortPublicPapers(papers = []) {
  return [...papers].sort((a, b) =>
    `${a.course}-${a.year}-${a.spec}-${a.sem}-${a.exam}-${a.name}`
      .localeCompare(`${b.course}-${b.year}-${b.spec}-${b.sem}-${b.exam}-${b.name}`)
  );
}

module.exports = {
  getPaperPayload,
  getExpectedPaperPayload,
  hasAllPaperFields,
  hasPaperSlotFields,
  normalizePaperFilters,
  sortPublicPapers
};

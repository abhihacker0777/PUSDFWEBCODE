const { sanitizePaperText } = require("../../utils/helpers");

function optionKey(option = {}) {
  return [
    option.course,
    option.year,
    option.specialization || option.spec || "",
    option.sem || option.semester || "",
    option.exam
  ].join("\u001F");
}

function buildPaperOptions(items = []) {
  const seen = new Set();
  const options = [];

  for (const item of items) {
    const option = {
      course: sanitizePaperText(item.course, 60),
      year: sanitizePaperText(item.year, 30),
      specialization: sanitizePaperText(item.specialization || item.spec, 100),
      sem: sanitizePaperText(item.sem || item.semester, 30),
      semester: sanitizePaperText(item.sem || item.semester, 30),
      exam: sanitizePaperText(item.exam, 30)
    };
    if (!option.course || !option.year || !option.sem || !option.exam) continue;
    const key = optionKey(option);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(option);
  }

  return options.sort((a, b) =>
    `${a.course}-${a.year}-${a.specialization}-${a.sem}-${a.exam}`
      .localeCompare(`${b.course}-${b.year}-${b.specialization}-${b.sem}-${b.exam}`)
  );
}

module.exports = {
  optionKey,
  buildPaperOptions
};

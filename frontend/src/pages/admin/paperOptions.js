import {
  ADD_COURSE,
  ADD_SEMESTER,
  ADD_SPEC,
  ADD_YEAR,
  courseSequence,
  examSequence,
  semesterSequence,
  yearSequence
} from "./adminConstants";
import {
  appendAddOption,
  defaultSemestersForYear,
  orderBySequence,
  uniqueList
} from "./adminHelpers";

export const buildPaperOptions = ({
  allPapers,
  course,
  year,
  spec,
  semester,
  exam,
  customSpecsByCourse,
  customSemestersByYear
}) => {
  const courses = appendAddOption(
    orderBySequence(uniqueList([...allPapers.map((item) => item.course), ...courseSequence]), courseSequence),
    ADD_COURSE
  );
  const years = appendAddOption(
    orderBySequence(uniqueList(allPapers.filter((item) => !course || item.course === course).map((item) => item.year)), yearSequence),
    ADD_YEAR
  );
  const specs = appendAddOption(
    uniqueList([
      ...allPapers
        .filter((item) => (!course || item.course === course) && (!year || item.year === year))
        .map((item) => item.spec),
      ...(course ? customSpecsByCourse[course] || [] : [])
    ]),
    ADD_SPEC
  );
  const semesters = appendAddOption(
    orderBySequence(uniqueList([
      ...allPapers
        .filter((item) => (!course || item.course === course) && (!year || item.year === year) && (!spec || item.spec === spec))
        .map((item) => item.semester),
      ...defaultSemestersForYear(year),
      ...(year ? customSemestersByYear[year] || [] : [])
    ]), semesterSequence),
    ADD_SEMESTER
  );
  const sheetExams = allPapers
    .filter((item) => (!course || item.course === course) && (!year || item.year === year) && (!spec || item.spec === spec) && (!semester || item.semester === semester))
    .map((item) => item.exam);

  return {
    courses,
    years,
    specs,
    semesters,
    exams: orderBySequence(uniqueList([...sheetExams, ...examSequence]), examSequence),
    papers: allPapers.filter((item) =>
      item.course === course &&
      item.year === year &&
      item.spec === spec &&
      item.semester === semester &&
      item.exam === exam
    )
  };
};

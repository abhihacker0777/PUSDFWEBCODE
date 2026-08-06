const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { paperMatchesExpectedSnapshot, resolveExpectedSheetRowIndex } = require("../src/models/papers/paperSheetRows");
const { getExpectedPaperPayload, hasAllPaperFields } = require("../src/models/papers/paperFields");
const { paperFromSupabaseRow } = require("../src/models/papers/paperSupabaseRows");

describe("paperMatchesExpectedSnapshot", () => {
  test("a row with blank fields matches its own accurate snapshot", () => {
    const existing = paperFromSupabaseRow({ id: 1, course: "PIHM", year: "1 Year", specialization: "Science", semester: "", exam: "ESE", title: "" });
    const expected = getExpectedPaperPayload({ expectedCourse: "PIHM", expectedYear: "1 Year", expectedSpec: "Science", expectedSem: "", expectedExam: "ESE", expectedName: "" });
    assert.equal(paperMatchesExpectedSnapshot(existing, expected), true);
  });

  test("a blank-field row rejects a stale (non-matching) expected snapshot", () => {
    const existing = paperFromSupabaseRow({ id: 1, course: "PIHM", year: "1 Year", specialization: "Science", semester: "", exam: "ESE", title: "" });
    const stale = getExpectedPaperPayload({ expectedCourse: "PIHM", expectedYear: "1 Year", expectedSpec: "Science", expectedSem: "", expectedExam: "ESE", expectedName: "Old Name" });
    assert.equal(paperMatchesExpectedSnapshot(existing, stale), false);
  });

  test("a fully populated row matches its own snapshot", () => {
    const existing = paperFromSupabaseRow({ id: 2, course: "PIHM", year: "1 Year", specialization: "Science", semester: "2", exam: "ESE", title: "Real Paper" });
    const expected = getExpectedPaperPayload({ expectedCourse: "PIHM", expectedYear: "1 Year", expectedSpec: "Science", expectedSem: "2", expectedExam: "ESE", expectedName: "Real Paper" });
    assert.equal(paperMatchesExpectedSnapshot(existing, expected), true);
  });

  test("a real mismatch on a fully populated row is still rejected", () => {
    const existing = paperFromSupabaseRow({ id: 2, course: "PIHM", year: "1 Year", specialization: "Science", semester: "2", exam: "ESE", title: "Real Paper" });
    const mismatch = getExpectedPaperPayload({ expectedCourse: "PIHM", expectedYear: "1 Year", expectedSpec: "Science", expectedSem: "2", expectedExam: "ESE", expectedName: "Different Name" });
    assert.equal(paperMatchesExpectedSnapshot(existing, mismatch), false);
  });

  test("returns false when there is no existing row", () => {
    assert.equal(paperMatchesExpectedSnapshot(null, getExpectedPaperPayload({})), false);
  });
});

describe("resolveExpectedSheetRowIndex", () => {
  const rows = [
    ["course", "year", "spec", "sem", "exam", "name", "link"],
    ["PIHM", "1 Year", "Science", "", "ESE", "", ""],
    ["PIHM", "1 Year", "Science", "2", "ESE", "Old Paper", "https://drive.google.com/file/d/abc"]
  ];

  test("finds a fully populated row by exact match", () => {
    const expected = { course: "PIHM", year: "1 Year", spec: "Science", sem: "2", exam: "ESE", name: "Old Paper" };
    assert.equal(resolveExpectedSheetRowIndex(null, rows, expected), 3);
  });

  test("finds a blank-field row even though sem and name are both blank", () => {
    const expected = { course: "PIHM", year: "1 Year", spec: "Science", sem: "", exam: "ESE", name: "" };
    assert.equal(resolveExpectedSheetRowIndex(null, rows, expected), 2);
  });

  test("does not match a real conflict", () => {
    const expected = { course: "PIHM", year: "1 Year", spec: "Science", sem: "", exam: "ESE", name: "Something Else" };
    assert.equal(resolveExpectedSheetRowIndex(null, rows, expected), null);
  });
});

describe("hasAllPaperFields", () => {
  test("rejects a payload missing the name", () => {
    assert.equal(Boolean(hasAllPaperFields({ course: "PIHM", year: "1 Year", spec: "Science", sem: "2", exam: "ESE", name: "" })), false);
  });

  test("accepts a fully populated payload", () => {
    assert.equal(Boolean(hasAllPaperFields({ course: "PIHM", year: "1 Year", spec: "Science", sem: "2", exam: "ESE", name: "Real" })), true);
  });
});

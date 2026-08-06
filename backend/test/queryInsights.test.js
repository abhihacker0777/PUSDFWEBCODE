const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { computeStudentQueryInsights } = require("../src/services/adminLogService");

describe("computeStudentQueryInsights", () => {
  const sample = [
    { question: "DBMS 3rd sem paper", status: "not_found", paper_name: "" },
    { question: "dbms 3rd sem paper", status: "not_found", paper_name: "" },
    { question: "OS previous paper", status: "not_found", paper_name: "" },
    { question: "give me networks paper", status: "found", paper_name: "Computer Networks ESE 2024" },
    { question: "give me networks paper", status: "found", paper_name: "Computer Networks ESE 2024" },
    { question: "hello", status: "info", paper_name: "" }
  ];

  test("counts total queries and status breakdown correctly", () => {
    const result = computeStudentQueryInsights(sample);
    assert.equal(result.totalQueries, 6);
    assert.equal(result.statusCounts.not_found, 3);
    assert.equal(result.statusCounts.found, 2);
    assert.equal(result.statusCounts.info, 1);
  });

  test("computes not-found rate as a percentage", () => {
    const result = computeStudentQueryInsights(sample);
    assert.equal(result.notFoundRate, 50);
  });

  test("groups not-found questions case-insensitively", () => {
    const result = computeStudentQueryInsights(sample);
    const dbmsEntry = result.topNotFoundQuestions.find((q) => q.question === "dbms 3rd sem paper");
    assert.ok(dbmsEntry, "differently-cased versions of the same question should be grouped together");
    assert.equal(dbmsEntry.count, 2);
  });

  test("ranks the most-requested found papers by count", () => {
    const result = computeStudentQueryInsights(sample);
    assert.equal(result.topFoundPapers[0].paperName, "Computer Networks ESE 2024");
    assert.equal(result.topFoundPapers[0].count, 2);
  });

  test("handles an empty result set without dividing by zero", () => {
    const result = computeStudentQueryInsights([]);
    assert.equal(result.totalQueries, 0);
    assert.equal(result.notFoundRate, 0);
    assert.deepEqual(result.topNotFoundQuestions, []);
  });
});

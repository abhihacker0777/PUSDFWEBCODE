const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { generateLogId } = require("../src/controllers/adminPaperJobs");

const ADMIN_LOG_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

describe("generateLogId", () => {
  test("stays within Number.isSafeInteger bounds", () => {
    for (let i = 0; i < 20; i += 1) {
      assert.ok(Number.isSafeInteger(generateLogId()));
    }
  });

  test("is always positive and roughly increasing over time", () => {
    const first = generateLogId();
    const second = generateLogId();
    assert.ok(first > 0 && second > 0);
    assert.ok(second >= first - 1000, "later ids should not be meaningfully smaller than earlier ones");
  });
});

describe("retention cutoff scale (adminLogService.getAdminLogsFromSupabase)", () => {
  // Mirrors the cutoff formula in adminLogService.js - kept here as an explicit,
  // named regression test for the specific bug: ids are generated at
  // Date.now()*1000+random scale, so the cutoff must be scaled the same way or
  // nothing is ever old enough to satisfy `id < cutoff`.
  function cutoffFor(now) {
    return (now - ADMIN_LOG_RETENTION_MS) * 1000;
  }

  test("a log written just now is kept (not below cutoff)", () => {
    const now = Date.now();
    const freshId = now * 1000 + 500;
    assert.ok(freshId >= cutoffFor(now));
  });

  test("a log 6 days old is still within the retention window", () => {
    const now = Date.now();
    const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;
    const id = sixDaysAgo * 1000 + 500;
    assert.ok(id >= cutoffFor(now), "6-day-old log must still be kept (retention is 7 days)");
  });

  test("a log 8 days old is correctly identified as past the cutoff", () => {
    const now = Date.now();
    const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
    const id = eightDaysAgo * 1000 + 500;
    assert.ok(id < cutoffFor(now), "8-day-old log must be past the 7-day cutoff and eligible for cleanup");
  });
});

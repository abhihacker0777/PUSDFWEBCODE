const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { createSupabaseWebhookController } = require("../src/controllers/supabaseWebhookController");

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.send = (b) => { res.body = b; return res; };
  return res;
}

function buildController(overrides = {}) {
  const calls = [];
  const controller = createSupabaseWebhookController({
    mirrorPaperToSheet: async (paper, expected) => calls.push({ fn: "mirrorPaperToSheet", paper: paper.name, expected: expected?.name || null }),
    mirrorDeletePaperFromSheet: async (expected) => calls.push({ fn: "mirrorDeletePaperFromSheet", expected: expected.name }),
    paperFromSupabaseRow: (row) => ({ course: row.course, year: row.year, spec: row.specialization, sem: row.semester, exam: row.exam, name: row.title, link: row.drive_url }),
    invalidatePapersCache: () => calls.push({ fn: "invalidatePapersCache" }),
    ...overrides
  });
  return { controller, calls };
}

describe("supabaseWebhookController", () => {
  test("INSERT mirrors the new paper with no expected snapshot", async () => {
    const { controller, calls } = buildController();
    const res = mockRes();
    await controller.handlePapersWebhook({ body: { type: "INSERT", table: "papers", record: { course: "BCA", title: "New Paper" }, old_record: null } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls[0], { fn: "mirrorPaperToSheet", paper: "New Paper", expected: null });
  });

  test("UPDATE mirrors using old_record to find the row to update", async () => {
    const { controller, calls } = buildController();
    const res = mockRes();
    await controller.handlePapersWebhook({
      body: { type: "UPDATE", table: "papers", record: { title: "Renamed" }, old_record: { title: "Old Name" } }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls[0], { fn: "mirrorPaperToSheet", paper: "Renamed", expected: "Old Name" });
  });

  test("DELETE mirrors using old_record", async () => {
    const { controller, calls } = buildController();
    const res = mockRes();
    await controller.handlePapersWebhook({ body: { type: "DELETE", table: "papers", record: null, old_record: { title: "Gone Paper" } } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls[0], { fn: "mirrorDeletePaperFromSheet", expected: "Gone Paper" });
  });

  test("ignores payloads for tables other than papers", async () => {
    const { controller, calls } = buildController();
    const res = mockRes();
    await controller.handlePapersWebhook({ body: { type: "INSERT", table: "admin_logs", record: {} } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(calls.length, 0);
  });

  test("returns 500 on mirror failure so the caller's webhook delivery retries", async () => {
    const { controller } = buildController({
      mirrorPaperToSheet: async () => { throw new Error("Sheets API down"); }
    });
    const res = mockRes();
    await controller.handlePapersWebhook({ body: { type: "INSERT", table: "papers", record: { course: "X" } } }, res);
    assert.equal(res.statusCode, 500);
  });
});

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { getRolePermissions } = require("../src/config/permissions");
const { hasAdminPermission } = require("../src/services/admin/adminAuthMapper");

describe("getRolePermissions", () => {
  test("view role can read papers, assistant, and monitor data", () => {
    const perms = getRolePermissions("view", false);
    assert.ok(perms.includes("papers:read"), "view must be able to read papers - the dashboard fetches this unconditionally on load");
    assert.ok(perms.includes("assistant:read"));
    assert.ok(perms.includes("monitor:read"));
  });

  test("view role cannot write, delete, or manage anything", () => {
    const perms = getRolePermissions("view", false);
    assert.ok(!perms.includes("papers:update"));
    assert.ok(!perms.includes("papers:delete"));
    assert.ok(!perms.includes("papers:create"));
    assert.ok(!perms.includes("admins:manage"));
  });

  test("only the owner gets admins:manage, regardless of role", () => {
    assert.ok(!getRolePermissions("full", false).includes("admins:manage"));
    assert.ok(getRolePermissions("full", true).includes("admins:manage"));
    assert.ok(getRolePermissions("view", true).includes("admins:manage"));
  });

  test("editor can read and update papers but not delete or manage admins", () => {
    const perms = getRolePermissions("editor", false);
    assert.ok(perms.includes("papers:read"));
    assert.ok(perms.includes("papers:update"));
    assert.ok(!perms.includes("papers:delete"));
    assert.ok(!perms.includes("admins:manage"));
  });
});

describe("hasAdminPermission", () => {
  test("returns false for a null admin", () => {
    assert.equal(hasAdminPermission(null, "papers:read"), false);
  });

  test("returns true when the admin's role includes the permission", () => {
    assert.equal(hasAdminPermission({ role: "view", isOwner: false }, "papers:read"), true);
  });

  test("returns false when the admin's role lacks the permission", () => {
    assert.equal(hasAdminPermission({ role: "view", isOwner: false }, "papers:delete"), false);
  });
});

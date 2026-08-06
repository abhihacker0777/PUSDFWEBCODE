import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isAdminSessionExpired } from "../src/pages/admin/adminResponseHelpers.js";

describe("isAdminSessionExpired", () => {
  test("401 (not logged in) is treated as session expired", () => {
    assert.equal(isAdminSessionExpired({ status: 401 }), true);
  });

  test("403 (logged in, but not permitted) is NOT treated as session expired", () => {
    // This is the exact bug from this session: a 'view' role admin got a 403
    // on a permission-gated fetch and was wrongly logged out entirely.
    assert.equal(isAdminSessionExpired({ status: 403 }), false);
  });

  test("a normal 200 is not treated as session expired", () => {
    assert.equal(isAdminSessionExpired({ status: 200 }), false);
  });

  test("a 409 conflict is not treated as session expired", () => {
    assert.equal(isAdminSessionExpired({ status: 409 }), false);
  });
});

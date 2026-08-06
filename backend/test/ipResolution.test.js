const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { getClientIp } = require("../src/middleware/security/ipCsrfSecurity");

describe("getClientIp", () => {
  test("trusts req.ip over a spoofed X-Forwarded-For header", () => {
    const req = {
      ip: "203.0.113.9",
      headers: {
        "x-forwarded-for": "198.51.100.50, 203.0.113.9",
        "x-real-ip": "198.51.100.50"
      },
      socket: { remoteAddress: "203.0.113.9" }
    };
    assert.equal(getClientIp(req), "203.0.113.9", "must return the real client IP, not the attacker-injected one");
  });

  test("normal case with no spoofing attempt", () => {
    const req = { ip: "203.0.113.9", headers: {}, socket: { remoteAddress: "203.0.113.9" } };
    assert.equal(getClientIp(req), "203.0.113.9");
  });

  test("falls back to cf-connecting-ip only if req.ip is unavailable", () => {
    const req = { ip: undefined, headers: { "cf-connecting-ip": "203.0.113.9" }, socket: {} };
    assert.equal(getClientIp(req), "203.0.113.9");
  });
});

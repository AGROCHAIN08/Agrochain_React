const assert = require("node:assert/strict");
const { afterEach, beforeEach, describe, it } = require("node:test");
const jwt = require("jsonwebtoken");

const { protect } = require("../../middleware/authMiddleware");
const { createMockResponse } = require("../helpers/createMockResponse");

describe("authMiddleware.protect", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it("rejects requests without an authorization header", () => {
    const req = { headers: {} };
    const res = createMockResponse();
    let nextCalled = false;

    protect(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { msg: "Not authorized, no token" });
  });

  it("rejects malformed bearer headers", () => {
    const req = { headers: { authorization: "Token abc123" } };
    const res = createMockResponse();

    protect(req, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
      msg: "Invalid authorization header. Use: Bearer <token>",
    });
  });

  it("attaches the decoded user for valid bearer tokens", () => {
    const token = jwt.sign({ id: "user-1", role: "farmer" }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockResponse();
    let nextCalled = false;

    protect(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.user.id, "user-1");
    assert.equal(req.user.role, "farmer");
  });

  it("rejects expired tokens with a clear error", () => {
    const token = jwt.sign({ id: "user-1" }, process.env.JWT_SECRET, { expiresIn: "-1s" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockResponse();

    protect(req, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { msg: "Token expired. Please login again." });
  });
});

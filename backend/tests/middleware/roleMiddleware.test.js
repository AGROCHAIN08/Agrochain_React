const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { authorize } = require("../../middleware/roleMiddleware");
const { createMockResponse } = require("../helpers/createMockResponse");

describe("roleMiddleware.authorize", () => {
  it("rejects requests when no user is attached", () => {
    const middleware = authorize("admin");
    const req = {};
    const res = createMockResponse();

    middleware(req, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
      msg: "Role (None) is not authorized to access this route",
    });
  });

  it("rejects users whose role is not allowed", () => {
    const middleware = authorize("admin");
    const req = { user: { role: "dealer" } };
    const res = createMockResponse();

    middleware(req, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
      msg: "Role (dealer) is not authorized to access this route",
    });
  });

  it("allows users with an approved role", () => {
    const middleware = authorize("admin", "representative");
    const req = { user: { role: "admin" } };
    const res = createMockResponse();
    let nextCalled = false;

    middleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.body, undefined);
  });
});

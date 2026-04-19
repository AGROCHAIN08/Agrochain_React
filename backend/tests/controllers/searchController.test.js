const assert = require("node:assert/strict");
const { afterEach, describe, it, mock } = require("node:test");

const { createMockResponse } = require("../helpers/createMockResponse");

const controllerPath = require.resolve("../../controllers/searchController");
const userModelPath = require.resolve("../../models/user");
const redisClientPath = require.resolve("../../config/redis");

function loadController({ userModel, redisClient }) {
  delete require.cache[controllerPath];
  require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: userModel,
  };
  require.cache[redisClientPath] = {
    id: redisClientPath,
    filename: redisClientPath,
    loaded: true,
    exports: redisClient,
  };

  return require("../../controllers/searchController");
}

afterEach(() => {
  delete require.cache[controllerPath];
  delete require.cache[userModelPath];
  delete require.cache[redisClientPath];
  mock.restoreAll();
});

describe("searchController.globalSearch", () => {
  it("returns 400 when the search query is missing", async () => {
    const controller = loadController({
      userModel: { find: async () => [] },
      redisClient: { isReady: false },
    });
    const req = { query: {} };
    const res = createMockResponse();

    await controller.globalSearch(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      success: false,
      message: "Search query 'q' is required",
    });
  });

  it("returns cached results when Redis already has them", async () => {
    const findMock = mock.fn(async () => []);
    const getMock = mock.fn(async () =>
      JSON.stringify([{ userId: "cached-user", name: "Cached Farmer" }])
    );
    mock.method(console, "time", () => {});
    mock.method(console, "timeEnd", () => {});

    const controller = loadController({
      userModel: { find: findMock },
      redisClient: {
        isReady: true,
        get: getMock,
      },
    });
    const req = { query: { q: "Rice" } };
    const res = createMockResponse();

    await controller.globalSearch(req, res);

    assert.equal(findMock.mock.callCount(), 0);
    assert.equal(getMock.mock.callCount(), 1);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      source: "Redis Cache",
      success: true,
      data: [{ userId: "cached-user", name: "Cached Farmer" }],
    });
  });

  it("formats MongoDB results and escapes special characters in the search term", async () => {
    const searchResults = [
      {
        _id: "user-1",
        role: "dealer",
        businessName: "Harvest Hub",
        firstName: "Unused",
        farmLocation: "Punjab",
        inventory: [
          { productName: "Rice (A+)", productType: "Grain" },
          { productName: "Corn", productType: "Feed" },
        ],
        crops: [
          { varietySpecies: "Rice (A+)", productType: "Cereal" },
          { varietySpecies: "Millet", productType: "Grain" },
        ],
        score: 12.5,
      },
    ];

    const chain = {
      select: mock.fn(() => chain),
      sort: mock.fn(() => chain),
      lean: mock.fn(async () => searchResults),
    };
    const findMock = mock.fn(() => chain);
    const setExMock = mock.fn(async () => {});

    mock.method(console, "time", () => {});
    mock.method(console, "timeEnd", () => {});

    const controller = loadController({
      userModel: { find: findMock },
      redisClient: {
        isReady: true,
        get: mock.fn(async () => null),
        setEx: setExMock,
      },
    });
    const req = { query: { q: "Rice (A+)" } };
    const res = createMockResponse();

    await controller.globalSearch(req, res);

    assert.equal(findMock.mock.callCount(), 1);
    assert.deepEqual(findMock.mock.calls[0].arguments[0], {
      $text: { $search: "Rice (A+)" },
    });
    assert.equal(setExMock.mock.callCount(), 1);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.source, "MongoDB Text Index");
    assert.equal(res.body.count, 1);
    assert.deepEqual(res.body.data[0], {
      userId: "user-1",
      role: "dealer",
      name: "Harvest Hub",
      location: "Punjab",
      matchingInventory: [{ productName: "Rice (A+)", productType: "Grain" }],
      matchingCrops: [{ varietySpecies: "Rice (A+)", productType: "Cereal" }],
      relevanceScore: 12.5,
    });
  });

  it("returns 500 when the search operation throws", async () => {
    mock.method(console, "time", () => {});
    mock.method(console, "error", () => {});

    const controller = loadController({
      userModel: {
        find: () => {
          throw new Error("Database unavailable");
        },
      },
      redisClient: { isReady: false },
    });
    const req = { query: { q: "wheat" } };
    const res = createMockResponse();

    await controller.globalSearch(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      success: false,
      message: "Error performing search",
    });
  });
});

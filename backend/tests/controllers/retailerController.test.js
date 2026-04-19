const assert = require("node:assert/strict");
const { afterEach, describe, it, mock } = require("node:test");

const { createMockResponse } = require("../helpers/createMockResponse");

const controllerPath = require.resolve("../../controllers/retailercontroller");
const userModelPath = require.resolve("../../models/user");
const retailerOrderPath = require.resolve("../../models/retailerOrder");
const redisClientPath = require.resolve("../../config/redis");

function loadController({ userModel, retailerOrderModel, redisClient }) {
  delete require.cache[controllerPath];
  require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: userModel,
  };
  require.cache[retailerOrderPath] = {
    id: retailerOrderPath,
    filename: retailerOrderPath,
    loaded: true,
    exports: retailerOrderModel,
  };
  require.cache[redisClientPath] = {
    id: redisClientPath,
    filename: redisClientPath,
    loaded: true,
    exports: redisClient,
  };

  return require("../../controllers/retailercontroller");
}

afterEach(() => {
  delete require.cache[controllerPath];
  delete require.cache[userModelPath];
  delete require.cache[retailerOrderPath];
  delete require.cache[redisClientPath];
  mock.restoreAll();
});

describe("retailerController.getAvailableProducts", () => {
  it("returns cached products when Redis already has them", async () => {
    const getMock = mock.fn(async () =>
      JSON.stringify([{ productName: "Cached Rice", dealerEmail: "dealer@example.com" }])
    );
    const findMock = mock.fn(() => {
      throw new Error("MongoDB should not be called on cache hit");
    });
    mock.method(console, "time", () => {});
    mock.method(console, "timeEnd", () => {});
    mock.method(console, "log", () => {});

    const controller = loadController({
      userModel: { find: findMock },
      retailerOrderModel: {},
      redisClient: { isReady: true, get: getMock },
    });
    const res = createMockResponse();

    await controller.getAvailableProducts({}, res);

    assert.equal(getMock.mock.callCount(), 1);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      source: "Redis Cache",
      success: true,
      data: [{ productName: "Cached Rice", dealerEmail: "dealer@example.com" }],
    });
  });

  it("flattens dealer inventory on cache miss and stores it in Redis", async () => {
    const dealers = [
      {
        email: "dealer-1@example.com",
        businessName: "Harvest Hub",
        warehouseAddress: "Warehouse 1",
        inventory: [
          { productId: "p1", productName: "Rice", quantity: 10, unitPrice: 120 },
        ],
      },
      {
        email: "dealer-2@example.com",
        businessName: "Fresh Depot",
        warehouseAddress: "Warehouse 2",
        inventory: [
          { productId: "p2", productName: "Wheat", quantity: 20, unitPrice: 80 },
        ],
      },
    ];
    const chain = {
      select: mock.fn(() => chain),
      lean: mock.fn(async () => dealers),
    };
    const setExMock = mock.fn(async () => {});
    mock.method(console, "time", () => {});
    mock.method(console, "timeEnd", () => {});
    mock.method(console, "log", () => {});

    const controller = loadController({
      userModel: { find: mock.fn(() => chain) },
      retailerOrderModel: {},
      redisClient: {
        isReady: true,
        get: mock.fn(async () => null),
        setEx: setExMock,
      },
    });
    const res = createMockResponse();

    await controller.getAvailableProducts({}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.source, "MongoDB");
    assert.equal(res.body.data.length, 2);
    assert.deepEqual(res.body.data[0], {
      productId: "p1",
      productName: "Rice",
      quantity: 10,
      unitPrice: 120,
      dealerEmail: "dealer-1@example.com",
      dealerBusinessName: "Harvest Hub",
      warehouseAddress: "Warehouse 1",
    });
    assert.equal(setExMock.mock.callCount(), 1);
  });

  it("returns 500 when fetching products fails", async () => {
    mock.method(console, "error", () => {});

    const controller = loadController({
      userModel: {
        find: () => {
          throw new Error("Database unavailable");
        },
      },
      retailerOrderModel: {},
      redisClient: { isReady: false },
    });
    const res = createMockResponse();

    await controller.getAvailableProducts({}, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      success: false,
      message: "Server error while fetching products",
    });
  });
});

describe("retailerController.placeOrder", () => {
  it("groups cart items by dealer and creates one order per dealer", async () => {
    const userFindOneMock = mock.fn(async ({ email, role }) => {
      if (role === "retailer") {
        return { email, role, shopAddress: "Retail Shop" };
      }
      return null;
    });
    const dealerList = [
      { email: "dealer-1@example.com", businessName: "Harvest Hub", warehouseAddress: "W1" },
      { email: "dealer-2@example.com", businessName: "Fresh Depot", warehouseAddress: "W2" },
    ];
    const userFindChain = {
      select: mock.fn(() => userFindChain),
      lean: mock.fn(async () => dealerList),
    };
    const savedPayloads = [];

    function RetailerOrderMock(payload) {
      this.payload = payload;
      this.save = async () => {
        savedPayloads.push(this.payload);
        return { _id: `order-${savedPayloads.length}`, ...this.payload };
      };
    }

    const controller = loadController({
      userModel: {
        findOne: userFindOneMock,
        find: mock.fn(() => userFindChain),
      },
      retailerOrderModel: RetailerOrderMock,
      redisClient: { isReady: false },
    });
    const req = {
      body: {
        retailerEmail: "retailer@example.com",
        cartItems: [
          { _id: "i1", productName: "Rice", quantity: 2, unitPrice: 100, dealerEmail: "dealer-1@example.com" },
          { _id: "i2", productName: "Wheat", quantity: 1, unitPrice: 80, dealerEmail: "dealer-1@example.com" },
          { _id: "i3", productName: "Corn", quantity: 4, unitPrice: 50, dealerEmail: "dealer-2@example.com" },
        ],
      },
    };
    const res = createMockResponse();

    await controller.placeOrder(req, res, () => {});

    assert.equal(res.statusCode, 201);
    assert.equal(savedPayloads.length, 2);
    assert.equal(savedPayloads[0].products.length, 2);
    assert.equal(savedPayloads[0].totalAmount, 280);
    assert.equal(savedPayloads[1].products.length, 1);
    assert.equal(savedPayloads[1].totalAmount, 200);
  });

  it("rejects empty carts", async () => {
    const controller = loadController({
      userModel: {},
      retailerOrderModel: function RetailerOrderMock() {},
      redisClient: { isReady: false },
    });
    const req = { body: { retailerEmail: "retailer@example.com", cartItems: [] } };
    const res = createMockResponse();

    await controller.placeOrder(req, res, () => {});

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { msg: "Cart is empty" });
  });
});

const assert = require("node:assert/strict");
const { afterEach, describe, it, mock } = require("node:test");

const { createMockResponse } = require("../helpers/createMockResponse");

const controllerPath = require.resolve("../../controllers/dealercontroller");
const userModelPath = require.resolve("../../models/user");
const orderModelPath = require.resolve("../../models/order");
const retailerOrderPath = require.resolve("../../models/retailerOrder");
const redisClientPath = require.resolve("../../config/redis");

function loadController({ userModel, orderModel, retailerOrderModel, redisClient }) {
  delete require.cache[controllerPath];
  require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: userModel,
  };
  require.cache[orderModelPath] = {
    id: orderModelPath,
    filename: orderModelPath,
    loaded: true,
    exports: orderModel,
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

  return require("../../controllers/dealercontroller");
}

afterEach(() => {
  delete require.cache[controllerPath];
  delete require.cache[userModelPath];
  delete require.cache[orderModelPath];
  delete require.cache[retailerOrderPath];
  delete require.cache[redisClientPath];
  mock.restoreAll();
});

describe("dealerController.getAllProducts", () => {
  it("returns only approved crops from all farmers", async () => {
    const farmers = [
      {
        email: "farmer-1@example.com",
        firstName: "Anil",
        lastName: "Kumar",
        mobile: "9999999999",
        farmLocation: "Punjab",
        crops: [
          { _id: "c1", varietySpecies: "Rice", verificationStatus: "pending", dateAdded: "2026-01-02T00:00:00.000Z" },
          { _id: "c2", varietySpecies: "Corn", verificationStatus: "approved", dateAdded: "2026-01-04T00:00:00.000Z" },
        ],
      },
      {
        email: "farmer-2@example.com",
        firstName: "Meera",
        lastName: "",
        mobile: "8888888888",
        farmLocation: "Karnataka",
        crops: [
          { _id: "c3", varietySpecies: "Wheat", verificationStatus: "approved", dateAdded: "2026-01-03T00:00:00.000Z" },
          { _id: "c4", varietySpecies: "Millet", approvalStatus: "approved", dateAdded: "2026-01-01T00:00:00.000Z" },
        ],
      },
    ];
    const chain = {
      select: mock.fn(() => chain),
      lean: mock.fn(async () => farmers),
    };

    const controller = loadController({
      userModel: { find: mock.fn(() => chain) },
      orderModel: {},
      retailerOrderModel: {},
      redisClient: { isReady: false },
    });
    const res = createMockResponse();

    await controller.getAllProducts({}, res, () => {});

    assert.equal(res.body.length, 3);
    assert.deepEqual(
      res.body.map((product) => product.varietySpecies),
      ["Corn", "Wheat", "Millet"]
    );
    assert.equal(res.body[0].farmerEmail, "farmer-1@example.com");
    assert.equal(res.body[1].farmerEmail, "farmer-2@example.com");
  });
});

describe("dealerController.getDealerOrders", () => {
  it("hydrates order history from batched dealer and farmer lookups", async () => {
    const sortedOrders = [
      {
        _id: "order-1",
        dealerEmail: "dealer@example.com",
        farmerEmail: "farmer@example.com",
        vehicleId: "veh-1",
        productId: "crop-1",
        assignedDate: "2026-01-01T00:00:00.000Z",
      },
    ];
    const ordersChain = {
      sort: mock.fn(() => ordersChain),
      lean: mock.fn(async () => sortedOrders),
    };
    const dealerChain = {
      select: mock.fn(() => dealerChain),
      lean: mock.fn(async () => ({
        email: "dealer@example.com",
        vehicles: [{ _id: "veh-1", vehicleType: "Truck" }],
      })),
    };
    const farmersChain = {
      select: mock.fn(() => farmersChain),
      lean: mock.fn(async () => [
        {
          email: "farmer@example.com",
          firstName: "Anil",
          lastName: "Kumar",
          mobile: "9999999999",
          crops: [{ _id: "crop-1", varietySpecies: "Rice" }],
        },
      ]),
    };
    const findOneMock = mock.fn(() => dealerChain);

    const controller = loadController({
      userModel: {
        findOne: findOneMock,
        find: mock.fn(() => farmersChain),
      },
      orderModel: { find: mock.fn(() => ordersChain) },
      retailerOrderModel: {},
      redisClient: { isReady: false },
    });
    const req = { params: { email: "dealer@example.com" } };
    const res = createMockResponse();

    await controller.getDealerOrders(req, res, () => {});

    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].vehicleDetails.vehicleType, "Truck");
    assert.equal(res.body[0].farmerDetails.firstName, "Anil");
    assert.equal(res.body[0].productDetails.varietySpecies, "Rice");
  });
});

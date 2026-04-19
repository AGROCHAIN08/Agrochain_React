const assert = require("node:assert/strict");
const { afterEach, describe, it, mock } = require("node:test");

const { createMockResponse } = require("../helpers/createMockResponse");

const controllerPath = require.resolve("../../controllers/farmercontroller");
const userModelPath = require.resolve("../../models/user");
const orderModelPath = require.resolve("../../models/order");

function loadController({ userModel, orderModel }) {
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

  return require("../../controllers/farmercontroller");
}

afterEach(() => {
  delete require.cache[controllerPath];
  delete require.cache[userModelPath];
  delete require.cache[orderModelPath];
  mock.restoreAll();
});

describe("farmerController.getFarmerOrders", () => {
  it("hydrates farmer order history from batched dealer lookups", async () => {
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
    const farmerChain = {
      select: mock.fn(() => farmerChain),
      lean: mock.fn(async () => ({
        email: "farmer@example.com",
        crops: [{ _id: "crop-1", varietySpecies: "Rice" }],
      })),
    };
    const dealersChain = {
      select: mock.fn(() => dealersChain),
      lean: mock.fn(async () => [
        {
          email: "dealer@example.com",
          firstName: "Ravi",
          lastName: "Patel",
          businessName: "Harvest Hub",
          mobile: "8888888888",
          vehicles: [{ _id: "veh-1", vehicleType: "Truck" }],
        },
      ]),
    };
    const findOneMock = mock.fn(() => farmerChain);

    const controller = loadController({
      userModel: {
        findOne: findOneMock,
        find: mock.fn(() => dealersChain),
      },
      orderModel: { find: mock.fn(() => ordersChain) },
    });
    const req = { params: { email: "farmer@example.com" } };
    const res = createMockResponse();

    await controller.getFarmerOrders(req, res, () => {});

    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].vehicleDetails.vehicleType, "Truck");
    assert.equal(res.body[0].dealerDetails.businessName, "Harvest Hub");
    assert.equal(res.body[0].productDetails.varietySpecies, "Rice");
  });
});

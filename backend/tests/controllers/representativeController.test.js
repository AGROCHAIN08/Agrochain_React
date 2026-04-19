const assert = require("node:assert/strict");
const { afterEach, describe, it, mock } = require("node:test");

const { createMockResponse } = require("../helpers/createMockResponse");

const controllerPath = require.resolve("../../controllers/representativecontroller");
const userModelPath = require.resolve("../../models/user");
const cloudinaryPath = require.resolve("../../config/cloudinary");

function loadController({ userModel, cloudinaryModule }) {
  delete require.cache[controllerPath];
  require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: userModel,
  };
  require.cache[cloudinaryPath] = {
    id: cloudinaryPath,
    filename: cloudinaryPath,
    loaded: true,
    exports: cloudinaryModule,
  };

  return require("../../controllers/representativecontroller");
}

afterEach(() => {
  delete require.cache[controllerPath];
  delete require.cache[userModelPath];
  delete require.cache[cloudinaryPath];
  mock.restoreAll();
});

describe("representativeController.getPendingCrops", () => {
  it("groups pending crops by batchId", async () => {
    const farmers = [
      {
        _id: "farmer-1",
        firstName: "Anil",
        lastName: "Kumar",
        email: "farmer@example.com",
        mobile: "9999999999",
        farmLocation: "Punjab",
        crops: [
          {
            _id: "crop-1",
            productType: "Cereal",
            varietySpecies: "Rice",
            verificationStatus: "pending",
            approvalStatus: "pending",
            batchId: "batch-1",
            dateAdded: "2026-01-01T00:00:00.000Z",
          },
          {
            _id: "crop-2",
            productType: "Cereal",
            varietySpecies: "Wheat",
            verificationStatus: "pending",
            approvalStatus: "pending",
            batchId: "batch-1",
            dateAdded: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
    ];
    const findChain = {
      lean: mock.fn(async () => farmers),
    };
    const findMock = mock.fn(() => findChain);

    const controller = loadController({
      userModel: { find: findMock },
      cloudinaryModule: { cloudinary: {}, upload: {} },
    });
    const res = createMockResponse();

    await controller.getPendingCrops({}, res, () => {});

    assert.equal(findMock.mock.callCount(), 1);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].batchId, "batch-1");
    assert.equal(res.body[0].crops.length, 2);
  });
});

describe("representativeController.getMyAssigned", () => {
  it("returns only claimed or in-verification crops for the current representative", async () => {
    const farmers = [
      {
        _id: "farmer-1",
        firstName: "Anil",
        lastName: "Kumar",
        email: "farmer@example.com",
        mobile: "9999999999",
        farmLocation: "Punjab",
        crops: [
          {
            _id: "crop-1",
            productType: "Cereal",
            varietySpecies: "Rice",
            verificationStatus: "claimed",
            claimedBy: "rep@example.com",
            batchId: "batch-1",
            dateAdded: "2026-01-01T00:00:00.000Z",
          },
          {
            _id: "crop-2",
            productType: "Cereal",
            varietySpecies: "Wheat",
            verificationStatus: "approved",
            claimedBy: "rep@example.com",
            batchId: "batch-2",
            dateAdded: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
    ];

    const controller = loadController({
      userModel: { find: mock.fn(() => ({ lean: async () => farmers })) },
      cloudinaryModule: { cloudinary: {}, upload: {} },
    });
    const req = { user: { email: "rep@example.com" } };
    const res = createMockResponse();

    await controller.getMyAssigned(req, res, () => {});

    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].crops.length, 1);
    assert.equal(res.body[0].crops[0].varietySpecies, "Rice");
  });
});

describe("representativeController.getExpiryAlerts", () => {
  it("returns approved crops expiring within the requested window", async () => {
    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const later = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();
    const farmers = [
      {
        _id: "farmer-1",
        firstName: "Anil",
        lastName: "Kumar",
        email: "farmer@example.com",
        crops: [
          {
            _id: "crop-1",
            productType: "Cereal",
            varietySpecies: "Rice",
            verificationStatus: "approved",
            claimedBy: "rep@example.com",
            expiryDate: soon,
          },
          {
            _id: "crop-2",
            productType: "Cereal",
            varietySpecies: "Wheat",
            verificationStatus: "approved",
            claimedBy: "rep@example.com",
            expiryDate: later,
          },
        ],
      },
    ];

    const controller = loadController({
      userModel: { find: mock.fn(() => ({ lean: async () => farmers })) },
      cloudinaryModule: { cloudinary: {}, upload: {} },
    });
    const req = {
      user: { email: "rep@example.com" },
      query: { days: "7" },
    };
    const res = createMockResponse();

    await controller.getExpiryAlerts(req, res, () => {});

    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].varietySpecies, "Rice");
  });
});

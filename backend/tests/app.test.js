const assert = require("node:assert/strict");
const http = require("node:http");
const { afterEach, describe, it, mock } = require("node:test");
const express = require("express");

const appPath = require.resolve("../app");
const mockedRoutePaths = [
  "../routes/search",
  "../routes/auth",
  "../routes/farmer",
  "../routes/dealer",
  "../routes/retailer",
  "../routes/admin",
  "../routes/representative",
  "../routes/payment",
].map((modulePath) => require.resolve(modulePath));

const originalModules = new Map();

function createMockRouter() {
  const router = express.Router();
  router.get("/", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return router;
}

function replaceModule(modulePath, exports) {
  originalModules.set(modulePath, require.cache[modulePath]);
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports,
  };
}

function loadApp() {
  delete require.cache[appPath];

  for (const routePath of mockedRoutePaths) {
    replaceModule(routePath, createMockRouter());
  }

  return require("../app");
}

function requestApp(app, { method = "GET", urlPath = "/", headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const request = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: urlPath,
          method,
          headers,
        },
        (response) => {
          let body = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            body += chunk;
          });
          response.on("end", () => {
            server.close(() => {
              const isJson = response.headers["content-type"]?.includes("application/json");
              resolve({
                statusCode: response.statusCode,
                headers: response.headers,
                body: isJson && body ? JSON.parse(body) : body,
              });
            });
          });
        }
      );

      request.on("error", (error) => {
        server.close(() => reject(error));
      });

      request.end();
    });
  });
}

afterEach(() => {
  delete require.cache[appPath];

  for (const routePath of mockedRoutePaths) {
    const original = originalModules.get(routePath);
    if (original) {
      require.cache[routePath] = original;
    } else {
      delete require.cache[routePath];
    }
  }

  originalModules.clear();
  mock.restoreAll();
});

describe("backend app", () => {
  it("serves the health check payload", async () => {
    const app = loadApp();

    const response = await requestApp(app);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.message, "AgroChain API is running");
    assert.equal(response.body.version, "1.0.0");
    assert.equal(
      response.body.endpoints["POST /api/auth/send-otp"],
      "Send email OTP"
    );
  });

  it("returns CORS headers for allowed origins", async () => {
    const app = loadApp();

    const response = await requestApp(app, {
      headers: { Origin: "http://localhost:3000" },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["access-control-allow-origin"], "http://localhost:3000");
  });

  it("rejects blocked origins through the central error handler", async () => {
    mock.method(console, "log", () => {});
    mock.method(console, "error", () => {});

    const app = loadApp();
    const response = await requestApp(app, {
      headers: { Origin: "http://malicious.example" },
    });

    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.body, {
      success: false,
      message: "CORS policy does not allow this origin.",
    });
  });

  it("returns a structured 404 response for unknown endpoints", async () => {
    mock.method(console, "error", () => {});

    const app = loadApp();
    const response = await requestApp(app, {
      urlPath: "/not-a-real-route",
    });

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, {
      success: false,
      msg: "API endpoint not found",
      path: "/not-a-real-route",
      method: "GET",
    });
  });
});

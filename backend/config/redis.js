const redis = require("redis");

// Redis is an optional cache. If it is not running locally, the app falls
// back to MongoDB queries in the controllers.
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: false,
  },
});

redisClient.on("error", (err) => {
  console.warn(`Redis cache unavailable: ${err.code || err.message}`);
});

redisClient.on("connect", () => {
  console.log("Redis connected successfully");
});

// Connect to Redis automatically, but do not fail the API if cache is absent.
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn("Continuing without Redis cache.");
  }
})();

module.exports = redisClient;

const redis = require("redis");

// Create a Redis client. 
// Uses local Redis by default, or an environment variable for production (like Render)
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

// Connect to Redis automatically
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Failed to connect to Redis initially:", err);
  }
})();

module.exports = redisClient;
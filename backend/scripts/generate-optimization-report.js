const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const { spawnSync } = require("child_process");
const mongoose = require("mongoose");
const redis = require("redis");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const User = require("../models/user");
const Order = require("../models/order");

const reportsDir = path.join(__dirname, "..", "..", "reports", "performance");
const reportPath = path.join(reportsDir, "optimization-report.md");
const sampleQuery = process.argv[2] || "rice";
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function formatMs(value) {
  return `${value.toFixed(2)} ms`;
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function improvementPercent(before, after) {
  if (!before) {
    return 0;
  }

  return ((before - after) / before) * 100;
}

function getWinningIndexName(plan) {
  if (!plan || typeof plan !== "object") {
    return null;
  }

  if (plan.indexName) {
    return plan.indexName;
  }

  if (Array.isArray(plan.inputStages)) {
    for (const stage of plan.inputStages) {
      const indexName = getWinningIndexName(stage);
      if (indexName) {
        return indexName;
      }
    }
  }

  if (plan.inputStage) {
    return getWinningIndexName(plan.inputStage);
  }

  if (plan.queryPlan) {
    return getWinningIndexName(plan.queryPlan);
  }

  if (plan.winningPlan) {
    return getWinningIndexName(plan.winningPlan);
  }

  if (plan.shards) {
    for (const shard of Object.values(plan.shards)) {
      const indexName = getWinningIndexName(shard);
      if (indexName) {
        return indexName;
      }
    }
  }

  return null;
}

async function benchmark(label, iterations, action) {
  const durations = [];

  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    await action();
    durations.push(performance.now() - start);
  }

  return {
    label,
    runs: iterations,
    averageMs: average(durations),
    minMs: Math.min(...durations),
    maxMs: Math.max(...durations),
  };
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const redisClient = redis.createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: false,
    },
  });

  let redisAvailable = true;

  try {
    await redisClient.connect();
  } catch (error) {
    redisAvailable = false;
  }

  const searchProjection = {
    score: { $meta: "textScore" },
  };

  const searchQuery = { $text: { $search: sampleQuery } };

  const uncachedSearch = await benchmark("MongoDB full-text search", 5, async () => {
    await User.find(searchQuery, searchProjection)
      .select("role firstName businessName crops inventory farmLocation score")
      .sort({ score: { $meta: "textScore" } })
      .lean();
  });

  let cachedSearch = null;
  const searchCacheKey = `performance_search_${sampleQuery.toLowerCase().trim()}`;

  if (redisAvailable) {
    const searchResults = await User.find(searchQuery, searchProjection)
      .select("role firstName businessName crops inventory farmLocation score")
      .sort({ score: { $meta: "textScore" } })
      .lean();

    await redisClient.set(searchCacheKey, JSON.stringify(searchResults));

    cachedSearch = await benchmark("Redis cached search", 5, async () => {
      const cachedPayload = await redisClient.get(searchCacheKey);
      JSON.parse(cachedPayload || "[]");
    });
  }

  const uncachedProducts = await benchmark("MongoDB dealer product aggregation", 5, async () => {
    const dealers = await User.find({ role: "dealer" })
      .select("inventory businessName email warehouseAddress")
      .lean();

    dealers.flatMap((dealer) =>
      Array.isArray(dealer.inventory)
        ? dealer.inventory.map((item) => ({
            ...item,
            dealerEmail: dealer.email,
            dealerBusinessName: dealer.businessName,
            warehouseAddress: dealer.warehouseAddress,
          }))
        : []
    );
  });

  let cachedProducts = null;
  const productsCacheKey = "performance_all_available_products";

  if (redisAvailable) {
    const dealers = await User.find({ role: "dealer" })
      .select("inventory businessName email warehouseAddress")
      .lean();

    const allProducts = dealers.flatMap((dealer) =>
      Array.isArray(dealer.inventory)
        ? dealer.inventory.map((item) => ({
            ...item,
            dealerEmail: dealer.email,
            dealerBusinessName: dealer.businessName,
            warehouseAddress: dealer.warehouseAddress,
          }))
        : []
    );

    await redisClient.set(productsCacheKey, JSON.stringify(allProducts));

    cachedProducts = await benchmark("Redis cached product feed", 5, async () => {
      const cachedPayload = await redisClient.get(productsCacheKey);
      JSON.parse(cachedPayload || "[]");
    });
  }

  const searchExplain = await User.collection
    .find(searchQuery, { projection: searchProjection })
    .sort({ score: { $meta: "textScore" } })
    .explain("executionStats");

  const orderSample = await Order.findOne({}, "dealerEmail farmerEmail assignedDate").lean();
  let dealerOrderExplain = null;

  if (orderSample?.dealerEmail) {
    dealerOrderExplain = await Order.collection
      .find({ dealerEmail: orderSample.dealerEmail })
      .sort({ assignedDate: -1 })
      .explain("executionStats");
  }

  const report = `# AgroChain Optimization Report

Generated on: ${new Date().toLocaleString("en-IN", { hour12: true })}

## 1. Database Optimizations Implemented

- Added and used MongoDB indexes for high-frequency access patterns in \`backend/models/user.js\`, \`backend/models/order.js\`, \`backend/models/retailerOrder.js\`, \`backend/models/representative.js\`, and \`backend/models/log.js\`.
- Reduced Mongoose overhead with \`.lean()\` and narrower \`.select(...)\` projections in read-heavy controllers.
- Removed repeated per-order lookups by batching related user fetches in dealer/farmer order history endpoints.

## 2. Query Planning Evidence

### Search Query

- Sample search term: \`${sampleQuery}\`
- Winning index: \`${getWinningIndexName(searchExplain.queryPlanner) || "Not detected"}\`
- Total docs examined: ${searchExplain.executionStats?.totalDocsExamined ?? "N/A"}
- Total keys examined: ${searchExplain.executionStats?.totalKeysExamined ?? "N/A"}

### Dealer Order History Query

- Winning index: \`${dealerOrderExplain ? getWinningIndexName(dealerOrderExplain.queryPlanner) || "Not detected" : "No sample order available"}\`
- Total docs examined: ${dealerOrderExplain?.executionStats?.totalDocsExamined ?? "N/A"}
- Total keys examined: ${dealerOrderExplain?.executionStats?.totalKeysExamined ?? "N/A"}

## 3. Redis Performance Report

### Search Endpoint Equivalent

- Uncached MongoDB average: ${formatMs(uncachedSearch.averageMs)}
${cachedSearch ? `- Cached Redis average: ${formatMs(cachedSearch.averageMs)}
- Improvement: ${formatPercent(improvementPercent(uncachedSearch.averageMs, cachedSearch.averageMs))}` : "- Cached Redis average: Redis was not reachable during the report run."}

### Dealer Product Feed Equivalent

- Uncached MongoDB average: ${formatMs(uncachedProducts.averageMs)}
${cachedProducts ? `- Cached Redis average: ${formatMs(cachedProducts.averageMs)}
- Improvement: ${formatPercent(improvementPercent(uncachedProducts.averageMs, cachedProducts.averageMs))}` : "- Cached Redis average: Redis was not reachable during the report run."}

## 4. Files Changed for Optimization

- \`backend/models/user.js\`
- \`backend/models/log.js\`
- \`backend/controllers/searchController.js\`
- \`backend/controllers/retailercontroller.js\`
- \`backend/controllers/dealercontroller.js\`
- \`backend/controllers/farmercontroller.js\`
- \`backend/controllers/representativecontroller.js\`
- \`backend/config/redis.js\`

## 5. Benefit Compared to the Previous Version

- Earlier, many endpoints fetched broad user documents and then performed extra filtering and repeated lookups in JavaScript.
- Now, the app uses indexed fields, batched lookups, lean reads, projection, and Redis caching for repeated read traffic.
- Result: less database work, fewer documents materialized in Node.js, lower response times on repeated requests, and better scalability as data grows.
`;

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, report, "utf8");
  spawnSync(process.execPath, [path.join(__dirname, "..", "..", "scripts", "render-performance-report.mjs")], {
    cwd: path.join(__dirname, "..", ".."),
    stdio: "inherit",
    env: process.env,
  });

  console.log(`Optimization report written to ${reportPath}`);

  if (redisAvailable) {
    await redisClient.del(searchCacheKey, productsCacheKey);
    await redisClient.quit();
  }

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Failed to generate optimization report:", error);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    // ignore disconnect errors during failure handling
  }
  process.exit(1);
});

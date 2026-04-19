# AgroChain Optimization Report

## 1. Database Optimizations Implemented

- Added and used MongoDB indexes for high-frequency access patterns in `backend/models/user.js`, `backend/models/order.js`, `backend/models/retailerOrder.js`, `backend/models/representative.js`, and `backend/models/log.js`.
- Reduced Mongoose overhead with `.lean()` and narrower `.select(...)` projections in read-heavy controllers.
- Removed repeated per-order lookups by batching related user fetches in dealer/farmer order history endpoints.

## 2. Query Planning Evidence

### Search Query

- Sample search term: `rice`
- Winning index: `Global_Agro_Search_Index`
- Total docs examined: 1
- Total keys examined: 1

### Dealer Order History Query

- Winning index: `dealerEmail_1_assignedDate_-1`
- Total docs examined: 3
- Total keys examined: 3

## 3. Redis Performance Report

### Search Endpoint Equivalent

- Uncached MongoDB average: 95.36 ms
- Cached Redis average: 4.77 ms
- Improvement: 95.00%

### Dealer Product Feed Equivalent

- Uncached MongoDB average: 36.60 ms
- Cached Redis average: 4.94 ms
- Improvement: 86.51%

## 4. Files Changed for Optimization

- `backend/models/user.js`
- `backend/models/log.js`
- `backend/controllers/searchController.js`
- `backend/controllers/retailercontroller.js`
- `backend/controllers/dealercontroller.js`
- `backend/controllers/farmercontroller.js`
- `backend/controllers/representativecontroller.js`
- `backend/config/redis.js`

## 5. Benefit Compared to the Previous Version

- Earlier, many endpoints fetched broad user documents and then performed extra filtering and repeated lookups in JavaScript.
- Now, the app uses indexed fields, batched lookups, lean reads, projection, and Redis caching for repeated read traffic.
- Result: less database work, fewer documents materialized in Node.js, lower response times on repeated requests, and better scalability as data grows.

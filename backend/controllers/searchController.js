const User = require("../models/user");
const redisClient = require("../config/redis");

exports.globalSearch = async (req, res) => {
  try {
    const searchQuery = req.query.q;

    if (!searchQuery) {
      return res.status(400).json({ success: false, message: "Search query 'q' is required" });
    }

    const cacheKey = `search_${searchQuery.toLowerCase().trim()}`;
    console.time(`SearchTime: ${searchQuery}`);

    // 1. Check Redis Cache First
    if (redisClient.isReady) {
      const cachedResults = await redisClient.get(cacheKey);
      if (cachedResults) {
        console.timeEnd(`SearchTime: ${searchQuery}`);
        return res.status(200).json({
          source: "Redis Cache",
          success: true,
          data: JSON.parse(cachedResults)
        });
      }
    }

    // 2. Perform High-Performance MongoDB Text Search
    // $text automatically uses the weighted index we created in the schema
    const searchResults = await User.find(
      { $text: { $search: searchQuery } },
      // Project the textScore to rank the results
      { score: { $meta: "textScore" } }
    )
    .select("role firstName businessName crops inventory farmLocation score")
    // Sort by the highest relevance score
    .sort({ score: { $meta: "textScore" } })
    .lean(); // .lean() strips Mongoose overhead for faster execution

    // 3. Format the results to make them easy for the frontend to display
    const formattedResults = searchResults.map(user => {
      return {
        userId: user._id,
        role: user.role,
        name: user.businessName || user.firstName,
        location: user.farmLocation,
        // Filter the sub-arrays to only show items that likely matched the search
        matchingInventory: user.inventory ? user.inventory.filter(i => 
          new RegExp(searchQuery, 'i').test(i.productName) || new RegExp(searchQuery, 'i').test(i.productType)
        ) : [],
        matchingCrops: user.crops ? user.crops.filter(c => 
          new RegExp(searchQuery, 'i').test(c.varietySpecies) || new RegExp(searchQuery, 'i').test(c.productType)
        ) : [],
        relevanceScore: user.score
      };
    });

    // 4. Save to Redis (Expire after 15 minutes)
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 900, JSON.stringify(formattedResults));
    }

    console.timeEnd(`SearchTime: ${searchQuery}`);

    res.status(200).json({
      source: "MongoDB Text Index",
      success: true,
      count: formattedResults.length,
      data: formattedResults
    });

  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ success: false, message: "Error performing search" });
  }
};
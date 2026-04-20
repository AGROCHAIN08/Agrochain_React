const swaggerJsdoc = require("swagger-jsdoc");

const publicApiUrl = (process.env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL || "").replace(/\/$/, "");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AgroChain API",
      version: "1.0.0",
      description:
        "AgroChain - a farm-to-fork supply chain platform connecting Farmers, Dealers, Retailers, Representatives, and Admins.",
      contact: {
        name: "AgroChain Team",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
      ...(publicApiUrl
        ? [
            {
              url: publicApiUrl,
              description: "Deployed server",
            },
          ]
        : []),
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token obtained from login/signup",
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication and user profile endpoints" },
      { name: "Farmer", description: "Farmer profile, crop, order, and notification management" },
      { name: "Dealer", description: "Dealer profile, vehicle, inventory, bidding, and order management" },
      { name: "Retailer", description: "Retailer inventory browsing, ordering, and payments" },
      { name: "Admin", description: "Admin dashboard, user management, and representative CRUD" },
      { name: "Representative", description: "Crop verification, claiming, and approval workflows" },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

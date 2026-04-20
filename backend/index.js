const connectDB = require("./config/db");
const app = require("./app");

console.log("Starting AgroChain Server...");

const PORT = process.env.PORT || 3000;
const publicApiUrl = (process.env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`)
  .replace(/\/$/, "");

const requiredEnvVars = ["MONGO_URI", "EMAIL_USER", "EMAIL_PASS", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:");
  missingEnvVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error("Please check your .env file");
  process.exit(1);
}

if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn("GOOGLE_CLIENT_ID not found - Google OAuth will not work");
  console.warn("Add GOOGLE_CLIENT_ID to .env file to enable Google sign-in");
}

console.log("Environment variables loaded:");
console.log(`   - EMAIL_USER: ${process.env.EMAIL_USER}`);
console.log(`   - MONGO_URI: ${process.env.MONGO_URI ? "Set" : "Missing"}`);
console.log(`   - GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "Set" : "Missing"}`);

connectDB(process.env.MONGO_URI);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Email service: ${process.env.EMAIL_USER}`);
  console.log(
    `Allowed frontend origins: ${process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "localhost defaults"}`
  );
  console.log(`API Documentation: ${publicApiUrl}/`);
  console.log(`Swagger Docs: ${publicApiUrl}/api-docs`);
  console.log("=====================================");
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

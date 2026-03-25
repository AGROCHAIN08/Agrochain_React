const connectDB = require("./config/db");
const app = require("./app");

console.log("🚀 Starting AgroChain Server...");

// Verify environment variables
const requiredEnvVars = ['MONGO_URI', 'EMAIL_USER', 'EMAIL_PASS', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error("Please check your .env file");
  process.exit(1);
}

// Optional Google OAuth check
if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn("⚠️  GOOGLE_CLIENT_ID not found - Google OAuth will not work");
  console.warn("   Add GOOGLE_CLIENT_ID to .env file to enable Google sign-in");
}

console.log("✅ Environment variables loaded:");
console.log(`   - EMAIL_USER: ${process.env.EMAIL_USER}`);
console.log(`   - MONGO_URI: ${process.env.MONGO_URI ? 'Set' : 'Missing'}`);
console.log(`   - GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing'}`);

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;
connectDB(mongoUri);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_USER}`);
  console.log(`🌐 Frontend CORS: http://127.0.0.1:5500`);
  console.log(`📋 API Documentation: http://localhost:${PORT}/`);
  console.log(`📖 Swagger Docs: http://localhost:${PORT}/api-docs`);
  console.log("=====================================");
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});
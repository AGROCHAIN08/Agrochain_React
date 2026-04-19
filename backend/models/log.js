const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  actionType: {
    type: String,
    enum: ["login", "addProduct", "orderPlaced", "updateProfile", "deleteUser", "other"],
  },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
});

logSchema.index({ userEmail: 1, timestamp: -1 });
logSchema.index({ actionType: 1, timestamp: -1 });
logSchema.index({ timestamp: -1 });

module.exports = mongoose.model("Log", logSchema);

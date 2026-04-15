// models/representative.js
const mongoose = require("mongoose");

const representativeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // This automatically creates an index
      lowercase: true,
      trim: true,
    },
    addedBy: {
      type: String, // admin email
      default: "admin",
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// ===========================
// INDEXES FOR PERFORMANCE
// ===========================
// Speeds up queries when an Admin looks up the representatives they added
representativeSchema.index({ addedBy: 1 });

module.exports = mongoose.model("Representative", representativeSchema);
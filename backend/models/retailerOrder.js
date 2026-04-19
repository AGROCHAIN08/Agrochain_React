const mongoose = require("mongoose");

const retailerOrderSchema = new mongoose.Schema({
  retailerEmail: { type: String, required: true },
  
  // An order is a collection of items from ONE dealer.
  dealerInfo: {
    email: { type: String, required: true },
    businessName: { type: String, required: true },
    warehouseAddress: { type: String, required: true } // Dealer's address for pickup/reference
  },
  
  products: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true }
  }],
  
  totalAmount: { type: Number, required: true },
  
  // Retailer's address for delivery
  shippingAddress: { type: String, required: true },
  
  paymentDetails: {
    status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    method: { type: String },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String }
  },
  
  orderStatus: {
    type: String,
    enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Placed'
  },
  
  // Review tracking
  reviewSubmitted: { type: Boolean, default: false },
  review: {
    retailerEmail: { type: String },
    quality: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Poor', '']
    },
    comments: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    date: { type: Date }
  }
  
}, { timestamps: true });

// ===========================
// INDEXES FOR PERFORMANCE
// ===========================
// Speeds up fetching a specific retailer's order history, sorted by newest
retailerOrderSchema.index({ retailerEmail: 1, createdAt: -1 });

// Speeds up fetching a specific dealer's received orders, sorted by newest
retailerOrderSchema.index({ "dealerInfo.email": 1, createdAt: -1 });

// Speeds up querying orders by their current status (e.g., finding all "Pending" orders)
retailerOrderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model("RetailerOrder", retailerOrderSchema);

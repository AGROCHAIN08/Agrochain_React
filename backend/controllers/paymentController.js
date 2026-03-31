const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/order');
const RetailerOrder = require('../models/retailerOrder');
const User = require('../models/user');

// ===========================
// CREATE STRIPE CHECKOUT SESSION
// ===========================
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { orderType, orderId } = req.body;

    if (!orderType || !orderId) {
      return res.status(400).json({ msg: "orderType and orderId are required" });
    }

    let lineItems = [];
    let metadata = {};
    let customerEmail = '';

    // ── FARMER-DEALER FLOW ──
    // Dealer pays farmer after bid is accepted
    if (orderType === 'farmer-dealer') {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ msg: "Order not found" });

      if (order.paymentStatus === 'Completed') {
        return res.status(400).json({ msg: "Payment already completed for this order" });
      }

      if (order.status !== 'Bid Accepted') {
        return res.status(400).json({ msg: "Bid must be accepted before payment" });
      }

      // Fetch product details for the line item description
      const farmer = await User.findOne({ email: order.farmerEmail, role: "farmer" });
      let productName = 'Agricultural Product';
      if (farmer && farmer.crops) {
        const crop = farmer.crops.find(c => c._id.toString() === order.productId.toString());
        if (crop) productName = crop.varietySpecies;
      }

      customerEmail = order.dealerEmail;

      lineItems = [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: productName,
            description: `Order from farmer ${order.farmerEmail} | Qty: ${order.quantity} | Receipt: ${order.receiptNumber || 'N/A'}`,
          },
          unit_amount: Math.round(order.bidPrice * 100), // Convert to paise
        },
        quantity: order.quantity,
      }];

      metadata = {
        orderType: 'farmer-dealer',
        orderId: order._id.toString(),
        dealerEmail: order.dealerEmail,
        farmerEmail: order.farmerEmail,
      };

    // ── DEALER-RETAILER FLOW ──  
    // Retailer pays dealer for their order
    } else if (orderType === 'dealer-retailer') {
      const retailerOrder = await RetailerOrder.findById(orderId);
      if (!retailerOrder) return res.status(404).json({ msg: "Retailer order not found" });

      if (retailerOrder.paymentDetails.status === 'Completed') {
        return res.status(400).json({ msg: "Payment already completed for this order" });
      }

      customerEmail = retailerOrder.retailerEmail;

      // Create line items from order products
      lineItems = retailerOrder.products.map(product => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: product.productName,
            description: `From dealer: ${retailerOrder.dealerInfo.businessName}`,
          },
          unit_amount: Math.round(product.unitPrice * 100), // Convert to paise
        },
        quantity: product.quantity,
      }));

      metadata = {
        orderType: 'dealer-retailer',
        orderId: retailerOrder._id.toString(),
        retailerEmail: retailerOrder.retailerEmail,
        dealerEmail: retailerOrder.dealerInfo.email,
      };

    } else {
      return res.status(400).json({ msg: "Invalid orderType. Must be 'farmer-dealer' or 'dealer-retailer'" });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?order_id=${orderId}&order_type=${orderType}`,
      customer_email: customerEmail,
      metadata: metadata,
    });

    // Store session ID in the order
    if (orderType === 'farmer-dealer') {
      await Order.findByIdAndUpdate(orderId, { stripeSessionId: session.id });
    } else {
      await RetailerOrder.findByIdAndUpdate(orderId, { 
        'paymentDetails.stripeSessionId': session.id 
      });
    }

    res.json({ 
      sessionId: session.id, 
      url: session.url,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });

  } catch (err) {
    console.error("Stripe session creation error:", err);
    next(err);
  }
};


// ===========================
// STRIPE WEBHOOK HANDLER
// ===========================
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // If webhook secret is configured, verify the signature
    if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET') {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // In development without webhook secret, parse the body directly
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { orderType, orderId, dealerEmail, farmerEmail, retailerEmail } = session.metadata;

    console.log(`✅ Payment completed for ${orderType} order: ${orderId}`);

    try {
      if (orderType === 'farmer-dealer') {
        // Update order payment status
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = 'Completed';
          order.stripePaymentIntentId = session.payment_intent;
          order.status = 'Completed';
          order.timeline.push({
            status: 'Payment Completed',
            timestamp: new Date(),
            notes: `Payment of ₹${(session.amount_total / 100).toFixed(2)} completed via Stripe`
          });
          await order.save();

          // Transfer product to dealer inventory (if not already done)
          const farmer = await User.findOne({ email: farmerEmail, role: "farmer" });
          const dealer = await User.findOne({ email: dealerEmail, role: "dealer" });

          if (farmer && dealer) {
            const productIndex = farmer.crops?.findIndex(
              c => c._id.toString() === order.productId.toString()
            );

            if (productIndex !== -1 && productIndex !== undefined) {
              const product = farmer.crops[productIndex];
              
              // Deduct from farmer
              product.harvestQuantity -= order.quantity;
              
              // Add to dealer inventory
              const inventoryItem = {
                productId: order.productId,
                productName: product.varietySpecies,
                productType: product.productType,
                quantity: order.quantity,
                unitPrice: order.bidPrice,
                totalValue: order.bidPrice * order.quantity,
                farmerName: `${farmer.firstName} ${farmer.lastName || ""}`,
                farmerEmail: farmer.email,
                imageUrl: product.imageUrl,
                addedDate: new Date(),
                receiptNumber: order.receiptNumber,
              };

              if (!Array.isArray(dealer.inventory)) dealer.inventory = [];
              dealer.inventory.push(inventoryItem);

              // Notify dealer
              if (!dealer.notifications) dealer.notifications = [];
              dealer.notifications.push({
                title: "Payment Successful!",
                message: `Your payment of ₹${(session.amount_total / 100).toFixed(2)} for ${product.varietySpecies} has been processed. The product has been added to your inventory.`,
                createdAt: new Date()
              });

              // Notify farmer
              if (!farmer.notifications) farmer.notifications = [];
              farmer.notifications.push({
                title: "Payment Received!",
                message: `Dealer ${dealer.businessName || dealer.firstName} has completed payment of ₹${(session.amount_total / 100).toFixed(2)} for your ${product.varietySpecies}.`,
                createdAt: new Date()
              });

              await dealer.save();
              await farmer.save();

              console.log("✅ Product transferred to dealer inventory via Stripe payment");
            }
          }
        }

      } else if (orderType === 'dealer-retailer') {
        // Update retailer order payment status
        const retailerOrder = await RetailerOrder.findById(orderId);
        if (retailerOrder) {
          retailerOrder.paymentDetails.status = 'Completed';
          retailerOrder.paymentDetails.method = 'Stripe';
          retailerOrder.paymentDetails.stripePaymentIntentId = session.payment_intent;
          retailerOrder.orderStatus = 'Processing';
          await retailerOrder.save();

          // Deduct from dealer inventory
          const dealer = await User.findOne({ email: retailerOrder.dealerInfo.email, role: 'dealer' });
          if (dealer) {
            for (const orderedProduct of retailerOrder.products) {
              const inventoryItem = dealer.inventory.find(
                item => item._id.toString() === orderedProduct.productId
              );
              if (inventoryItem) {
                inventoryItem.quantity -= orderedProduct.quantity;
                if (inventoryItem.quantity <= 0) {
                  dealer.inventory = dealer.inventory.filter(
                    item => item._id.toString() !== orderedProduct.productId
                  );
                }
              }
            }
            
            // Notify dealer
            if (!dealer.notifications) dealer.notifications = [];
            dealer.notifications.push({
              title: "New Payment Received!",
              message: `Retailer ${retailerEmail} has paid ₹${(session.amount_total / 100).toFixed(2)} for their order.`,
              createdAt: new Date()
            });
            
            await dealer.save();
          }

          console.log("✅ Retailer order payment completed, inventory updated");
        }
      }
    } catch (err) {
      console.error("Error processing webhook:", err);
    }
  }

  res.json({ received: true });
};


// ===========================
// CHECK SESSION STATUS
// ===========================
exports.getSessionStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Find the associated order
    const { orderType, orderId } = session.metadata;
    let order = null;
    let paymentStatus = 'unknown';

    if (orderType === 'farmer-dealer') {
      order = await Order.findById(orderId);
      paymentStatus = order?.paymentStatus || 'Pending';
    } else if (orderType === 'dealer-retailer') {
      order = await RetailerOrder.findById(orderId);
      paymentStatus = order?.paymentDetails?.status || 'Pending';
    }

    res.json({
      status: session.payment_status,
      orderType,
      orderId,
      paymentStatus,
      amountTotal: session.amount_total / 100,
      currency: session.currency,
      customerEmail: session.customer_email,
    });

  } catch (err) {
    console.error("Error fetching session status:", err);
    next(err);
  }
};


// ===========================
// MANUAL PAYMENT VERIFICATION (fallback if webhook fails)
// ===========================
exports.verifyPayment = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ msg: "sessionId is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ msg: "Payment not completed", status: session.payment_status });
    }

    const { orderType, orderId } = session.metadata;

    // Check if already processed
    if (orderType === 'farmer-dealer') {
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus === 'Completed') {
        return res.json({ msg: "Payment already verified", status: 'Completed' });
      }
    } else if (orderType === 'dealer-retailer') {
      const order = await RetailerOrder.findById(orderId);
      if (order && order.paymentDetails.status === 'Completed') {
        return res.json({ msg: "Payment already verified", status: 'Completed' });
      }
    }

    // Simulate the webhook event processing
    const fakeEvent = {
      type: 'checkout.session.completed',
      data: { object: session }
    };

    // Process using the same webhook logic
    req.body = Buffer.from(JSON.stringify(fakeEvent));
    req.headers['stripe-signature'] = 'manual-verification';
    
    // Call webhook handler logic directly
    await exports.handleWebhook(req, res);

  } catch (err) {
    console.error("Error verifying payment:", err);
    next(err);
  }
};

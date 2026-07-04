const cron = require("node-cron");
const Order = require("../models/order");
const Payment = require("../models/payment");
const Product = require("../models/product");

const PAYMENT_EXPIRY_MINUTES = 15;
const AUTO_CANCEL_HOURS = 24;

const markExpiredPayments = async () => {
  try {
    const expiryTime = new Date(Date.now() - PAYMENT_EXPIRY_MINUTES * 60 * 1000);

    const stuckOrders = await Order.find({
      paymentStatus: "pending",
      paymentMethod: "online",
      orderStatus: { $in: ["payment_pending", "confirmed"] },
      createdAt: { $lt: expiryTime },
      autoCancelledAt: null,
    });

    if (stuckOrders.length === 0) return { markedExpired: 0 };

    console.log(`🕐 [Payment Cleanup] Found ${stuckOrders.length} expired payment(s)`);

    let markedExpired = 0;

    for (const order of stuckOrders) {
      order.paymentStatus = "expired";
      order.orderStatus = "payment_pending";
      order.paymentExpiresAt = new Date(Date.now() + AUTO_CANCEL_HOURS * 60 * 60 * 1000);
      await order.save();

      await Payment.updateMany(
        { order: order._id, status: "initiated" },
        {
          status: "cancelled",
          failedAt: new Date(),
          failureReason: `Payment session expired (${PAYMENT_EXPIRY_MINUTES} min timeout)`,
        }
      );

      markedExpired++;
      console.log(`  ⏰ Marked expired: ${order.orderNumber}`);
    }

    return { markedExpired };
  } catch (err) {
    console.error("❌ markExpiredPayments error:", err);
    return { markedExpired: 0, error: err.message };
  }
};

const autoCancelExpiredOrders = async () => {
  try {
    const now = new Date();

    const ordersToCancel = await Order.find({
      paymentStatus: "expired",
      orderStatus: "payment_pending",
      paymentExpiresAt: { $lt: now },
      autoCancelledAt: null,
    });

    if (ordersToCancel.length === 0) return { autoCancelled: 0 };

    console.log(`🗑️  [Payment Cleanup] Auto-cancelling ${ordersToCancel.length} unpaid order(s)`);

    let autoCancelled = 0;

    for (const order of ordersToCancel) {
      order.orderStatus = "cancelled";
      order.paymentStatus = "failed";
      order.cancelReason = `Payment not completed within ${AUTO_CANCEL_HOURS} hours`;
      order.cancelledAt = new Date();
      order.autoCancelledAt = new Date();
      await order.save();

      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, totalSold: -item.quantity },
        });
      }

      await Payment.updateMany(
        { order: order._id, status: { $in: ["initiated", "cancelled"] } },
        {
          status: "cancelled",
          failureReason: `Order auto-cancelled after ${AUTO_CANCEL_HOURS} hours`,
        }
      );

      autoCancelled++;
      console.log(`  ✅ Auto-cancelled: ${order.orderNumber} (stock restored)`);
    }

    return { autoCancelled };
  } catch (err) {
    console.error("❌ autoCancelExpiredOrders error:", err);
    return { autoCancelled: 0, error: err.message };
  }
};

const runPaymentCleanup = async () => {
  console.log("═══════════════════════════════════════");
  console.log(`🧹 [${new Date().toISOString()}] Running payment cleanup...`);

  const expired = await markExpiredPayments();
  const cancelled = await autoCancelExpiredOrders();

  const summary = {
    markedExpired: expired.markedExpired || 0,
    autoCancelled: cancelled.autoCancelled || 0,
    timestamp: new Date().toISOString(),
  };

  if (summary.markedExpired > 0 || summary.autoCancelled > 0) {
    console.log(`✅ Cleanup complete:`, summary);
  } else {
    console.log(`✅ No stuck payments found`);
  }
  console.log("═══════════════════════════════════════");

  return summary;
};

const startPaymentCleanupCron = () => {
  cron.schedule("*/5 * * * *", runPaymentCleanup);
  console.log("🕐 Payment cleanup cron started");
  console.log(`   Runs: Every 5 minutes`);
  console.log(`   Expires payments after: ${PAYMENT_EXPIRY_MINUTES} minutes`);
  console.log(`   Auto-cancels orders after: ${AUTO_CANCEL_HOURS} hours`);

  setTimeout(runPaymentCleanup, 10000);
};

module.exports = {
  startPaymentCleanupCron,
  runPaymentCleanup,
  markExpiredPayments,
  autoCancelExpiredOrders,
  PAYMENT_EXPIRY_MINUTES,
  AUTO_CANCEL_HOURS,
};
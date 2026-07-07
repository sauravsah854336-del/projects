const cron = require("node-cron");
const { getExpiredPaymentOrders, getOrdersToAutoCancel, updateOrder } = require("../models/dynamodb/orderModel");
const { updateManyPayments } = require("../models/dynamodb/paymentModel");
const { getProductById, updateProduct } = require("../models/dynamodb/productModel");

const PAYMENT_EXPIRY_MINUTES = 15;
const AUTO_CANCEL_HOURS = 24;

const markExpiredPayments = async () => {
  try {
    const expiryTime = new Date(Date.now() - PAYMENT_EXPIRY_MINUTES * 60 * 1000);
    const stuckOrders = await getExpiredPaymentOrders(expiryTime);

    if (stuckOrders.length === 0) return { markedExpired: 0 };

    console.log(`🕐 [Payment Cleanup] Found ${stuckOrders.length} expired payment(s)`);
    let markedExpired = 0;

    for (const order of stuckOrders) {
      await updateOrder(order._id, {
        paymentStatus: "expired",
        orderStatus: "payment_pending",
        paymentExpiresAt: new Date(Date.now() + AUTO_CANCEL_HOURS * 60 * 60 * 1000).toISOString(),
      });

      await updateManyPayments(
        { orderId: order._id, status: "initiated" },
        { status: "cancelled", failedAt: new Date().toISOString(), failureReason: `Payment session expired (${PAYMENT_EXPIRY_MINUTES} min timeout)` }
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
    const ordersToCancel = await getOrdersToAutoCancel(now);

    if (ordersToCancel.length === 0) return { autoCancelled: 0 };

    console.log(`🗑️  [Payment Cleanup] Auto-cancelling ${ordersToCancel.length} unpaid order(s)`);
    let autoCancelled = 0;

    for (const order of ordersToCancel) {
      await updateOrder(order._id, {
        orderStatus: "cancelled",
        paymentStatus: "failed",
        cancelReason: `Payment not completed within ${AUTO_CANCEL_HOURS} hours`,
        cancelledAt: new Date().toISOString(),
        autoCancelledAt: new Date().toISOString(),
      });

      for (const item of order.items) {
        const product = await getProductById(item.product);
        if (product) {
          await updateProduct(item.product, {
            stock: (product.stock || 0) + item.quantity,
            totalSold: Math.max(0, (product.totalSold || 0) - item.quantity),
          });
        }
      }

      await updateManyPayments(
        { orderId: order._id, status: ["initiated", "cancelled"] },
        { status: "cancelled", failureReason: `Order auto-cancelled after ${AUTO_CANCEL_HOURS} hours` }
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

  const summary = { markedExpired: expired.markedExpired || 0, autoCancelled: cancelled.autoCancelled || 0, timestamp: new Date().toISOString() };

  if (summary.markedExpired > 0 || summary.autoCancelled > 0) console.log(`✅ Cleanup complete:`, summary);
  else console.log(`✅ No stuck payments found`);
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

module.exports = { startPaymentCleanupCron, runPaymentCleanup, markExpiredPayments, autoCancelExpiredOrders, PAYMENT_EXPIRY_MINUTES, AUTO_CANCEL_HOURS };
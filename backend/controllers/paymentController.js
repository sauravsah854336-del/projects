const {
  createPayment,
  getLatestPaymentByOrder,
  getPaymentByGatewayOrderId,
  getUserPayments,
  getAllPayments,
  updatePayment,
  savePayment,
  updateManyPayments,
} = require("../models/dynamodb/paymentModel");
const { getOrderById, updateOrder, getOrdersByCashfreeId } = require("../models/dynamodb/orderModel");
const { getProductById, updateProduct } = require("../models/dynamodb/productModel");
const { getUserById } = require("../models/dynamodb/userModel");
const {
  createCashfreeOrder,
  fetchCashfreePayments,
  verifyWebhookSignature,
} = require("../services/cashfreeService");

const detectPaymentMethod = (cfPayment) => {
  if (cfPayment?.payment_method?.upi) return "upi";
  if (cfPayment?.payment_method?.card) return "card";
  if (cfPayment?.payment_method?.netbanking) return "netbanking";
  if (cfPayment?.payment_method?.wallet) return "wallet";
  if (cfPayment?.payment_method?.paylater) return "paylater";
  return cfPayment?.payment_group || "";
};

const initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: "Order ID required" });

    const order = await getOrderById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, message: "Not authorized" });
    if (order.paymentMethod === "cod") return res.status(400).json({ success: false, message: "COD orders do not need payment" });
    if (order.paymentStatus === "paid") return res.status(400).json({ success: false, message: "Order already paid" });

    const user = await getUserById(order.userId);
    const cashfreeOrderId = `CF_${order.orderNumber.replace(/-/g, "_")}_${Date.now()}`;

    const customer = {
      id: `USER_${order.userId.slice(-10)}`,
      name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Customer",
      email: user?.email || "",
      phone: order.shippingAddress?.phone?.replace(/\D/g, "").slice(-10) || "",
    };

    const returnUrl = `${process.env.FRONTEND_URL}/payment/status`;
    const cfResult = await createCashfreeOrder({ orderId: cashfreeOrderId, amount: order.total, customer, returnUrl });

    if (!cfResult.success) return res.status(500).json({ success: false, message: cfResult.message });

    const payment = await createPayment({
      orderId: order._id,
      userId: order.userId,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: "INR",
      gateway: "cashfree",
      gatewayOrderId: cashfreeOrderId,
      paymentSessionId: cfResult.paymentSessionId,
      status: "initiated",
      customerDetails: customer,
      attempts: [{ attemptedAt: new Date().toISOString(), status: "initiated" }],
      rawGatewayResponse: cfResult,
    });

    await updateOrder(order._id, {
      paymentDetails: {
        ...(order.paymentDetails || {}),
        gateway: "cashfree",
        cashfreeOrderId,
        paymentSessionId: cfResult.paymentSessionId,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        cashfreeOrderId,
        paymentSessionId: cfResult.paymentSessionId,
        amount: order.total,
        currency: "INR",
      },
    });
  } catch (err) {
    console.error("initiatePayment error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: "Order ID required" });

    const order = await getOrderById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, message: "Not authorized" });
    if (order.paymentStatus === "paid") return res.status(400).json({ success: false, message: "Already paid" });
    if (order.orderStatus === "cancelled") return res.status(400).json({ success: false, message: "Cannot retry cancelled order" });
    if ((order.paymentAttempts || 0) >= 5) return res.status(400).json({ success: false, message: "Maximum retry attempts reached" });

    const user = await getUserById(order.userId);
    const cashfreeOrderId = `CF_${order.orderNumber.replace(/-/g, "_")}_R${(order.paymentAttempts || 0) + 1}_${Date.now()}`;

    const customer = {
      id: `USER_${order.userId.slice(-10)}`,
      name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Customer",
      email: user?.email || "",
      phone: order.shippingAddress?.phone?.replace(/\D/g, "").slice(-10) || "",
    };

    const returnUrl = `${process.env.FRONTEND_URL}/payment/status`;
    const cfResult = await createCashfreeOrder({ orderId: cashfreeOrderId, amount: order.total, customer, returnUrl });

    if (!cfResult.success) return res.status(500).json({ success: false, message: cfResult.message });

    const payment = await createPayment({
      orderId: order._id,
      userId: order.userId,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: "INR",
      gateway: "cashfree",
      gatewayOrderId: cashfreeOrderId,
      paymentSessionId: cfResult.paymentSessionId,
      status: "initiated",
      customerDetails: customer,
      attempts: [{ attemptedAt: new Date().toISOString(), status: "initiated" }],
      metadata: { isRetry: true, retryNumber: (order.paymentAttempts || 0) + 1 },
      rawGatewayResponse: cfResult,
    });

    await updateOrder(order._id, {
      paymentAttempts: (order.paymentAttempts || 0) + 1,
      lastPaymentAttemptAt: new Date().toISOString(),
      paymentStatus: "pending",
      orderStatus: "payment_pending",
      paymentExpiresAt: null,
      paymentDetails: {
        ...(order.paymentDetails || {}),
        gateway: "cashfree",
        cashfreeOrderId,
        paymentSessionId: cfResult.paymentSessionId,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Retry payment initiated (attempt ${(order.paymentAttempts || 0) + 1})`,
      data: {
        paymentId: payment._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        cashfreeOrderId,
        paymentSessionId: cfResult.paymentSessionId,
        amount: order.total,
        currency: "INR",
        retryNumber: (order.paymentAttempts || 0) + 1,
      },
    });
  } catch (err) {
    console.error("retryPayment error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: "Order ID required" });

    const order = await getOrderById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, message: "Not authorized" });

    const payment = await getLatestPaymentByOrder(order._id);

    if (order.paymentStatus === "paid" && payment?.status === "success") {
      return res.status(200).json({ success: true, message: "Already verified", data: { paymentStatus: "paid", order, payment } });
    }

    const cfOrderId = order.paymentDetails?.cashfreeOrderId;
    if (!cfOrderId) return res.status(400).json({ success: false, message: "No payment initiated" });

    const paymentsResult = await fetchCashfreePayments(cfOrderId);
    if (!paymentsResult.success) return res.status(500).json({ success: false, message: paymentsResult.message });

    const cfPayments = paymentsResult.data || [];
    const successPayment = cfPayments.find((p) => p.payment_status === "SUCCESS");
    const failedPayment = cfPayments.find((p) => p.payment_status === "FAILED");

    if (successPayment) {
      await updateOrder(order._id, {
        paymentStatus: "paid",
        paymentDetails: {
          ...(order.paymentDetails || {}),
          cfPaymentId: successPayment.cf_payment_id?.toString() || "",
          paymentTime: successPayment.payment_completion_time ? new Date(successPayment.payment_completion_time).toISOString() : new Date().toISOString(),
          paymentMode: successPayment.payment_group || "",
          bankReference: successPayment.bank_reference || "",
        },
      });

      if (payment) {
        await savePayment({
          ...payment,
          status: "success",
          gatewayPaymentId: successPayment.cf_payment_id?.toString() || "",
          paymentMethod: detectPaymentMethod(successPayment),
          paymentGroup: successPayment.payment_group || "",
          bankReference: successPayment.bank_reference || "",
          completedAt: new Date().toISOString(),
          cardDetails: successPayment.payment_method?.card ? {
            last4: successPayment.payment_method.card.card_number?.slice(-4) || "",
            network: successPayment.payment_method.card.card_network || "",
            type: successPayment.payment_method.card.card_type || "",
            issuer: successPayment.payment_method.card.card_bank_name || "",
          } : payment.cardDetails,
          upiId: successPayment.payment_method?.upi?.upi_id || payment.upiId || "",
          attempts: [...(payment.attempts || []), { attemptedAt: new Date().toISOString(), status: "success", paymentMethod: detectPaymentMethod(successPayment) }],
          rawGatewayResponse: successPayment,
        });
      }

      const updatedOrder = await getOrderById(order._id);
      return res.status(200).json({ success: true, message: "Payment verified", data: { paymentStatus: "paid", order: updatedOrder, payment } });
    }

    if (failedPayment) {
      await updateOrder(order._id, {
        paymentStatus: "failed",
        paymentDetails: { ...(order.paymentDetails || {}), failureReason: failedPayment.payment_message || "Payment failed" },
      });

      if (payment) {
        await savePayment({
          ...payment,
          status: "failed",
          failedAt: new Date().toISOString(),
          failureReason: failedPayment.payment_message || "Payment failed",
          attempts: [...(payment.attempts || []), { attemptedAt: new Date().toISOString(), status: "failed", errorMessage: failedPayment.payment_message || "" }],
          rawGatewayResponse: failedPayment,
        });
      }

      for (const item of order.items) {
        const product = await getProductById(item.product);
        if (product) {
          await updateProduct(item.product, {
            stock: (product.stock || 0) + item.quantity,
            totalSold: Math.max(0, (product.totalSold || 0) - item.quantity),
          });
        }
      }

      return res.status(200).json({ success: false, message: "Payment failed", data: { paymentStatus: "failed", order, payment } });
    }

    return res.status(200).json({ success: true, message: "Payment pending", data: { paymentStatus: "pending", order, payment } });
  } catch (err) {
    console.error("verifyPayment error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];
    const rawBody = req.rawBody;

    if (!signature || !timestamp || !rawBody) return res.status(400).json({ success: false, message: "Missing headers" });

    const isValid = verifyWebhookSignature(rawBody, signature, timestamp);
    if (!isValid) return res.status(401).json({ success: false, message: "Invalid signature" });

    const event = req.body;
    const eventType = event.type;
    const paymentData = event.data?.payment;
    const orderData = event.data?.order;

    if (!orderData?.order_id) return res.status(400).json({ success: false, message: "No order_id" });

    const order = await getOrdersByCashfreeId(orderData.order_id);
    if (!order) return res.status(200).json({ received: true });

    const payment = await getPaymentByGatewayOrderId(orderData.order_id);

    if (order.paymentStatus === "paid" && eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      return res.status(200).json({ received: true });
    }

    if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      await updateOrder(order._id, {
        paymentStatus: "paid",
        paymentDetails: {
          ...(order.paymentDetails || {}),
          cfPaymentId: paymentData?.cf_payment_id?.toString() || "",
          paymentTime: paymentData?.payment_time ? new Date(paymentData.payment_time).toISOString() : new Date().toISOString(),
          paymentMode: paymentData?.payment_group || "",
          bankReference: paymentData?.bank_reference || "",
        },
      });

      if (payment) {
        await savePayment({
          ...payment,
          status: "success",
          gatewayPaymentId: paymentData?.cf_payment_id?.toString() || "",
          paymentMethod: detectPaymentMethod(paymentData),
          completedAt: new Date().toISOString(),
          attempts: [...(payment.attempts || []), { attemptedAt: new Date().toISOString(), status: "success" }],
          rawGatewayResponse: paymentData,
        });
      }
    } else if (eventType === "PAYMENT_FAILED_WEBHOOK" || eventType === "PAYMENT_USER_DROPPED_WEBHOOK") {
      const newStatus = eventType === "PAYMENT_USER_DROPPED_WEBHOOK" ? "cancelled" : "failed";

      if (order.paymentStatus !== "paid") {
        await updateOrder(order._id, {
          paymentStatus: "failed",
          paymentDetails: { ...(order.paymentDetails || {}), failureReason: paymentData?.payment_message || "Payment failed" },
        });

        if (payment) {
          await savePayment({
            ...payment,
            status: newStatus,
            failedAt: new Date().toISOString(),
            failureReason: paymentData?.payment_message || "Payment failed",
            attempts: [...(payment.attempts || []), { attemptedAt: new Date().toISOString(), status: newStatus }],
            rawGatewayResponse: paymentData,
          });
        }

        for (const item of order.items) {
          const product = await getProductById(item.product);
          if (product) {
            await updateProduct(item.product, {
              stock: (product.stock || 0) + item.quantity,
              totalSold: Math.max(0, (product.totalSold || 0) - item.quantity),
            });
          }
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await getOrderById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.userId !== req.user.id) return res.status(403).json({ success: false, message: "Not authorized" });

    const payment = await getLatestPaymentByOrder(order._id);

    return res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total,
        paymentDetails: order.paymentDetails,
        payment,
      },
    });
  } catch (err) {
    console.error("getPaymentStatus error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getUserPayments(req.user.id, { page, limit });

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
    });
  } catch (err) {
    console.error("getMyPayments error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminGetAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, gateway, search } = req.query;

    const result = await getAllPayments({ status, gateway, search, page, limit });

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
      summary: result.summary,
    });
  } catch (err) {
    console.error("adminGetAllPayments error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  initiatePayment,
  retryPayment,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
  getMyPayments,
  adminGetAllPayments,
};
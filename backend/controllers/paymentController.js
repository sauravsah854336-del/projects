const Order = require("../models/order");
const Product = require("../models/product");
const Payment = require("../models/payment");
const {
  createCashfreeOrder,
  fetchCashfreeOrder,
  fetchCashfreePayments,
  verifyWebhookSignature,
} = require("../services/cashfreeService");

const initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID required" });
    }

    const order = await Order.findById(orderId).populate("user", "firstName lastName email phone");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (order.paymentMethod === "cod") {
      return res.status(400).json({ success: false, message: "COD orders do not need payment" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Order already paid" });
    }

    const cashfreeOrderId = `CF_${order.orderNumber.replace(/-/g, "_")}_${Date.now()}`;

    const customer = {
      id: `USER_${order.user._id.toString().slice(-10)}`,
      name: `${order.user.firstName} ${order.user.lastName || ""}`.trim(),
      email: order.user.email,
      phone: order.shippingAddress.phone.replace(/\D/g, "").slice(-10),
    };

    const returnUrl = `${process.env.FRONTEND_URL}/payment/status`;

    const cfResult = await createCashfreeOrder({
      orderId: cashfreeOrderId,
      amount: order.total,
      customer,
      returnUrl,
    });

    if (!cfResult.success) {
      return res.status(500).json({ success: false, message: cfResult.message });
    }

    const payment = await Payment.create({
      order: order._id,
      user: order.user._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: "INR",
      gateway: "cashfree",
      gatewayOrderId: cashfreeOrderId,
      paymentSessionId: cfResult.paymentSessionId,
      status: "initiated",
      customerDetails: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      attempts: [
        {
          attemptedAt: new Date(),
          status: "initiated",
        },
      ],
      rawGatewayResponse: cfResult,
    });

    order.paymentDetails = {
      ...order.paymentDetails,
      gateway: "cashfree",
      cashfreeOrderId: cashfreeOrderId,
      paymentSessionId: cfResult.paymentSessionId,
    };
    await order.save();

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        cashfreeOrderId: cashfreeOrderId,
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

const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID required" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const payment = await Payment.findOne({ order: order._id }).sort({ createdAt: -1 });

    if (order.paymentStatus === "paid" && payment?.status === "success") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: { paymentStatus: "paid", order, payment },
      });
    }

    const cfOrderId = order.paymentDetails?.cashfreeOrderId;
    if (!cfOrderId) {
      return res.status(400).json({ success: false, message: "No payment initiated for this order" });
    }

    const paymentsResult = await fetchCashfreePayments(cfOrderId);

    if (!paymentsResult.success) {
      return res.status(500).json({ success: false, message: paymentsResult.message });
    }

    const cfPayments = paymentsResult.data || [];
    const successPayment = cfPayments.find((p) => p.payment_status === "SUCCESS");
    const failedPayment = cfPayments.find((p) => p.payment_status === "FAILED");
    const activePayment = successPayment || failedPayment || cfPayments[0];

    if (successPayment) {
      order.paymentStatus = "paid";
      order.paymentDetails = {
        ...order.paymentDetails,
        cfPaymentId: successPayment.cf_payment_id?.toString() || "",
        paymentTime: successPayment.payment_completion_time ? new Date(successPayment.payment_completion_time) : new Date(),
        paymentMode: successPayment.payment_group || successPayment.payment_method?.type || "",
        bankReference: successPayment.bank_reference || "",
      };
      await order.save();

      if (payment) {
        payment.status = "success";
        payment.gatewayPaymentId = successPayment.cf_payment_id?.toString() || "";
        payment.paymentMethod = detectPaymentMethod(successPayment);
        payment.paymentGroup = successPayment.payment_group || "";
        payment.bankReference = successPayment.bank_reference || "";
        payment.completedAt = successPayment.payment_completion_time ? new Date(successPayment.payment_completion_time) : new Date();

        if (successPayment.payment_method?.card) {
          payment.cardDetails = {
            last4: successPayment.payment_method.card.card_number?.slice(-4) || "",
            network: successPayment.payment_method.card.card_network || "",
            type: successPayment.payment_method.card.card_type || "",
            issuer: successPayment.payment_method.card.card_bank_name || "",
          };
        }

        if (successPayment.payment_method?.upi) {
          payment.upiId = successPayment.payment_method.upi.upi_id || "";
        }

        payment.attempts.push({
          attemptedAt: new Date(),
          status: "success",
          paymentMethod: detectPaymentMethod(successPayment),
        });

        payment.rawGatewayResponse = successPayment;
        await payment.save();
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: { paymentStatus: "paid", order, payment },
      });
    }

    if (failedPayment) {
      order.paymentStatus = "failed";
      order.paymentDetails = {
        ...order.paymentDetails,
        failureReason: failedPayment.payment_message || "Payment failed",
      };
      await order.save();

      if (payment) {
        payment.status = "failed";
        payment.failedAt = new Date();
        payment.failureReason = failedPayment.payment_message || "Payment failed";
        payment.attempts.push({
          attemptedAt: new Date(),
          status: "failed",
          errorMessage: failedPayment.payment_message || "",
          errorCode: failedPayment.error_details?.error_code || "",
        });
        payment.rawGatewayResponse = failedPayment;
        await payment.save();
      }

      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, totalSold: -item.quantity },
        });
      }

      return res.status(200).json({
        success: false,
        message: failedPayment.payment_message || "Payment failed",
        data: { paymentStatus: "failed", order, payment },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment pending",
      data: { paymentStatus: "pending", order, payment },
    });
  } catch (err) {
    console.error("verifyPayment error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const detectPaymentMethod = (cfPayment) => {
  if (cfPayment.payment_method?.upi) return "upi";
  if (cfPayment.payment_method?.card) return "card";
  if (cfPayment.payment_method?.netbanking) return "netbanking";
  if (cfPayment.payment_method?.wallet) return "wallet";
  if (cfPayment.payment_method?.paylater) return "paylater";
  return cfPayment.payment_group || "";
};

const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];
    const rawBody = req.rawBody;

    if (!signature || !timestamp || !rawBody) {
      return res.status(400).json({ success: false, message: "Missing webhook headers" });
    }

    const isValid = verifyWebhookSignature(rawBody, signature, timestamp);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    const event = req.body;
    const eventType = event.type;
    const paymentData = event.data?.payment;
    const orderData = event.data?.order;

    if (!orderData?.order_id) {
      return res.status(400).json({ success: false, message: "No order_id in webhook" });
    }

    const order = await Order.findOne({
      "paymentDetails.cashfreeOrderId": orderData.order_id,
    });

    if (!order) {
      return res.status(200).json({ received: true });
    }

    const payment = await Payment.findOne({ gatewayOrderId: orderData.order_id }).sort({ createdAt: -1 });

    if (order.paymentStatus === "paid" && eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      return res.status(200).json({ received: true, message: "Already processed" });
    }

    if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      order.paymentStatus = "paid";
      order.paymentDetails = {
        ...order.paymentDetails,
        cfPaymentId: paymentData?.cf_payment_id?.toString() || "",
        paymentTime: paymentData?.payment_time ? new Date(paymentData.payment_time) : new Date(),
        paymentMode: paymentData?.payment_group || "",
        bankReference: paymentData?.bank_reference || "",
      };
      await order.save();

      if (payment) {
        payment.status = "success";
        payment.gatewayPaymentId = paymentData?.cf_payment_id?.toString() || "";
        payment.paymentMethod = detectPaymentMethod(paymentData);
        payment.paymentGroup = paymentData?.payment_group || "";
        payment.bankReference = paymentData?.bank_reference || "";
        payment.completedAt = paymentData?.payment_time ? new Date(paymentData.payment_time) : new Date();
        payment.attempts.push({
          attemptedAt: new Date(),
          status: "success",
          paymentMethod: detectPaymentMethod(paymentData),
        });
        payment.rawGatewayResponse = paymentData;
        await payment.save();
      }
    } else if (eventType === "PAYMENT_FAILED_WEBHOOK") {
      order.paymentStatus = "failed";
      order.paymentDetails = {
        ...order.paymentDetails,
        failureReason: paymentData?.payment_message || "Payment failed",
      };
      await order.save();

      if (payment) {
        payment.status = "failed";
        payment.failedAt = new Date();
        payment.failureReason = paymentData?.payment_message || "Payment failed";
        payment.attempts.push({
          attemptedAt: new Date(),
          status: "failed",
          errorMessage: paymentData?.payment_message || "",
        });
        payment.rawGatewayResponse = paymentData;
        await payment.save();
      }

      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, totalSold: -item.quantity },
        });
      }
    } else if (eventType === "PAYMENT_USER_DROPPED_WEBHOOK") {
      if (order.paymentStatus === "pending") {
        order.paymentStatus = "failed";
        order.paymentDetails = {
          ...order.paymentDetails,
          failureReason: "User dropped payment",
        };
        await order.save();

        if (payment) {
          payment.status = "cancelled";
          payment.failedAt = new Date();
          payment.failureReason = "User cancelled payment";
          payment.attempts.push({
            attemptedAt: new Date(),
            status: "cancelled",
            errorMessage: "User dropped payment",
          });
          await payment.save();
        }

        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity, totalSold: -item.quantity },
          });
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

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const payment = await Payment.findOne({ order: order._id }).sort({ createdAt: -1 });

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
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ user: req.user.id })
      .populate("order", "orderNumber total orderStatus")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ user: req.user.id });

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
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
    const skip = (page - 1) * limit;
    const { status, gateway, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (gateway) filter.gateway = gateway;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { orderNumber: { $regex: escaped, $options: "i" } },
        { gatewayOrderId: { $regex: escaped, $options: "i" } },
        { gatewayPaymentId: { $regex: escaped, $options: "i" } },
      ];
    }

    const payments = await Payment.find(filter)
      .populate("user", "firstName lastName email phone")
      .populate("order", "orderNumber total orderStatus")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    const stats = await Payment.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalRevenue: stats[0]?.totalAmount || 0,
        successfulPayments: stats[0]?.totalCount || 0,
        totalPayments: total,
      },
    });
  } catch (err) {
    console.error("adminGetAllPayments error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
  getMyPayments,
  adminGetAllPayments,
};
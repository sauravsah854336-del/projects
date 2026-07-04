const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    gateway: {
      type: String,
      enum: ["cashfree", "razorpay", "stripe", "paypal", "cod"],
      default: "cashfree",
    },
    gatewayOrderId: {
      type: String,
      default: "",
      index: true,
    },
    paymentSessionId: {
      type: String,
      default: "",
    },
    gatewayPaymentId: {
      type: String,
      default: "",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "card", "netbanking", "wallet", "emi", "paylater", "cod", ""],
      default: "",
    },
    paymentGroup: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["initiated", "pending", "success", "failed", "cancelled", "refunded", "partially_refunded"],
      default: "initiated",
      index: true,
    },
    bankReference: {
      type: String,
      default: "",
    },
    upiId: {
      type: String,
      default: "",
    },
    cardDetails: {
      last4: { type: String, default: "" },
      network: { type: String, default: "" },
      type: { type: String, default: "" },
      issuer: { type: String, default: "" },
    },
    customerDetails: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    attempts: [
      {
        attemptedAt: { type: Date, default: Date.now },
        status: { type: String, default: "" },
        errorCode: { type: String, default: "" },
        errorMessage: { type: String, default: "" },
        paymentMethod: { type: String, default: "" },
      },
    ],
    refund: {
      amount: { type: Number, default: 0 },
      refundId: { type: String, default: "" },
      refundedAt: { type: Date, default: null },
      reason: { type: String, default: "" },
      status: { type: String, enum: ["", "pending", "success", "failed"], default: "" },
    },
    initiatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    failureReason: { type: String, default: "" },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rawGatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ user: 1, status: 1 });

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
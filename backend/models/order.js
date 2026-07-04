const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, default: "" },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  storeName: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: "India" },
      postalCode: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: [
        "cod",
        "card",
        "upi",
        "netbanking",
        "wallet",
        "paypal",
        "applepay",
        "googlepay",
        "online",
      ],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentDetails: {
  gateway: { type: String, default: "cashfree" },
  cashfreeOrderId: { type: String, default: "" },
  paymentSessionId: { type: String, default: "" },
  cfPaymentId: { type: String, default: "" },
  paymentTime: { type: Date, default: null },
  paymentMode: { type: String, default: "" },
  bankReference: { type: String, default: "" },
  failureReason: { type: String, default: "" },
},
    country: {
      code: { type: String, default: "IN", uppercase: true },
      name: { type: String, default: "India" },
      flag: { type: String, default: "🇮🇳" },
      currency: {
        code: { type: String, default: "INR", uppercase: true },
        symbol: { type: String, default: "₹" },
        name: { type: String, default: "Indian Rupee" },
      },
      exchangeRate: { type: Number, default: 1 },
    },
    pricing: {
      subtotalINR: { type: Number, default: 0 },
      subtotalLocal: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      taxRate: { type: Number, default: 0 },
      taxLabel: { type: String, default: "" },
      taxIncluded: { type: Boolean, default: true },
      shippingCost: { type: Number, default: 0 },
      shippingCostINR: { type: Number, default: 0 },
      discountINR: { type: Number, default: 0 },
      discountLocal: { type: Number, default: 0 },
      totalINR: { type: Number, default: 0 },
      totalLocal: { type: Number, default: 0 },
    },
    orderStatus: {
      type: String,
      enum: [
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      default: "confirmed",
    },
    confirmedAt: { type: Date, default: null },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: {
      type: String,
      default: "",
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
    couponType: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping", ""],
      default: "",
    },
    shippingCharge: { type: Number, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String, default: "" },
    cancelReason: { type: String, default: "" },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ "items.vendor": 1 });
orderSchema.index({ couponCode: 1 });
orderSchema.index({ "paymentDetails.cashfreeOrderId": 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
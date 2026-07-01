const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      maxlength: 2,
    },
    name: { type: String, required: true },
    nativeName: { type: String, default: "" },
    flag: { type: String, default: "" },
    
    // ✅ NEW FIELD
    dialCode: {
      type: String,
      default: "+91",
    },
    
    currency: {
      code: { type: String, required: true, uppercase: true },
      symbol: { type: String, required: true },
      name: { type: String, required: true },
    },
    exchangeRate: {
      type: Number,
      required: true,
      default: 1,
    },
    domain: { type: String, default: "" },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "" },
    tax: {
      type: { type: String, enum: ["GST", "VAT", "Sales Tax", "None"], default: "None" },
      rate: { type: Number, default: 0 },
      label: { type: String, default: "" },
      includedInPrice: { type: Boolean, default: false },
    },
    shipping: {
      freeShippingThreshold: { type: Number, default: 0 },
      standardCost: { type: Number, default: 0 },
      expressCost: { type: Number, default: 0 },
      estimatedDays: {
        standard: { type: Number, default: 7 },
        express: { type: Number, default: 3 },
      },
    },
    paymentMethods: [{
      type: String,
      enum: ["cod", "card", "upi", "netbanking", "wallet", "paypal", "applepay", "googlepay"],
    }],
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    lastRateUpdate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

countrySchema.index({ isActive: 1 });

module.exports = mongoose.models.Country || mongoose.model("Country", countrySchema);
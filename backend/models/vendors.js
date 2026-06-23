const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    storeDescription: {
      type: String,
      trim: true,
      default: "",
    },
    storeLogo: {
      type: String,
      default: "",
    },
    storeBanner: {
      type: String,
      default: "",
    },
    businessType: {
      type: String,
      enum: [
        "individual",
        "sole_proprietorship",
        "partnership",
        "private_limited",
        "llp",
        "other",
      ],
      default: "individual",
    },
    panNumber: {
      type: String,
      trim: true,
      default: "",
    },
    panDocument: {
      url: { type: String, default: "" },
      filename: { type: String, default: "" },
    },
    gstNumber: {
      type: String,
      trim: true,
      default: "",
    },
    gstDocument: {
      url: { type: String, default: "" },
      filename: { type: String, default: "" },
    },
    businessRegistrationDoc: {
      url: { type: String, default: "" },
      filename: { type: String, default: "" },
    },
    cancelledCheque: {
      url: { type: String, default: "" },
      filename: { type: String, default: "" },
    },
    bankDetails: {
      accountHolderName: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      accountType: {
        type: String,
        enum: ["savings", "current", ""],
        default: "",
      },
    },
    businessAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    warehouseAddress: {
      sameAsBusiness: { type: Boolean, default: true },
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
    },
    primaryCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    agreementsAccepted: {
      type: Boolean,
      default: false,
    },
    agreementDate: {
      type: Date,
      default: null,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    commission: {
      type: Number,
      default: 10,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

vendorSchema.index({ userId: 1 }, { unique: true });
vendorSchema.index({ approvalStatus: 1 });

module.exports =
  mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
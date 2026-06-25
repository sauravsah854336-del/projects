const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    comparePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: "" },
        isDefault: { type: Boolean, default: false },
      },
    ],
    variants: [
      {
        name: { type: String, trim: true },
        options: [
          {
            label: { type: String, trim: true },
            value: { type: String, trim: true },
            priceModifier: { type: Number, default: 0 },
          },
        ],
      },
    ],
    specifications: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    weight: {
      type: Number,
      default: 0,
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorStore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalSold: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    delistReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ vendor: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);

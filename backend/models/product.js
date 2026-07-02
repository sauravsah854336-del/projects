const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, lowercase: true, trim: true, unique: true },
    description: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true, default: "", maxlength: 500 },
    keyFeatures: [{ type: String, trim: true, maxlength: 200 }],

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: { type: String, trim: true, default: "" },
    modelNumber: { type: String, trim: true, default: "" },

    price: { type: Number, required: true, min: 0 },
    basePrice: { type: Number, min: 0 },
    baseCurrency: { type: String, default: "INR", uppercase: true },
    comparePrice: { type: Number, default: 0, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },

    bulkPricing: [
      {
        minQuantity: { type: Number, min: 2 },
        pricePerUnit: { type: Number, min: 0 },
      },
    ],

    countryPricing: [
      {
        countryCode: { type: String, uppercase: true },
        price: { type: Number, min: 0 },
        comparePrice: { type: Number, default: 0 },
        isAvailable: { type: Boolean, default: true },
        stock: { type: Number, default: 0 },
        isOverride: { type: Boolean, default: false },
      },
    ],

    availableCountries: [{ type: String, uppercase: true }],
    restrictedCountries: [{ type: String, uppercase: true }],
    shippingCountries: [{ type: String, uppercase: true }],

    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: "" },
        isDefault: { type: Boolean, default: false },
      },
    ],

    videoUrl: { type: String, default: "" },
    model3dUrl: { type: String, default: "" },

    colors: [
      {
        name: { type: String, trim: true },
        hex: { type: String, trim: true, default: "" },
        image: { type: String, default: "" },
      },
    ],

    sizes: [
      {
        name: { type: String, trim: true },
        stock: { type: Number, default: 0 },
        priceModifier: { type: Number, default: 0 },
      },
    ],

    materials: [{ type: String, trim: true }],

    variants: [
      {
        name: { type: String, trim: true },
        options: [
          {
            label: { type: String, trim: true },
            value: { type: String, trim: true },
            priceModifier: { type: Number, default: 0 },
            stock: { type: Number, default: 0 },
          },
        ],
      },
    ],

    specifications: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true },
        group: { type: String, trim: true, default: "General" },
      },
    ],

    stock: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    reservedStock: { type: Number, default: 0 },

    sku: { type: String, trim: true, default: "" },
    barcode: { type: String, trim: true, default: "" },

    weight: { type: Number, default: 0 },
    weightUnit: { type: String, enum: ["g", "kg", "lb", "oz"], default: "kg" },

    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      unit: { type: String, enum: ["cm", "m", "in", "ft"], default: "cm" },
    },

    roomType: [
      {
        type: String,
        enum: [
          "living-room",
          "bedroom",
          "kitchen",
          "bathroom",
          "office",
          "outdoor",
          "kids-room",
          "dining-room",
          "hallway",
          "garage",
          "none",
        ],
      },
    ],

    assemblyRequired: { type: Boolean, default: false },
    assemblyTime: { type: Number, default: 0 },

    warranty: {
      duration: { type: Number, default: 0 },
      unit: {
        type: String,
        enum: ["days", "months", "years"],
        default: "months",
      },
      type: {
        type: String,
        enum: ["manufacturer", "seller", "none"],
        default: "none",
      },
      description: { type: String, default: "" },
    },

    returnPolicy: {
      returnable: { type: Boolean, default: true },
      returnWindow: { type: Number, default: 10 },
      returnConditions: {
        type: String,
        default: "Item must be unused and in original packaging",
      },
    },

    shipping: {
      isFreeShipping: { type: Boolean, default: false },
      shippingCost: { type: Number, default: 0 },
      handlingTime: { type: Number, default: 1 },
      estimatedDeliveryDays: { type: Number, default: 5 },
    },

    faqs: [
      {
        question: { type: String, trim: true },
        answer: { type: String, trim: true },
      },
    ],

    seo: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      keywords: [{ type: String, trim: true }],
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
      enum: ["draft", "pending", "approved", "rejected", "delisted"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },

    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    tags: [{ type: String, trim: true, lowercase: true }],

    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    ratingDistribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 },
    },

    totalSold: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
    delistReason: { type: String, default: "" },
  },
  { timestamps: true }
);

productSchema.virtual("discountPercentage").get(function () {
  if (this.comparePrice > this.price) {
    return Math.round(
      ((this.comparePrice - this.price) / this.comparePrice) * 100
    );
  }
  return 0;
});

productSchema.virtual("availableStock").get(function () {
  return Math.max(0, this.stock - (this.reservedStock || 0));
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isDeleted: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ "colors.name": 1 });
productSchema.index({ materials: 1 });
productSchema.index({ roomType: 1 });

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
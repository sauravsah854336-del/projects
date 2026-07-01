const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: function () {
        return this.discountType !== "free_shipping";
      },
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usageLimitPerUser: {
      type: Number,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        usedCount: {
          type: Number,
          default: 1,
        },
        lastUsedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    applicableCountries: [
      {
        type: String,
        uppercase: true,
      },
    ],
    firstTimeUserOnly: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiryDate: 1 });
couponSchema.index({ isPublic: 1, isActive: 1 });

couponSchema.methods.isValid = function () {
  const now = new Date();

  if (!this.isActive) return { valid: false, reason: "Coupon is inactive" };
  if (now < this.startDate) return { valid: false, reason: "Coupon not yet active" };
  if (now > this.expiryDate) return { valid: false, reason: "Coupon has expired" };
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, reason: "Coupon usage limit reached" };
  }

  return { valid: true };
};

couponSchema.methods.canBeUsedBy = function (userId) {
  const userUsage = this.usedBy.find(
    (u) => u.user?.toString() === userId?.toString()
  );

  if (!userUsage) return { canUse: true, usedCount: 0 };

  if (userUsage.usedCount >= this.usageLimitPerUser) {
    return {
      canUse: false,
      reason: `You have already used this coupon ${userUsage.usedCount} time(s)`,
      usedCount: userUsage.usedCount,
    };
  }

  return { canUse: true, usedCount: userUsage.usedCount };
};

couponSchema.methods.calculateDiscount = function (subtotal) {
  let discount = 0;

  if (this.discountType === "percentage") {
    discount = (subtotal * this.discountValue) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.discountType === "fixed") {
    discount = Math.min(this.discountValue, subtotal);
  } else if (this.discountType === "free_shipping") {
    discount = 0;
  }

  return Math.round(discount * 100) / 100;
};

module.exports =
  mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
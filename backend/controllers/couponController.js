const Coupon = require("../models/coupon");
const Order = require("../models/order");

const adminCreateCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      startDate,
      expiryDate,
      usageLimit,
      usageLimitPerUser,
      applicableCategories,
      applicableProducts,
      applicableCountries,
      firstTimeUserOnly,
      isPublic,
    } = req.body;

    if (!code || !description || !discountType || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Code, description, discount type, and expiry date are required",
      });
    }

    if (discountType !== "free_shipping" && !discountValue) {
      return res.status(400).json({
        success: false,
        message: "Discount value is required",
      });
    }

    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    const normalizedCode = code.toUpperCase().trim();

    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    if (new Date(expiryDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be in the future",
      });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      description: description.trim(),
      discountType,
      discountValue: discountType === "free_shipping" ? 0 : discountValue,
      maxDiscountAmount: maxDiscountAmount || null,
      minOrderAmount: minOrderAmount || 0,
      startDate: startDate || Date.now(),
      expiryDate,
      usageLimit: usageLimit || null,
      usageLimitPerUser: usageLimitPerUser || 1,
      applicableCategories: applicableCategories || [],
      applicableProducts: applicableProducts || [],
      applicableCountries: applicableCountries || [],
      firstTimeUserOnly: firstTimeUserOnly || false,
      isPublic: isPublic !== false,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (err) {
    console.error("createCoupon error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminGetAllCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, search, type } = req.query;

    const filter = {};

    if (status === "active") {
      filter.isActive = true;
      filter.expiryDate = { $gt: new Date() };
    } else if (status === "expired") {
      filter.expiryDate = { $lte: new Date() };
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    if (type) filter.discountType = type;

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { code: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
    }

    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "firstName lastName")
      .populate("applicableCategories", "name")
      .lean();

    const total = await Coupon.countDocuments(filter);

    const stats = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          totalCoupons: { $sum: 1 },
          activeCoupons: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$isActive", true] }, { $gt: ["$expiryDate", new Date()] }] },
                1,
                0,
              ],
            },
          },
          totalUsage: { $sum: "$usedCount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: coupons,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: stats[0] || { totalCoupons: 0, activeCoupons: 0, totalUsage: 0 },
    });
  } catch (err) {
    console.error("getAllCoupons error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminGetCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("applicableCategories", "name slug")
      .populate("applicableProducts", "name slug")
      .populate("usedBy.user", "firstName lastName email");

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    return res.status(200).json({ success: true, data: coupon });
  } catch (err) {
    console.error("getCouponById error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminUpdateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.code) {
      updates.code = updates.code.toUpperCase().trim();
      const existing = await Coupon.findOne({
        code: updates.code,
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Coupon code already exists",
        });
      }
    }

    if (updates.discountType === "percentage" && updates.discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (err) {
    console.error("updateCoupon error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminDeleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (err) {
    console.error("deleteCoupon error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminToggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? "activated" : "deactivated"}`,
      data: coupon,
    });
  } catch (err) {
    console.error("toggleCouponStatus error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPublicCoupons = async (req, res) => {
  try {
    const { countryCode } = req.query;
    const now = new Date();

    const filter = {
      isActive: true,
      isPublic: true,
      startDate: { $lte: now },
      expiryDate: { $gt: now },
    };

    if (countryCode) {
      filter.$or = [
        { applicableCountries: { $size: 0 } },
        { applicableCountries: countryCode.toUpperCase() },
      ];
    }

    const coupons = await Coupon.find(filter)
      .select(
        "code description discountType discountValue maxDiscountAmount minOrderAmount expiryDate firstTimeUserOnly"
      )
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (err) {
    console.error("getPublicCoupons error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal, cartItems, countryCode } = req.body;
    const userId = req.user.id;

    if (!code || subtotal === undefined) {
      return res.status(400).json({
        success: false,
        message: "Code and subtotal are required",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    const validity = coupon.isValid();
    if (!validity.valid) {
      return res.status(400).json({
        success: false,
        message: validity.reason,
      });
    }

    const userCheck = coupon.canBeUsedBy(userId);
    if (!userCheck.canUse) {
      return res.status(400).json({
        success: false,
        message: userCheck.reason,
      });
    }

    if (subtotal < coupon.minOrderAmount) {
      const remaining = coupon.minOrderAmount - subtotal;
      return res.status(400).json({
        success: false,
        message: `Add ₹${remaining.toFixed(2)} more to use this coupon (Min: ₹${coupon.minOrderAmount})`,
      });
    }

    if (
      coupon.applicableCountries?.length > 0 &&
      countryCode &&
      !coupon.applicableCountries.includes(countryCode.toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "This coupon is not valid in your country",
      });
    }

    if (coupon.firstTimeUserOnly) {
      const previousOrders = await Order.countDocuments({
        user: userId,
        orderStatus: { $nin: ["cancelled"] },
      });
      if (previousOrders > 0) {
        return res.status(400).json({
          success: false,
          message: "This coupon is only for first-time buyers",
        });
      }
    }

    if (coupon.applicableCategories?.length > 0 && cartItems?.length > 0) {
      const categoryIds = coupon.applicableCategories.map((c) => c.toString());
      const hasApplicableItem = cartItems.some((item) =>
        categoryIds.includes(item.categoryId?.toString())
      );
      if (!hasApplicableItem) {
        return res.status(400).json({
          success: false,
          message: "Coupon not applicable to items in your cart",
        });
      }
    }

    if (coupon.applicableProducts?.length > 0 && cartItems?.length > 0) {
      const productIds = coupon.applicableProducts.map((p) => p.toString());
      const hasApplicableItem = cartItems.some((item) =>
        productIds.includes(item.productId?.toString())
      );
      if (!hasApplicableItem) {
        return res.status(400).json({
          success: false,
          message: "Coupon not applicable to items in your cart",
        });
      }
    }

    const discount = coupon.calculateDiscount(subtotal);

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      data: {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscountAmount: coupon.maxDiscountAmount,
        },
        discount,
        freeShipping: coupon.discountType === "free_shipping",
        finalAmount: subtotal - discount,
      },
    });
  } catch (err) {
    console.error("validateCoupon error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const applyCouponUsage = async (couponCode, userId) => {
  try {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) return null;

    coupon.usedCount += 1;

    const userUsageIndex = coupon.usedBy.findIndex(
      (u) => u.user?.toString() === userId.toString()
    );

    if (userUsageIndex >= 0) {
      coupon.usedBy[userUsageIndex].usedCount += 1;
      coupon.usedBy[userUsageIndex].lastUsedAt = new Date();
    } else {
      coupon.usedBy.push({
        user: userId,
        usedCount: 1,
        lastUsedAt: new Date(),
      });
    }

    await coupon.save();
    return coupon;
  } catch (err) {
    console.error("applyCouponUsage error:", err);
    return null;
  }
};

module.exports = {
  adminCreateCoupon,
  adminGetAllCoupons,
  adminGetCouponById,
  adminUpdateCoupon,
  adminDeleteCoupon,
  adminToggleCouponStatus,
  getPublicCoupons,
  validateCoupon,
  applyCouponUsage,
};
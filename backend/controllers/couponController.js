const {
  createCoupon: createCouponInDB,
  getCouponByCode,
  getCouponById,
  getAllCoupons: getAllCouponsFromDB,
  getPublicCoupons: getPublicCouponsFromDB,
  updateCoupon: updateCouponInDB,
  saveCoupon,
  deleteCouponById,
  isValid,
  canBeUsedBy,
  calculateDiscount,
} = require("../models/dynamodb/couponModel");
const { getAllOrders } = require("../models/dynamodb/orderModel");

const adminCreateCoupon = async (req, res) => {
  try {
    const {
      code, description, discountType, discountValue,
      maxDiscountAmount, minOrderAmount, startDate, expiryDate,
      usageLimit, usageLimitPerUser,
      applicableCategories, applicableProducts, applicableCountries,
      firstTimeUserOnly, isPublic,
    } = req.body;

    if (!code || !description || !discountType || !expiryDate) {
      return res.status(400).json({ success: false, message: "Code, description, discount type, and expiry date are required" });
    }

    if (discountType !== "free_shipping" && !discountValue) {
      return res.status(400).json({ success: false, message: "Discount value is required" });
    }

    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%" });
    }

    const normalizedCode = code.toUpperCase().trim();

    const existing = await getCouponByCode(normalizedCode);
    if (existing) {
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    }

    if (new Date(expiryDate) <= new Date()) {
      return res.status(400).json({ success: false, message: "Expiry date must be in the future" });
    }

    const coupon = await createCouponInDB({
      code: normalizedCode,
      description: description.trim(),
      discountType,
      discountValue: discountType === "free_shipping" ? 0 : discountValue,
      maxDiscountAmount: maxDiscountAmount || null,
      minOrderAmount: minOrderAmount || 0,
      startDate: startDate || new Date().toISOString(),
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

    return res.status(201).json({ success: true, message: "Coupon created successfully", data: coupon });
  } catch (err) {
    console.error("createCoupon error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminGetAllCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, search, type } = req.query;

    const result = await getAllCouponsFromDB({ status, search, type, page, limit });

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
      stats: result.stats,
    });
  } catch (err) {
    console.error("getAllCoupons error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminGetCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await getCouponById(id);

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

    const coupon = await getCouponById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    if (updates.code && updates.code.toUpperCase().trim() !== coupon.code) {
      const existing = await getCouponByCode(updates.code.toUpperCase().trim());
      if (existing) {
        return res.status(409).json({ success: false, message: "Coupon code already exists" });
      }
    }

    if (updates.discountType === "percentage" && updates.discountValue > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%" });
    }

    if (updates.startDate) updates.startDate = new Date(updates.startDate).toISOString();
    if (updates.expiryDate) updates.expiryDate = new Date(updates.expiryDate).toISOString();

    const updated = await updateCouponInDB(coupon.code, updates);

    return res.status(200).json({ success: true, message: "Coupon updated successfully", data: updated });
  } catch (err) {
    console.error("updateCoupon error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminDeleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteCouponById(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    return res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (err) {
    console.error("deleteCoupon error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminToggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await getCouponById(id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    const updated = await updateCouponInDB(coupon.code, { isActive: !coupon.isActive });

    return res.status(200).json({
      success: true,
      message: `Coupon ${updated.isActive ? "activated" : "deactivated"}`,
      data: updated,
    });
  } catch (err) {
    console.error("toggleCouponStatus error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPublicCoupons = async (req, res) => {
  try {
    const { countryCode } = req.query;
    const coupons = await getPublicCouponsFromDB(countryCode);

    return res.status(200).json({ success: true, data: coupons });
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
      return res.status(400).json({ success: false, message: "Code and subtotal are required" });
    }

    const coupon = await getCouponByCode(code.toUpperCase().trim());
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code" });
    }

    const validity = isValid(coupon);
    if (!validity.valid) {
      return res.status(400).json({ success: false, message: validity.reason });
    }

    const userCheck = canBeUsedBy(coupon, userId);
    if (!userCheck.canUse) {
      return res.status(400).json({ success: false, message: userCheck.reason });
    }

    if (subtotal < coupon.minOrderAmount) {
      const remaining = coupon.minOrderAmount - subtotal;
      return res.status(400).json({
        success: false,
        message: `Add ₹${remaining.toFixed(2)} more to use this coupon (Min: ₹${coupon.minOrderAmount})`,
      });
    }

    if (coupon.applicableCountries?.length > 0 && countryCode &&
        !coupon.applicableCountries.includes(countryCode.toUpperCase())) {
      return res.status(400).json({ success: false, message: "This coupon is not valid in your country" });
    }

    if (coupon.firstTimeUserOnly) {
      const ordersResult = await getAllOrders({ page: 1, limit: 1 });
      const userOrders = ordersResult.items.filter(
        (o) => o.userId === userId && o.orderStatus !== "cancelled"
      );
      if (userOrders.length > 0) {
        return res.status(400).json({ success: false, message: "This coupon is only for first-time buyers" });
      }
    }

    const discount = calculateDiscount(coupon, subtotal);

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
    const coupon = await getCouponByCode(couponCode.toUpperCase());
    if (!coupon) return null;

    const usedBy = coupon.usedBy || [];
    const userIndex = usedBy.findIndex((u) => (u.user || u) === userId);

    if (userIndex >= 0) {
      usedBy[userIndex].usedCount = (usedBy[userIndex].usedCount || 1) + 1;
      usedBy[userIndex].lastUsedAt = new Date().toISOString();
    } else {
      usedBy.push({ user: userId, usedCount: 1, lastUsedAt: new Date().toISOString() });
    }

    await saveCoupon({
      ...coupon,
      usedCount: (coupon.usedCount || 0) + 1,
      usedBy,
    });

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
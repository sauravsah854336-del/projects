const User = require("../models/users");
const Vendor = require("../models/vendors");
const Order = require("../models/order");
const bcrypt = require("bcryptjs");

const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one uppercase letter" });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one number" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existUser = await User.findOne({ email: normalizedEmail });
    if (existUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const existPhone = await User.findOne({ phone: phone.trim() });
    if (existPhone) {
      return res.status(409).json({ success: false, message: "Phone already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully.",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin", isDeleted: false })
      .select("-password -refreshTokens -passwordResetOTP -passwordResetOTPExpiry")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: admins });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -refreshTokens -passwordResetOTP -passwordResetOTPExpiry");

    if (!user) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not an admin" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("getAdminProfile error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, avatar } = req.body;

    if (firstName !== undefined && firstName.trim().length < 2) {
      return res.status(400).json({ success: false, message: "First name must be at least 2 characters" });
    }

    if (phone !== undefined && phone.trim() !== "" && !/^[6-9]\d{9}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, message: "Valid 10-digit Indian phone number required" });
    }

    if (phone && phone.trim() !== "") {
      const existPhone = await User.findOne({
        phone: phone.trim(),
        _id: { $ne: req.user.id },
      });
      if (existPhone) {
        return res.status(409).json({ success: false, message: "Phone number already in use" });
      }
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth || null;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -refreshTokens -passwordResetOTP -passwordResetOTPExpiry");

    if (!user) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("updateAdminProfile error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Must contain at least one uppercase letter" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Must contain at least one number" });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.refreshTokens = [];
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("changeAdminPassword error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPendingVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ approvalStatus: "pending", isDeleted: false })
      .populate("userId", "firstName lastName email phone createdAt status")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: vendors });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllVendors = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (status) filter.approvalStatus = status;

    const vendors = await Vendor.find(filter)
      .populate("userId", "firstName lastName email phone status createdAt lastLogin")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Vendor.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: vendors,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    if (vendor.approvalStatus === "approved") {
      return res.status(400).json({ success: false, message: "Vendor is already approved" });
    }
    vendor.approvalStatus = "approved";
    vendor.approvedAt = new Date();
    vendor.approvedBy = req.user.id;
    vendor.rejectionReason = "";
    await vendor.save();
    await User.findByIdAndUpdate(vendor.userId, { status: "active" });
    return res.status(200).json({ success: true, message: "Vendor approved successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const rejectVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { reason } = req.body;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    vendor.approvalStatus = "rejected";
    vendor.rejectionReason = reason || "No reason provided";
    await vendor.save();
    await User.findByIdAndUpdate(vendor.userId, { status: "blocked" });
    return res.status(200).json({ success: true, message: "Vendor rejected" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const suspendVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { reason } = req.body;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    vendor.approvalStatus = "suspended";
    vendor.rejectionReason = reason || "Suspended by admin";
    await vendor.save();
    await User.findByIdAndUpdate(vendor.userId, { status: "blocked" });
    return res.status(200).json({ success: true, message: "Vendor suspended" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const unsuspendVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    vendor.approvalStatus = "approved";
    vendor.rejectionReason = "";
    await vendor.save();
    await User.findByIdAndUpdate(vendor.userId, { status: "active" });
    return res.status(200).json({ success: true, message: "Vendor unsuspended" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateVendorCommission = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { commission } = req.body;
    if (commission === undefined || commission < 0 || commission > 100) {
      return res.status(400).json({ success: false, message: "Commission must be between 0 and 100" });
    }
    const vendor = await Vendor.findByIdAndUpdate(vendorId, { commission }, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    return res.status(200).json({ success: true, message: "Commission updated", data: { commission: vendor.commission } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { role: "customer", isDeleted: false };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await User.find(filter)
      .select("-password -refreshTokens -passwordResetOTP -passwordResetOTPExpiry")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orderCount = await Order.countDocuments({ user: customer._id });
        const orders = await Order.find({ user: customer._id });
        const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalSaved = orders.reduce((sum, o) => sum + (o.discount || 0), 0);
        const couponOrders = orders.filter((o) => o.couponCode).length;
        return {
          ...customer.toObject(),
          orderCount,
          totalSpent,
          totalSaved,
          couponOrders,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: customersWithStats,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSingleCustomer = async (req, res) => {
  try {
    const { userId } = req.params;
    const customer = await User.findOne({ _id: userId, role: "customer", isDeleted: false })
      .select("-password -refreshTokens -passwordResetOTP -passwordResetOTPExpiry");

    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(10);
    const allOrders = await Order.find({ user: userId });
    const totalOrders = allOrders.length;
    const totalSpent = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalSaved = allOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const couponOrdersCount = allOrders.filter((o) => o.couponCode).length;
    const couponsUsed = [...new Set(allOrders.filter((o) => o.couponCode).map((o) => o.couponCode))];

    return res.status(200).json({
      success: true,
      data: {
        ...customer.toObject(),
        recentOrders: orders,
        totalOrders,
        totalSpent,
        totalSaved,
        couponOrdersCount,
        couponsUsed,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const blockCustomer = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ _id: userId, role: "customer" });

    if (!user) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (user.isDeleted) {
      return res.status(400).json({ success: false, message: "Cannot block deleted customer" });
    }

    user.status = "blocked";
    user.refreshTokens = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Customer blocked successfully",
      data: { _id: user._id, status: user.status },
    });
  } catch (err) {
    console.error("blockCustomer error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const unblockCustomer = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ _id: userId, role: "customer" });

    if (!user) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (user.isDeleted) {
      return res.status(400).json({ success: false, message: "Cannot unblock deleted customer" });
    }

    user.status = "active";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Customer unblocked successfully",
      data: { _id: user._id, status: user.status },
    });
  } catch (err) {
    console.error("unblockCustomer error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ _id: userId, role: "customer" });
    if (!user) return res.status(404).json({ success: false, message: "Customer not found" });
    user.isDeleted = true;
    user.status = "blocked";
    await user.save();
    return res.status(200).json({ success: true, message: "Customer deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const Product = require("../models/product");
    const Coupon = require("../models/coupon");

    const [
      totalCustomers,
      activeCustomers,
      blockedCustomers,
      totalVendors,
      approvedVendors,
      pendingVendors,
      suspendedVendors,
      totalAdmins,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalProducts,
      approvedProducts,
      pendingProducts,
      allOrders,
      totalCoupons,
      activeCoupons,
    ] = await Promise.all([
      User.countDocuments({ role: "customer", isDeleted: false }),
      User.countDocuments({ role: "customer", status: "active", isDeleted: false }),
      User.countDocuments({ role: "customer", status: "blocked", isDeleted: false }),
      Vendor.countDocuments({ isDeleted: false }),
      Vendor.countDocuments({ approvalStatus: "approved", isDeleted: false }),
      Vendor.countDocuments({ approvalStatus: "pending", isDeleted: false }),
      Vendor.countDocuments({ approvalStatus: "suspended", isDeleted: false }),
      User.countDocuments({ role: "admin", isDeleted: false }),
      Order.countDocuments({}),
      Order.countDocuments({ orderStatus: "pending" }),
      Order.countDocuments({ orderStatus: "delivered" }),
      Order.countDocuments({ orderStatus: "cancelled" }),
      Product.countDocuments({ isDeleted: false }),
      Product.countDocuments({ status: "approved", isDeleted: false }),
      Product.countDocuments({ status: "pending", isDeleted: false }),
      Order.find({}).select("total discount couponCode createdAt orderStatus"),
      Coupon.countDocuments({}).catch(() => 0),
      Coupon.countDocuments({ isActive: true, expiryDate: { $gt: new Date() } }).catch(() => 0),
    ]);

    const totalRevenue = allOrders
      .filter((o) => o.orderStatus === "delivered")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const totalDiscountGiven = allOrders
      .filter((o) => o.orderStatus === "delivered" && o.discount > 0)
      .reduce((sum, o) => sum + (o.discount || 0), 0);

    const ordersWithCoupons = allOrders.filter((o) => o.couponCode).length;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const revenueThisMonth = allOrders
      .filter((o) => o.orderStatus === "delivered" && new Date(o.createdAt) >= thisMonthStart)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const revenueLastMonth = allOrders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return o.orderStatus === "delivered" && d >= lastMonthStart && d <= lastMonthEnd;
      })
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const ordersLast7Days = allOrders.filter((o) => new Date(o.createdAt) >= last7Days).length;
    const ordersThisMonth = allOrders.filter((o) => new Date(o.createdAt) >= thisMonthStart).length;
    const ordersLastMonth = allOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= lastMonthStart && d <= lastMonthEnd;
    }).length;

    const dailyRevenue = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyRevenue[key] = 0;
    }
    allOrders
      .filter((o) => o.orderStatus === "delivered" && new Date(o.createdAt) >= last7Days)
      .forEach((order) => {
        const key = new Date(order.createdAt).toISOString().split("T")[0];
        if (dailyRevenue[key] !== undefined) dailyRevenue[key] += order.total || 0;
      });

    const growthPercent =
      revenueLastMonth > 0
        ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
        : revenueThisMonth > 0
        ? 100
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        customers: { total: totalCustomers, active: activeCustomers, blocked: blockedCustomers },
        vendors: {
          total: totalVendors,
          approved: approvedVendors,
          pending: pendingVendors,
          suspended: suspendedVendors,
        },
        admins: { total: totalAdmins },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          last7Days: ordersLast7Days,
          thisMonth: ordersThisMonth,
          lastMonth: ordersLastMonth,
          withCoupons: ordersWithCoupons,
        },
        products: {
          total: totalProducts,
          approved: approvedProducts,
          pending: pendingProducts,
        },
        revenue: {
          total: totalRevenue,
          thisMonth: revenueThisMonth,
          lastMonth: revenueLastMonth,
          growthPercent,
          daily: dailyRevenue,
          totalDiscountGiven,
        },
        coupons: {
          total: totalCoupons,
          active: activeCoupons,
          ordersUsingCoupons: ordersWithCoupons,
          totalSavingsGiven: totalDiscountGiven,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getPendingVendors,
  getAllVendors,
  approveVendor,
  rejectVendor,
  suspendVendor,
  unsuspendVendor,
  updateVendorCommission,
  getAllCustomers,
  getSingleCustomer,
  blockCustomer,
  unblockCustomer,
  deleteCustomer,
  getAdminStats,
};
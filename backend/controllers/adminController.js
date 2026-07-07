const bcrypt = require("bcryptjs");
const {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByIdWithPassword,
  getUsersByRole,
  updateUser,
  searchUsers,
  countUsersByRole,
  softDeleteUser,
} = require("../models/dynamodb/userModel");
const {
  getVendorById,
  getVendorByUserId,
  getVendorsByStatus,
  getAllVendors: getAllVendorsFromDB,
  updateVendor,
  countVendorsByStatus,
} = require("../models/dynamodb/vendorModel");
const { getAllOrders, getTotalRevenue } = require("../models/dynamodb/orderModel");
const { getAllProducts, countProductsByVendor } = require("../models/dynamodb/productModel");
const { getAllCoupons } = require("../models/dynamodb/couponModel");

const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    if (!/[A-Z]/.test(password)) return res.status(400).json({ success: false, message: "Must contain uppercase letter" });
    if (!/[0-9]/.test(password)) return res.status(400).json({ success: false, message: "Must contain number" });

    const normalizedEmail = email.toLowerCase().trim();
    const existUser = await getUserByEmail(normalizedEmail);
    if (existUser) return res.status(409).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await createUser({
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
      data: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error("createAdmin error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const result = await getUsersByRole("admin", 100);
    const admins = result.items.filter((a) => !a.isDeleted);
    return res.status(200).json({ success: true, data: admins });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "Admin not found" });
    if (user.role !== "admin") return res.status(403).json({ success: false, message: "Not an admin" });
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, avatar } = req.body;

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth || null;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await updateUser(req.user.id, updates);
    if (!user) return res.status(404).json({ success: false, message: "Admin not found" });

    return res.status(200).json({ success: true, message: "Profile updated successfully", data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: "Both passwords are required" });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ success: false, message: "Must contain uppercase letter" });
    if (!/[0-9]/.test(newPassword)) return res.status(400).json({ success: false, message: "Must contain number" });

    const user = await getUserByIdWithPassword(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await updateUser(req.user.id, { password: hashedPassword, refreshTokens: [] });

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPendingVendors = async (req, res) => {
  try {
    const vendors = await getVendorsByStatus("pending");

    const enriched = await Promise.all(vendors.map(async (vendor) => {
      const user = await getUserById(vendor.userId);
      return { ...vendor, userId: user || { _id: vendor.userId } };
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllVendors = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await getAllVendorsFromDB({ status });
    const vendors = result.items;

    const enriched = await Promise.all(vendors.map(async (vendor) => {
      const user = await getUserById(vendor.userId);
      return { ...vendor, userId: user || { _id: vendor.userId } };
    }));

    const total = enriched.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginated = enriched.slice(skip, skip + Number(limit));

    return res.status(200).json({
      success: true,
      data: paginated,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await getVendorById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    if (vendor.approvalStatus === "approved") return res.status(400).json({ success: false, message: "Already approved" });

    await updateVendor(vendorId, { approvalStatus: "approved", approvedAt: new Date().toISOString(), approvedBy: req.user.id, rejectionReason: "" });
    await updateUser(vendor.userId, { status: "active" });

    return res.status(200).json({ success: true, message: "Vendor approved successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const rejectVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { reason } = req.body;
    const vendor = await getVendorById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    await updateVendor(vendorId, { approvalStatus: "rejected", rejectionReason: reason || "No reason provided" });
    await updateUser(vendor.userId, { status: "blocked" });

    return res.status(200).json({ success: true, message: "Vendor rejected" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const suspendVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { reason } = req.body;
    const vendor = await getVendorById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    await updateVendor(vendorId, { approvalStatus: "suspended", rejectionReason: reason || "Suspended by admin" });
    await updateUser(vendor.userId, { status: "blocked" });

    return res.status(200).json({ success: true, message: "Vendor suspended" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const unsuspendVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await getVendorById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    await updateVendor(vendorId, { approvalStatus: "approved", rejectionReason: "" });
    await updateUser(vendor.userId, { status: "active" });

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
    const vendor = await updateVendor(vendorId, { commission });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    return res.status(200).json({ success: true, message: "Commission updated", data: { commission: vendor.commission } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let customers;
    if (search) {
      customers = await searchUsers(search, "customer", 100);
    } else {
      const result = await getUsersByRole("customer", 1000);
      customers = result.items.filter((u) => !u.isDeleted);
    }

    if (status) customers = customers.filter((c) => c.status === status);

    const { getUserOrders } = require("../models/dynamodb/orderModel");

    const enriched = await Promise.all(customers.map(async (customer) => {
      const ordersResult = await getUserOrders(customer._id, { page: 1, limit: 1000 });
      const orders = ordersResult.items;
      return {
        ...customer,
        orderCount: orders.length,
        totalSpent: orders.reduce((sum, o) => sum + (o.total || 0), 0),
        totalSaved: orders.reduce((sum, o) => sum + (o.discount || 0), 0),
        couponOrders: orders.filter((o) => o.couponCode).length,
      };
    }));

    const total = enriched.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginated = enriched.slice(skip, skip + Number(limit));

    return res.status(200).json({
      success: true,
      data: paginated,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("getAllCustomers error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSingleCustomer = async (req, res) => {
  try {
    const { userId } = req.params;
    const customer = await getUserById(userId);
    if (!customer || customer.role !== "customer" || customer.isDeleted) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const { getUserOrders } = require("../models/dynamodb/orderModel");
    const ordersResult = await getUserOrders(userId, { page: 1, limit: 1000 });
    const allOrders = ordersResult.items;

    return res.status(200).json({
      success: true,
      data: {
        ...customer,
        recentOrders: allOrders.slice(0, 10),
        totalOrders: allOrders.length,
        totalSpent: allOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        totalSaved: allOrders.reduce((sum, o) => sum + (o.discount || 0), 0),
        couponOrdersCount: allOrders.filter((o) => o.couponCode).length,
        couponsUsed: [...new Set(allOrders.filter((o) => o.couponCode).map((o) => o.couponCode))],
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const blockCustomer = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);
    if (!user || user.role !== "customer") return res.status(404).json({ success: false, message: "Customer not found" });
    if (user.isDeleted) return res.status(400).json({ success: false, message: "Cannot block deleted customer" });

    await updateUser(userId, { status: "blocked", refreshTokens: [] });
    return res.status(200).json({ success: true, message: "Customer blocked successfully", data: { _id: userId, status: "blocked" } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const unblockCustomer = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);
    if (!user || user.role !== "customer") return res.status(404).json({ success: false, message: "Customer not found" });

    await updateUser(userId, { status: "active" });
    return res.status(200).json({ success: true, message: "Customer unblocked successfully", data: { _id: userId, status: "active" } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);
    if (!user || user.role !== "customer") return res.status(404).json({ success: false, message: "Customer not found" });

    await softDeleteUser(userId);
    return res.status(200).json({ success: true, message: "Customer deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const customersResult = await getUsersByRole("customer", 10000);
    const allCustomers = customersResult.items.filter((u) => !u.isDeleted);

    const vendorsResult = await getAllVendorsFromDB();
    const allVendors = vendorsResult.items;

    const adminsResult = await getUsersByRole("admin", 100);

    const ordersResult = await getAllOrders({ page: 1, limit: 100000 });
    const allOrders = ordersResult.items;

    const productsResult = await getAllProducts({ page: 1, limit: 100000 });
    const allProducts = productsResult.items;

    let totalCoupons = 0;
    let activeCoupons = 0;
    try {
      const couponsResult = await getAllCoupons({});
      totalCoupons = couponsResult.total || 0;
      activeCoupons = couponsResult.stats?.activeCoupons || 0;
    } catch (e) {}

    const totalRevenue = allOrders.filter((o) => o.orderStatus === "delivered").reduce((sum, o) => sum + (o.total || 0), 0);
    const totalDiscountGiven = allOrders.filter((o) => o.orderStatus === "delivered" && o.discount > 0).reduce((sum, o) => sum + (o.discount || 0), 0);
    const ordersWithCoupons = allOrders.filter((o) => o.couponCode).length;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const revenueThisMonth = allOrders.filter((o) => o.orderStatus === "delivered" && new Date(o.createdAt) >= thisMonthStart).reduce((sum, o) => sum + (o.total || 0), 0);
    const revenueLastMonth = allOrders.filter((o) => { const d = new Date(o.createdAt); return o.orderStatus === "delivered" && d >= lastMonthStart && d <= lastMonthEnd; }).reduce((sum, o) => sum + (o.total || 0), 0);

    const dailyRevenue = {};
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dailyRevenue[d.toISOString().split("T")[0]] = 0; }
    allOrders.filter((o) => o.orderStatus === "delivered" && new Date(o.createdAt) >= last7Days).forEach((o) => { const key = new Date(o.createdAt).toISOString().split("T")[0]; if (dailyRevenue[key] !== undefined) dailyRevenue[key] += o.total || 0; });

    const growthPercent = revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : revenueThisMonth > 0 ? 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        customers: { total: allCustomers.length, active: allCustomers.filter((c) => c.status === "active").length, blocked: allCustomers.filter((c) => c.status === "blocked").length },
        vendors: { total: allVendors.length, approved: allVendors.filter((v) => v.approvalStatus === "approved").length, pending: allVendors.filter((v) => v.approvalStatus === "pending").length, suspended: allVendors.filter((v) => v.approvalStatus === "suspended").length },
        admins: { total: adminsResult.items.length },
        orders: {
          total: allOrders.length,
          pending: allOrders.filter((o) => o.orderStatus === "pending" || o.orderStatus === "payment_pending").length,
          delivered: allOrders.filter((o) => o.orderStatus === "delivered").length,
          cancelled: allOrders.filter((o) => o.orderStatus === "cancelled").length,
          last7Days: allOrders.filter((o) => new Date(o.createdAt) >= last7Days).length,
          thisMonth: allOrders.filter((o) => new Date(o.createdAt) >= thisMonthStart).length,
          lastMonth: allOrders.filter((o) => { const d = new Date(o.createdAt); return d >= lastMonthStart && d <= lastMonthEnd; }).length,
          withCoupons: ordersWithCoupons,
        },
        products: { total: allProducts.length, approved: allProducts.filter((p) => p.status === "approved").length, pending: allProducts.filter((p) => p.status === "pending").length },
        revenue: { total: totalRevenue, thisMonth: revenueThisMonth, lastMonth: revenueLastMonth, growthPercent, daily: dailyRevenue, totalDiscountGiven },
        coupons: { total: totalCoupons, active: activeCoupons, ordersUsingCoupons: ordersWithCoupons, totalSavingsGiven: totalDiscountGiven },
      },
    });
  } catch (err) {
    console.error("getAdminStats error:", err);
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
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  createUser,
  getUserByEmail,
  getUserByEmailWithPassword,
  getUserById,
  getUserByIdWithPassword,
  updateUser,
  pushRefreshToken,
} = require("../models/dynamodb/userModel");
const {
  createVendor,
  getVendorByUserId,
  findVendorByPAN,
  findVendorByGST,
  findVendorByStoreNameCaseInsensitive,
  updateVendor,
} = require("../models/dynamodb/vendorModel");
const { getAllOrders } = require("../models/dynamodb/orderModel");
const { getAllProducts } = require("../models/dynamodb/productModel");

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id || user.userId, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id || user.userId, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

const vendorSignup = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, password,
      storeName, storeDescription, businessType,
      panNumber, panDocument, gstNumber, gstDocument,
      businessRegistrationDoc, cancelledCheque,
      bankDetails, businessAddress, agreementsAccepted,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !storeName) {
      return res.status(400).json({ success: false, message: "First name, last name, email, phone, password and store name are required" });
    }

    if (storeName.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Store name must be at least 3 characters" });
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panNumber || !panRegex.test(panNumber.trim().toUpperCase())) {
      return res.status(400).json({ success: false, message: "Valid PAN number is required" });
    }

    if (!bankDetails?.accountHolderName || !bankDetails?.accountNumber || !bankDetails?.ifscCode || !bankDetails?.bankName) {
      return res.status(400).json({ success: false, message: "Complete bank details are required" });
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(bankDetails.ifscCode.trim().toUpperCase())) {
      return res.status(400).json({ success: false, message: "Valid IFSC code is required" });
    }

    if (bankDetails.accountNumber.trim().length < 9) {
      return res.status(400).json({ success: false, message: "Valid bank account number is required" });
    }

    if (!businessAddress?.postalCode || !/^\d{6}$/.test(businessAddress.postalCode.trim())) {
      return res.status(400).json({ success: false, message: "Valid 6-digit PIN code is required" });
    }

    if (!businessAddress?.street || !businessAddress?.city || !businessAddress?.state) {
      return res.status(400).json({ success: false, message: "Complete business address is required" });
    }

    if (!cancelledCheque?.url) {
      return res.status(400).json({ success: false, message: "Cancelled cheque document is required" });
    }

    if (!panDocument?.url) {
      return res.status(400).json({ success: false, message: "PAN card document is required" });
    }

    if (!agreementsAccepted) {
      return res.status(400).json({ success: false, message: "You must accept the terms and vendor agreement" });
    }

    if (!gstNumber || gstNumber.trim().length !== 15) {
      return res.status(400).json({ success: false, message: "Valid 15-character GST number is required" });
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNumber.trim().toUpperCase())) {
      return res.status(400).json({ success: false, message: "Invalid GST number format" });
    }

    if (panNumber) {
      const panInGST = gstNumber.trim().toUpperCase().substring(2, 12);
      if (panInGST !== panNumber.trim().toUpperCase()) {
        return res.status(400).json({ success: false, message: "PAN number in GST does not match the provided PAN" });
      }
    }

    if (!gstDocument?.url) {
      return res.status(400).json({ success: false, message: "GST certificate document is required" });
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

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({ success: false, message: "Valid 10-digit Indian phone number is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existUser = await getUserByEmail(normalizedEmail);
    if (existUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const existStore = await findVendorByStoreNameCaseInsensitive(storeName.trim(), null);
    if (existStore) {
      return res.status(409).json({ success: false, message: "Store name is already taken" });
    }

    const existPAN = await findVendorByPAN(panNumber.trim().toUpperCase());
    if (existPAN) {
      return res.status(409).json({ success: false, message: "This PAN number is already registered" });
    }

    const existGST = await findVendorByGST(gstNumber.trim().toUpperCase());
    if (existGST) {
      return res.status(409).json({ success: false, message: "This GST number is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await createUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      dialCode: "+91",
      fullPhone: `+91${phone.trim()}`,
      password: hashedPassword,
      role: "vendor",
      status: "inactive",
    });

    await createVendor({
      userId: user._id,
      storeName: storeName.trim(),
      storeDescription: storeDescription?.trim() || "",
      businessType: businessType || "individual",
      panNumber: panNumber.trim().toUpperCase(),
      panDocument: panDocument || { url: "", filename: "" },
      gstNumber: gstNumber?.trim().toUpperCase() || "",
      gstDocument: gstDocument || { url: "", filename: "" },
      businessRegistrationDoc: businessRegistrationDoc || { url: "", filename: "" },
      cancelledCheque: cancelledCheque || { url: "", filename: "" },
      bankDetails: {
        accountHolderName: bankDetails.accountHolderName.trim(),
        bankName: bankDetails.bankName.trim(),
        accountNumber: bankDetails.accountNumber.trim(),
        ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
        accountType: bankDetails.accountType || "savings",
      },
      businessAddress: {
        street: businessAddress.street.trim(),
        city: businessAddress.city.trim(),
        state: businessAddress.state.trim(),
        postalCode: businessAddress.postalCode.trim(),
        country: "India",
      },
      agreementsAccepted: true,
      agreementDate: new Date().toISOString(),
      approvalStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Vendor registration submitted successfully. Our team will review your application within 24-48 hours.",
    });
  } catch (err) {
    console.error("vendorSignup error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const vendorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await getUserByEmailWithPassword(normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.role === "customer") {
      return res.status(403).json({ success: false, message: "This is a customer account.", redirectTo: "/login" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "This is an admin account.", redirectTo: "/login" });
    }

    if (user.role !== "vendor") {
      return res.status(403).json({ success: false, message: "This portal is for vendors only.", redirectTo: "/login" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const vendor = await getVendorByUserId(user._id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
    }

    if (vendor.approvalStatus === "pending") {
      return res.status(403).json({ success: false, message: "Your account is pending admin approval." });
    }

    if (vendor.approvalStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: vendor.rejectionReason ? `Your application was rejected: ${vendor.rejectionReason}` : "Your application was rejected.",
      });
    }

    if (vendor.approvalStatus === "suspended") {
      return res.status(403).json({ success: false, message: "Your account has been suspended." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ success: false, message: "Account is not active." });
    }

    if (user.isDeleted) {
      return res.status(403).json({ success: false, message: "Account no longer exists." });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await updateUser(user._id, { lastLogin: new Date().toISOString() });
    await pushRefreshToken(user._id, { token: refreshToken, createdAt: new Date().toISOString() });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: {
        _id: user._id,
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dialCode: user.dialCode || "+91",
        fullPhone: user.fullPhone || `+91${user.phone}`,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        preferredCountry: user.preferredCountry || "IN",
        preferredCurrency: user.preferredCurrency || "INR",
      },
      vendor: {
        id: vendor._id,
        storeName: vendor.storeName,
        approvalStatus: vendor.approvalStatus,
        commission: vendor.commission,
      },
    });
  } catch (err) {
    console.error("vendor login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getVendorProfile = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    const vendor = await getVendorByUserId(req.user.id);

    if (!user || !vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          dateOfBirth: user.dateOfBirth,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
        vendor: {
          _id: vendor._id,
          storeName: vendor.storeName,
          storeDescription: vendor.storeDescription,
          storeLogo: vendor.storeLogo,
          storeBanner: vendor.storeBanner,
          businessType: vendor.businessType,
          panNumber: vendor.panNumber,
          gstNumber: vendor.gstNumber,
          bankDetails: vendor.bankDetails,
          businessAddress: vendor.businessAddress,
          warehouseAddress: vendor.warehouseAddress,
          approvalStatus: vendor.approvalStatus,
          commission: vendor.commission,
          totalSales: vendor.totalSales,
          totalEarnings: vendor.totalEarnings,
          approvedAt: vendor.approvedAt,
          createdAt: vendor.createdAt,
        },
      },
    });
  } catch (err) {
    console.error("getVendorProfile error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateVendorProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, avatar } = req.body;

    if (firstName && firstName.trim().length < 2) {
      return res.status(400).json({ success: false, message: "First name must be at least 2 characters" });
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, message: "Valid 10-digit Indian phone number required" });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth || null;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await updateUser(req.user.id, updateData);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("updateVendorProfile error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateVendorStore = async (req, res) => {
  try {
    const { storeName, storeDescription, storeLogo, storeBanner, bankDetails, businessAddress, warehouseAddress } = req.body;

    const vendor = await getVendorByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
    }

    const vendorId = vendor.vendorId || vendor._id;
    const storeUpdates = {};

    if (storeName !== undefined) {
      if (storeName.trim().length < 3) {
        return res.status(400).json({ success: false, message: "Store name must be at least 3 characters" });
      }
      const normalizedNew = storeName.trim().replace(/\s+/g, " ").toLowerCase();
      const normalizedCurrent = (vendor.storeName || "").trim().replace(/\s+/g, " ").toLowerCase();
      if (normalizedNew !== normalizedCurrent) {
        const existing = await findVendorByStoreNameCaseInsensitive(storeName.trim(), vendorId);
        if (existing) {
          return res.status(409).json({ success: false, message: "Store name already taken" });
        }
      }
      storeUpdates.storeName = storeName.trim();
    }

    if (storeDescription !== undefined) storeUpdates.storeDescription = storeDescription.trim();
    if (storeLogo !== undefined) storeUpdates.storeLogo = storeLogo;
    if (storeBanner !== undefined) storeUpdates.storeBanner = storeBanner;

    if (bankDetails) {
      if (bankDetails.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode.trim().toUpperCase())) {
        return res.status(400).json({ success: false, message: "Invalid IFSC code format" });
      }
      if (bankDetails.accountNumber && bankDetails.accountNumber.trim().length < 9) {
        return res.status(400).json({ success: false, message: "Account number must be at least 9 digits" });
      }
      storeUpdates.bankDetails = {
        accountHolderName: bankDetails.accountHolderName?.trim() || vendor.bankDetails.accountHolderName,
        bankName: bankDetails.bankName?.trim() || vendor.bankDetails.bankName,
        accountNumber: bankDetails.accountNumber?.trim() || vendor.bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode?.trim().toUpperCase() || vendor.bankDetails.ifscCode,
        accountType: bankDetails.accountType || vendor.bankDetails.accountType,
      };
    }

    if (businessAddress) {
      if (businessAddress.postalCode && !/^\d{6}$/.test(businessAddress.postalCode.trim())) {
        return res.status(400).json({ success: false, message: "Valid 6-digit PIN code required" });
      }
      storeUpdates.businessAddress = {
        street: businessAddress.street?.trim() || vendor.businessAddress.street,
        city: businessAddress.city?.trim() || vendor.businessAddress.city,
        state: businessAddress.state?.trim() || vendor.businessAddress.state,
        postalCode: businessAddress.postalCode?.trim() || vendor.businessAddress.postalCode,
        country: "India",
      };
    }

    if (warehouseAddress) {
      storeUpdates.warehouseAddress = {
        sameAsBusiness: warehouseAddress.sameAsBusiness ?? vendor.warehouseAddress?.sameAsBusiness,
        street: warehouseAddress.street?.trim() || vendor.warehouseAddress?.street || "",
        city: warehouseAddress.city?.trim() || vendor.warehouseAddress?.city || "",
        state: warehouseAddress.state?.trim() || vendor.warehouseAddress?.state || "",
        postalCode: warehouseAddress.postalCode?.trim() || vendor.warehouseAddress?.postalCode || "",
      };
    }

    const updatedVendor = await updateVendor(vendorId, storeUpdates);

    return res.status(200).json({
      success: true,
      message: "Store details updated successfully",
      data: updatedVendor,
    });
  } catch (err) {
    console.error("updateVendorStore error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const changeVendorPassword = async (req, res) => {
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

    const user = await getUserByIdWithPassword(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await updateUser(req.user.id, {
      password: hashedPassword,
      refreshTokens: [],
    });

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("changeVendorPassword error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const checkStoreName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || name.trim().length < 3) {
      return res.status(200).json({ available: false, message: "Store name must be at least 3 characters" });
    }

    let excludeVendorId = null;

    if (req.user?.id) {
      const currentVendor = await getVendorByUserId(req.user.id);
      if (currentVendor) {
        excludeVendorId = currentVendor.vendorId || currentVendor._id;
      }
    }

    const existing = await findVendorByStoreNameCaseInsensitive(name.trim(), excludeVendorId);

    return res.status(200).json({
      available: !existing,
      message: existing ? "Store name is already taken" : "Store name is available",
    });
  } catch (err) {
    return res.status(500).json({ available: false, message: "Failed to check" });
  }
};

const getVendorStats = async (req, res) => {
  try {
    const vendor = await getVendorByUserId(req.user.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const vendorId = String(vendor.vendorId || vendor._id);

    const vendorIdVariations = [
      String(vendor.vendorId || ""),
      String(vendor._id || ""),
      String(vendor.id || ""),
      String(vendor.userId || ""),
    ].filter(Boolean);

    const orderResult = await getAllOrders({ page: 1, limit: 100000 });
    const allOrders = orderResult.items || [];

    const productResult = await getAllProducts({ page: 1, limit: 100000 });
    const allProducts = productResult.items || [];

    const isVendorMatch = (item) => {
      const values = [
        String(item.vendor || ""),
        String(item.vendorId || ""),
        String(item.vendorStore || ""),
      ];
      return values.some((v) => vendorIdVariations.includes(v));
    };

    const vendorOrders = allOrders.filter((order) =>
      (order.items || []).some(isVendorMatch)
    );

    const vendorProducts = allProducts.filter((p) => {
      const productVendorValues = [
        String(p.vendorId || ""),
        String(p.vendor || ""),
        String(p.vendorStoreId || ""),
      ];
      return productVendorValues.some((val) =>
        vendorIdVariations.includes(val)
      );
    });

    const calculateVendorRevenue = (orderList) => {
      return orderList.reduce((sum, order) => {
        const vendorItems = (order.items || []).filter(isVendorMatch);
        const itemTotal = vendorItems.reduce(
          (s, item) =>
            s + (Number(item.price) || 0) * (Number(item.quantity) || 1),
          0
        );
        return sum + itemTotal;
      }, 0);
    };

    const deliveredOrders = vendorOrders.filter(
      (o) => o.orderStatus === "delivered"
    );

    const totalRevenueFromDelivered = calculateVendorRevenue(deliveredOrders);
    const totalRevenueFromAll = calculateVendorRevenue(vendorOrders);

    const totalRevenue =
      totalRevenueFromDelivered > 0
        ? totalRevenueFromDelivered
        : totalRevenueFromAll;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59
    );
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const ordersForRevenue =
      totalRevenueFromDelivered > 0 ? deliveredOrders : vendorOrders;

    const thisMonthRevenue = calculateVendorRevenue(
      ordersForRevenue.filter((o) => new Date(o.createdAt) >= thisMonthStart)
    );
    const lastMonthRevenue = calculateVendorRevenue(
      ordersForRevenue.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= lastMonthStart && d <= lastMonthEnd;
      })
    );

    let monthlyGrowth = 0;
    if (lastMonthRevenue > 0) {
      monthlyGrowth = Math.round(
        ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      );
    } else if (thisMonthRevenue > 0) {
      monthlyGrowth = 100;
    }

    const daily = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      daily[d.toISOString().split("T")[0]] = 0;
    }

    ordersForRevenue
      .filter((o) => new Date(o.createdAt) >= last7Days)
      .forEach((order) => {
        const key = new Date(order.createdAt).toISOString().split("T")[0];
        if (daily[key] !== undefined) {
          const vendorItems = (order.items || []).filter(isVendorMatch);
          daily[key] += vendorItems.reduce(
            (s, item) =>
              s + (Number(item.price) || 0) * (Number(item.quantity) || 1),
            0
          );
        }
      });

    const last7DaysCount = vendorOrders.filter(
      (o) => new Date(o.createdAt) >= last7Days
    ).length;

    const last30DaysCount = vendorOrders.filter(
      (o) => new Date(o.createdAt) >= last30Days
    ).length;

    const ordersByStatus = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
      payment_pending: 0,
    };

    vendorOrders.forEach((order) => {
      const status = order.orderStatus || order.status || "pending";
      if (Object.prototype.hasOwnProperty.call(ordersByStatus, status)) {
        ordersByStatus[status]++;
      }
    });

    const productSales = {};
    vendorOrders.forEach((order) => {
      (order.items || []).filter(isVendorMatch).forEach((item) => {
        const pid = String(item.product || item.productId || "");
        if (!pid) return;
        if (!productSales[pid]) {
          productSales[pid] = { productId: pid, totalQty: 0, totalRevenue: 0 };
        }
        productSales[pid].totalQty += Number(item.quantity) || 1;
        productSales[pid].totalRevenue +=
          (Number(item.price) || 0) * (Number(item.quantity) || 1);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)
      .map((sale) => {
        const product = vendorProducts.find(
          (p) => String(p._id || p.productId) === sale.productId
        );
        return {
          _id: sale.productId,
          name: product?.name || "Unknown Product",
          price: product?.price || 0,
          images: product?.images || [],
          averageRating: product?.averageRating || 0,
          totalReviews: product?.totalReviews || 0,
          totalSold: sale.totalQty,
          totalRevenue: sale.totalRevenue,
        };
      });

    const responseData = {
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        thisMonth: Math.round(thisMonthRevenue * 100) / 100,
        lastMonth: Math.round(lastMonthRevenue * 100) / 100,
        monthlyGrowth,
        daily,
      },
      orders: {
        total: vendorOrders.length,
        confirmed: ordersByStatus.confirmed || 0,
        processing: ordersByStatus.processing || 0,
        shipped: ordersByStatus.shipped || 0,
        delivered: ordersByStatus.delivered || 0,
        cancelled: ordersByStatus.cancelled || 0,
        pending: ordersByStatus.pending || 0,
        last7Days: last7DaysCount,
        last30Days: last30DaysCount,
      },
      products: {
        total: vendorProducts.length,
        approved: vendorProducts.filter((p) => p.status === "approved").length,
        lowStock: vendorProducts.filter(
          (p) =>
            (Number(p.stock) || 0) > 0 &&
            (Number(p.stock) || 0) <= (Number(p.lowStockThreshold) || 5)
        ).length,
        outOfStock: vendorProducts.filter((p) => (Number(p.stock) || 0) <= 0)
          .length,
      },
      topProducts,
      store: {
        storeName: vendor.storeName,
        commission: vendor.commission || 10,
        approvalStatus: vendor.approvalStatus,
        memberSince: vendor.createdAt,
      },
    };

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    console.error("getVendorStats error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getSalesReport = async (req, res) => {
  try {
    const vendor = await getVendorByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    const vendorIdVariations = [
      String(vendor.vendorId || ""),
      String(vendor._id || ""),
      String(vendor.id || ""),
      String(vendor.userId || ""),
    ].filter(Boolean);

    const {
      dateFrom,
      dateTo,
      status = "all",
      groupBy = "day",
    } = req.query;

    console.log(`\n📊 SALES REPORT DEBUG:`);
    console.log(`   Vendor variations:`, vendorIdVariations);

    const orderResult = await getAllOrders({ page: 1, limit: 100000 });
    const allOrders = orderResult.items || [];

    console.log(`   Total orders in DB: ${allOrders.length}`);

    const isVendorMatch = (item) => {
      const values = [
        String(item.vendor || ""),
        String(item.vendorId || ""),
        String(item.vendorStore || ""),
      ];
      return values.some((v) => vendorIdVariations.includes(v));
    };

    let vendorOrders = allOrders.filter((order) =>
      (order.items || []).some(isVendorMatch)
    );

    console.log(`   Vendor's orders (matched): ${vendorOrders.length}`);

    if (vendorOrders.length === 0 && allOrders.length > 0) {
      console.log(`   ⚠️ SAMPLE ORDER ITEM:`, JSON.stringify(allOrders[0]?.items?.[0], null, 2));
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      vendorOrders = vendorOrders.filter((o) => new Date(o.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      vendorOrders = vendorOrders.filter((o) => new Date(o.createdAt) <= to);
    }
    if (status !== "all") {
      vendorOrders = vendorOrders.filter((o) => o.orderStatus === status);
    }

    console.log(`   After date/status filter: ${vendorOrders.length}`);

    const commissionRate = (vendor.commission || 10) / 100;

    const productResult = await getAllProducts({ page: 1, limit: 100000 });
    const allProducts = (productResult.items || []).filter((p) => {
      const productVendorValues = [
        String(p.vendorId || ""),
        String(p.vendor || ""),
        String(p.vendorStoreId || ""),
      ];
      return productVendorValues.some((val) =>
        vendorIdVariations.includes(val)
      );
    });

    const salesData = vendorOrders.map((order) => {
      const vendorItems = (order.items || []).filter(isVendorMatch);

      const grossAmount = vendorItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      );

      const commission = grossAmount * commissionRate;
      const netEarning = grossAmount - commission;
      const totalQty = vendorItems.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

      return {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        customer: order.shippingAddress?.fullName || "Unknown",
        customerCity: order.shippingAddress?.city || "",
        customerState: order.shippingAddress?.state || "",
        itemCount: vendorItems.length,
        totalQuantity: totalQty,
        grossAmount: Math.round(grossAmount * 100) / 100,
        commission: Math.round(commission * 100) / 100,
        netEarning: Math.round(netEarning * 100) / 100,
        commissionRate: vendor.commission || 10,
        paymentMethod: order.paymentMethod || "online",
        paymentStatus: order.paymentStatus || "pending",
        orderStatus: order.orderStatus || "pending",
        couponCode: order.couponCode || "",
        products: vendorItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: (item.price || 0) * (item.quantity || 1),
        })),
      };
    });

    const paidOrders = salesData.filter(
      (s) =>
        s.paymentStatus === "paid" ||
        s.paymentStatus === "completed" ||
        s.paymentStatus === "success"
    );
    const deliveredOrders = salesData.filter((s) => s.orderStatus === "delivered");

    const revenueOrders = paidOrders.length > 0 ? paidOrders : salesData;

    const totalGross = revenueOrders.reduce((sum, s) => sum + s.grossAmount, 0);
    const totalCommission = revenueOrders.reduce((sum, s) => sum + s.commission, 0);
    const totalNet = revenueOrders.reduce((sum, s) => sum + s.netEarning, 0);
    const totalQty = revenueOrders.reduce((sum, s) => sum + s.totalQuantity, 0);

    console.log(`   Paid orders: ${paidOrders.length}`);
    console.log(`   Total revenue: ₹${totalGross}`);

    const chartData = {};
    revenueOrders.forEach((order) => {
      const date = new Date(order.date);
      let key;
      if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = date.toISOString().split("T")[0];
      }

      if (!chartData[key]) {
        chartData[key] = { period: key, orders: 0, gross: 0, net: 0 };
      }
      chartData[key].orders++;
      chartData[key].gross += order.grossAmount;
      chartData[key].net += order.netEarning;
    });

    const productSales = {};
    revenueOrders.forEach((order) => {
      order.products.forEach((p) => {
        if (!productSales[p.name]) {
          productSales[p.name] = { name: p.name, qty: 0, revenue: 0 };
        }
        productSales[p.name].qty += p.quantity;
        productSales[p.name].revenue += p.total;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const statusBreakdown = {
      pending: salesData.filter((s) => s.orderStatus === "pending").length,
      confirmed: salesData.filter((s) => s.orderStatus === "confirmed").length,
      processing: salesData.filter((s) => s.orderStatus === "processing").length,
      shipped: salesData.filter((s) => s.orderStatus === "shipped").length,
      delivered: salesData.filter((s) => s.orderStatus === "delivered").length,
      cancelled: salesData.filter((s) => s.orderStatus === "cancelled").length,
    };

    const stateBreakdown = {};
    revenueOrders.forEach((order) => {
      const state = order.customerState || "Unknown";
      if (!stateBreakdown[state]) {
        stateBreakdown[state] = { state, orders: 0, revenue: 0 };
      }
      stateBreakdown[state].orders++;
      stateBreakdown[state].revenue += order.grossAmount;
    });

    const topStates = Object.values(stateBreakdown)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders: salesData.length,
          totalPaidOrders: paidOrders.length,
          totalDeliveredOrders: deliveredOrders.length,
          totalGross: Math.round(totalGross * 100) / 100,
          totalCommission: Math.round(totalCommission * 100) / 100,
          totalNet: Math.round(totalNet * 100) / 100,
          totalQuantity: totalQty,
          averageOrderValue: revenueOrders.length > 0
            ? Math.round((totalGross / revenueOrders.length) * 100) / 100
            : 0,
          commissionRate: vendor.commission || 10,
          totalProducts: allProducts.length,
          conversionRate: salesData.length > 0
            ? Math.round((deliveredOrders.length / salesData.length) * 100)
            : 0,
        },
        vendor: {
          storeName: vendor.storeName,
          commission: vendor.commission || 10,
          memberSince: vendor.createdAt,
        },
        orders: salesData.slice(0, 100),
        chartData: Object.values(chartData).sort((a, b) =>
          a.period.localeCompare(b.period)
        ),
        topProducts,
        topStates,
        statusBreakdown,
        dateRange: { from: dateFrom, to: dateTo },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("getSalesReport error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  vendorSignup,
  vendorLogin,
  getVendorProfile,
  updateVendorProfile,
  updateVendorStore,
  changeVendorPassword,
  checkStoreName,
  getVendorStats,
  getSalesReport,
};
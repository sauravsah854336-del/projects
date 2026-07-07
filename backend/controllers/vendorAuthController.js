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
  getVendorByStoreName,
  findVendorByPAN,
  findVendorByGST,
  findVendorByStoreNameCaseInsensitive,
  updateVendor,
} = require("../models/dynamodb/vendorModel");

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

    const existStore = await findVendorByStoreNameCaseInsensitive(storeName.trim());
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

    console.log(`✅ VENDOR Login: ${user.email} | Store: ${vendor.storeName}`);

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

    const storeUpdates = {};

    if (storeName !== undefined) {
      if (storeName.trim().length < 3) {
        return res.status(400).json({ success: false, message: "Store name must be at least 3 characters" });
      }
      const existing = await findVendorByStoreNameCaseInsensitive(storeName.trim());
      if (existing && existing._id !== vendor._id) {
        return res.status(409).json({ success: false, message: "Store name already taken" });
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

    const updatedVendor = await updateVendor(vendor._id, storeUpdates);

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

    const existing = await findVendorByStoreNameCaseInsensitive(name.trim());

    return res.status(200).json({
      available: !existing,
      message: existing ? "Store name is already taken" : "Store name is available",
    });
  } catch (err) {
    return res.status(500).json({ available: false, message: "Failed to check" });
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
};
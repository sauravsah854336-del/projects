const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const { otpEmailTemplate } = require("../utils/emailTemplates");
const {
  createUser,
  getUserByEmail,
  getUserByEmailWithPassword,
  getUserById,
  getUserByIdWithPassword,
  getUserByFullPhone,
  updateUser,
  pushRefreshToken,
  pullRefreshToken,
  clearRefreshTokens,
} = require("../models/dynamodb/userModel");

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

const COUNTRY_VALIDATIONS = {
  IN: { length: 10, pattern: /^[6-9]\d{9}$/, name: "Indian", dial: "+91" },
  US: { length: 10, pattern: /^[2-9]\d{9}$/, name: "US", dial: "+1" },
  GB: { length: 10, pattern: /^\d{10}$/, name: "UK", dial: "+44" },
  AE: { length: 9, pattern: /^5\d{8}$/, name: "UAE", dial: "+971" },
  SA: { length: 9, pattern: /^5\d{8}$/, name: "Saudi", dial: "+966" },
  AU: { length: 9, pattern: /^4\d{8}$/, name: "Australia", dial: "+61" },
  CA: { length: 10, pattern: /^[2-9]\d{9}$/, name: "Canada", dial: "+1" },
  SG: { length: 8, pattern: /^[89]\d{7}$/, name: "Singapore", dial: "+65" },
  DE: { length: 11, pattern: /^1\d{9,10}$/, name: "Germany", dial: "+49" },
  FR: { length: 9, pattern: /^[67]\d{8}$/, name: "France", dial: "+33" },
  JP: { length: 10, pattern: /^[7-9]0\d{8}$/, name: "Japan", dial: "+81" },
  CN: { length: 11, pattern: /^1\d{10}$/, name: "China", dial: "+86" },
  BR: { length: 11, pattern: /^\d{10,11}$/, name: "Brazil", dial: "+55" },
  ZA: { length: 9, pattern: /^[6-8]\d{8}$/, name: "South Africa", dial: "+27" },
  NG: { length: 10, pattern: /^[789]\d{9}$/, name: "Nigeria", dial: "+234" },
  PK: { length: 10, pattern: /^3\d{9}$/, name: "Pakistan", dial: "+92" },
  BD: { length: 10, pattern: /^1\d{9}$/, name: "Bangladesh", dial: "+880" },
  LK: { length: 9, pattern: /^7\d{8}$/, name: "Sri Lanka", dial: "+94" },
  NP: { length: 10, pattern: /^9\d{9}$/, name: "Nepal", dial: "+977" },
  MY: { length: 10, pattern: /^1\d{8,9}$/, name: "Malaysia", dial: "+60" },
};

const COUNTRY_DEFAULTS = {
  IN: {
    code: "IN", name: "India", flag: "🇮🇳",
    currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
    exchangeRate: 1,
    tax: { type: "GST", rate: 18, label: "GST", includedInPrice: true },
    shipping: { freeShippingThreshold: 499, standardCost: 49, expressCost: 99, estimatedDays: { standard: 5, express: 2 } },
    paymentMethods: ["cod", "card", "upi", "netbanking", "wallet"],
  },
};

const sanitizeUser = (user) => ({
  _id: user._id || user.userId,
  id: user._id || user.userId,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  dialCode: user.dialCode || "+91",
  fullPhone: user.fullPhone || `+91${user.phone}`,
  avatar: user.avatar || "",
  role: user.role,
  status: user.status,
  dateOfBirth: user.dateOfBirth,
  isEmailVerified: user.isEmailVerified,
  isPhoneVerified: user.isPhoneVerified,
  preferredCountry: user.preferredCountry || "IN",
  preferredCurrency: user.preferredCurrency || "INR",
  createdAt: user.createdAt,
  lastLogin: user.lastLogin,
});

const getCountryData = async (countryCode) => {
  try {
    const { getCountryByCode } = require("../models/dynamodb/countryModel");
    const country = await getCountryByCode(countryCode);
    if (country) return country;
  } catch (e) {
    console.log("Country DB lookup failed:", e.message);
  }
  return COUNTRY_DEFAULTS[countryCode] || COUNTRY_DEFAULTS.IN;
};

const signup = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, password,
      countryCode = "IN", dialCode, fullPhone,
    } = req.body;

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

    const validation = COUNTRY_VALIDATIONS[countryCode] || COUNTRY_VALIDATIONS.IN;

    if (!validation.pattern.test(phone.trim())) {
      return res.status(400).json({ success: false, message: `Valid ${validation.name} phone number required` });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const finalDialCode = dialCode || validation.dial;
    const finalFullPhone = fullPhone || `${finalDialCode}${phone.trim()}`;

    const existUser = await getUserByEmail(normalizedEmail);
    if (existUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const existPhone = await getUserByFullPhone(finalFullPhone);
    if (existPhone) {
      return res.status(409).json({ success: false, message: "Phone number already registered" });
    }

    const countryData = await getCountryData(countryCode);
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await createUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      dialCode: finalDialCode,
      fullPhone: finalFullPhone,
      password: hashedPassword,
      role: "customer",
      status: "active",
      preferredCountry: countryCode,
      preferredCurrency: countryData?.currency?.code || "INR",
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await pushRefreshToken(user._id, { token: refreshToken, createdAt: new Date().toISOString() });

    console.log(`✅ Signup: ${user.email} | Country: ${countryCode}`);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
      detectedCountry: countryData,
      userCountry: countryData,
    });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await getUserByEmailWithPassword(normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact support." });
    }

    if (user.status === "inactive") {
      return res.status(403).json({ success: false, message: "Account is not active. Please contact support." });
    }

    if (user.isDeleted) {
      return res.status(403).json({ success: false, message: "Account no longer exists." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.role === "vendor") {
      const { getVendorByUserId } = require("../models/dynamodb/vendorModel");
      const vendor = await getVendorByUserId(user._id);

      if (!vendor) {
        return res.status(404).json({ success: false, message: "Vendor profile not found" });
      }

      if (vendor.approvalStatus === "pending") {
        return res.status(403).json({ success: false, message: "Your vendor account is pending admin approval." });
      }

      if (vendor.approvalStatus === "rejected") {
        return res.status(403).json({
          success: false,
          message: vendor.rejectionReason
            ? `Your vendor application was rejected: ${vendor.rejectionReason}`
            : "Your vendor application was rejected.",
        });
      }

      if (vendor.approvalStatus === "suspended") {
        return res.status(403).json({ success: false, message: "Your vendor account has been suspended." });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      await updateUser(user._id, { lastLogin: new Date().toISOString() });
      await pushRefreshToken(user._id, { token: refreshToken, createdAt: new Date().toISOString() });

      const countryData = await getCountryData(user.preferredCountry || "IN");

      console.log(`✅ VENDOR Login: ${user.email} | Store: ${vendor.storeName}`);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token: accessToken,
        refreshToken,
        user: sanitizeUser(user),
        preferredCountry: countryData,
        userCountry: countryData,
        vendor: {
          id: vendor._id,
          storeName: vendor.storeName,
          approvalStatus: vendor.approvalStatus,
          commission: vendor.commission,
        },
      });
    }

    if (user.role !== "customer" && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Invalid account type." });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await updateUser(user._id, { lastLogin: new Date().toISOString() });
    await pushRefreshToken(user._id, { token: refreshToken, createdAt: new Date().toISOString() });

    const countryData = await getCountryData(user.preferredCountry || "IN");

    console.log(`✅ ${user.role.toUpperCase()} Login: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
      preferredCountry: countryData,
      userCountry: countryData,
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.status === "blocked" || user.isDeleted) {
      return res.status(403).json({ success: false, message: "Account is not active" });
    }

    const tokenExists = (user.refreshTokens || []).some((t) => t.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({ success: false, message: "Refresh token not valid" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await pullRefreshToken(user._id, refreshToken);
    await pushRefreshToken(user._id, { token: newRefreshToken, createdAt: new Date().toISOString() });

    return res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("refresh error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const verifyToken = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.status === "blocked" || user.isDeleted) {
      return res.status(403).json({ success: false, message: "Account is not active" });
    }

    const countryData = await getCountryData(user.preferredCountry || "IN");

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
      userCountry: countryData,
    });
  } catch (err) {
    console.error("verifyToken error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await pullRefreshToken(req.user.id, refreshToken);
    }

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await getUserByEmail(email.trim().toLowerCase());

    if (!user || user.role !== "customer") {
      return res.status(200).json({ success: true, message: "If this email exists, an OTP has been sent" });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await updateUser(user._id, {
      passwordResetOTP: otp,
      passwordResetOTPExpiry: expiry,
    });

    await sendEmail({
      to: user.email,
      subject: "Password Reset OTP — E-Commerce",
      html: otpEmailTemplate({ otp, firstName: user.firstName }),
    });

    return res.status(200).json({ success: true, message: "OTP sent to your email address" });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await getUserByEmail(email.trim().toLowerCase());
    if (!user || user.role !== "customer") {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (!user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      return res.status(400).json({ success: false, message: "No OTP requested." });
    }

    if (new Date() > new Date(user.passwordResetOTPExpiry)) {
      await updateUser(user._id, { passwordResetOTP: null, passwordResetOTPExpiry: null });
      return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    if (user.passwordResetOTP !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    return res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one uppercase letter" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one number" });
    }

    const user = await getUserByEmailWithPassword(email.trim().toLowerCase());
    if (!user || user.role !== "customer") {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    if (!user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      return res.status(400).json({ success: false, message: "No OTP found." });
    }

    if (new Date() > new Date(user.passwordResetOTPExpiry)) {
      await updateUser(user._id, { passwordResetOTP: null, passwordResetOTPExpiry: null });
      return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    if (user.passwordResetOTP !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await updateUser(user._id, {
      password: hashed,
      passwordResetOTP: null,
      passwordResetOTPExpiry: null,
      refreshTokens: [],
    });

    return res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await getUserByEmail(email.trim().toLowerCase());
    if (!user || user.role !== "customer") {
      return res.status(200).json({ success: true, message: "If this email exists, an OTP has been sent" });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await updateUser(user._id, {
      passwordResetOTP: otp,
      passwordResetOTPExpiry: expiry,
    });

    await sendEmail({
      to: user.email,
      subject: "Password Reset OTP (Resent) — E-Commerce",
      html: otpEmailTemplate({ otp, firstName: user.firstName }),
    });

    return res.status(200).json({ success: true, message: "New OTP sent to your email" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to resend OTP" });
  }
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
  verifyToken,
  forgotPassword,
  verifyOTP,
  resetPassword,
  resendOTP,
};
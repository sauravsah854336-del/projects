const jwt = require("jsonwebtoken");
const User = require("../models/users");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const { otpEmailTemplate } = require("../utils/emailTemplates");

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

const getCountryFromPhone = (phone) => {
  if (!phone) return "IN";
  const cleaned = phone.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(cleaned)) return "IN";
  if (/^1\d{10}$/.test(cleaned)) return "US";
  if (/^44\d{10}$/.test(cleaned)) return "GB";
  if (/^971\d{9}$/.test(cleaned)) return "AE";
  if (/^966\d{9}$/.test(cleaned)) return "SA";
  if (/^61\d{9}$/.test(cleaned)) return "AU";
  if (/^65\d{8}$/.test(cleaned)) return "SG";
  if (/^49\d{10,11}$/.test(cleaned)) return "DE";
  if (/^81\d{10}$/.test(cleaned)) return "JP";
  return "IN";
};

const sanitizeUser = (user) => ({
  _id: user._id,
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
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

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
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
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, message: "Valid 10-digit Indian phone number required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existUser = await User.findOne({ email: normalizedEmail });
    if (existUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const existPhone = await User.findOne({ phone: phone.trim() });
    if (existPhone) {
      return res.status(409).json({ success: false, message: "Phone number already registered" });
    }

    const detectedCountryCode = getCountryFromPhone(phone.trim());

    let countryData = null;
    try {
      const Country = require("../models/country");
      countryData = await Country.findOne({ code: detectedCountryCode, isActive: true });
    } catch (e) {
      console.log("Country model not available, using defaults");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "customer",
      status: "active",
      preferredCountry: detectedCountryCode,
      preferredCurrency: countryData?.currency?.code || "INR",
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          token: refreshToken,
          createdAt: new Date(),
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
      detectedCountry: countryData || null,
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
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.role === "vendor") {
      return res.status(403).json({ success: false, message: "Vendors must login from the vendor portal." });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact support." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ success: false, message: "Account is not active. Please contact support." });
    }

    if (user.isDeleted) {
      return res.status(403).json({ success: false, message: "Account no longer exists." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      $push: { refreshTokens: { token: refreshToken, createdAt: new Date() } },
    });

    let countryData = null;
    try {
      const Country = require("../models/country");
      countryData = await Country.findOne({
        code: user.preferredCountry || "IN",
        isActive: true,
      });
    } catch (e) {
      console.log("Country model not available");
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
      preferredCountry: countryData || null,
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

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.status === "blocked" || user.isDeleted) {
      return res.status(403).json({ success: false, message: "Account is not active" });
    }

    const tokenExists = user.refreshTokens.some((t) => t.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({ success: false, message: "Refresh token not valid" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: { token: refreshToken } },
    });

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { token: newRefreshToken, createdAt: new Date() } },
    });

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
    const user = await User.findById(req.user.id).select("-password -refreshTokens");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.status === "blocked" || user.isDeleted) {
      return res.status(403).json({ success: false, message: "Account is not active" });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
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
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { refreshTokens: { token: refreshToken } },
      });
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

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "customer",
    });

    if (!user) {
      return res.status(200).json({ success: true, message: "If this email exists, an OTP has been sent" });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetOTP = otp;
    user.passwordResetOTPExpiry = expiry;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Password Reset OTP — E-Commerce",
      html: otpEmailTemplate({ otp, firstName: user.firstName }),
    });

    return res.status(200).json({ success: true, message: "OTP sent to your email address" });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase(), role: "customer" });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (!user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      return res.status(400).json({ success: false, message: "No OTP requested. Please request a new one." });
    }

    if (new Date() > user.passwordResetOTPExpiry) {
      user.passwordResetOTP = null;
      user.passwordResetOTPExpiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (user.passwordResetOTP !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
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

    const user = await User.findOne({ email: email.trim().toLowerCase(), role: "customer" });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    if (!user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });
    }

    if (new Date() > user.passwordResetOTPExpiry) {
      user.passwordResetOTP = null;
      user.passwordResetOTPExpiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (user.passwordResetOTP !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    user.passwordResetOTP = null;
    user.passwordResetOTPExpiry = null;
    user.refreshTokens = [];
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successfully. Please login." });
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

    const user = await User.findOne({ email: email.trim().toLowerCase(), role: "customer" });
    if (!user) {
      return res.status(200).json({ success: true, message: "If this email exists, an OTP has been sent" });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetOTP = otp;
    user.passwordResetOTPExpiry = expiry;
    await user.save();

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
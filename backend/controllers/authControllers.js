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
  US: {
    code: "US", name: "United States", flag: "🇺🇸",
    currency: { code: "USD", symbol: "$", name: "US Dollar" },
    exchangeRate: 0.012,
    tax: { type: "Sales Tax", rate: 7.5, label: "Tax", includedInPrice: false },
    shipping: { freeShippingThreshold: 25, standardCost: 5.99, expressCost: 12.99, estimatedDays: { standard: 7, express: 3 } },
    paymentMethods: ["card", "paypal", "applepay", "googlepay"],
  },
  GB: {
    code: "GB", name: "United Kingdom", flag: "🇬🇧",
    currency: { code: "GBP", symbol: "£", name: "British Pound" },
    exchangeRate: 0.0094,
    tax: { type: "VAT", rate: 20, label: "VAT", includedInPrice: true },
    shipping: { freeShippingThreshold: 20, standardCost: 3.99, expressCost: 7.99, estimatedDays: { standard: 5, express: 2 } },
    paymentMethods: ["card", "paypal", "applepay"],
  },
  AE: {
    code: "AE", name: "United Arab Emirates", flag: "🇦🇪",
    currency: { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    exchangeRate: 0.044,
    tax: { type: "VAT", rate: 5, label: "VAT", includedInPrice: true },
    shipping: { freeShippingThreshold: 100, standardCost: 15, expressCost: 25, estimatedDays: { standard: 4, express: 1 } },
    paymentMethods: ["cod", "card", "applepay"],
  },
  SA: {
    code: "SA", name: "Saudi Arabia", flag: "🇸🇦",
    currency: { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
    exchangeRate: 0.045,
    tax: { type: "VAT", rate: 15, label: "VAT", includedInPrice: true },
    shipping: { freeShippingThreshold: 200, standardCost: 20, expressCost: 35, estimatedDays: { standard: 5, express: 2 } },
    paymentMethods: ["cod", "card"],
  },
  CA: {
    code: "CA", name: "Canada", flag: "🇨🇦",
    currency: { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    exchangeRate: 0.016,
    tax: { type: "GST", rate: 13, label: "HST/GST", includedInPrice: false },
    shipping: { freeShippingThreshold: 35, standardCost: 7.99, expressCost: 14.99, estimatedDays: { standard: 7, express: 3 } },
    paymentMethods: ["card", "paypal"],
  },
  AU: {
    code: "AU", name: "Australia", flag: "🇦🇺",
    currency: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    exchangeRate: 0.018,
    tax: { type: "GST", rate: 10, label: "GST", includedInPrice: true },
    shipping: { freeShippingThreshold: 49, standardCost: 6.99, expressCost: 12.99, estimatedDays: { standard: 6, express: 2 } },
    paymentMethods: ["card", "paypal"],
  },
  SG: {
    code: "SG", name: "Singapore", flag: "🇸🇬",
    currency: { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
    exchangeRate: 0.016,
    tax: { type: "GST", rate: 9, label: "GST", includedInPrice: true },
    shipping: { freeShippingThreshold: 40, standardCost: 5, expressCost: 10, estimatedDays: { standard: 3, express: 1 } },
    paymentMethods: ["card", "paypal", "applepay"],
  },
  DE: {
    code: "DE", name: "Germany", flag: "🇩🇪",
    currency: { code: "EUR", symbol: "€", name: "Euro" },
    exchangeRate: 0.011,
    tax: { type: "VAT", rate: 19, label: "MwSt", includedInPrice: true },
    shipping: { freeShippingThreshold: 29, standardCost: 3.99, expressCost: 6.99, estimatedDays: { standard: 4, express: 2 } },
    paymentMethods: ["card", "paypal"],
  },
  FR: {
    code: "FR", name: "France", flag: "🇫🇷",
    currency: { code: "EUR", symbol: "€", name: "Euro" },
    exchangeRate: 0.011,
    tax: { type: "VAT", rate: 20, label: "TVA", includedInPrice: true },
    shipping: { freeShippingThreshold: 25, standardCost: 4.99, expressCost: 8.99, estimatedDays: { standard: 4, express: 2 } },
    paymentMethods: ["card", "paypal"],
  },
  JP: {
    code: "JP", name: "Japan", flag: "🇯🇵",
    currency: { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    exchangeRate: 1.8,
    tax: { type: "VAT", rate: 10, label: "消費税", includedInPrice: true },
    shipping: { freeShippingThreshold: 2000, standardCost: 350, expressCost: 700, estimatedDays: { standard: 3, express: 1 } },
    paymentMethods: ["card", "cod"],
  },
  CN: {
    code: "CN", name: "China", flag: "🇨🇳",
    currency: { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    exchangeRate: 0.087,
    tax: { type: "VAT", rate: 13, label: "VAT", includedInPrice: true },
    shipping: { freeShippingThreshold: 99, standardCost: 10, expressCost: 25, estimatedDays: { standard: 5, express: 2 } },
    paymentMethods: ["card", "wallet"],
  },
  BR: {
    code: "BR", name: "Brazil", flag: "🇧🇷",
    currency: { code: "BRL", symbol: "R$", name: "Brazilian Real" },
    exchangeRate: 0.061,
    tax: { type: "Sales Tax", rate: 17, label: "ICMS", includedInPrice: true },
    shipping: { freeShippingThreshold: 79, standardCost: 9.99, expressCost: 19.99, estimatedDays: { standard: 8, express: 4 } },
    paymentMethods: ["card", "cod"],
  },
  ZA: {
    code: "ZA", name: "South Africa", flag: "🇿🇦",
    currency: { code: "ZAR", symbol: "R", name: "South African Rand" },
    exchangeRate: 0.22,
    tax: { type: "VAT", rate: 15, label: "VAT", includedInPrice: true },
    shipping: { freeShippingThreshold: 500, standardCost: 60, expressCost: 120, estimatedDays: { standard: 7, express: 3 } },
    paymentMethods: ["card", "cod"],
  },
  NG: {
    code: "NG", name: "Nigeria", flag: "🇳🇬",
    currency: { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    exchangeRate: 19.5,
    tax: { type: "VAT", rate: 7.5, label: "VAT", includedInPrice: false },
    shipping: { freeShippingThreshold: 10000, standardCost: 1500, expressCost: 3000, estimatedDays: { standard: 7, express: 3 } },
    paymentMethods: ["card", "cod"],
  },
  PK: {
    code: "PK", name: "Pakistan", flag: "🇵🇰",
    currency: { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
    exchangeRate: 3.35,
    tax: { type: "Sales Tax", rate: 17, label: "GST", includedInPrice: true },
    shipping: { freeShippingThreshold: 2500, standardCost: 200, expressCost: 500, estimatedDays: { standard: 5, express: 2 } },
    paymentMethods: ["cod", "card"],
  },
  BD: {
    code: "BD", name: "Bangladesh", flag: "🇧🇩",
    currency: { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
    exchangeRate: 1.31,
    tax: { type: "VAT", rate: 15, label: "VAT", includedInPrice: true },
    shipping: { freeShippingThreshold: 1000, standardCost: 80, expressCost: 200, estimatedDays: { standard: 5, express: 2 } },
    paymentMethods: ["cod", "card"],
  },
  LK: {
    code: "LK", name: "Sri Lanka", flag: "🇱🇰",
    currency: { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
    exchangeRate: 3.6,
    tax: { type: "VAT", rate: 18, label: "VAT", includedInPrice: true },
    shipping: { freeShippingThreshold: 3000, standardCost: 250, expressCost: 500, estimatedDays: { standard: 5, express: 2 } },
    paymentMethods: ["cod", "card"],
  },
  NP: {
    code: "NP", name: "Nepal", flag: "🇳🇵",
    currency: { code: "NPR", symbol: "₨", name: "Nepalese Rupee" },
    exchangeRate: 1.6,
    tax: { type: "VAT", rate: 13, label: "VAT", includedInPrice: true },
    shipping: { freeShippingThreshold: 1500, standardCost: 100, expressCost: 250, estimatedDays: { standard: 6, express: 3 } },
    paymentMethods: ["cod", "card"],
  },
  MY: {
    code: "MY", name: "Malaysia", flag: "🇲🇾",
    currency: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
    exchangeRate: 0.057,
    tax: { type: "Sales Tax", rate: 6, label: "SST", includedInPrice: true },
    shipping: { freeShippingThreshold: 80, standardCost: 8, expressCost: 18, estimatedDays: { standard: 4, express: 2 } },
    paymentMethods: ["card", "cod"],
  },
};

const sanitizeUser = (user) => ({
  _id: user._id,
  id: user._id,
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
    const Country = require("../models/country");
    const country = await Country.findOne({
      code: countryCode,
      isActive: true,
    });

    if (country) {
      return country.toObject ? country.toObject() : country;
    }
  } catch (e) {
    console.log("Country DB lookup failed:", e.message);
  }

  return COUNTRY_DEFAULTS[countryCode] || COUNTRY_DEFAULTS.IN;
};

const signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      countryCode = "IN",
      dialCode,
      fullPhone,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one uppercase letter",
      });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one number",
      });
    }

    const validation =
      COUNTRY_VALIDATIONS[countryCode] || COUNTRY_VALIDATIONS.IN;

    if (!validation.pattern.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: `Valid ${validation.name} phone number required`,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const finalDialCode = dialCode || validation.dial;
    const finalFullPhone = fullPhone || `${finalDialCode}${phone.trim()}`;

    const existUser = await User.findOne({ email: normalizedEmail });
    if (existUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    const existPhone = await User.findOne({ fullPhone: finalFullPhone });
    if (existPhone) {
      return res
        .status(409)
        .json({ success: false, message: "Phone number already registered" });
    }

    const countryData = await getCountryData(countryCode);

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
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

    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          token: refreshToken,
          createdAt: new Date(),
        },
      },
    });

    console.log(`✅ Signup: ${user.email} | Country: ${countryCode} | Currency: ${countryData?.currency?.code}`);

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
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact support.",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Account is not active. Please contact support.",
      });
    }

    if (user.isDeleted) {
      return res
        .status(403)
        .json({ success: false, message: "Account no longer exists." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // ✅ If vendor, check vendor approval status
    if (user.role === "vendor") {
      const Vendor = require("../models/vendors");
      const vendor = await Vendor.findOne({ userId: user._id });

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor profile not found",
        });
      }

      if (vendor.approvalStatus === "pending") {
        return res.status(403).json({
          success: false,
          message:
            "Your vendor account is pending admin approval. We will notify you within 24-48 hours.",
        });
      }

      if (vendor.approvalStatus === "rejected") {
        return res.status(403).json({
          success: false,
          message: vendor.rejectionReason
            ? `Your vendor application was rejected: ${vendor.rejectionReason}`
            : "Your vendor application was rejected. Please contact support.",
        });
      }

      if (vendor.approvalStatus === "suspended") {
        return res.status(403).json({
          success: false,
          message: "Your vendor account has been suspended. Please contact support.",
        });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      await User.findByIdAndUpdate(user._id, {
        lastLogin: new Date(),
        $push: { refreshTokens: { token: refreshToken, createdAt: new Date() } },
      });

      const countryData = await getCountryData(user.preferredCountry || "IN");

      console.log(`✅ VENDOR Login (via public): ${user.email} | Store: ${vendor.storeName}`);

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

    // ✅ Customer or Admin login
    if (user.role !== "customer" && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Invalid account type.",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      $push: { refreshTokens: { token: refreshToken, createdAt: new Date() } },
    });

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
      return res
        .status(401)
        .json({ success: false, message: "Refresh token missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    if (user.status === "blocked" || user.isDeleted) {
      return res
        .status(403)
        .json({ success: false, message: "Account is not active" });
    }

    const tokenExists = user.refreshTokens.some(
      (t) => t.token === refreshToken
    );
    if (!tokenExists) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token not valid" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: { token: refreshToken } },
    });

    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: { token: newRefreshToken, createdAt: new Date() },
      },
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
    const user = await User.findById(req.user.id).select(
      "-password -refreshTokens"
    );

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    if (user.status === "blocked" || user.isDeleted) {
      return res
        .status(403)
        .json({ success: false, message: "Account is not active" });
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
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { refreshTokens: { token: refreshToken } },
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
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
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "customer",
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email exists, an OTP has been sent",
      });
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

    return res
      .status(200)
      .json({ success: true, message: "OTP sent to your email address" });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "customer",
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (!user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: "No OTP requested. Please request a new one.",
      });
    }

    if (new Date() > user.passwordResetOTPExpiry) {
      user.passwordResetOTP = null;
      user.passwordResetOTPExpiry = null;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.passwordResetOTP !== otp.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again." });
    }

    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one uppercase letter",
      });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one number",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "customer",
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request" });
    }

    if (!user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    if (new Date() > user.passwordResetOTPExpiry) {
      user.passwordResetOTP = null;
      user.passwordResetOTPExpiry = null;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
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

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "customer",
    });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email exists, an OTP has been sent",
      });
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

    return res
      .status(200)
      .json({ success: true, message: "New OTP sent to your email" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to resend OTP" });
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
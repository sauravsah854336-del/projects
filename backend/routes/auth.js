const express = require("express");
const {
  signup,
  login,
  refresh,
  logout,
  verifyToken,
  forgotPassword,
  verifyOTP,
  resetPassword,
  resendOTP,
} = require("../controllers/authControllers");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/verify", protect, verifyToken);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOTP);

module.exports = router;

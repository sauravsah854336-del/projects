const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  vendorSignup,
  vendorLogin,
  getVendorProfile,
  updateVendorProfile,
  updateVendorStore,
  changeVendorPassword,
  checkStoreName,
  getVendorStats,
} = require("../controllers/vendorController");

const router = express.Router();

router.post("/signup", vendorSignup);
router.post("/login", vendorLogin);
router.get("/check-store-name", protect, checkStoreName);
router.get("/profile", protect, authorized("vendor"), getVendorProfile);
router.put("/profile", protect, authorized("vendor"), updateVendorProfile);
router.put("/store", protect, authorized("vendor"), updateVendorStore);
router.put("/change-password", protect, authorized("vendor"), changeVendorPassword);
router.get("/stats", protect, authorized("vendor"), getVendorStats);

module.exports = router;
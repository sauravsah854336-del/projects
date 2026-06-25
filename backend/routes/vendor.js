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
} = require("../controllers/vendorAuthController");
const Vendor = require("../models/vendors");

const router = express.Router();

router.post("/signup", vendorSignup);
router.post("/login", vendorLogin);

router.get("/profile", protect, authorized("vendor"), getVendorProfile);
router.put("/profile", protect, authorized("vendor"), updateVendorProfile);
router.put("/store", protect, authorized("vendor"), updateVendorStore);
router.put("/change-password", protect, authorized("vendor"), changeVendorPassword);

router.get("/check-store-name", async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        available: false,
        message: "Store name must be at least 3 characters",
      });
    }

    const existing = await Vendor.findOne({
      storeName: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      isDeleted: false,
    });

    return res.status(200).json({
      success: true,
      available: !existing,
      message: existing ? "Store name is already taken" : "Store name is available",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      available: false,
      message: "Server error",
    });
  }
});

module.exports = router;
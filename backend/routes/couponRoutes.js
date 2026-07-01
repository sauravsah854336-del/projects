const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  adminCreateCoupon,
  adminGetAllCoupons,
  adminGetCouponById,
  adminUpdateCoupon,
  adminDeleteCoupon,
  adminToggleCouponStatus,
  getPublicCoupons,
  validateCoupon,
} = require("../controllers/couponController");

const router = express.Router();

router.get("/public", getPublicCoupons);
router.post("/validate", protect, validateCoupon);

router.post("/admin", protect, authorized("admin"), adminCreateCoupon);
router.get("/admin", protect, authorized("admin"), adminGetAllCoupons);
router.get("/admin/:id", protect, authorized("admin"), adminGetCouponById);
router.put("/admin/:id", protect, authorized("admin"), adminUpdateCoupon);
router.delete("/admin/:id", protect, authorized("admin"), adminDeleteCoupon);
router.put("/admin/:id/toggle", protect, authorized("admin"), adminToggleCouponStatus);

module.exports = router;
const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  placeOrder,
  getMyOrders,
  getSingleOrder,
  cancelOrder,
  adminGetAllOrders,
  updateOrderStatus,
  vendorGetOrders,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", protect, authorized("customer"), placeOrder);
router.get("/my", protect, authorized("customer"), getMyOrders);
router.get("/my/:id", protect, authorized("customer"), getSingleOrder);
router.put("/my/:id/cancel", protect, authorized("customer"), cancelOrder);

router.get("/admin", protect, authorized("admin"), adminGetAllOrders);
router.put("/admin/:id/status", protect, authorized("admin"), updateOrderStatus);

router.get("/vendor", protect, authorized("vendor"), vendorGetOrders);

module.exports = router;
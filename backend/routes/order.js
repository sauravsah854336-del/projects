const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  placeOrder, getMyOrders, getSingleOrder, cancelOrder,
  adminGetAllOrders, adminCancelOrder,
  vendorUpdateOrderStatus, vendorGetOrders,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", protect, authorized("customer"), placeOrder);
router.get("/my", protect, authorized("customer"), getMyOrders);
router.get("/my/:id", protect, authorized("customer"), getSingleOrder);
router.put("/my/:id/cancel", protect, authorized("customer"), cancelOrder);

router.get("/admin", protect, authorized("admin"), adminGetAllOrders);
router.put("/admin/:id/cancel", protect, authorized("admin"), adminCancelOrder);

router.get("/vendor", protect, authorized("vendor"), vendorGetOrders);
router.put("/vendor/:id/status", protect, authorized("vendor"), vendorUpdateOrderStatus);

module.exports = router;
const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeGuestCart,
  applyCouponToCart,
  removeCouponFromCart,
} = require("../controllers/cartController");

const router = express.Router();

router.get("/", protect, authorized("customer"), getCart);
router.post("/add", protect, authorized("customer"), addToCart);
router.post("/merge", protect, authorized("customer"), mergeGuestCart);
router.put("/update", protect, authorized("customer"), updateCartItem);
router.delete(
  "/remove/:productId",
  protect,
  authorized("customer"),
  removeCartItem
);
router.delete("/clear", protect, authorized("customer"), clearCart);
router.post(
  "/apply-coupon",
  protect,
  authorized("customer"),
  applyCouponToCart
);
router.delete(
  "/remove-coupon",
  protect,
  authorized("customer"),
  removeCouponFromCart
);

module.exports = router;
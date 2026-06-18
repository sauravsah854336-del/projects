const express = require("express");
const protect = require("../middlewares/authMiddleware");
const authorized = require("../middlewares/roleMiddleware");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");

const router = express.Router();

router.get("/", protect, authorized("customer"), getCart);
router.post("/add", protect, authorized("customer"), addToCart);
router.put("/update", protect, authorized("customer"), updateCartItem);
router.delete("/remove/:productId", protect, authorized("customer"), removeCartItem);
router.delete("/clear", protect, authorized("customer"), clearCart);

module.exports = router;
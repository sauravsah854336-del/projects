const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  toggleHelpful,
  canReview,
  getMyReviews,
  adminGetAllReviews,
  vendorGetProductReviews,
} = require("../controllers/reviewController");

router.get("/product/:productId", getProductReviews);
router.get("/can-review/:productId", protect, canReview);
router.get("/my-reviews", protect, getMyReviews);
router.get("/admin/all", protect, adminGetAllReviews);
router.get("/vendor/my-products", protect, vendorGetProductReviews);
router.post("/", protect, createReview);
router.put("/:reviewId", protect, updateReview);
router.delete("/:reviewId", protect, deleteReview);
router.post("/:reviewId/helpful", protect, toggleHelpful);

module.exports = router;
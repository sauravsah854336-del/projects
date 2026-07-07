const {
  createReview: createReviewInDB,
  getReviewByReviewId,
  getProductReviews: getProductReviewsFromDB,
  getUserReviews,
  getExistingReview,
  getAllReviews,
  getVendorProductReviews,
  updateReview: updateReviewInDB,
  saveReview,
  recalcProductRating,
} = require("../models/dynamodb/reviewModel");
const { getProductById } = require("../models/dynamodb/productModel");
const { getOrderById } = require("../models/dynamodb/orderModel");
const { getUserById } = require("../models/dynamodb/userModel");
const { getProductsByVendor } = require("../models/dynamodb/productModel");

const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, body } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const order = await getOrderById(orderId);
    if (!order || order.userId !== userId || order.orderStatus !== "delivered") {
      return res.status(403).json({ success: false, message: "You can only review products from delivered orders" });
    }

    const hasProduct = order.items.some((item) => item.product === productId);
    if (!hasProduct) {
      return res.status(403).json({ success: false, message: "This product is not in this order" });
    }

    const existing = await getExistingReview(productId, userId);
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already reviewed this product" });
    }

    const images = req.body.images || [];

    const review = await createReviewInDB({
      productId,
      userId,
      orderId,
      rating,
      title: title || "",
      body: body || "",
      images,
      isVerifiedPurchase: true,
    });

    await recalcProductRating(productId);

    const user = await getUserById(userId);
    review.user = user ? { _id: user._id, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar } : { _id: userId };

    return res.status(201).json({ success: true, message: "Review submitted successfully", data: review });
  } catch (err) {
    console.error("createReview error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sort = "newest", rating, page = 1, limit = 10 } = req.query;

    const result = await getProductReviewsFromDB(productId, {
      sort,
      rating,
      page: Number(page),
      limit: Number(limit),
    });

    const enrichedReviews = await Promise.all(
      result.reviews.map(async (review) => {
        const user = await getUserById(review.userId);
        return {
          ...review,
          user: user ? { _id: user._id, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar } : { _id: review.userId },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        reviews: enrichedReviews,
        ratingBreakdown: result.ratingBreakdown,
        pagination: { total: result.total, page: result.page, pages: result.pages, limit: result.limit },
      },
    });
  } catch (err) {
    console.error("getProductReviews error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, title, body, images } = req.body;

    const review = await getReviewByReviewId(reviewId);
    if (!review || review.userId !== userId || review.isDeleted) {
      return res.status(404).json({ success: false, message: "Review not found or not authorized" });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const updates = {};
    if (rating) updates.rating = rating;
    if (title !== undefined) updates.title = title;
    if (body !== undefined) updates.body = body;
    if (images !== undefined) updates.images = images;

    const updated = await updateReviewInDB(review.productId, review.reviewId, updates);

    await recalcProductRating(review.productId);

    const user = await getUserById(userId);
    updated.user = user ? { _id: user._id, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar } : { _id: userId };

    return res.status(200).json({ success: true, message: "Review updated successfully", data: updated });
  } catch (err) {
    console.error("updateReview error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const review = await getReviewByReviewId(reviewId);

    if (!review || review.isDeleted) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (userRole !== "admin" && review.userId !== userId) {
      return res.status(404).json({ success: false, message: "Not authorized" });
    }

    await updateReviewInDB(review.productId, review.reviewId, {
      isDeleted: true,
      deletedBy: userRole === "admin" ? "admin" : "user",
    });

    await recalcProductRating(review.productId);

    return res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    console.error("deleteReview error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const toggleHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await getReviewByReviewId(reviewId);

    if (!review || review.isDeleted) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.userId === userId) {
      return res.status(400).json({ success: false, message: "You cannot vote on your own review" });
    }

    const helpfulVotes = review.helpfulVotes || [];
    const alreadyVoted = helpfulVotes.includes(userId);

    let updatedVotes;
    if (alreadyVoted) {
      updatedVotes = helpfulVotes.filter((id) => id !== userId);
    } else {
      updatedVotes = [...helpfulVotes, userId];
    }

    await updateReviewInDB(review.productId, review.reviewId, { helpfulVotes: updatedVotes });

    return res.status(200).json({
      success: true,
      message: alreadyVoted ? "Vote removed" : "Marked as helpful",
      data: { helpfulCount: updatedVotes.length, hasVoted: !alreadyVoted },
    });
  } catch (err) {
    console.error("toggleHelpful error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const canReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const { getAllOrders } = require("../models/dynamodb/orderModel");
    const ordersResult = await getAllOrders({ status: "delivered", page: 1, limit: 1000 });
    const deliveredOrder = ordersResult.items.find(
      (o) => o.userId === userId && o.orderStatus === "delivered" &&
        o.items.some((item) => item.product === productId)
    );

    if (!deliveredOrder) {
      return res.status(200).json({
        success: true,
        data: { canReview: false, reason: "no_purchase", message: "Purchase the product to write a review" },
      });
    }

    const existing = await getExistingReview(productId, userId);
    if (existing) {
      return res.status(200).json({
        success: true,
        data: { canReview: false, reason: "already_reviewed", message: "You have already reviewed this product", existingReview: existing },
      });
    }

    return res.status(200).json({
      success: true,
      data: { canReview: true, orderId: deliveredOrder._id, orderNumber: deliveredOrder.orderNumber },
    });
  } catch (err) {
    console.error("canReview error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getMyReviews = async (req, res) => {
  try {
    const reviews = await getUserReviews(req.user.id);

    const enriched = await Promise.all(
      reviews.map(async (review) => {
        const product = await getProductById(review.productId);
        return {
          ...review,
          product: product ? { _id: product._id, name: product.name, images: product.images, slug: product.slug } : { _id: review.productId },
        };
      })
    );

    return res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    console.error("getMyReviews error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const adminGetAllReviews = async (req, res) => {
  try {
    const { rating, page = 1, limit = 10, sort = "newest" } = req.query;

    const result = await getAllReviews({ rating, page: Number(page), limit: Number(limit), sort });

    const enriched = await Promise.all(
      result.items.map(async (review) => {
        const [user, product] = await Promise.all([
          getUserById(review.userId),
          getProductById(review.productId),
        ]);
        return {
          ...review,
          user: user ? { _id: user._id, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar, email: user.email } : { _id: review.userId },
          product: product ? { _id: product._id, name: product.name, images: product.images, slug: product.slug } : { _id: review.productId },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: { total: result.total, page: result.page, pages: result.pages, limit: result.limit },
    });
  } catch (err) {
    console.error("adminGetAllReviews error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const vendorGetProductReviews = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { rating, page = 1, limit = 10, sort = "newest" } = req.query;

    const vendorProducts = await getProductsByVendor(vendorId, { limit: 1000 });
    const productIds = vendorProducts.items.map((p) => p._id);

    const result = await getVendorProductReviews(productIds, {
      rating,
      page: Number(page),
      limit: Number(limit),
      sort,
    });

    const enriched = await Promise.all(
      result.items.map(async (review) => {
        const [user, product] = await Promise.all([
          getUserById(review.userId),
          getProductById(review.productId),
        ]);
        return {
          ...review,
          user: user ? { _id: user._id, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar } : { _id: review.userId },
          product: product ? { _id: product._id, name: product.name, images: product.images, slug: product.slug } : { _id: review.productId },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enriched,
      ratingBreakdown: result.ratingBreakdown,
      pagination: { total: result.total, page: result.page, pages: result.pages, limit: result.limit },
    });
  } catch (err) {
    console.error("vendorGetProductReviews error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  toggleHelpful,
  canReview,
  getMyReviews,
  adminGetAllReviews,
  vendorGetProductReviews,
};
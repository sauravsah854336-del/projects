const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, body } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      orderStatus: "delivered",
      "items.product": productId,
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: "You can only review products from delivered orders",
      });
    }

    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
      isDeleted: false,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const images = req.body.images || [];

    const review = await Review.create({
      product: productId,
      user: userId,
      order: orderId,
      rating,
      title: title || "",
      body: body || "",
      images,
      isVerifiedPurchase: true,
    });

    await Review.recalcProductRating(productId);

    const populated = await Review.findById(review._id).populate(
      "user",
      "firstName lastName avatar"
    );

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: populated,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sort = "newest", rating, page = 1, limit = 10 } = req.query;

    const filter = {
      product: productId,
      isDeleted: false,
    };

    if (rating) {
      filter.rating = Number(rating);
    }

    let sortOption = {};
    if (sort === "newest") sortOption = { createdAt: -1 };
    else if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "highest") sortOption = { rating: -1 };
    else if (sort === "lowest") sortOption = { rating: 1 };
    else if (sort === "helpful") sortOption = { helpfulVotes: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "firstName lastName avatar")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(filter),
    ]);

    const breakdown = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdown.forEach((b) => {
      ratingBreakdown[b._id] = b.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        ratingBreakdown,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, title, body, images } = req.body;

    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
      isDeleted: false,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not authorized",
      });
    }

    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }
      review.rating = rating;
    }

    if (title !== undefined) review.title = title;
    if (body !== undefined) review.body = body;
    if (images !== undefined) review.images = images;

    await review.save();
    await Review.recalcProductRating(review.product);

    const populated = await Review.findById(review._id).populate(
      "user",
      "firstName lastName avatar"
    );

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: populated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let review;

    if (userRole === "admin") {
      review = await Review.findOne({
        _id: reviewId,
        isDeleted: false,
      });
    } else {
      review = await Review.findOne({
        _id: reviewId,
        user: userId,
        isDeleted: false,
      });
    }

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not authorized",
      });
    }

    review.isDeleted = true;
    review.deletedBy = userRole === "admin" ? "admin" : "user";
    await review.save();
    await Review.recalcProductRating(review.product);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const toggleHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({
      _id: reviewId,
      isDeleted: false,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.user.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot vote on your own review",
      });
    }

    const alreadyVoted = review.helpfulVotes.includes(userId);

    if (alreadyVoted) {
      review.helpfulVotes = review.helpfulVotes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      review.helpfulVotes.push(userId);
    }

    await review.save();

    return res.status(200).json({
      success: true,
      message: alreadyVoted ? "Vote removed" : "Marked as helpful",
      data: {
        helpfulCount: review.helpfulVotes.length,
        hasVoted: !alreadyVoted,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const canReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const deliveredOrder = await Order.findOne({
      user: userId,
      orderStatus: "delivered",
      "items.product": productId,
    }).select("_id orderNumber");

    if (!deliveredOrder) {
      return res.status(200).json({
        success: true,
        data: {
          canReview: false,
          reason: "no_purchase",
          message: "Purchase the product to write a review",
        },
      });
    }

    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
      isDeleted: false,
    });

    if (existingReview) {
      return res.status(200).json({
        success: true,
        data: {
          canReview: false,
          reason: "already_reviewed",
          message: "You have already reviewed this product",
          existingReview,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        canReview: true,
        orderId: deliveredOrder._id,
        orderNumber: deliveredOrder.orderNumber,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await Review.find({
      user: userId,
      isDeleted: false,
    })
      .populate("product", "name images slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const adminGetAllReviews = async (req, res) => {
  try {
    const { rating, page = 1, limit = 10, sort = "newest" } = req.query;

    const filter = { isDeleted: false };
    if (rating) filter.rating = Number(rating);

    let sortOption = {};
    if (sort === "newest") sortOption = { createdAt: -1 };
    else if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "highest") sortOption = { rating: -1 };
    else if (sort === "lowest") sortOption = { rating: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "firstName lastName avatar email")
        .populate("product", "name images slug")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const vendorGetProductReviews = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { rating, page = 1, limit = 10, sort = "newest" } = req.query;

    const vendorProducts = await Product.find({
      vendor: vendorId,
      isDeleted: false,
    }).select("_id");

    const productIds = vendorProducts.map((p) => p._id);

    const filter = {
      product: { $in: productIds },
      isDeleted: false,
    };

    if (rating) filter.rating = Number(rating);

    let sortOption = {};
    if (sort === "newest") sortOption = { createdAt: -1 };
    else if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "highest") sortOption = { rating: -1 };
    else if (sort === "lowest") sortOption = { rating: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "firstName lastName avatar")
        .populate("product", "name images slug")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(filter),
    ]);

    const breakdown = await Review.aggregate([
      {
        $match: {
          product: { $in: productIds },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdown.forEach((b) => {
      ratingBreakdown[b._id] = b.count;
    });

    return res.status(200).json({
      success: true,
      data: reviews,
      ratingBreakdown,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
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
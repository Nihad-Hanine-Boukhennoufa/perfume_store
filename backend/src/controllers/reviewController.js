import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { updateProductRating } from "../services/productRatingService.js";

// ─── Add a review ─────────────────────────────────────────────────────────────

export const addReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // One review per user per product (also enforced by unique index on the model)
    const exists = await Review.findOne({ userId, productId });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product",
      });
    }

    const review = await Review.create({ userId, productId, rating, comment });

    await updateProductRating(productId);

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Update a review ──────────────────────────────────────────────────────────

export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating && !comment) {
      return res.status(400).json({
        success: false,
        message: "Provide rating or comment to update",
      });
    }

    // ✅ Mongoose handles string → ObjectId casting automatically in findOne;
    //    manual `new mongoose.Types.ObjectId()` casts are not needed
    const review = await Review.findOne({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    review.isEdited = true;

    await review.save();
    await updateProductRating(review.productId);

    res.status(200).json({ success: true, message: "Review updated", data: review });
  } catch (err) {
    next(err);
  }
};

// ─── Get all reviews for a product ───────────────────────────────────────────

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy } = req.query;

    const pageNumber  = Math.max(parseInt(page) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

    const sortMap = {
      highest: { rating: -1 },
      lowest:  { rating: 1  },
      oldest:  { createdAt: 1 },
    };
    const sort = sortMap[sortBy] || { createdAt: -1 };

    const [total, reviews, distribution] = await Promise.all([
      Review.countDocuments({ productId }),

      Review.find({ productId })
        .populate("userId", "name")
        .sort(sort)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),

      Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId) } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ]),
    ]);

    // Normalise to always include all 5 star levels
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(({ _id, count }) => {
      ratingDistribution[_id] = count;
    });

    res.status(200).json({
      success: true,
      data: reviews,
      ratingDistribution,
      pagination: {
        page:       pageNumber,
        limit:      limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get current user's reviews ───────────────────────────────────────────────

export const getUserReviews = async (req, res, next) => {
  try {
    const userId      = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber  = Math.max(parseInt(page) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

    const [total, reviews] = await Promise.all([
      Review.countDocuments({ userId }),
      Review.find({ userId })
        .populate("productId", "name images slug")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page:       pageNumber,
        limit:      limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Delete a review ──────────────────────────────────────────────────────────

export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // ✅ Mongoose handles string → ObjectId casting — no manual cast needed
    const review = await Review.findOne({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const productId = review.productId;
    await review.deleteOne();
    await updateProductRating(productId);

    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (err) {
    next(err);
  }
};
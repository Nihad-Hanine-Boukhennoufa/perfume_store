import Review from "../models/Review.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

// Helper function to update product rating and reviews count after adding/deleting a review
export const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: stats[0].avgRating.toFixed(1),
      reviewsCount: stats[0].totalReviews,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviewsCount: 0,
    });
  }
};

// Add a review for a product
export const addReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check if user already reviewed this product - one review per user per product
    const exists = await Review.findOne({ userId, productId });
    if (exists) {
      return res.status(400).json({ success: false, message: "You already reviewed this product" });
    }

    const review = new Review({
      userId,
      productId,
      rating,
      comment,
    });

    await review.save();
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

// Get all reviews for a product
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

// User can delete their own review
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const reviewObjectId = new mongoose.Types.ObjectId(reviewId);
    const userObjectId = new mongoose.Types.ObjectId(userId);


    const review = await Review.findOne({ _id: reviewObjectId, userId: userObjectId });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const productId = review.productId;

    await review.deleteOne();

    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      message: "Review deleted",
    });
  } catch (err) {
    next(err);
  }
};



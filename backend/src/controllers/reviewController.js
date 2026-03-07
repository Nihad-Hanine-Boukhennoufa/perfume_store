import Review from "../models/Review.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import { updateProductRating } from "../services/productRatingService.js";

// Add a review to a product 
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

    const review = await Review.create({
      userId,
      productId,
      rating,
      comment,
    });
    
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

// Update a review 

export const updateReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        if (!rating && !comment) {
            return res.status(400).json({ success: false, message: "Provide rating or comment to update" });
        }

        const review = await Review.findOne({
            _id: new mongoose.Types.ObjectId(reviewId),
            userId: new mongoose.Types.ObjectId(userId)
        });

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

//  Get all reviews for a product — Get paginated reviews + rating distribution
export const getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sortBy } = req.query;

        const pageNumber = Math.max(parseInt(page) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

        const sortMap = {
            highest: { rating: -1 },
            lowest: { rating: 1 },
            oldest: { createdAt: 1 },
        };
        const sort = sortMap[sortBy] || { createdAt: -1 };

        const productObjectId = new mongoose.Types.ObjectId(productId);

        // Run count, paginated reviews, and rating distribution in parallel
        const [total, reviews, distribution] = await Promise.all([
            Review.countDocuments({ productId }),

            Review.find({ productId })
                .populate("userId", "name")
                .sort(sort)
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber)
                .lean(),

            // Rating distribution
            Review.aggregate([
                { $match: { productId: productObjectId } },
                { $group: { _id: "$rating", count: { $sum: 1 } } },
            ]),
        ]);

        // Normalize distribution to always have all 5 stars
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distribution.forEach(({ _id, count }) => {
            ratingDistribution[_id] = count;
        });

        res.status(200).json({
            success: true,
            data: reviews,
            ratingDistribution,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalItems: total,
            },
        });
    } catch (err) {
        next(err);
    }
};

// GET /reviews/user — Get current user's reviews
export const getUserReviews = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const pageNumber = Math.max(parseInt(page) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

        const [total, reviews] = await Promise.all([
            Review.countDocuments({ userId }),
            Review.find({ userId })
                .populate("productId", "name images slug")
                .sort({ createdAt: -1 })
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber)
                .lean()
        ]);

        res.status(200).json({
            success: true,
            data: reviews,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalItems: total,
            },
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

        const review = await Review.findOne({
            _id: new mongoose.Types.ObjectId(reviewId),
            userId: new mongoose.Types.ObjectId(userId),
        });

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

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

  const update = stats.length > 0
    ? { rating: parseFloat(stats[0].avgRating.toFixed(1)), reviewsCount: stats[0].totalReviews }
    : { rating: 0, reviewsCount: 0 };

  await Product.findByIdAndUpdate(productId, update);
};
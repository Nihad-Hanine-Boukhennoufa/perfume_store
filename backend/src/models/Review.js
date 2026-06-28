import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // ✅ required by reviewController.updateReview — must exist or Mongoose
    //    silently drops it in strict mode
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Fast lookup of all reviews for a product (getProductReviews, updateProductRating)
reviewSchema.index({ productId: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
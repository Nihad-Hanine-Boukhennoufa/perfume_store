import express from "express";
import {
  addReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { addReviewSchema, updateReviewSchema } from "../validators/reviewValidator.js";

const router = express.Router();

router.post("/", verifyToken, validate(addReviewSchema), addReview);
router.patch("/:reviewId", verifyToken, validate(updateReviewSchema), updateReview);
router.get("/product/:productId", getProductReviews);       
router.get("/user", verifyToken, getUserReviews);
router.delete("/:reviewId", verifyToken, deleteReview);

export default router;

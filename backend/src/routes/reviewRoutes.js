import express from "express";
import {
  addReview,
  getProductReviews,
  deleteReview,
} from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addReview);
router.get("/:productId", getProductReviews);
router.delete("/:reviewId", verifyToken, deleteReview);

export default router;

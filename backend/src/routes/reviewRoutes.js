import express from "express";
import {
  addReview,
  getProductReviews,
  deleteReview,
} from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addReview);
router.patch("/:reviewId", authMiddleware, updateReview);
router.get("/product/:productId", getProductReviews);       // public
router.get("/user", authMiddleware, getUserReviews);
router.delete("/:reviewId", authMiddleware, deleteReview);

export default router;

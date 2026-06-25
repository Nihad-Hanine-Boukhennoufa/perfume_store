import express from "express";
import {
  addReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addReview);
router.patch("/:reviewId", verifyToken, updateReview);
router.get("/product/:productId", getProductReviews);       // public
router.get("/user", verifyToken, getUserReviews);
router.delete("/:reviewId", verifyToken, deleteReview);

export default router;

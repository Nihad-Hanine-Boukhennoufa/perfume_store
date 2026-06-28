import express from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../controllers/wishlistController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addToWishlist);
router.get("/", verifyToken, getWishlist);

// ✅ FIX: clearWishlist (DELETE /) must be registered BEFORE removeFromWishlist
//         (DELETE /:productId) — Express matches routes top-down and
//         /:productId would shadow "/" if it came first
router.delete("/", verifyToken, clearWishlist);
router.delete("/:productId", verifyToken, removeFromWishlist);

export default router;
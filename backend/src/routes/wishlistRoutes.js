import express from "express";
import { addToWishlist, getWishlist, removeFromWishlist, clearWishlist } from "../controllers/wishlistController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addToWishlist);
router.get("/", verifyToken, getWishlist);
router.delete("/:productId", verifyToken, removeFromWishlist);
router.delete("/", verifyToken, clearWishlist);

export default router;

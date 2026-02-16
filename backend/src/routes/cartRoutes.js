import express from "express";
import { addToCart, getCart, removeFromCart, clearCart, updateCartItem } from "../controllers/cartController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addToCart);
router.get("/", verifyToken, getCart);
router.put("/:productId", verifyToken, updateCartItem);
router.delete("/:productId", verifyToken, removeFromCart);
router.delete("/", verifyToken, clearCart);

export default router;

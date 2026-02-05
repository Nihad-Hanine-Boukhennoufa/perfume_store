import express from "express";
import { addToCart, getCart, removeFromCart, clearCart } from "../controllers/cartController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addToCart);
router.get("/", verifyToken, getCart);
router.delete("/:productId", verifyToken, removeFromCart);
router.delete("/", verifyToken, clearCart);

export default router;

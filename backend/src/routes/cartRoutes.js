import express from "express";
import { addToCart, getCart, removeFromCart } from "../controllers/cartController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/addToCart", verifyToken, addToCart);
router.get("/getCart", verifyToken, getCart);
router.delete("/removeFromCart/:productId", verifyToken, removeFromCart);

export default router;

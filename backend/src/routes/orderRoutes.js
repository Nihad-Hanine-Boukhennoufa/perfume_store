import express from "express";
import { createOrder, getMyOrders, getAllOrders } from "../controllers/orderController.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createOrder);
router.get("/myOrders", verifyToken, getMyOrders);
router.get("/orders", verifyToken, verifyAdmin, getAllOrders);

export default router;
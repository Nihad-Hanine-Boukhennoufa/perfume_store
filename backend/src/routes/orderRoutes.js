import express from "express";
import { createOrder, getMyOrders, getAllOrders, cancelOrder } from "../controllers/orderController.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createOrder);
router.get("/myOrders", verifyToken, getMyOrders);
router.get("/", verifyToken, verifyAdmin, getAllOrders);
router.patch("/:orderId/cancel", verifyToken, cancelOrder);


export default router;
import express from "express";
import { createOrder, getMyOrders, getAllOrders, cancelOrder, adminUpdateOrderStatus,adminDeleteOrder } from "../controllers/orderController.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createOrder);
router.get("/myOrders", verifyToken, getMyOrders);
router.get("/", verifyToken, verifyAdmin, getAllOrders);
router.put("/cancel/:orderId", verifyToken, cancelOrder);
router.put("/updateStatus/:orderId", verifyToken, verifyAdmin, adminUpdateOrderStatus);
router.delete("/delete/:orderId", verifyToken, verifyAdmin, adminDeleteOrder);


export default router;
import express from "express";
import { createOrder, getMyOrders, getAllOrders } from "../controllers/orderController.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/createOrder", verifyToken, createOrder);
router.get("/getMyOrders", verifyToken, getMyOrders);
router.get("/getAllOrders", verifyToken, verifyAdmin, getAllOrders);

export default router;
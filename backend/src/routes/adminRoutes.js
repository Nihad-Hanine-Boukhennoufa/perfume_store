import express from "express";
import { getDashboardStats } from "../controllers/adminController.js";
import {
  getAllOrders,
  adminUpdateOrderStatus,
  adminDeleteOrder,
} from "../controllers/orderController.js";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} from "../controllers/userController.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../middleware/upload.js";

const router = express.Router();

// All routes in this file are protected and restricted to admins
router.use(verifyToken, verifyAdmin);

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get("/dashboard", getDashboardStats);

// ── Orders ───────────────────────────────────────────────────────────────────
router.get("/orders", getAllOrders);
router.patch("/orders/:orderId/status", adminUpdateOrderStatus);
router.delete("/orders/:orderId", adminDeleteOrder);

// ── Users ────────────────────────────────────────────────────────────────────
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

export default router;
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { getTotalRevenue, getRevenueByMonth } from "../services/transactionService.js";


export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue,
      revenueByMonth,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      // ── Counts ─────────────────────────────────────────────────────────────
      Product.countDocuments(),
      User.countDocuments({ role: "user" }),
      Order.countDocuments(),

      // ── Revenue from Transactions (single source of truth) ──────────────────
      getTotalRevenue(),
      getRevenueByMonth(12),

      // ── Last 5 orders for the "Recent Orders" widget ────────────────────────
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("items.productId", "name price image")
        .lean(),

      // ── Low stock products for the alert widget (stock <= 10) ───────────────
      Product.find({ stock: { $lte: 10 } })
        .select("name stock")
        .sort({ stock: 1 })
        .limit(10)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue,
        revenueByMonth,
        recentOrders,
        lowStockProducts,
      },
    });
  } catch (err) {
    next(err);
  }
};
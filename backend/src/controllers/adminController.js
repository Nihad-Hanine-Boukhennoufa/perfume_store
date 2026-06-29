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
      Product.countDocuments(),
      User.countDocuments({ role: "user" }),
      Order.countDocuments(),

      getTotalRevenue(),
      getRevenueByMonth(12),

      
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("items.productId", "name variants images")
        .lean(),

      Product.find({
        variants: { $elemMatch: { stock: { $lte: 10 } } },
      })
        .select("name variants")
        .sort({ createdAt: -1 })
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
import express from "express";
import cors from "cors";
import productRoutes  from "./routes/productRoutes.js";
import authRoutes     from "./routes/authRoutes.js";
import userRoutes     from "./routes/userRoutes.js";
import cartRoutes     from "./routes/cartRoutes.js";
import orderRoutes    from "./routes/orderRoutes.js";
import adminRoutes    from "./routes/adminRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import reviewRoutes   from "./routes/reviewRoutes.js";
import brandRoutes    from "./routes/brandRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// ─── Core middleware ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth",     authRoutes);
app.use("/users",    userRoutes);
app.use("/products", productRoutes);
app.use("/brands",   brandRoutes);
app.use("/cart",     cartRoutes);
app.use("/orders",   orderRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/reviews",  reviewRoutes);
app.use("/admin",    adminRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
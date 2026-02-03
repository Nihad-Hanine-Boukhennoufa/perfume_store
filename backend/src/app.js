import express from "express";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/products", productRoutes);
app.use("/auth", authRoutes);

export default app;

import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// Add product to Wishlist
export const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) return res.status(400).json({ success: false, message: "ProductId is required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    const exists = wishlist.items.some(item => item.productId.toString() === productId);
    if (exists) return res.status(400).json({ success: false, message: "Product already in wishlist" });

    wishlist.items.push({ productId });
    await wishlist.save();

    res.status(200).json({ success: true, data: wishlist, message: "Product added to wishlist" });
  } catch (err) {
    next(err);
  }
};

// Get Wishlist products
export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishlist = await Wishlist.findOne({ userId }).populate("items.productId", "name price image");

    if (!wishlist) return res.status(200).json({ success: true, data: [], message: "Wishlist empty" });

    res.status(200).json({ success: true, data: wishlist.items });
  } catch (err) {
    next(err);
  }
};

// Remove product from Wishlist
export const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) return res.status(404).json({ success: false, message: "Wishlist not found" });

    const originalLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);

    if (wishlist.items.length === originalLength) 
      return res.status(400).json({ success: false, message: "Product not in wishlist" });

    await wishlist.save();

    res.status(200).json({ success: true, data: wishlist, message: "Product removed from wishlist" });
  } catch (err) {
    next(err);
  }
};

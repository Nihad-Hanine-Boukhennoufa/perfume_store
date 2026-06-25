import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Fix: images (plural, Cloudinary array) + nested brand populate + useful fields.
const PRODUCT_SELECT = "name price images stock concentration gender";
const BRAND_POPULATE = { path: "brand", select: "name" };

const populateWishlist = (wishlist) =>
  wishlist.populate({
    path:     "items.productId",
    select:   PRODUCT_SELECT,
    populate: BRAND_POPULATE,
  });

// ─── Add product to wishlist ──────────────────────────────────────────────────

export const addToWishlist = async (req, res, next) => {
  try {
    const userId    = req.user.id;
    const { productId } = req.body;

    if (!productId)
      return res.status(400).json({ success: false, message: "ProductId is required" });

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) wishlist = new Wishlist({ userId, items: [] });

    const exists = wishlist.items.some(
      (item) => item.productId.toString() === productId
    );
    if (exists)
      return res.status(400).json({ success: false, message: "Product already in wishlist" });

    wishlist.items.push({ productId });
    await wishlist.save();

    res.status(200).json({ success: true, message: "Product added to wishlist" });
  } catch (err) {
    next(err);
  }
};

// ─── Get wishlist ─────────────────────────────────────────────────────────────

export const getWishlist = async (req, res, next) => {
  try {
    const userId    = req.user.id;
    const wishlist  = await Wishlist.findOne({ userId });

    // Fix: empty wishlist is valid — return [] instead of 404
    if (!wishlist)
      return res.status(200).json({ success: true, data: [] });

    const populated = await populateWishlist(wishlist);
    res.status(200).json({ success: true, data: populated.items });
  } catch (err) {
    next(err);
  }
};

// ─── Remove product from wishlist ─────────────────────────────────────────────

export const removeFromWishlist = async (req, res, next) => {
  try {
    const userId        = req.user.id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist)
      return res.status(404).json({ success: false, message: "Wishlist not found" });

    const originalLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId
    );

    if (wishlist.items.length === originalLength)
      return res.status(400).json({ success: false, message: "Product not in wishlist" });

    await wishlist.save();
    res.status(200).json({ success: true, message: "Product removed from wishlist" });
  } catch (err) {
    next(err);
  }
};

// ─── Clear all products from wishlist ────────────────────────────────────────

export const clearWishlist = async (req, res, next) => {
  try {
    const userId   = req.user.id;
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist)
      return res.status(404).json({ success: false, message: "Wishlist not found" });

    wishlist.items = [];
    await wishlist.save();

    res.status(200).json({ success: true, message: "Wishlist has been cleared" });
  } catch (err) {
    next(err);
  }
};
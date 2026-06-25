import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Fix: images (plural, Cloudinary array) + nested brand populate + stock field.
// brand is an ObjectId ref so we must populate it separately to get the name.
const PRODUCT_SELECT  = "name price images stock concentration gender";
const BRAND_POPULATE  = { path: "brand", select: "name" };

const populateCart = (cart) =>
  cart.populate({
    path:     "items.productId",
    select:   PRODUCT_SELECT,
    populate: BRAND_POPULATE,
  });

// ─── Add item to cart ─────────────────────────────────────────────────────────

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || quantity < 1)
      return res.status(400).json({ success: false, message: "Invalid product or quantity" });

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    // Fix: reject out-of-stock products upfront
    if (product.stock === 0)
      return res.status(400).json({ success: false, message: `${product.name} is out of stock` });

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;

      // Fix: validate combined quantity against available stock
      if (newQuantity > product.stock)
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} unit(s) of "${product.name}" available`,
        });

      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].price    = product.price;
    } else {
      // Fix: validate initial quantity against available stock
      if (quantity > product.stock)
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} unit(s) of "${product.name}" available`,
        });

      cart.items.push({ productId, quantity, price: product.price });
    }

    await cart.save();
    const populatedCart = await populateCart(cart);

    res.status(200).json({ success: true, data: populatedCart });
  } catch (err) {
    next(err);
  }
};

// ─── Update quantity of a cart item ──────────────────────────────────────────

export const updateCartItem = async (req, res, next) => {
  try {
    const userId             = req.user.id;
    const { productId }      = req.params;
    const { quantity }       = req.body;

    if (quantity < 1)
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });

    const cart = await Cart.findOne({ userId });
    if (!cart)
      return res.status(404).json({ success: false, message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (itemIndex === -1)
      return res.status(404).json({ success: false, message: "Product not in cart" });

    // Fix: validate new quantity against live stock
    const product = await Product.findById(productId).select("stock name");
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    if (quantity > product.stock)
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) of "${product.name}" available`,
      });

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const populatedCart = await populateCart(cart);
    res.status(200).json({ success: true, data: populatedCart });
  } catch (err) {
    next(err);
  }
};

// ─── Get user cart ────────────────────────────────────────────────────────────

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    // Fix: empty cart is a valid state — return an empty cart object instead
    // of 404, which causes the frontend query to throw unnecessarily.
    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { userId: req.user.id, items: [] },
      });
    }

    const populatedCart = await populateCart(cart);
    res.status(200).json({ success: true, data: populatedCart });
  } catch (err) {
    next(err);
  }
};

// ─── Remove item from cart ────────────────────────────────────────────────────

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId        = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart)
      return res.status(404).json({ success: false, message: "Cart not found" });

    const originalLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    if (cart.items.length === originalLength)
      return res.status(400).json({ success: false, message: "Product not found in cart" });

    await cart.save();
    const populatedCart = await populateCart(cart);

    res.status(200).json({ success: true, data: populatedCart });
  } catch (err) {
    next(err);
  }
};

// ─── Clear all items from cart ────────────────────────────────────────────────

export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart)
      return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = [];
    await cart.save();

    res.status(200).json({ success: true, message: "Cart has been cleared", data: cart });
  } catch (err) {
    next(err);
  }
};
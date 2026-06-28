import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ✅ FIX 1: removed "price" and "stock" from select — they don't exist at the root
//           level on Product. Stock and price live inside variants[].
const PRODUCT_SELECT = "name variants images concentration gender";
const BRAND_POPULATE = { path: "brand", select: "name" };

const populateCart = (cart) =>
  cart.populate({
    path: "items.productId",
    select: PRODUCT_SELECT,
    populate: BRAND_POPULATE,
  });

// ✅ FIX 2: helper to find the right variant by volume and validate stock
const getVariant = (product, volume) => {
  const variant = product.variants.find((v) => v.volume === Number(volume));
  return variant || null;
};

// ─── Add item to cart ─────────────────────────────────────────────────────────

export const addToCart = async (req, res, next) => {
  try {
    // ✅ FIX 3: require volume so we know which variant to use
    const { productId, quantity, volume } = req.body;
    const userId = req.user.id;

    if (!productId || !volume || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "productId, volume, and a valid quantity are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // ✅ FIX 4: look up the variant by volume
    const variant = getVariant(product, volume);
    if (!variant) {
      return res.status(400).json({
        success: false,
        message: `Volume ${volume}ml is not available for this product`,
      });
    }

    if (!variant.isAvailable || variant.stock === 0) {
      return res.status(400).json({
        success: false,
        message: `${product.name} (${volume}ml) is out of stock`,
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    // Match by both productId AND volume so different sizes are separate cart lines
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.volume === Number(volume)
    );

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;

      if (newQuantity > variant.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stock} unit(s) of "${product.name}" (${volume}ml) available`,
        });
      }

      cart.items[itemIndex].quantity = newQuantity;
      // Keep price in sync in case it changed since item was added
      cart.items[itemIndex].price = variant.price;
    } else {
      if (quantity > variant.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stock} unit(s) of "${product.name}" (${volume}ml) available`,
        });
      }

      // ✅ FIX 5: store volume alongside productId so the cart line is unambiguous
      cart.items.push({
        productId,
        volume: Number(volume),
        quantity,
        price: variant.price,
      });
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
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity, volume } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    if (!volume) {
      return res.status(400).json({
        success: false,
        message: "volume is required to identify the cart item",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    // ✅ FIX 6: match on both productId and volume
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.volume === Number(volume)
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    // ✅ FIX 7: validate against variant stock, not product.stock
    const product = await Product.findById(productId).select("variants name");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const variant = getVariant(product, volume);
    if (!variant) {
      return res.status(400).json({
        success: false,
        message: `Volume ${volume}ml is not available for this product`,
      });
    }

    if (quantity > variant.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.stock} unit(s) of "${product.name}" (${volume}ml) available`,
      });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = variant.price;

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
    // ✅ FIX 8: volume comes from query string since DELETE has no body by convention
    const { volume } = req.query;
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const originalLength = cart.items.length;

    cart.items = cart.items.filter((item) => {
      const sameProduct = item.productId.toString() === productId;
      // If volume is provided, remove only that variant; otherwise remove all variants
      const sameVolume = volume ? item.volume === Number(volume) : true;
      return !(sameProduct && sameVolume);
    });

    if (cart.items.length === originalLength) {
      return res.status(400).json({
        success: false,
        message: "Product not found in cart",
      });
    }

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
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart has been cleared",
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};
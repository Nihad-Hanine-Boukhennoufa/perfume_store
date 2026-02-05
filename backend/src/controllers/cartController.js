import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Add item to cart
export const addToCart = async (req, res, next) => {

  try {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  if (!productId || quantity < 1)
      return res.status(400).json({ success: false, message: "Invalid product or quantity" });

  
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });


    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].price = product.price;
    } else {
      cart.items.push({ 
        productId, 
        quantity, 
        price: product.price });
    }

    await cart.save();
    const populatedCart = await cart.populate({
  path: "items.productId",
  select: "name brand price image"
});


    res.status(200).json({ success: true, data: populatedCart });
  } catch (err) {
    next(err);
  }
};


// Get user cart

export const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate("items.productId", "name brand price image");
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

// Remove item from cart
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const originalLength = cart.items.length;
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    if (cart.items.length === originalLength)
      return res.status(400).json({ success: false, message: "Product not found in cart" });

    await cart.save();
    const populatedCart = await cart.populate("items.productId", "name brand price image");

    res.status(200).json({ success: true, data: populatedCart });
  } catch (err) {
    next(err);
  }
};
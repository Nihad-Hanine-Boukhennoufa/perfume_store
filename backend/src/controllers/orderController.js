import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { buyNowProductId, buyNowQuantity, selectedItems, buyAll } = req.body;
    const userId = req.user.id;

    let items = [];

    // Buy Now
    if (buyNowProductId) {
      const product = await Product.findById(buyNowProductId);
      if (!product) return res.status(404).json({ message: "Product not found" });

      if (buyNowQuantity > product.stock)
        return res.status(400).json({
          message: `Not enough stock for ${product.name}. Available: ${product.stock}`,
        });

      items.push({
        productId: product._id,
        quantity: buyNowQuantity || 1,
        price: product.price,
      });

    // Buy selected items from cart
    } else if (selectedItems && selectedItems.length > 0) {
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      if (!cart || cart.items.length === 0)
        return res.status(400).json({ message: "Cart is empty" });

      for (const selected of selectedItems) {
        const cartItem = cart.items.find(
          (item) => item.productId._id.toString() === selected.productId
        );
        if (cartItem) {
          if (selected.quantity > cartItem.productId.stock) {
            return res.status(400).json({ message: `Not enough stock for ${cartItem.productId.name}. Available: ${cartItem.productId.stock}` });
          }
          items.push({
            productId: cartItem.productId._id,
            quantity: selected.quantity || cartItem.quantity,
            price: cartItem.productId.price,
          });
        }
      }

      if (items.length === 0)
        return res.status(400)
        .json({ message: "Selected products not found in cart" });

      // Remove ordered items from cart
      cart.items = cart.items.filter(
        (item) => !items.some(
          (i) => i.productId.toString() === item.productId._id.toString()
        )
      );
      await cart.save();

    // Buy all items from cart
    } else if (buyAll === true) {
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      if (!cart || cart.items.length === 0)
        return res.status(400).json({ message: "Cart is empty" });

      for (const item of cart.items) {
        if (item.quantity > item.productId.stock)
          return res.status(400).json({
            message: `Not enough stock for ${item.productId.name}. Available: ${item.productId.stock}`,
          });
      }

      items = cart.items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
      }));

      // Clear the cart
      cart.items = [];
      await cart.save();

    } else {
      return res.status(400).json({ message: "No products selected for order" });
    }

    // update product stock 
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId, stock: { $gte: item.quantity } }, // شرط لمنع السالب
        update: { $inc: { stock: -item.quantity } },
      },
    }));

    const result = await Product.bulkWrite(bulkOps);


if (result.modifiedCount !== items.length) {
  return res.status(400).json({ message: "Not enough stock for some products" });
}

    // calculate total
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // create order
    const order = new Order({
      userId,
      items,
      total,
    });

    await order.save();
    
    res.status(201).json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




export const getMyOrders = async (req, res) => {
  try {

    const { status } = req.query; 
    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    const orders = await Order.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .populate("items.productId");
    res.status(200).json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const getAllOrders = async (req, res) => {
  try {

    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("items.productId");

    res.status(200).json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

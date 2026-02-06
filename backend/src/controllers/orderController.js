import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Create order
export const createOrder = async (req, res, next) => {
  try {
    const { buyNowProductId, buyNowQuantity, selectedItems, buyAll } = req.body;
    const userId = req.user.id;

    let items = [];

    // Buy Now
    if (buyNowProductId) {
      const product = await Product.findById(buyNowProductId);
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });

      const quantity = buyNowQuantity || 1;
      if (quantity > product.stock)
        return res.status(400).json({
          success: false,
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
        return res.status(400).json({ success: false, message: "Cart is empty" });

      for (const sel of selectedItems) {

        if (!sel.productId || sel.quantity < 1) continue;

        const cartItem = cart.items.find(
          (item) => item.productId._id.toString() === sel.productId
        );
        if (!cartItem) continue;
        if (cartItem) {
          if (sel.quantity > cartItem.productId.stock)
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${cartItem.productId.name}. Available: ${cartItem.productId.stock}`,
          });
          items.push({
            productId: cartItem.productId._id,
            quantity: sel.quantity || cartItem.quantity,
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
        return res.status(400).json({ success: false, message: "Cart is empty" });

      for (const item of cart.items) {
        if (item.quantity > item.productId.stock)
          return res.status(400).json({
            success: false,
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
      return res.status(400).json({success: false, message: "No products selected for order" });
    }

    // update product stock 
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId, stock: { $gte: item.quantity } },
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
    
    
    res.status(201).json({ success: true, data: order, message: "Order created successfully" });
  } catch (err) {
    next(err);
  }
};




export const getMyOrders = async (req, res, next) => {
  try {

    const { status } = req.query; 
    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    const orders = await Order.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .populate("items.productId", "name price image")
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (err) { next(err); }
};



export const getAllOrders = async (req, res, next) => {
  try {

    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("items.productId", "name price image");

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });

  } catch (err) { next(err); }
};


// User can cancel order if it's still pending
export const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel this order",
      });
    }

    // Restore product stock
    const bulkOps = order.items.map(item => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { stock: item.quantity } },
      }
    }));

    await Product.bulkWrite(bulkOps);

    // Update order status to cancelled  
    order.status = "cancelled";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order
    });

  } catch (err) {
    next(err);
  }
};

// Admin can update order status
export const adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { newStatus } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!['pending', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    order.status = newStatus;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      data: order
    });

  } catch (err) {
    next(err);
  }
};

// Admin can delete order if it's delivered or cancelled
export const adminDeleteOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Can only delete delivered or cancelled orders"
      });
    }

    await order.deleteOne();

    res.status(200).json({
      success: true,
      message: "Order deleted permanently"
    });

  } catch (err) {
    next(err);
  }
};

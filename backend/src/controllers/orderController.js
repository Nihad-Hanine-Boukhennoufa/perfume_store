import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { createTransaction } from "../services/transactionService.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const VALID_STATUSES      = ["pending", "shipped", "delivered", "cancelled"];
const FINALIZED_STATUS    = "delivered";
const STOCK_HELD_STATUSES = ["pending", "shipped"];

// ─── Populate helper ──────────────────────────────────────────────────────────
const populateOrders = (query) =>
  query.populate({
    path:     "items.productId",
    select:   "name variants images concentration gender",
    populate: { path: "brand", select: "name" },
  });

// ─── Stock helpers (variant-aware) ───────────────────────────────────────────

// FIX: stock lives in variants[].stock — use arrayFilters to target exact variant
const decrementStock = async (items) => {
  const ops = items.map((item) => ({
    updateOne: {
      filter: {
        _id: item.productId,
        variants: { $elemMatch: { volume: item.volume, stock: { $gte: item.quantity } } },
      },
      update: { $inc: { "variants.$[v].stock": -item.quantity } },
      arrayFilters: [{ "v.volume": item.volume }],
    },
  }));

  const result = await Product.bulkWrite(ops);
  return result.modifiedCount === items.length;
};

const restoreStock = async (items) => {
  const ops = items.map((item) => ({
    updateOne: {
      filter: { _id: item.productId },
      update: { $inc: { "variants.$[v].stock": item.quantity } },
      arrayFilters: [{ "v.volume": item.volume }],
    },
  }));

  await Product.bulkWrite(ops);
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const getVariant = (product, volume) =>
  product.variants.find((v) => v.volume === Number(volume)) || null;

// ─── Create order ─────────────────────────────────────────────────────────────

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { buyNowProductId, buyNowVolume, buyNowQuantity, selectedItems, buyAll } = req.body;

    let items      = [];
    let cartToSave = null;

    if (buyNowProductId) {
      if (!buyNowVolume) {
        return res.status(400).json({ success: false, message: "buyNowVolume is required" });
      }

      const product = await Product.findById(buyNowProductId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      const variant = getVariant(product, buyNowVolume);
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Volume ${buyNowVolume}ml is not available for this product`,
        });
      }

      const quantity = Math.max(parseInt(buyNowQuantity) || 1, 1);

      if (!variant.isAvailable || quantity > variant.stock) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name} (${buyNowVolume}ml). Available: ${variant.stock}`,
        });
      }

      items.push({ productId: product._id, volume: Number(buyNowVolume), quantity, price: variant.price });

    } else if (selectedItems?.length > 0) {
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }

      for (const sel of selectedItems) {
        if (!sel.productId || !sel.volume) continue;

        const cartItem = cart.items.find(
          (item) =>
            item.productId._id.toString() === sel.productId &&
            item.volume === Number(sel.volume)
        );
        if (!cartItem) continue;

        const variant  = getVariant(cartItem.productId, sel.volume);
        if (!variant) continue;

        const quantity = sel.quantity || cartItem.quantity;

        if (quantity > variant.stock) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${cartItem.productId.name} (${sel.volume}ml). Available: ${variant.stock}`,
          });
        }

        items.push({
          productId: cartItem.productId._id,
          volume:    Number(sel.volume),
          quantity,
          price:     variant.price,
        });
      }

      if (items.length === 0) {
        return res.status(400).json({ success: false, message: "Selected products not found in cart" });
      }

      cart.items = cart.items.filter(
        (item) =>
          !items.some(
            (i) =>
              i.productId.toString() === item.productId._id.toString() &&
              i.volume === item.volume
          )
      );
      cartToSave = cart;

    } else if (buyAll === true) {
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }

      for (const item of cart.items) {
        const variant = getVariant(item.productId, item.volume);
        if (!variant) {
          return res.status(400).json({
            success: false,
            message: `Volume ${item.volume}ml is no longer available for ${item.productId.name}`,
          });
        }

        if (item.quantity > variant.stock) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${item.productId.name} (${item.volume}ml). Available: ${variant.stock}`,
          });
        }

        items.push({ productId: item.productId._id, volume: item.volume, quantity: item.quantity, price: variant.price });
      }

      cart.items = [];
      cartToSave = cart;

    } else {
      return res.status(400).json({ success: false, message: "No products selected for order" });
    }

    const stockOk = await decrementStock(items);
    if (!stockOk) {
      return res.status(400).json({ success: false, message: "Not enough stock for one or more products" });
    }

    if (cartToSave) await cartToSave.save();

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({ userId, items, total });

    res.status(201).json({ success: true, data: order, message: "Order created successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── Get my orders ────────────────────────────────────────────────────────────

export const getMyOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    const orders = await populateOrders(Order.find(filter).sort({ createdAt: -1 }));
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// ─── Get all orders (admin) ───────────────────────────────────────────────────

export const getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await populateOrders(Order.find(filter).sort({ createdAt: -1 }));
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
};

// ─── User cancel order ────────────────────────────────────────────────────────

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending orders can be cancelled" });
    }

    await restoreStock(order.items);
    order.status = "cancelled";
    await order.save();

    res.status(200).json({ success: true, message: "Order cancelled successfully", data: order });
  } catch (err) {
    next(err);
  }
};

// ─── Admin update order status ────────────────────────────────────────────────

export const adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const { orderId }   = req.params;
    const { newStatus } = req.body;

    if (!VALID_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === FINALIZED_STATUS) {
      return res.status(400).json({ success: false, message: "Delivered orders cannot be changed" });
    }

    const previousStatus = order.status;

    if (newStatus === "cancelled" && STOCK_HELD_STATUSES.includes(previousStatus)) {
      await restoreStock(order.items);
    }

    order.status = newStatus;
    await order.save();

    if (newStatus === FINALIZED_STATUS) {
      createTransaction({ order: order._id, user: order.userId, amount: order.total }).catch((err) => {
        console.error(`[TransactionService] Failed for order ${order._id}:`, err.message);
      });
    }

    res.status(200).json({ success: true, message: `Order status updated to ${newStatus}`, data: order });
  } catch (err) {
    next(err);
  }
};

// ─── Admin delete order ───────────────────────────────────────────────────────

export const adminDeleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!["delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({ success: false, message: "Can only delete delivered or cancelled orders" });
    }

    await order.deleteOne();
    res.status(200).json({ success: true, message: "Order deleted permanently" });
  } catch (err) {
    next(err);
  }
};
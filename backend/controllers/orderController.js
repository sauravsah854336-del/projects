const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");

const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORD-${timestamp}-${random}`;
};

const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = "cod", notes = "" } = req.body;

    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.street ||
        !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.postalCode) {
      return res.status(400).json({ success: false, message: "Complete shipping address is required" });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id).populate("vendorStore", "storeName");

      if (!product || product.status !== "approved" || product.isDeleted || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.name}" is no longer available`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0]?.url || "",
        price: product.price,
        quantity: item.quantity,
        vendor: product.vendor,
        storeName: product.vendorStore?.storeName || "",
      });

      subtotal += product.price * item.quantity;
    }

    const discount = cart.coupon?.discount || 0;
    const shippingCharge = 0;
    const total = subtotal - discount + shippingCharge;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "confirmed",
      subtotal,
      discount,
      shippingCharge,
      total,
      notes,
      confirmedAt: new Date(),
    });

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, totalSold: item.quantity },
      });
    }

    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], totalItems: 0, subtotal: 0, total: 0, coupon: { code: "", discount: 0, discountType: "fixed" } }
    );

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ user: req.user.id });

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (!["confirmed", "processing"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage. Contact support.",
      });
    }

    order.orderStatus = "cancelled";
    order.cancelReason = reason || "Cancelled by customer";
    order.cancelledAt = new Date();

    if (order.paymentMethod === "online" && order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
    }

    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, totalSold: -item.quantity },
      });
    }

    return res.status(200).json({ success: true, message: "Order cancelled successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const adminGetAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(filter)
      .populate("user", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders: total,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const adminCancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (["cancelled", "delivered", "refunded"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Cannot cancel this order" });
    }

    order.orderStatus = "cancelled";
    order.cancelReason = reason || "Cancelled by admin";
    order.cancelledAt = new Date();

    if (order.paymentMethod === "online" && order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
    }

    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, totalSold: -item.quantity },
      });
    }

    return res.status(200).json({ success: true, message: "Order cancelled by admin" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const vendorUpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["processing", "shipped", "out_for_delivery", "delivered", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const vendorItems = order.items.filter(
      (item) => item.vendor.toString() === req.user.id
    );

    if (vendorItems.length === 0) {
      return res.status(403).json({ success: false, message: "No items from your store in this order" });
    }

    if (status === "cancelled" && !["confirmed", "processing"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order that has already been shipped",
      });
    }

    const progression = {
      confirmed: ["processing"],
      processing: ["shipped"],
      shipped: ["out_for_delivery"],
      out_for_delivery: ["delivered"],
    };

    if (status !== "cancelled" && progression[order.orderStatus] && !progression[order.orderStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from "${order.orderStatus}" to "${status}"`,
      });
    }

    order.orderStatus = status;

    if (status === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "paid";
    }

    if (status === "cancelled") {
      order.cancelReason = req.body.reason || "Cancelled by vendor";
      order.cancelledAt = new Date();
      for (const item of vendorItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, totalSold: -item.quantity },
        });
      }
    }

    await order.save();

    return res.status(200).json({ success: true, message: "Order status updated", data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const vendorGetOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = { "items.vendor": req.user.id };
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter)
      .populate("user", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const vendorOrders = orders.map((order) => ({
      ...order.toObject(),
      items: order.items.filter((item) => item.vendor.toString() === req.user.id),
    }));

    const total = await Order.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: vendorOrders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  placeOrder, getMyOrders, getSingleOrder, cancelOrder,
  adminGetAllOrders, adminCancelOrder,
  vendorUpdateOrderStatus, vendorGetOrders,
};
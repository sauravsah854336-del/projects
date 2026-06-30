const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");
const User = require("../models/users");

const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORD-${timestamp}-${random}`;
};

const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = "cod", notes = "", country } = req.body;

    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.street ||
        !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.postalCode) {
      return res.status(400).json({ success: false, message: "Complete shipping address is required" });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const orderItems = [];
    let subtotalINR = 0;

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

      subtotalINR += product.price * item.quantity;
    }

    const discountINR = cart.coupon?.discount || 0;
    const subtotalAfterDiscountINR = subtotalINR - discountINR;

    const countryInfo = country || {
      code: "IN",
      name: "India",
      flag: "🇮🇳",
      currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
      exchangeRate: 1,
      tax: { rate: 18, label: "GST", includedInPrice: true },
      shipping: { standardCost: 0, freeShippingThreshold: 499 },
    };

    const exchangeRate = countryInfo.exchangeRate || 1;
    const subtotalLocal = subtotalINR * exchangeRate;
    const discountLocal = discountINR * exchangeRate;

    const taxRate = countryInfo.tax?.rate || 0;
    const taxIncluded = countryInfo.tax?.includedInPrice !== false;
    const taxAmount = taxIncluded ? 0 : (subtotalAfterDiscountINR * exchangeRate * taxRate) / 100;

    const freeThreshold = countryInfo.shipping?.freeShippingThreshold || 0;
    const standardShippingCost = countryInfo.shipping?.standardCost || 0;
    const shippingCostLocal = (subtotalLocal - discountLocal) >= freeThreshold ? 0 : standardShippingCost;
    const shippingCostINR = exchangeRate > 0 ? shippingCostLocal / exchangeRate : 0;

    const totalINR = subtotalAfterDiscountINR + shippingCostINR + (exchangeRate > 0 ? taxAmount / exchangeRate : 0);
    const totalLocal = totalINR * exchangeRate;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "confirmed",
      subtotal: subtotalINR,
      discount: discountINR,
      shippingCharge: shippingCostINR,
      total: totalINR,
      notes,
      confirmedAt: new Date(),
      country: {
        code: countryInfo.code || "IN",
        name: countryInfo.name || "India",
        flag: countryInfo.flag || "🇮🇳",
        currency: {
          code: countryInfo.currency?.code || "INR",
          symbol: countryInfo.currency?.symbol || "₹",
          name: countryInfo.currency?.name || "Indian Rupee",
        },
        exchangeRate: exchangeRate,
      },
      pricing: {
        subtotalINR,
        subtotalLocal,
        taxAmount,
        taxRate,
        taxLabel: countryInfo.tax?.label || "",
        taxIncluded,
        shippingCost: shippingCostLocal,
        shippingCostINR,
        discountINR,
        discountLocal,
        totalINR,
        totalLocal,
      },
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

    if (countryInfo.code) {
      await User.findByIdAndUpdate(req.user.id, {
        preferredCountry: countryInfo.code,
        preferredCurrency: countryInfo.currency?.code || "INR",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    console.error("placeOrder error:", err);
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
    console.error("getMyOrders error:", err);
    return res.status(500).json({ success: false, message: err.message });
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
    console.error("getSingleOrder error:", err);
    return res.status(500).json({ success: false, message: err.message });
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

    await Order.findByIdAndUpdate(id, {
      orderStatus: "cancelled",
      cancelReason: reason || "Cancelled by customer",
      cancelledAt: new Date(),
      ...(order.paymentMethod !== "cod" && order.paymentStatus === "paid"
        ? { paymentStatus: "refunded" }
        : {}),
    });

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, totalSold: -item.quantity },
      });
    }

    return res.status(200).json({ success: true, message: "Order cancelled successfully" });
  } catch (err) {
    console.error("cancelOrder error:", err);
    return res.status(500).json({ success: false, message: err.message });
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
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.orderNumber = { $regex: escaped, $options: "i" };
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
    console.error("adminGetAllOrders error:", err);
    return res.status(500).json({ success: false, message: err.message });
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

    await Order.findByIdAndUpdate(id, {
      orderStatus: "cancelled",
      cancelReason: reason || "Cancelled by admin",
      cancelledAt: new Date(),
      ...(order.paymentMethod !== "cod" && order.paymentStatus === "paid"
        ? { paymentStatus: "refunded" }
        : {}),
    });

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, totalSold: -item.quantity },
      });
    }

    return res.status(200).json({ success: true, message: "Order cancelled by admin" });
  } catch (err) {
    console.error("adminCancelOrder error:", err);
    return res.status(500).json({ success: false, message: err.message });
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

    const updateData = { orderStatus: status };

    if (status === "delivered") {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = "paid";
    }

    if (status === "cancelled") {
      updateData.cancelReason = req.body.reason || "Cancelled by vendor";
      updateData.cancelledAt = new Date();
      for (const item of vendorItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, totalSold: -item.quantity },
        });
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true });

    return res.status(200).json({ success: true, message: "Order status updated", data: updatedOrder });
  } catch (err) {
    console.error("vendorUpdateOrderStatus error:", err);
    return res.status(500).json({ success: false, message: err.message });
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
    console.error("vendorGetOrders error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getSingleOrder,
  cancelOrder,
  adminGetAllOrders,
  adminCancelOrder,
  vendorUpdateOrderStatus,
  vendorGetOrders,
};
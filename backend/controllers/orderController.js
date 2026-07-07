const {
  createOrder,
  getOrderById,
  getUserOrders,
  getAllOrders,
  getVendorOrders,
  updateOrder,
  getTotalRevenue,
} = require("../models/dynamodb/orderModel");
const { getOrCreateCart, saveCart } = require("../models/dynamodb/cartModel");
const { getProductById, updateProduct, incrementProductField } = require("../models/dynamodb/productModel");
const { updateUser } = require("../models/dynamodb/userModel");
const { getVendorByUserId } = require("../models/dynamodb/vendorModel");

const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORD-${timestamp}-${random}`;
};

const applyCouponUsage = async (couponCode, userId) => {
  try {
    const { getCouponByCode } = require("../models/dynamodb/couponModel");
    const { PutCommand } = require("@aws-sdk/lib-dynamodb");
    const { docClient, getTableName } = require("../config/dynamodb");

    const coupon = await getCouponByCode(couponCode);
    if (!coupon) return;

    const usedBy = coupon.usedBy || [];
    const userIndex = usedBy.findIndex((u) => (u.user || u) === userId);

    if (userIndex > -1) {
      usedBy[userIndex].usedCount = (usedBy[userIndex].usedCount || 1) + 1;
      usedBy[userIndex].lastUsedAt = new Date().toISOString();
    } else {
      usedBy.push({ user: userId, usedCount: 1, lastUsedAt: new Date().toISOString() });
    }

    await docClient.send(new PutCommand({
      TableName: getTableName("coupons"),
      Item: {
        ...coupon,
        usedCount: (coupon.usedCount || 0) + 1,
        usedBy,
        updatedAt: Date.now(),
      },
    }));
  } catch (err) {
    console.log("Coupon usage tracking failed:", err.message);
  }
};

const placeOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      paymentMethod = "online",
      notes = "",
      country,
    } = req.body;

    if (paymentMethod === "cod") {
      return res.status(400).json({
        success: false,
        message: "Cash on Delivery is coming soon. Please use Online Payment.",
      });
    }

    const allowedPaymentMethods = ["online"];
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Only online payment is available.",
      });
    }

    if (!shippingAddress?.fullName || !shippingAddress?.phone ||
        !shippingAddress?.street || !shippingAddress?.city ||
        !shippingAddress?.state || !shippingAddress?.postalCode) {
      return res.status(400).json({ success: false, message: "Complete shipping address is required" });
    }

    const cart = await getOrCreateCart(req.user.id);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const orderItems = [];
    let subtotalINR = 0;

    for (const item of cart.items) {
      const product = await getProductById(item.product);

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

      let storeName = item.storeName || "";
      if (!storeName) {
        try {
          const vendor = await getVendorByUserId(product.vendorId);
          storeName = vendor?.storeName || "";
        } catch (e) {}
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0]?.url || "",
        price: product.price,
        quantity: item.quantity,
        vendor: product.vendorId || "",
        storeName,
      });

      subtotalINR += product.price * item.quantity;
    }

    const discountINR = cart.coupon?.discount || 0;
    const couponCode = cart.coupon?.code || "";
    const isFreeShippingCoupon = cart.coupon?.freeShipping || false;
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
    const subtotalAfterDiscountLocal = subtotalAfterDiscountINR * exchangeRate;

    const taxRate = countryInfo.tax?.rate || 0;
    const taxIncluded = countryInfo.tax?.includedInPrice !== false;
    const taxAmount = taxIncluded
      ? 0
      : (subtotalAfterDiscountINR * exchangeRate * taxRate) / 100;

    const freeThreshold = countryInfo.shipping?.freeShippingThreshold || 0;
    const standardShippingCost = countryInfo.shipping?.standardCost || 0;

    let shippingCostLocal = 0;
    if (isFreeShippingCoupon) {
      shippingCostLocal = 0;
    } else if (freeThreshold > 0 && subtotalAfterDiscountLocal >= freeThreshold) {
      shippingCostLocal = 0;
    } else {
      shippingCostLocal = standardShippingCost;
    }

    const shippingCostINR = exchangeRate > 0 ? shippingCostLocal / exchangeRate : 0;

    const totalINR = subtotalAfterDiscountINR + shippingCostINR + (exchangeRate > 0 ? taxAmount / exchangeRate : 0);
    const totalLocal = totalINR * exchangeRate;

    console.log("═══════════════════════════════════════════════");
    console.log("🧾 ORDER CALCULATION:");
    console.log(`   Subtotal INR:        ₹${subtotalINR.toFixed(2)}`);
    console.log(`   Discount INR:        ₹${discountINR.toFixed(2)}`);
    console.log(`   Final Shipping INR:  ₹${shippingCostINR.toFixed(2)}`);
    console.log(`   Total INR:           ₹${totalINR.toFixed(2)}`);
    console.log("═══════════════════════════════════════════════");

    const order = await createOrder({
      orderNumber: generateOrderNumber(),
      userId: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "payment_pending",
      confirmedAt: null,
      paymentAttempts: 0,
      lastPaymentAttemptAt: null,
      paymentExpiresAt: null,
      subtotal: subtotalINR,
      discount: discountINR,
      couponCode,
      shippingCharge: shippingCostINR,
      total: totalINR,
      notes,
      country: {
        code: countryInfo.code || "IN",
        name: countryInfo.name || "India",
        flag: countryInfo.flag || "🇮🇳",
        currency: {
          code: countryInfo.currency?.code || "INR",
          symbol: countryInfo.currency?.symbol || "₹",
          name: countryInfo.currency?.name || "Indian Rupee",
        },
        exchangeRate,
      },
      pricing: {
        subtotalINR, subtotalLocal, taxAmount, taxRate,
        taxLabel: countryInfo.tax?.label || "",
        taxIncluded,
        shippingCost: shippingCostLocal,
        shippingCostINR, discountINR, discountLocal, totalINR, totalLocal,
      },
    });

    for (const item of orderItems) {
      const product = await getProductById(item.product);
      if (product) {
        await updateProduct(item.product, {
          stock: Math.max(0, product.stock - item.quantity),
          totalSold: (product.totalSold || 0) + item.quantity,
        });
      }
    }

    if (couponCode) {
      await applyCouponUsage(couponCode, req.user.id);
    }

    const emptyCart = {
      ...cart,
      items: [],
      totalItems: 0,
      subtotal: 0,
      total: 0,
      coupon: { code: "", discount: 0, discountType: "fixed", freeShipping: false, description: "", appliedAt: null },
      userId: req.user.id,
    };
    await saveCart(emptyCart);

    if (countryInfo.code) {
      await updateUser(req.user.id, {
        preferredCountry: countryInfo.code,
        preferredCurrency: countryInfo.currency?.code || "INR",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
      paymentRequired: true,
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

    const result = await getUserOrders(req.user.id, { page, limit });

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
    });
  } catch (err) {
    console.error("getMyOrders error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.userId !== req.user.id) {
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

    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (!["confirmed", "processing", "payment_pending"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage. Contact support.",
      });
    }

    const updateData = {
      orderStatus: "cancelled",
      cancelReason: reason || "Cancelled by customer",
      cancelledAt: new Date().toISOString(),
    };

    if (order.paymentStatus === "paid") {
      updateData.paymentStatus = "refunded";
    }

    await updateOrder(id, updateData);

    for (const item of order.items) {
      const product = await getProductById(item.product);
      if (product) {
        await updateProduct(item.product, {
          stock: (product.stock || 0) + item.quantity,
          totalSold: Math.max(0, (product.totalSold || 0) - item.quantity),
        });
      }
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
    const { status, search } = req.query;

    const result = await getAllOrders({ status, search, page, limit });

    const enrichedOrders = await Promise.all(
      result.items.map(async (order) => {
        let userData = null;
        try {
          const { getUserById } = require("../models/dynamodb/userModel");
          userData = await getUserById(order.userId);
        } catch (e) {}

        return {
          ...order,
          user: userData ? {
            _id: userData._id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone,
          } : { _id: order.userId },
        };
      })
    );

    const totalRevenue = await getTotalRevenue();

    return res.status(200).json({
      success: true,
      data: enrichedOrders,
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
      summary: { totalRevenue, totalOrders: result.total },
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

    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (["cancelled", "delivered", "refunded"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Cannot cancel this order" });
    }

    const updateData = {
      orderStatus: "cancelled",
      cancelReason: reason || "Cancelled by admin",
      cancelledAt: new Date().toISOString(),
    };

    if (order.paymentStatus === "paid") {
      updateData.paymentStatus = "refunded";
    }

    await updateOrder(id, updateData);

    for (const item of order.items) {
      const product = await getProductById(item.product);
      if (product) {
        await updateProduct(item.product, {
          stock: (product.stock || 0) + item.quantity,
          totalSold: Math.max(0, (product.totalSold || 0) - item.quantity),
        });
      }
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

    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const vendorItems = order.items.filter((item) => item.vendor === req.user.id);

    if (vendorItems.length === 0) {
      return res.status(403).json({ success: false, message: "No items from your store in this order" });
    }

    if (status === "cancelled" && !["confirmed", "processing"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Cannot cancel order that has already been shipped" });
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
      updateData.deliveredAt = new Date().toISOString();
    }

    if (status === "cancelled") {
      updateData.cancelReason = req.body.reason || "Cancelled by vendor";
      updateData.cancelledAt = new Date().toISOString();
      for (const item of vendorItems) {
        const product = await getProductById(item.product);
        if (product) {
          await updateProduct(item.product, {
            stock: (product.stock || 0) + item.quantity,
            totalSold: Math.max(0, (product.totalSold || 0) - item.quantity),
          });
        }
      }
    }

    const updatedOrder = await updateOrder(id, updateData);

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
    const status = req.query.status;

    const result = await getVendorOrders(req.user.id, { status, page, limit });

    const enrichedOrders = await Promise.all(
      result.items.map(async (order) => {
        let userData = null;
        try {
          const { getUserById } = require("../models/dynamodb/userModel");
          userData = await getUserById(order.userId);
        } catch (e) {}

        return {
          ...order,
          user: userData ? {
            _id: userData._id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone,
          } : { _id: order.userId },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedOrders,
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
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
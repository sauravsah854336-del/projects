const {
  getOrCreateCart,
  saveCart,
  clearCart: clearCartInDB,
} = require("../models/dynamodb/cartModel");
const { getProductById } = require("../models/dynamodb/productModel");

const recalculateCart = async (cart) => {
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (cart.coupon?.code && cart.coupon?.discount > 0) {
    try {
      const { getCouponByCode } = require("../models/dynamodb/couponModel");
      const coupon = await getCouponByCode(cart.coupon.code);
      if (coupon) {
        const now = new Date();
        const isValid = coupon.isActive &&
          new Date(coupon.startDate || 0) <= now &&
          new Date(coupon.expiryDate || coupon.endDate) >= now &&
          (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit);

        if (isValid && cart.subtotal >= (coupon.minOrderAmount || 0)) {
          let newDiscount = 0;
          if (coupon.discountType === "percentage") {
            newDiscount = (cart.subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && newDiscount > coupon.maxDiscountAmount) {
              newDiscount = coupon.maxDiscountAmount;
            }
          } else if (coupon.discountType === "fixed") {
            newDiscount = Math.min(coupon.discountValue, cart.subtotal);
          }
          cart.coupon.discount = Math.round(newDiscount * 100) / 100;
        } else {
          cart.coupon = {
            code: "",
            discount: 0,
            discountType: "fixed",
            freeShipping: false,
            description: "",
            appliedAt: null,
          };
        }
      }
    } catch (e) {
      console.log("Coupon recalculation error:", e.message);
    }
  }

  cart.total = cart.subtotal - (cart.coupon?.discount || 0);
  if (cart.total < 0) cart.total = 0;

  return cart;
};

const getCart = async (req, res) => {
  try {
    let cart = await getOrCreateCart(req.user.id);

    const validItems = [];

    for (const item of cart.items) {
      const product = await getProductById(item.product);

      if (!product || product.stock <= 0 || product.status !== "approved") {
        continue;
      }

      const maxQty = Math.min(item.quantity, product.stock);

      validItems.push({
        product: product._id,
        quantity: maxQty,
        price: product.price,
        comparePrice: product.comparePrice || 0,
        name: product.name,
        image: product.images?.[0]?.url || "",
        vendor: product.vendorId || product.vendor,
        storeName: product.storeName || "",
        maxQuantity: product.stock,
      });
    }

    cart.items = validItems;
    await recalculateCart(cart);
    cart.userId = req.user.id;
    await saveCart(cart);

    return res.status(200).json({ success: true, data: cart });
  } catch (err) {
    console.error("getCart error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.status !== "approved" || product.stock <= 0) {
      return res.status(400).json({ success: false, message: "Product is not available" });
    }

    const requestedQty = Math.min(quantity, product.stock);
    let cart = await getOrCreateCart(req.user.id);

    const existingIndex = cart.items.findIndex((item) => item.product === productId);

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += requestedQty;
      if (cart.items[existingIndex].quantity > product.stock) {
        cart.items[existingIndex].quantity = product.stock;
      }
      cart.items[existingIndex].price = product.price;
      cart.items[existingIndex].comparePrice = product.comparePrice || 0;
      cart.items[existingIndex].name = product.name;
      cart.items[existingIndex].image = product.images?.[0]?.url || "";
      cart.items[existingIndex].vendor = product.vendorId || product.vendor;
      cart.items[existingIndex].storeName = product.storeName || "";
      cart.items[existingIndex].maxQuantity = product.stock;
    } else {
      cart.items.push({
        product: productId,
        quantity: requestedQty,
        price: product.price,
        comparePrice: product.comparePrice || 0,
        name: product.name,
        image: product.images?.[0]?.url || "",
        vendor: product.vendorId || product.vendor,
        storeName: product.storeName || "",
        maxQuantity: product.stock,
      });
    }

    await recalculateCart(cart);
    cart.userId = req.user.id;
    await saveCart(cart);

    return res.status(200).json({ success: true, message: "Product added to cart", data: cart });
  } catch (err) {
    console.error("addToCart error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, message: "Product ID and quantity are required" });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    let cart = await getOrCreateCart(req.user.id);

    const itemIndex = cart.items.findIndex((item) => item.product === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    cart.items[itemIndex].quantity = Math.min(quantity, product.stock);
    cart.items[itemIndex].price = product.price;
    cart.items[itemIndex].comparePrice = product.comparePrice || 0;
    cart.items[itemIndex].maxQuantity = product.stock;

    await recalculateCart(cart);
    cart.userId = req.user.id;
    await saveCart(cart);

    return res.status(200).json({ success: true, message: "Cart updated", data: cart });
  } catch (err) {
    console.error("updateCartItem error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    let cart = await getOrCreateCart(req.user.id);

    cart.items = cart.items.filter((item) => item.product !== productId);

    await recalculateCart(cart);
    cart.userId = req.user.id;
    await saveCart(cart);

    return res.status(200).json({ success: true, message: "Item removed from cart", data: cart });
  } catch (err) {
    console.error("removeCartItem error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await clearCartInDB(req.user.id);

    return res.status(200).json({ success: true, message: "Cart cleared", data: cart });
  } catch (err) {
    console.error("clearCart error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const mergeGuestCart = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      const existing = await getOrCreateCart(req.user.id);
      return res.status(200).json({ success: true, message: "No items to merge", data: existing });
    }

    let cart = await getOrCreateCart(req.user.id);

    for (const guestItem of items) {
      const product = await getProductById(guestItem.productId);

      if (!product || product.status !== "approved" || product.stock <= 0) {
        continue;
      }

      const existingIndex = cart.items.findIndex(
        (item) => item.product === guestItem.productId
      );

      if (existingIndex > -1) {
        const newQty = cart.items[existingIndex].quantity + (guestItem.quantity || 1);
        cart.items[existingIndex].quantity = Math.min(newQty, product.stock);
        cart.items[existingIndex].price = product.price;
        cart.items[existingIndex].comparePrice = product.comparePrice || 0;
        cart.items[existingIndex].maxQuantity = product.stock;
      } else {
        cart.items.push({
          product: guestItem.productId,
          quantity: Math.min(guestItem.quantity || 1, product.stock),
          price: product.price,
          comparePrice: product.comparePrice || 0,
          name: product.name,
          image: product.images?.[0]?.url || "",
          vendor: product.vendorId || product.vendor,
          storeName: product.storeName || "",
          maxQuantity: product.stock,
        });
      }
    }

    await recalculateCart(cart);
    cart.userId = req.user.id;
    await saveCart(cart);

    return res.status(200).json({
      success: true,
      message: `Merged ${items.length} items from guest cart`,
      data: cart,
    });
  } catch (err) {
    console.error("mergeGuestCart error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const applyCouponToCart = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    let cart = await getOrCreateCart(req.user.id);

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let coupon = null;
    try {
      const { getCouponByCode } = require("../models/dynamodb/couponModel");
      coupon = await getCouponByCode(code.toUpperCase().trim());
    } catch (e) {}

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code" });
    }

    const now = new Date();
    const startDate = coupon.startDate ? new Date(coupon.startDate) : new Date(0);
    const endDate = coupon.expiryDate ? new Date(coupon.expiryDate) : (coupon.endDate ? new Date(coupon.endDate) : new Date("2099-12-31"));

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: "Coupon is inactive" });
    }
    if (now < startDate) {
      return res.status(400).json({ success: false, message: "Coupon not yet active" });
    }
    if (now > endDate) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    }

    const userUsage = (coupon.usedBy || []).find(
      (u) => (u.user || u) === req.user.id
    );
    const perUserLimit = coupon.usageLimitPerUser || coupon.perUserLimit || 1;
    if (userUsage && (userUsage.usedCount || 1) >= perUserLimit) {
      return res.status(400).json({ success: false, message: "You have already used this coupon" });
    }

    if (cart.subtotal < (coupon.minOrderAmount || 0)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount ₹${coupon.minOrderAmount} required`,
      });
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === "percentage") {
      calculatedDiscount = (cart.subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
        calculatedDiscount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === "fixed") {
      calculatedDiscount = Math.min(coupon.discountValue, cart.subtotal);
    }

    cart.coupon = {
      code: coupon.code,
      discount: Math.round(calculatedDiscount * 100) / 100,
      discountType: coupon.discountType,
      freeShipping: coupon.discountType === "free_shipping",
      description: coupon.description,
      appliedAt: new Date().toISOString(),
    };

    await recalculateCart(cart);
    cart.userId = req.user.id;
    await saveCart(cart);

    return res.status(200).json({ success: true, message: "Coupon applied successfully", data: cart });
  } catch (err) {
    console.error("applyCouponToCart error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const removeCouponFromCart = async (req, res) => {
  try {
    let cart = await getOrCreateCart(req.user.id);

    cart.coupon = {
      code: "",
      discount: 0,
      discountType: "fixed",
      freeShipping: false,
      description: "",
      appliedAt: null,
    };

    await recalculateCart(cart);
    cart.userId = req.user.id;
    await saveCart(cart);

    return res.status(200).json({ success: true, message: "Coupon removed successfully", data: cart });
  } catch (err) {
    console.error("removeCouponFromCart error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeGuestCart,
  applyCouponToCart,
  removeCouponFromCart,
};
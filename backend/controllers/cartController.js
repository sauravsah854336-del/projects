const Cart = require("../models/cart");
const Product = require("../models/product");

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
      "name price comparePrice images stock vendor brand slug"
    );

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        totalItems: 0,
        subtotal: 0,
        total: 0,
      });
    }

    const itemsWithValidStock = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product);

      if (!product || product.stock <= 0 || product.status !== "approved") {
        continue;
      }

      const maxQty = Math.min(item.quantity, product.stock);

      if (maxQty !== item.quantity) {
        item.quantity = maxQty;
      }

      item.price = product.price;
      item.comparePrice = product.comparePrice || 0;
      item.name = product.name;
      item.image = product.images?.[0]?.url || "";
      item.vendor = product.vendor;
      item.storeName = product.vendorStore?.storeName || "";
      item.maxQuantity = product.stock;

      itemsWithValidStock.push(item);
    }

    cart.items = itemsWithValidStock;
    cart.totalItems = itemsWithValidStock.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    cart.subtotal = itemsWithValidStock.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cart.total = cart.subtotal - cart.coupon.discount;

    if (cart.total < 0) cart.total = 0;

    await cart.save();

    return res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.status !== "approved" || product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product is not available",
      });
    }

    const requestedQty = Math.min(quantity, product.stock);

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        totalItems: 0,
        subtotal: 0,
        total: 0,
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += requestedQty;

      if (cart.items[existingItemIndex].quantity > product.stock) {
        cart.items[existingItemIndex].quantity = product.stock;
      }

      cart.items[existingItemIndex].price = product.price;
      cart.items[existingItemIndex].comparePrice = product.comparePrice || 0;
      cart.items[existingItemIndex].name = product.name;
      cart.items[existingItemIndex].image = product.images?.[0]?.url || "";
      cart.items[existingItemIndex].vendor = product.vendor;
      cart.items[existingItemIndex].storeName = product.vendorStore?.storeName || "";
      cart.items[existingItemIndex].maxQuantity = product.stock;
    } else {
      cart.items.push({
        product: productId,
        quantity: requestedQty,
        price: product.price,
        comparePrice: product.comparePrice || 0,
        name: product.name,
        image: product.images?.[0]?.url || "",
        vendor: product.vendor,
        storeName: product.vendorStore?.storeName || "",
        maxQuantity: product.stock,
      });
    }

    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cart.total = cart.subtotal - cart.coupon.discount;

    if (cart.total < 0) cart.total = 0;

    await cart.save();

    cart = await Cart.findById(cart._id).populate(
      "items.product",
      "name price comparePrice images stock vendor brand slug"
    );

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      data: cart,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    cart.items[itemIndex].quantity = Math.min(quantity, product.stock);
    cart.items[itemIndex].price = product.price;
    cart.items[itemIndex].comparePrice = product.comparePrice || 0;
    cart.items[itemIndex].maxQuantity = product.stock;

    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cart.total = cart.subtotal - cart.coupon.discount;

    if (cart.total < 0) cart.total = 0;

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name price comparePrice images stock vendor brand slug"
    );

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      data: populatedCart,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cart.total = cart.subtotal - cart.coupon.discount;

    if (cart.total < 0) cart.total = 0;

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name price comparePrice images stock vendor brand slug"
    );

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: populatedCart,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    cart.totalItems = 0;
    cart.subtotal = 0;
    cart.total = 0;
    cart.coupon = { code: "", discount: 0, discountType: "fixed" };

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared",
      data: cart,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const mergeGuestCart = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      const existing = await Cart.findOne({ user: req.user.id }).populate(
        "items.product",
        "name price comparePrice images stock vendor brand slug"
      );
      return res.status(200).json({
        success: true,
        message: "No items to merge",
        data: existing,
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        totalItems: 0,
        subtotal: 0,
        total: 0,
      });
    }

    for (const guestItem of items) {
      const product = await Product.findById(guestItem.productId);

      if (!product || product.status !== "approved" || product.stock <= 0) {
        continue;
      }

      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === guestItem.productId
      );

      if (existingItemIndex > -1) {
        const newQty = cart.items[existingItemIndex].quantity + (guestItem.quantity || 1);
        cart.items[existingItemIndex].quantity = Math.min(newQty, product.stock);
        cart.items[existingItemIndex].price = product.price;
        cart.items[existingItemIndex].comparePrice = product.comparePrice || 0;
        cart.items[existingItemIndex].maxQuantity = product.stock;
      } else {
        cart.items.push({
          product: guestItem.productId,
          quantity: Math.min(guestItem.quantity || 1, product.stock),
          price: product.price,
          comparePrice: product.comparePrice || 0,
          name: product.name,
          image: product.images?.[0]?.url || "",
          vendor: product.vendor,
          storeName: product.vendorStore?.storeName || "",
          maxQuantity: product.stock,
        });
      }
    }

    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.total = cart.subtotal - cart.coupon.discount;
    if (cart.total < 0) cart.total = 0;

    await cart.save();

    const populated = await Cart.findById(cart._id).populate(
      "items.product",
      "name price comparePrice images stock vendor brand slug"
    );

    return res.status(200).json({
      success: true,
      message: `Merged ${items.length} items from guest cart`,
      data: populated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeGuestCart,
};

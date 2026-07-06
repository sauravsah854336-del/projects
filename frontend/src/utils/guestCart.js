const GUEST_CART_KEY = "guestCart";

export const getGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return { items: [], totalItems: 0, subtotal: 0, total: 0 };
    return JSON.parse(raw);
  } catch {
    return { items: [], totalItems: 0, subtotal: 0, total: 0 };
  }
};

const saveGuestCart = (cart) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("guestCartUpdated"));
};

const recalculate = (items) => {
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { totalItems, subtotal, total: subtotal };
};

export const addToGuestCart = (product, quantity = 1) => {
  const cart = getGuestCart();
  const existingIndex = cart.items.findIndex(
    (item) => item.product._id === product._id
  );

  if (existingIndex > -1) {
    const newQty = cart.items[existingIndex].quantity + quantity;
    cart.items[existingIndex].quantity = Math.min(newQty, product.stock || 99);
  } else {
    cart.items.push({
      product: {
        _id: product._id,
        slug: product.slug,
        name: product.name,
        images: product.images,
      },
      productId: product._id,
      name: product.name,
      image: product.images?.[0]?.url || "",
      price: product.price,
      comparePrice: product.comparePrice || 0,
      quantity: Math.min(quantity, product.stock || 99),
      maxQuantity: product.stock || 99,
      storeName: product.vendorStore?.storeName || "Vendor",
      vendor: product.vendor?._id || product.vendor || "",
    });
  }

  const totals = recalculate(cart.items);
  const updated = { ...cart, ...totals };
  saveGuestCart(updated);
  return updated;
};

export const updateGuestCartItem = (productId, quantity) => {
  const cart = getGuestCart();
  const index = cart.items.findIndex((item) => item.productId === productId);

  if (index === -1) return cart;

  if (quantity < 1) {
    return removeGuestCartItem(productId);
  }

  cart.items[index].quantity = Math.min(quantity, cart.items[index].maxQuantity);
  const totals = recalculate(cart.items);
  const updated = { ...cart, ...totals };
  saveGuestCart(updated);
  return updated;
};

export const removeGuestCartItem = (productId) => {
  const cart = getGuestCart();
  cart.items = cart.items.filter((item) => item.productId !== productId);
  const totals = recalculate(cart.items);
  const updated = { ...cart, ...totals };
  saveGuestCart(updated);
  return updated;
};

export const clearGuestCart = () => {
  const empty = { items: [], totalItems: 0, subtotal: 0, total: 0 };
  saveGuestCart(empty);
  return empty;
};

export const getGuestCartForMerge = () => {
  const cart = getGuestCart();
  return cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));
};
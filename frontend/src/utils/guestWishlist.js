const GUEST_WISHLIST_KEY = "guestWishlist";

export const getGuestWishlist = () => {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveGuestWishlist = (items) => {
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("guestWishlistUpdated"));
};

export const addToGuestWishlist = (product) => {
  const items = getGuestWishlist();
  const exists = items.find((item) => item._id === product._id);
  if (exists) return items;

  items.push({
    _id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    comparePrice: product.comparePrice || 0,
    images: product.images,
    stock: product.stock,
    averageRating: product.averageRating || 0,
    totalReviews: product.totalReviews || 0,
    brand: product.brand || "",
    vendorStore: product.vendorStore,
    category: product.category,
    isFeatured: product.isFeatured || false,
  });

  saveGuestWishlist(items);
  return items;
};

export const removeFromGuestWishlist = (productId) => {
  const items = getGuestWishlist().filter((item) => item._id !== productId);
  saveGuestWishlist(items);
  return items;
};

export const isInGuestWishlist = (productId) => {
  return getGuestWishlist().some((item) => item._id === productId);
};

export const clearGuestWishlist = () => {
  saveGuestWishlist([]);
};

export const getGuestWishlistForMerge = () => {
  return getGuestWishlist().map((item) => item._id);
};
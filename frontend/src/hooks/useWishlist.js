import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} from "../features/wishlist/wishlistApi";
import {
  getGuestWishlist,
  addToGuestWishlist,
  removeFromGuestWishlist,
  isInGuestWishlist,
} from "../utils/guestWishlist";

export const useWishlist = () => {
  const { user } = useSelector((state) => state.auth);
  const isCustomer = user?.role === "customer";
  const isGuest = !user;

  const [guestWishlist, setGuestWishlist] = useState(() => getGuestWishlist());

  useEffect(() => {
    const handler = () => setGuestWishlist(getGuestWishlist());
    window.addEventListener("guestWishlistUpdated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("guestWishlistUpdated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const { data: userWishlistData, isLoading: userWishlistLoading } =
    useGetWishlistQuery(undefined, { skip: !isCustomer });

  const [addToWishlistAPI] = useAddToWishlistMutation();
  const [removeFromWishlistAPI] = useRemoveFromWishlistMutation();

  const items = isCustomer
    ? userWishlistData?.data || []
    : guestWishlist;

  const total = isCustomer
    ? userWishlistData?.total || 0
    : guestWishlist.length;

  const isLoading = isCustomer ? userWishlistLoading : false;

  const isWishlisted = (productId) => {
    if (isCustomer) {
      return items.some((item) => item._id === productId);
    }
    return isInGuestWishlist(productId);
  };

  const toggleWishlist = async (product) => {
    const productId = product._id;

    if (isCustomer) {
      if (isWishlisted(productId)) {
        return removeFromWishlistAPI(productId).unwrap();
      } else {
        return addToWishlistAPI(productId).unwrap();
      }
    } else {
      if (isInGuestWishlist(productId)) {
        return removeFromGuestWishlist(productId);
      } else {
        return addToGuestWishlist(product);
      }
    }
  };

  const removeItem = async (productId) => {
    if (isCustomer) {
      return removeFromWishlistAPI(productId).unwrap();
    } else {
      return removeFromGuestWishlist(productId);
    }
  };

  return {
    items,
    total,
    isLoading,
    isWishlisted,
    toggleWishlist,
    removeItem,
    isGuest,
  };
};
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from "../features/cart/cartApi";
import {
  getGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  removeGuestCartItem,
  clearGuestCart,
} from "../utils/guestCart";

export const useCart = () => {
  const { user } = useSelector((state) => state.auth);
  const isCustomer = user?.role === "customer";

  const [guestCart, setGuestCart] = useState(() => getGuestCart());

  useEffect(() => {
    const handler = () => setGuestCart(getGuestCart());
    window.addEventListener("guestCartUpdated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("guestCartUpdated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const { data: userCartData, isLoading: userCartLoading } = useGetCartQuery(
    undefined,
    { skip: !isCustomer }
  );

  const [addToCartAPI] = useAddToCartMutation();
  const [updateCartItemAPI] = useUpdateCartItemMutation();
  const [removeCartItemAPI] = useRemoveCartItemMutation();
  const [clearCartAPI] = useClearCartMutation();

  const cart = isCustomer ? userCartData?.data : guestCart;
  const isLoading = isCustomer ? userCartLoading : false;

  const addItem = async (product, quantity = 1) => {
    if (isCustomer) {
      return addToCartAPI({ productId: product._id, quantity }).unwrap();
    } else {
      const updated = addToGuestCart(product, quantity);
      return updated;
    }
  };

  const updateItem = async (productId, quantity) => {
    if (isCustomer) {
      return updateCartItemAPI({ productId, quantity }).unwrap();
    } else {
      const updated = updateGuestCartItem(productId, quantity);
      return updated;
    }
  };

  const removeItem = async (productId) => {
    if (isCustomer) {
      return removeCartItemAPI(productId).unwrap();
    } else {
      const updated = removeGuestCartItem(productId);
      return updated;
    }
  };

  const clear = async () => {
    if (isCustomer) {
      return clearCartAPI().unwrap();
    } else {
      const updated = clearGuestCart();
      return updated;
    }
  };

  return {
    cart: cart || { items: [], totalItems: 0, subtotal: 0, total: 0 },
    isLoading,
    addItem,
    updateItem,
    removeItem,
    clear,
    isGuest: !isCustomer,
  };
};
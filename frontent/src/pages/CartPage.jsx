import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from "../features/cart/cartApi";
import { useSelector } from "react-redux";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: cartData, isLoading } = useGetCartQuery();
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();
  const [clearCart] = useClearCartMutation();
  const [updatingItems, setUpdatingItems] = useState({});

  const cart = cartData?.data;
  const items = cart?.items || [];

  const handleQuantityChange = async (productId, newQty) => {
    if (newQty < 1) return;
    setUpdatingItems((prev) => ({ ...prev, [productId]: true }));
    try {
      await updateCartItem({ productId, quantity: newQty }).unwrap();
    } catch (err) {
      console.log(err);
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeCartItem(productId).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart().unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-2xl font-bold mb-2">Please login to view your cart</h2>
          <Link
            to="/login"
            className="bg-black text-white px-6 py-3 rounded-xl no-underline inline-block mt-4"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🛒</p>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-4">
            Looks like you haven't added anything yet.
          </p>
          <Link
            to="/products"
            className="bg-black text-white px-6 py-3 rounded-xl no-underline inline-block"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Shopping Cart ({cart?.totalItems} items)
        </h1>
        <button
          onClick={handleClearCart}
          className="text-sm text-red-500 hover:text-red-700 underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product?._id || item.product}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4"
            >
              <Link
                to={`/products/${item.product?.slug || ""}`}
                className="flex-shrink-0"
              >
                <img
                  src={item.image || "https://placehold.co/120?text=Product"}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-xl"
                  onError={(e) => {
                    e.target.src = "https://placehold.co/120?text=Product";
                  }}
                />
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <Link
                      to={`/products/${item.product?.slug || ""}`}
                      className="font-semibold text-gray-900 hover:text-[#D85A30] no-underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.storeName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.product?._id)}
                    className="text-gray-400 hover:text-red-500 text-xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item.product?._id,
                          item.quantity - 1
                        )
                      }
                      disabled={updatingItems[item.product?._id] || item.quantity <= 1}
                      className="px-3 py-1.5 text-lg hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="px-3 py-1.5 font-medium border-x border-gray-300 min-w-[40px] text-center">
                      {updatingItems[item.product?._id] ? "..." : item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item.product?._id,
                          item.quantity + 1
                        )
                      }
                      disabled={
                        updatingItems[item.product?._id] ||
                        item.quantity >= item.maxQuantity
                      }
                      className="px-3 py-1.5 text-lg hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-[#D85A30] font-bold text-lg">
                      {formatRupee(item.price * item.quantity)}
                    </div>
                    {item.comparePrice > 0 && (
                      <div className="text-gray-400 text-xs line-through">
                        {formatRupee(item.comparePrice * item.quantity)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">
                  {formatRupee(cart?.subtotal || 0)}
                </span>
              </div>

              {cart?.coupon?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>− {formatRupee(cart.coupon.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>

              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-[#D85A30]">
                  {formatRupee(cart?.total || 0)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="w-full mt-6 bg-black text-white py-4 rounded-xl font-semibold hover:bg-[#D85A30] transition"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
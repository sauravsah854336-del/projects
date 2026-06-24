import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import WishlistButton from "../components/WishlistButton";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, isLoading, updateItem, removeItem, clear, isGuest } = useCart();
  const [updatingItems, setUpdatingItems] = useState({});
  const [removingItems, setRemovingItems] = useState({});

  const items = cart?.items || [];

  const getProductId = (item) => item.product?._id || item.productId || item.product;

  const handleQuantityChange = async (productId, newQty) => {
    if (newQty < 1) return;
    setUpdatingItems((prev) => ({ ...prev, [productId]: true }));
    try { await updateItem(productId, newQty); }
    catch (err) { console.log(err); }
    finally { setUpdatingItems((prev) => ({ ...prev, [productId]: false })); }
  };

  const handleRemove = async (productId) => {
    setRemovingItems((prev) => ({ ...prev, [productId]: true }));
    try { await removeItem(productId); }
    catch (err) { console.log(err); }
    finally { setRemovingItems((prev) => ({ ...prev, [productId]: false })); }
  };

  const handleClearCart = async () => {
    try { await clear(); } catch (err) { console.log(err); }
  };

  const handleCheckout = () => {
    if (isGuest) { navigate("/login?redirect=/checkout"); }
    else { navigate("/checkout"); }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-9 h-9 border-[3px] border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-100 px-4">
        <div className="text-center bg-white p-12 sm:p-14 rounded-2xl border border-gray-200 max-w-[440px] w-full">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-7">Looks like you haven't added anything yet. Start shopping!</p>
          <Link
            to="/products"
            className="inline-block bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 no-underline px-8 py-3 rounded-xl font-bold text-sm border border-yellow-400 hover:brightness-95 transition"
          >
            Continue Shopping
          </Link>
          {isGuest && (
            <div className="mt-6 px-4 py-3.5 bg-blue-50 border border-blue-200 rounded-xl text-left">
              <p className="text-xs text-blue-800 font-bold m-0">💡 Sign in to save your cart</p>
              <p className="text-[11px] text-blue-600 mt-0.5 m-0">Your cart will be synced when you sign in</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-5 sm:py-6 px-3 sm:px-4">
      <div className="max-w-[1200px] mx-auto">

        <div className="flex items-center justify-between mb-5 sm:mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">Shopping Cart</h1>
            <p className="text-gray-500 text-[13px] mt-1 m-0">
              {cart?.totalItems} {cart?.totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <button
            onClick={handleClearCart}
            className="bg-transparent border border-red-300 text-red-500 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-red-50 transition font-[inherit]"
          >
            Clear Cart
          </button>
        </div>

        {isGuest && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl px-4 sm:px-5 py-3.5 flex items-center gap-3.5 mb-4 flex-wrap">
            <span className="text-2xl shrink-0">🔐</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-blue-800 m-0">Sign in to save your cart</p>
              <p className="text-xs text-blue-600 mt-0.5 m-0">Your cart items will be saved when you sign in. You'll need to sign in to complete checkout.</p>
            </div>
            <button
              onClick={() => navigate("/login?redirect=/cart")}
              className="bg-blue-600 text-white border-none rounded-xl px-5 py-2.5 text-[13px] font-extrabold cursor-pointer whitespace-nowrap shadow-md shadow-blue-500/25 hover:bg-blue-700 transition font-[inherit] shrink-0"
            >
              Sign In →
            </button>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-4 lg:gap-5 items-start">

          <div className="flex flex-col gap-3 w-full">

            <div className="bg-white rounded-xl border border-gray-200 px-4 sm:px-5 py-3 hidden sm:flex items-center justify-between">
              <span className="text-[13px] font-bold text-gray-900">Product</span>
              <div className="flex gap-16 sm:gap-20">
                <span className="text-[13px] font-bold text-gray-900">Quantity</span>
                <span className="text-[13px] font-bold text-gray-900">Total</span>
              </div>
            </div>

            {items.map((item) => {
              const productId = getProductId(item);
              const wishlistProduct = {
                _id: productId,
                name: item.name,
                slug: item.product?.slug || "",
                price: item.price,
                comparePrice: item.comparePrice || 0,
                images: item.image ? [{ url: item.image }] : [],
                stock: item.maxQuantity || 99,
                averageRating: 0,
                totalReviews: 0,
                vendorStore: { storeName: item.storeName || "Vendor" },
              };

              return (
                <div
                  key={productId}
                  className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex gap-3.5 sm:gap-4 items-start transition-opacity"
                  style={{ opacity: removingItems[productId] ? 0.5 : 1 }}
                >
                  <Link to={`/products/${item.product?.slug || ""}`} className="shrink-0">
                    <img
                      src={item.image || PLACEHOLDER_MEDIUM}
                      alt={item.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-200"
                      onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }}
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product?.slug || ""}`}
                          className="font-semibold text-sm text-gray-900 no-underline leading-snug block hover:text-[#D85A30] transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-1 m-0">Sold by: {item.storeName || "Vendor"}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Link to={`/products/${item.product?.slug || ""}`} className="text-[11px] text-blue-700 no-underline hover:underline">
                            View Details
                          </Link>
                          <span className="text-gray-200 text-xs">|</span>
                          <button
                            onClick={() => handleRemove(productId)}
                            className="text-[11px] text-red-500 bg-transparent border-none cursor-pointer p-0 hover:underline font-[inherit]"
                          >
                            Remove
                          </button>
                          <span className="text-gray-200 text-xs">|</span>
                          <WishlistButton product={wishlistProduct} size="sm" />
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg sm:text-xl font-extrabold text-[#B12704] m-0">
                          {formatRupee(item.price * item.quantity)}
                        </p>
                        {item.comparePrice > 0 && (
                          <p className="text-[11px] text-gray-400 line-through mt-0.5 m-0">
                            {formatRupee(item.comparePrice * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-fit">
                        <button
                          onClick={() => handleQuantityChange(productId, item.quantity - 1)}
                          disabled={updatingItems[productId] || item.quantity <= 1}
                          className="w-9 h-9 bg-gray-50 border-none cursor-pointer text-lg flex items-center justify-center text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition font-[inherit]"
                        >
                          −
                        </button>
                        <span className="w-11 h-9 text-sm font-bold text-gray-900 border-x border-gray-200 flex items-center justify-center">
                          {updatingItems[productId] ? (
                            <span className="w-3.5 h-3.5 border-2 border-[#D85A30] border-t-transparent rounded-full animate-spin inline-block" />
                          ) : item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(productId, item.quantity + 1)}
                          disabled={updatingItems[productId] || item.quantity >= item.maxQuantity}
                          className="w-9 h-9 bg-gray-50 border-none cursor-pointer text-lg flex items-center justify-center text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition font-[inherit]"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 m-0">{formatRupee(item.price)} each</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-2.5">
              <span className="text-xl">🚚</span>
              <div>
                <p className="text-[13px] font-bold text-green-800 m-0">Free Delivery</p>
                <p className="text-xs text-green-600 m-0">Your order qualifies for free delivery</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:sticky lg:top-20">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-base font-bold text-gray-900 m-0">Order Summary</h2>
              </div>
              <div className="p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between">
                    <span className="text-[13px] text-gray-500">Subtotal ({cart?.totalItems} items)</span>
                    <span className="text-[13px] font-semibold text-gray-900">{formatRupee(cart?.subtotal || 0)}</span>
                  </div>
                  {cart?.coupon?.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[13px] text-green-600">Discount</span>
                      <span className="text-[13px] font-semibold text-green-600">− {formatRupee(cart.coupon.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[13px] text-gray-500">Shipping</span>
                    <span className="text-[13px] font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
                    <span className="text-base font-extrabold text-gray-900">Total</span>
                    <span className="text-2xl font-extrabold text-[#B12704]">{formatRupee(cart?.total || cart?.subtotal || 0)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full mt-5 bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border border-yellow-400 rounded-xl py-3.5 text-[15px] font-extrabold cursor-pointer hover:brightness-95 transition font-[inherit]"
                >
                  {isGuest
                    ? `🔐 Sign in to Checkout (${cart?.totalItems})`
                    : `Proceed to Checkout (${cart?.totalItems})`}
                </button>

                <button
                  onClick={() => navigate("/products")}
                  className="w-full mt-2.5 bg-transparent text-blue-700 border border-gray-200 rounded-xl py-3 text-[13px] font-semibold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                >
                  Continue Shopping
                </button>

                <div className="mt-5 flex flex-col gap-2">
                  {[
                    { icon: "🔒", text: "Secure checkout" },
                    { icon: "🔄", text: "Easy returns" },
                    { icon: "✅", text: "Verified vendors" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-xs text-gray-500">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
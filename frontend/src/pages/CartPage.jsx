import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useSelector, useDispatch } from "react-redux";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import WishlistButton from "../components/WishlistButton";
import CouponInput from "../components/CouponInput";
import {
  formatPrice,
  convertPrice,
  calculateTax,
  getShippingInfo,
} from "../utils/priceHelper";
import { authApi } from "../features/auth/authApi";

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCountry, isUserCountry } = useSelector((state) => state.country);
  const { cart, isLoading, updateItem, removeItem, clear, isGuest } = useCart();
  const [updatingItems, setUpdatingItems] = useState({});
  const [removingItems, setRemovingItems] = useState({});
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const items = cart?.items || [];
  const getProductId = (item) =>
    item.product?._id || item.productId || item.product;

  const subtotalINR = cart?.subtotal || 0;
  const couponDiscountINR = appliedCoupon?.discount || 0;
  const isFreeShippingCoupon = appliedCoupon?.freeShipping || false;
  const subtotalAfterCouponINR = subtotalINR - couponDiscountINR;

  useEffect(() => {
    if (cart?.coupon?.code && !appliedCoupon) {
      setAppliedCoupon({
        coupon: {
          code: cart.coupon.code,
          description: cart.coupon.description || "Applied coupon",
          discountType: cart.coupon.discountType,
        },
        discount: cart.coupon.discount,
        freeShipping: cart.coupon.freeShipping || false,
      });
    }
  }, [cart, appliedCoupon]);

  const taxAmount = currentCountry.tax?.includedInPrice
    ? 0
    : calculateTax(
        convertPrice(subtotalAfterCouponINR, currentCountry),
        currentCountry
      );

  const shippingInfo = getShippingInfo(subtotalAfterCouponINR, currentCountry);
  const shippingCostINR = isFreeShippingCoupon
    ? 0
    : shippingInfo?.isFree
    ? 0
    : (currentCountry.shipping?.standardCost || 0) / currentCountry.exchangeRate;

  const totalINR =
    subtotalAfterCouponINR +
    shippingCostINR +
    taxAmount / currentCountry.exchangeRate;

  const totalSavings = couponDiscountINR;

  const handleQuantityChange = async (productId, newQty) => {
    if (newQty < 1) return;
    setUpdatingItems((prev) => ({ ...prev, [productId]: true }));
    try {
      await updateItem(productId, newQty);
    } catch (err) {
      console.log(err);
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemove = async (productId) => {
    setRemovingItems((prev) => ({ ...prev, [productId]: true }));
    try {
      await removeItem(productId);
    } catch (err) {
      console.log(err);
    } finally {
      setRemovingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleClearCart = async () => {
    try {
      await clear();
      setAppliedCoupon(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleApplyCoupon = (couponData) => {
    setAppliedCoupon(couponData);
    dispatch(authApi.util.invalidateTags(["Cart"]));
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    dispatch(authApi.util.invalidateTags(["Cart"]));
  };

  const handleCheckout = () => {
    if (isGuest) navigate("/login?redirect=/checkout");
    else navigate("/checkout");
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-9 h-9 border-[3px] border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-12 sm:p-14 rounded-3xl border border-gray-100 shadow-sm max-w-[420px] w-full">
          <div className="w-20 h-20 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-5 text-4xl">
            🛒
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-400 text-sm mb-7">
            Looks like you haven't added anything yet.
          </p>
          <Link
            to="/products"
            className="inline-block bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 no-underline px-8 py-3 rounded-xl font-bold text-sm border border-yellow-400 hover:brightness-95 transition"
          >
            Start Shopping
          </Link>
          {isGuest && (
            <div className="mt-5 px-4 py-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-left">
              <p className="text-xs text-blue-800 font-bold m-0">
                💡 Sign in to save your cart
              </p>
              <p className="text-[11px] text-blue-600 mt-0.5 m-0">
                Your cart will be synced when you sign in
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-5 sm:py-7 px-3 sm:px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-5 sm:mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">
                Shopping Cart
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#D85A30] border border-orange-200 px-2.5 py-1 rounded-full text-xs font-bold">
                {currentCountry.flag} {currentCountry.currency.code}
              </span>
              {isUserCountry && (
                <span className="inline-flex items-center bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                  YOUR PROFILE
                </span>
              )}
            </div>
            <p className="text-gray-400 text-[13px] mt-1 m-0">
              {cart?.totalItems} {cart?.totalItems === 1 ? "item" : "items"} ·
              Showing prices in {currentCountry.name}
            </p>
          </div>
          <button
            onClick={handleClearCart}
            className="bg-transparent border border-red-200 text-red-400 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition font-[inherit]"
          >
            Clear Cart
          </button>
        </div>

        {isGuest && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 sm:px-5 py-3.5 flex items-center gap-3.5 mb-5 flex-wrap">
            <span className="text-2xl shrink-0">🔐</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-blue-800 m-0">
                Sign in to save your cart
              </p>
              <p className="text-xs text-blue-500 mt-0.5 m-0">
                Your cart items will be saved when you sign in. Login also unlocks coupons!
              </p>
            </div>
            <button
              onClick={() => navigate("/login?redirect=/cart")}
              className="bg-blue-600 text-white border-none rounded-xl px-5 py-2.5 text-[13px] font-extrabold cursor-pointer whitespace-nowrap hover:bg-blue-700 transition font-[inherit] shrink-0"
            >
              Sign In →
            </button>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-5 items-start">
          <div className="flex flex-col gap-3 w-full">
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
                  className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex gap-4 items-start shadow-sm transition-all"
                  style={{
                    opacity: removingItems[productId] ? 0.4 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <Link
                    to={`/products/${item.product?.slug || ""}`}
                    className="shrink-0"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.image || PLACEHOLDER_MEDIUM}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_MEDIUM;
                        }}
                      />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product?.slug || ""}`}
                          className="font-semibold text-sm text-gray-900 no-underline leading-snug block hover:text-[#D85A30] transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[11px] text-gray-400 mt-1 m-0">
                          Sold by: {item.storeName || "Vendor"}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Link
                            to={`/products/${item.product?.slug || ""}`}
                            className="text-[11px] text-[#D85A30] no-underline hover:underline font-medium"
                          >
                            View Details
                          </Link>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={() => handleRemove(productId)}
                            className="text-[11px] text-gray-400 bg-transparent border-none cursor-pointer p-0 hover:text-red-500 transition-colors font-[inherit]"
                          >
                            Remove
                          </button>
                          <span className="text-gray-200">|</span>
                          <WishlistButton product={wishlistProduct} size="sm" />
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base sm:text-lg font-extrabold text-[#B12704] m-0">
                          {formatPrice(
                            item.price * item.quantity,
                            currentCountry
                          )}
                        </p>
                        {item.comparePrice > 0 && (
                          <p className="text-[11px] text-gray-400 line-through mt-0.5 m-0">
                            {formatPrice(
                              item.comparePrice * item.quantity,
                              currentCountry
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() =>
                            handleQuantityChange(productId, item.quantity - 1)
                          }
                          disabled={
                            updatingItems[productId] || item.quantity <= 1
                          }
                          className="w-9 h-9 bg-transparent border-none cursor-pointer text-lg flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition font-[inherit]"
                        >
                          −
                        </button>
                        <span className="w-10 h-9 text-sm font-bold text-gray-900 border-x border-gray-200 flex items-center justify-center bg-white">
                          {updatingItems[productId] ? (
                            <span className="w-3.5 h-3.5 border-2 border-[#D85A30] border-t-transparent rounded-full animate-spin inline-block" />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(productId, item.quantity + 1)
                          }
                          disabled={
                            updatingItems[productId] ||
                            item.quantity >= item.maxQuantity
                          }
                          className="w-9 h-9 bg-transparent border-none cursor-pointer text-lg flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition font-[inherit]"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400 m-0">
                        {formatPrice(item.price, currentCountry)} each
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {(isFreeShippingCoupon || shippingInfo?.isFree) ? (
              <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                  🚚
                </div>
                <div>
                  <p className="text-[13px] font-bold text-green-800 m-0">
                    {isFreeShippingCoupon ? "Free Shipping via Coupon!" : "Free Delivery Eligible!"}
                  </p>
                  <p className="text-xs text-green-600 m-0">
                    Your order qualifies for free delivery to{" "}
                    {currentCountry.flag} {currentCountry.name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                  🛒
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-orange-800 m-0">
                    Add{" "}
                    {formatPrice(
                      shippingInfo?.remainingForFree / currentCountry.exchangeRate,
                      currentCountry
                    )}{" "}
                    more for FREE delivery
                  </p>
                  <p className="text-xs text-orange-600 m-0">
                    Free shipping over{" "}
                    {formatPrice(
                      currentCountry.shipping.freeShippingThreshold /
                        currentCountry.exchangeRate,
                      currentCountry
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:sticky lg:top-20">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                <h2 className="text-base font-extrabold text-gray-900 m-0">
                  Order Summary
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5 m-0">
                  Prices in {currentCountry.flag} {currentCountry.currency.code}
                </p>
              </div>
              <div className="p-5">
                {!isGuest && (
                  <div className="mb-5">
                    <CouponInput
                      subtotal={subtotalINR}
                      cartItems={items}
                      onApply={handleApplyCoupon}
                      onRemove={handleRemoveCoupon}
                      appliedCoupon={appliedCoupon}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-3 mb-5">
                  <div className="flex justify-between">
                    <span className="text-[13px] text-gray-500">
                      Subtotal ({cart?.totalItems}{" "}
                      {cart?.totalItems === 1 ? "item" : "items"})
                    </span>
                    <span className="text-[13px] font-semibold text-gray-900">
                      {formatPrice(subtotalINR, currentCountry)}
                    </span>
                  </div>

                  {couponDiscountINR > 0 && (
                    <div className="flex justify-between items-center bg-green-50 -mx-2 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🎟️</span>
                        <div>
                          <span className="text-[13px] text-green-700 font-bold">
                            Coupon Applied
                          </span>
                          {appliedCoupon?.coupon?.code && (
                            <span className="block text-[10px] text-green-600 font-semibold">
                              {appliedCoupon.coupon.code}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-green-600">
                        − {formatPrice(couponDiscountINR, currentCountry)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-[13px] text-gray-500">Shipping</span>
                    {(isFreeShippingCoupon || shippingInfo?.isFree) ? (
                      <span className="text-[13px] font-bold text-green-600 flex items-center gap-1">
                        🚚 FREE
                      </span>
                    ) : (
                      <span className="text-[13px] font-semibold text-gray-900">
                        {formatPrice(shippingCostINR, currentCountry)}
                      </span>
                    )}
                  </div>

                  {currentCountry.tax?.rate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[13px] text-gray-500">
                        {currentCountry.tax.label} ({currentCountry.tax.rate}%)
                        {currentCountry.tax.includedInPrice && (
                          <span className="text-[10px] text-green-600 ml-1">
                            (included)
                          </span>
                        )}
                      </span>
                      <span className="text-[13px] font-semibold text-gray-900">
                        {currentCountry.tax.includedInPrice
                          ? "Included"
                          : `${currentCountry.currency.symbol}${taxAmount.toFixed(2)}`}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                    <span className="text-base font-extrabold text-gray-900">
                      Total
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-[#B12704]">
                        {formatPrice(totalINR, currentCountry)}
                      </span>
                      {totalSavings > 0 && (
                        <p className="text-[11px] text-green-600 font-semibold m-0 mt-0.5">
                          You save{" "}
                          {formatPrice(totalSavings, currentCountry)}!
                        </p>
                      )}
                      {currentCountry.code !== "IN" && (
                        <p className="text-[10px] text-gray-400 m-0 mt-0.5">
                          ≈ ₹{Math.round(totalINR).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border border-yellow-400 rounded-xl py-3.5 text-[15px] font-extrabold cursor-pointer hover:brightness-95 transition font-[inherit] shadow-md shadow-yellow-400/20"
                >
                  {isGuest
                    ? `🔐 Sign in to Checkout`
                    : `Proceed to Checkout →`}
                </button>

                <button
                  onClick={() => navigate("/products")}
                  className="w-full mt-2.5 bg-transparent text-gray-500 border border-gray-200 rounded-xl py-3 text-[13px] font-semibold cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition font-[inherit]"
                >
                  Continue Shopping
                </button>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide m-0 mb-2">
                    Accepted Payment Methods
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCountry.paymentMethods?.map((method) => {
                      const methodIcons = {
                        cod: "💵",
                        card: "💳",
                        upi: "📱",
                        netbanking: "🏦",
                        wallet: "👛",
                        paypal: "🅿️",
                        applepay: "🍎",
                        googlepay: "🔵",
                      };
                      const methodNames = {
                        cod: "COD",
                        card: "Card",
                        upi: "UPI",
                        netbanking: "NetBanking",
                        wallet: "Wallet",
                        paypal: "PayPal",
                        applepay: "Apple Pay",
                        googlepay: "Google Pay",
                      };
                      return (
                        <span
                          key={method}
                          className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md text-[10px] font-bold text-gray-700"
                        >
                          {methodIcons[method]} {methodNames[method]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col gap-2.5">
                  {[
                    { icon: "🔒", text: "Secure & encrypted checkout" },
                    { icon: "🔄", text: "Easy 10-day returns" },
                    { icon: "✅", text: "All vendors verified" },
                    {
                      icon: "🌍",
                      text: `Shipping to ${currentCountry.name}`,
                    },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2.5">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-[12px] text-gray-400">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {totalSavings > 0 && (
              <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white text-lg shrink-0">
                    💰
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-green-800 m-0">
                      Great Savings!
                    </p>
                    <p className="text-xs text-green-600 mt-0.5 m-0">
                      You're saving {formatPrice(totalSavings, currentCountry)}{" "}
                      on this order
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
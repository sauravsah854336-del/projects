import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useWishlist } from "../hooks/useWishlist";
import { useCart } from "../hooks/useCart";
import { useState } from "react";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import { formatPrice } from "../utils/priceHelper";

const WishlistPage = () => {
  const navigate = useNavigate();
  const { currentCountry } = useSelector((state) => state.country);
  const { items, total, isLoading, removeItem, isGuest } = useWishlist();
  const { addItem } = useCart();
  const [movingToCart, setMovingToCart] = useState({});
  const [removing, setRemoving] = useState({});

  const handleMoveToCart = async (product) => {
    setMovingToCart((p) => ({ ...p, [product._id]: true }));
    try {
      await addItem(product, 1);
      await removeItem(product._id);
    } catch (err) {
      console.log(err);
    } finally {
      setMovingToCart((p) => ({ ...p, [product._id]: false }));
    }
  };

  const handleRemove = async (productId) => {
    setRemoving((p) => ({ ...p, [productId]: true }));
    try {
      await removeItem(productId);
    } catch (err) {
      console.log(err);
    } finally {
      setRemoving((p) => ({ ...p, [productId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-9 h-9 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-14 rounded-3xl border border-gray-200 max-w-[440px] w-full shadow-sm">
          <p className="text-6xl mb-4">❤️</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 text-sm mb-7">Save products you love to buy them later</p>
          <Link
            to="/products"
            className="inline-block bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white no-underline px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/30 hover:brightness-95 transition"
          >
            Explore Products
          </Link>
          {isGuest && (
            <div className="mt-6 px-4 py-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-left">
              <p className="text-xs text-blue-800 font-bold m-0">💡 Sign in to save your wishlist</p>
              <p className="text-[11px] text-blue-600 mt-0.5 m-0">Your wishlist will sync when you sign in</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-5 sm:py-6 px-3 sm:px-4">
      <div className="max-w-[1200px] mx-auto">

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0 flex items-center gap-2.5">
                <span className="text-2xl">❤️</span> My Wishlist
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#D85A30] border border-orange-200 px-2.5 py-1 rounded-full text-xs font-bold">
                {currentCountry.flag} {currentCountry.currency.code}
              </span>
            </div>
            <p className="text-gray-500 text-[13px] mt-1 m-0">
              {total} {total === 1 ? "item" : "items"} saved
            </p>
          </div>
          <Link
            to="/products"
            className="bg-white text-gray-700 no-underline border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-gray-50 transition"
          >
            Continue Shopping
          </Link>
        </div>

        {isGuest && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl px-5 py-4 flex items-center gap-3.5 mb-5 flex-wrap">
            <span className="text-2xl shrink-0">🔐</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-blue-800 m-0">Sign in to save your wishlist</p>
              <p className="text-xs text-blue-600 mt-0.5 m-0">Your items will sync to your account</p>
            </div>
            <button
              onClick={() => navigate("/login?redirect=/wishlist")}
              className="bg-blue-600 text-white border-none rounded-xl px-5 py-2.5 text-[13px] font-extrabold cursor-pointer whitespace-nowrap hover:bg-blue-700 transition font-[inherit] shrink-0"
            >
              Sign In →
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {items.map((product) => {
            const discount = product.comparePrice > product.price
              ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
              : 0;

            return (
              <div
                key={product._id}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 hover:border-[#D85A30]/40 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-0.5 shadow-sm"
                style={{ opacity: removing[product._id] ? 0.4 : 1, transition: "opacity 0.2s" }}
              >
                <Link to={`/products/${product.slug}`} className="no-underline text-inherit">
                  <div className="relative w-full bg-gray-50 overflow-hidden" style={{ paddingBottom: "100%" }}>
                    <img
                      src={product.images?.[0]?.url || PLACEHOLDER_MEDIUM}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }}
                    />

                    {discount > 0 && (
                      <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-lg shadow-md z-10">
                        -{discount}% OFF
                      </span>
                    )}

                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                        <span className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {product.stock > 0 && product.stock <= 5 && (
                      <div className="absolute bottom-2.5 left-2.5 z-10">
                        <span className="bg-orange-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-md">
                          Only {product.stock} left
                        </span>
                      </div>
                    )}

                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(product._id); }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-red-100 border border-red-300 flex items-center justify-center cursor-pointer hover:bg-red-200 transition z-10"
                    >
                      <svg width="14" height="14" fill="#EF4444" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                  </div>
                </Link>

                <div className="p-3.5">
                  <p className="text-[10px] text-gray-400 mb-1 truncate">
                    {product.vendorStore?.storeName || "Vendor"}
                    {product.category?.name && <span> · {product.category.name}</span>}
                  </p>

                  <Link to={`/products/${product.slug}`} className="no-underline">
                    <h3 className="text-[13px] font-semibold text-gray-900 mb-1.5 line-clamp-2 leading-snug hover:text-[#D85A30] transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {product.averageRating > 0 && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={`text-[10px] ${s <= Math.round(product.averageRating) ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400">({product.totalReviews || 0})</span>
                    </div>
                  )}

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-base font-extrabold text-[#B12704]">
                      {formatPrice(product.price, currentCountry)}
                    </span>
                    {product.comparePrice > product.price && (
                      <span className="text-[10px] text-gray-400 line-through">
                        {formatPrice(product.comparePrice, currentCountry)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {product.stock > 0 ? (
                      <button
                        onClick={() => handleMoveToCart(product)}
                        disabled={movingToCart[product._id]}
                        className="flex-1 bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border border-yellow-500 rounded-xl py-2 text-[11px] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95 transition font-[inherit]"
                      >
                        {movingToCart[product._id] ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <span className="w-3 h-3 border-[1.5px] border-gray-900 border-t-transparent rounded-full animate-spin" />
                            Moving...
                          </span>
                        ) : "🛒 Move to Cart"}
                      </button>
                    ) : (
                      <button disabled className="flex-1 bg-gray-100 text-gray-400 border-none rounded-xl py-2 text-[11px] font-bold cursor-not-allowed font-[inherit]">
                        Out of Stock
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(product._id)}
                      className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-3 py-2 text-[11px] font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
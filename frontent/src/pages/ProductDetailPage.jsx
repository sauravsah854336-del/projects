import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useGetSingleProductQuery } from "../features/product/productApi";
import { useCart } from "../hooks/useCart";
import { useSelector } from "react-redux";
import ReviewList from "../components/reviews/ReviewList";
import WishlistButton from "../components/WishlistButton";
import Price from "../components/Price";
import ShippingBadge from "../components/ShippingBadge";
import { toast } from "../components/Toast";
import {
  formatPrice,
  calculateFinalPrice,
  calculateTax,
  convertPrice,
  getShippingInfo,
} from "../utils/priceHelper";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { currentCountry } = useSelector((state) => state.country);
  const { data, isLoading, error } = useGetSingleProductQuery(slug);
  const { addItem, isLoading: addingToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [actionType, setActionType] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-12 rounded-3xl border border-gray-100 shadow-sm max-w-sm w-full">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            Product not found
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            This product doesn't exist or has been removed.
          </p>
          <Link
            to="/products"
            className="bg-gray-900 text-white px-6 py-3 rounded-xl no-underline inline-block font-bold hover:bg-[#D85A30] transition text-sm"
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const product = data.data;
  const discount =
    product.comparePrice > product.price
      ? Math.round(
          ((product.comparePrice - product.price) / product.comparePrice) * 100,
        )
      : 0;

  const isCustomer = user?.role === "customer";
  const canShop = !user || isCustomer;

  const currentImageUrl = imgError
    ? "https://via.placeholder.com/600x600?text=Product"
    : product.images?.[selectedImage]?.url ||
      "https://via.placeholder.com/600x600?text=Product";

  const totalPriceINR = product.price * quantity;
  const totalPriceLocal = convertPrice(totalPriceINR, currentCountry);
  const taxAmount = currentCountry.tax?.includedInPrice
    ? 0
    : calculateTax(totalPriceLocal, currentCountry);
  const shippingInfo = getShippingInfo(totalPriceINR, currentCountry);

  const handleAddToCart = async () => {
    if (user && !isCustomer) return;
    setActionType("cart");
    try {
      await addItem(product, quantity);
      setAddedSuccess(true);
      toast.success(`Added ${quantity} × ${product.name} to cart!`);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || "Failed to add to cart",
      );
    } finally {
      setActionType(null);
    }
  };

  const handleBuyNow = async () => {
    if (user && !isCustomer) return;
    setActionType("buy");
    try {
      await addItem(product, quantity);
      if (!user) navigate("/login?redirect=/checkout");
      else navigate("/checkout");
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || "Failed to add to cart",
      );
      setActionType(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6 sm:mb-8 flex-wrap">
          <Link
            to="/"
            className="hover:text-gray-700 no-underline transition-colors"
          >
            Home
          </Link>
          <span>/</span>
          <Link
            to="/products"
            className="hover:text-gray-700 no-underline transition-colors"
          >
            Products
          </Link>
          {product.category?.name && (
            <>
              <span>/</span>
              <Link
                to={`/products?category=${product.category._id}`}
                className="hover:text-gray-700 no-underline transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="flex flex-col gap-4">
            <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
              <div
                className="relative w-full"
                style={{ paddingBottom: "100%" }}
              >
                <img
                  src={currentImageUrl}
                  alt={product.name}
                  onError={() => setImgError(true)}
                  className="absolute inset-0 w-full h-full object-contain p-6 sm:p-8 transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discount > 0 && (
                    <span className="bg-[#D85A30] text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                      -{discount}% OFF
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="bg-gray-900 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                      ⭐ Featured
                    </span>
                  )}
                </div>

                {canShop && (
                  <div className="absolute top-4 right-4">
                    <WishlistButton product={product} size="lg" />
                  </div>
                )}

                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[3px] flex items-center justify-center">
                    <span className="bg-gray-900 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-2.5 flex-wrap">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(index);
                      setImgError(false);
                    }}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white flex items-center justify-center ${
                      selectedImage === index
                        ? "border-[#D85A30] shadow-md shadow-orange-500/20"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-contain p-1.5"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/80?text=Img";
                      }}
                    />
                    {selectedImage === index && (
                      <div className="absolute inset-0 border-2 border-[#D85A30] rounded-xl pointer-events-none" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="hidden sm:grid grid-cols-3 gap-3 mt-2">
              {[
                {
                  icon: "🚚",
                  label: "Fast Delivery",
                  sub: `${shippingInfo?.estimatedDays?.standard || 5}-${shippingInfo?.estimatedDays?.express + 5 || 7} days`,
                },
                { icon: "🔄", label: "Easy Returns", sub: "10-day policy" },
                { icon: "🛡️", label: "Secure Payment", sub: "100% protected" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm"
                >
                  <div className="text-xl mb-1">{item.icon}</div>
                  <p className="text-[11px] font-bold text-gray-800 m-0">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.category?.name && (
                <Link
                  to={`/products?category=${product.category._id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D85A30] bg-orange-50 border border-orange-200 px-3 py-1 rounded-full no-underline hover:bg-orange-100 transition w-fit"
                >
                  {product.category.name}
                </Link>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                {currentCountry.flag} Showing in {currentCountry.currency.code}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
              {product.name}
            </h1>

            {product.averageRating > 0 && (
              <a
                href="#reviews"
                className="flex items-center gap-2.5 mb-4 no-underline group w-fit"
              >
                <div className="flex bg-yellow-400 rounded-lg px-2 py-0.5 gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-sm ${star <= Math.round(product.averageRating) ? "text-white" : "text-yellow-200"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-700">
                  {product.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-400 group-hover:text-[#D85A30] transition-colors">
                  ({product.totalReviews}{" "}
                  {product.totalReviews === 1 ? "review" : "reviews"})
                </span>
              </a>
            )}

            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl px-5 py-4 border-2 border-orange-100 mb-4">
              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#B12704]">
                  {formatPrice(product.price, currentCountry)}
                </span>
                {product.comparePrice > product.price && (
                  <>
                    <span className="text-lg text-gray-400 line-through font-medium">
                      {formatPrice(product.comparePrice, currentCountry)}
                    </span>
                    <span className="bg-green-100 text-green-700 text-xs font-extrabold px-2.5 py-1 rounded-full">
                      Save {discount}%
                    </span>
                  </>
                )}
              </div>

              {currentCountry.tax?.includedInPrice ? (
                <p className="text-xs text-green-600 font-semibold m-0 flex items-center gap-1">
                  ✓ Inclusive of {currentCountry.tax.label} (
                  {currentCountry.tax.rate}%)
                </p>
              ) : (
                <p className="text-xs text-gray-500 m-0">
                  +{" "}
                  {formatPrice(
                    product.price * (currentCountry.tax.rate / 100),
                    currentCountry,
                  )}{" "}
                  {currentCountry.tax.label}
                </p>
              )}

              {currentCountry.code !== "IN" && (
                <p className="text-[10px] text-gray-400 mt-1.5 m-0">
                  Original: ₹{product.price.toLocaleString("en-IN")} (Converted
                  at 1 INR = {currentCountry.exchangeRate}{" "}
                  {currentCountry.currency.code})
                </p>
              )}
            </div>

            <div className="mb-4">
              <ShippingBadge orderAmount={product.price} />
            </div>

            {product.shortDescription && (
              <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">
                {product.shortDescription}
              </p>
            )}

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${product.stock > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${product.stock > 0 ? "bg-green-500" : "bg-red-500"}`}
                />
                {product.stock > 0
                  ? `In Stock (${product.stock} available)`
                  : "Out of Stock"}
              </span>
              {product.stock > 0 &&
                product.stock <= (product.lowStockThreshold || 5) && (
                  <span className="text-xs text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
                    ⚠️ Only {product.stock} left!
                  </span>
                )}
            </div>

            <div className="flex flex-col gap-1 mb-5 text-sm">
              {product.brand && (
                <p className="text-gray-500 m-0">
                  Brand:{" "}
                  <span className="font-bold text-gray-900">
                    {product.brand}
                  </span>
                </p>
              )}
              <p className="text-gray-500 m-0">
                Sold by:{" "}
                <span className="font-bold text-gray-900">
                  {product.vendorStore?.storeName || "Vendor"}
                </span>
              </p>
            </div>

            {addedSuccess && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                  ✅
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800 m-0">
                    Added to cart!
                  </p>
                  <p className="text-xs text-green-600 m-0">
                    {quantity} × {product.name}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/cart")}
                  className="bg-green-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl border-none cursor-pointer hover:bg-green-600 transition whitespace-nowrap font-[inherit]"
                >
                  View Cart →
                </button>
              </div>
            )}

            {canShop && product.stock > 0 && (
              <div className="flex items-center gap-4 mb-5 flex-wrap">
                <span className="text-sm font-bold text-gray-700">Qty:</span>
                <div className="flex items-center bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-11 h-11 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-30 border-none bg-transparent cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-12 h-11 flex items-center justify-center font-extrabold text-base text-gray-900 border-x-2 border-gray-200 bg-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock, q + 1))
                    }
                    disabled={quantity >= product.stock}
                    className="w-11 h-11 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-30 border-none bg-transparent cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  Total:{" "}
                  <span className="font-extrabold text-[#B12704] text-base">
                    {formatPrice(totalPriceINR, currentCountry)}
                  </span>
                  {!currentCountry.tax?.includedInPrice && taxAmount > 0 && (
                    <span className="text-[11px] text-gray-400 ml-1">
                      + tax
                    </span>
                  )}
                </div>
              </div>
            )}

            {canShop && (
              <div className="flex flex-col gap-2.5 mb-4">
                <div className="flex gap-3">
                  <button
                    disabled={product.stock <= 0 || addingToCart}
                    onClick={handleAddToCart}
                    className="flex-1 bg-gray-900 text-white py-3.5 rounded-2xl font-extrabold text-sm hover:bg-[#D85A30] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer shadow-md hover:shadow-orange-500/25 font-[inherit]"
                  >
                    {actionType === "cart" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </span>
                    ) : product.stock > 0 ? (
                      "🛒 Add to Cart"
                    ) : (
                      "Out of Stock"
                    )}
                  </button>
                  <button
                    disabled={product.stock <= 0 || addingToCart}
                    onClick={handleBuyNow}
                    className="flex-1 bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white py-3.5 rounded-2xl font-extrabold text-sm hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer shadow-md shadow-orange-500/20 font-[inherit]"
                  >
                    {actionType === "buy" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "⚡ Buy Now"
                    )}
                  </button>
                </div>

                <WishlistButton
                  product={product}
                  size="md"
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    height: 48,
                    fontSize: 14,
                    fontWeight: 700,
                    gap: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </div>
            )}

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-indigo-800 mb-2 m-0">
                📦 Delivery Information
              </p>
              <div className="space-y-1 text-xs text-indigo-700">
                <p className="m-0">
                  📍 Shipping to:{" "}
                  <strong>
                    {currentCountry.flag} {currentCountry.name}
                  </strong>
                </p>
                <p className="m-0">
                  🚚 Standard:{" "}
                  <strong>
                    {shippingInfo?.isFree
                      ? "FREE"
                      : formatPrice(
                          currentCountry.shipping.standardCost /
                            currentCountry.exchangeRate,
                          currentCountry,
                        )}
                  </strong>{" "}
                  · {shippingInfo?.estimatedDays?.standard || 5} days
                </p>
                <p className="m-0">
                  ⚡ Express:{" "}
                  <strong>
                    {formatPrice(
                      currentCountry.shipping.expressCost /
                        currentCountry.exchangeRate,
                      currentCountry,
                    )}
                  </strong>{" "}
                  · {shippingInfo?.estimatedDays?.express || 2} days
                </p>
                {currentCountry.tax?.rate > 0 && (
                  <p className="m-0">
                    💰 {currentCountry.tax.label}:{" "}
                    <strong>{currentCountry.tax.rate}%</strong>{" "}
                    {currentCountry.tax.includedInPrice
                      ? "(included)"
                      : "(extra)"}
                  </p>
                )}
              </div>
            </div>

            {!user && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
                <span className="text-2xl">🔐</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-800 m-0">
                    Sign in for better experience
                  </p>
                  <p className="text-xs text-blue-500 mt-0.5 m-0">
                    Save cart, track orders & get recommendations
                  </p>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl border-none cursor-pointer hover:bg-blue-700 transition whitespace-nowrap font-[inherit]"
                >
                  Sign In
                </button>
              </div>
            )}

            {user && !isCustomer && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 mb-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
                    {user.role === "admin" ? "👑" : "🏪"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-extrabold text-amber-900 m-0">
                        {user.role === "admin"
                          ? "Admin Account"
                          : "Vendor Account"}
                      </p>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 m-0 leading-relaxed">
                      {user.role === "admin"
                        ? "You're viewing this product as an admin. Purchasing is available for customers only."
                        : "You're viewing this product as a vendor. To buy products, use a customer account."}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() =>
                          navigate(
                            user.role === "admin"
                              ? "/admin/dashboard"
                              : "/vendor/dashboard",
                          )
                        }
                        className="bg-amber-600 text-white border-none rounded-lg px-4 py-2 text-xs font-bold cursor-pointer hover:bg-amber-700 transition font-[inherit]"
                      >
                        Go to Dashboard →
                      </button>
                      <button
                        onClick={() => navigate("/products")}
                        className="bg-white text-amber-800 border border-amber-300 rounded-lg px-4 py-2 text-xs font-bold cursor-pointer hover:bg-amber-50 transition font-[inherit]"
                      >
                        Browse More
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 sm:hidden pt-4 border-t border-gray-100">
              {[
                { icon: "🚚", label: "Fast Delivery", sub: "2-5 days" },
                { icon: "🔄", label: "Easy Returns", sub: "10-day" },
                { icon: "🛡️", label: "Secure Pay", sub: "100% safe" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-xl mb-1">{item.icon}</div>
                  <p className="text-[10px] font-bold text-gray-700 m-0">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-14 grid lg:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-base">
                📄
              </span>
              Description
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
              {product.description}
            </p>
          </div>

          {product.specifications?.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center text-base">
                  📋
                </span>
                Specifications
              </h2>
              <div className="space-y-1">
                {product.specifications.map((spec, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center py-2.5 px-3 rounded-xl text-sm ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                  >
                    <span className="text-gray-500 font-medium shrink-0 mr-4">
                      {spec.key}
                    </span>
                    <span className="text-gray-900 font-semibold text-right">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {product.tags?.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-white border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full hover:border-[#D85A30] hover:text-[#D85A30] transition cursor-default shadow-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div id="reviews" className="mt-12 sm:mt-16 scroll-mt-8">
          <ReviewList product={product} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

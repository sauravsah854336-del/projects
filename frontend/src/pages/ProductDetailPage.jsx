import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useGetSingleProductQuery,
  useGetRelatedProductsQuery,
} from "../features/product/productApi";
import { useCart } from "../hooks/useCart";
import { useSelector } from "react-redux";
import ReviewList from "../components/reviews/ReviewList";
import WishlistButton from "../components/WishlistButton";
import Price from "../components/Price";
import ShippingBadge from "../components/ShippingBadge";
import OtherSellers from "../components/OtherSellers";
import { toast } from "../components/Toast";
import {
  formatPrice,
  calculateTax,
  convertPrice,
  getShippingInfo,
} from "../utils/priceHelper";

const roomTypeLabels = {
  "living-room": "🛋️ Living Room",
  "bedroom": "🛏️ Bedroom",
  "kitchen": "🍳 Kitchen",
  "bathroom": "🚿 Bathroom",
  "office": "💼 Office",
  "outdoor": "🏡 Outdoor",
  "kids-room": "🧸 Kids Room",
  "dining-room": "🍽️ Dining Room",
  "hallway": "🚪 Hallway",
  "garage": "🚗 Garage",
};

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { currentCountry, isUserCountry } = useSelector((state) => state.country);
  const { data, isLoading, error } = useGetSingleProductQuery(slug);
  const { addItem, isLoading: addingToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [actionType, setActionType] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const { data: relatedData } = useGetRelatedProductsQuery(data?.data?._id, {
    skip: !data?.data?._id,
  });
  const relatedProducts = relatedData?.data || [];
  const otherSellers = data?.otherSellers || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-12 rounded-3xl border border-gray-100 shadow-sm max-w-sm w-full">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-400 text-sm mb-6">This product doesn't exist or has been removed.</p>
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
  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const isCustomer = user?.role === "customer";
  const canShop = !user || isCustomer;

  const currentImageUrl = imgError
    ? "https://via.placeholder.com/600x600?text=Product"
    : product.images?.[selectedImage]?.url || "https://via.placeholder.com/600x600?text=Product";

  const sizePriceModifier = selectedSize?.priceModifier || 0;
  const effectivePrice = product.price + sizePriceModifier;
  const totalPriceINR = effectivePrice * quantity;
  const totalPriceLocal = convertPrice(totalPriceINR, currentCountry);
  const taxAmount = currentCountry.tax?.includedInPrice ? 0 : calculateTax(totalPriceLocal, currentCountry);
  const shippingInfo = getShippingInfo(totalPriceINR, currentCountry);

  const groupedSpecs = (product.specifications || []).reduce((acc, spec) => {
    const group = spec.group || "General";
    if (!acc[group]) acc[group] = [];
    acc[group].push(spec);
    return acc;
  }, {});

  const currentPrice = product.price;
  const cheapestOtherPrice = otherSellers.length > 0
    ? Math.min(...otherSellers.map(s => s.price))
    : null;
  const isCurrentCheapest = cheapestOtherPrice === null || currentPrice <= cheapestOtherPrice;
  const savingsIfSwitched = cheapestOtherPrice && !isCurrentCheapest
    ? currentPrice - cheapestOtherPrice
    : 0;

  const handleAddToCart = async () => {
    if (user && !isCustomer) return;
    setActionType("cart");
    try {
      await addItem(product, quantity);
      setAddedSuccess(true);
      toast.success(`Added ${quantity} × ${product.name} to cart!`);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to add to cart");
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
      toast.error(err?.data?.message || err?.message || "Failed to add to cart");
      setActionType(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6 sm:mb-8 flex-wrap">
          <Link to="/" className="hover:text-gray-700 no-underline transition">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-gray-700 no-underline transition">Products</Link>
          {product.category?.name && (
            <>
              <span>/</span>
              <Link to={`/products?category=${product.category._id}`} className="hover:text-gray-700 no-underline transition">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="flex flex-col gap-4">
            <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
              <div className="relative w-full" style={{ paddingBottom: "100%" }}>
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
                  {product.isNewArrival && (
                    <span className="bg-blue-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                      🆕 New Arrival
                    </span>
                  )}
                  {otherSellers.length > 0 && isCurrentCheapest && (
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      ⚡ BEST PRICE
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
                    onClick={() => { setSelectedImage(index); setImgError(false); }}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white flex items-center justify-center ${
                      selectedImage === index
                        ? "border-[#D85A30] shadow-md shadow-orange-500/20"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-contain p-1.5" />
                  </button>
                ))}
              </div>
            )}

            {product.videoUrl && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">🎬 Product Video</p>
                {product.videoUrl.includes("youtube") || product.videoUrl.includes("youtu.be") ? (
                  <div className="aspect-video rounded-xl overflow-hidden">
                    <iframe
                      src={product.videoUrl.replace("watch?v=", "embed/")}
                      className="w-full h-full"
                      title="Product video"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video controls className="w-full rounded-xl">
                    <source src={product.videoUrl} />
                  </video>
                )}
              </div>
            )}

            <div className="hidden sm:grid grid-cols-3 gap-3 mt-2">
              {[
                { icon: "🚚", label: "Fast Delivery", sub: `${product.shipping?.estimatedDeliveryDays || 5} days` },
                { icon: "🔄", label: "Easy Returns", sub: `${product.returnPolicy?.returnWindow || 10}-day policy` },
                { icon: "🛡️", label: "Secure Payment", sub: "100% protected" },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
                  <div className="text-xl mb-1">{item.icon}</div>
                  <p className="text-[11px] font-bold text-gray-800 m-0">{item.label}</p>
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D85A30] bg-orange-50 border border-orange-200 px-3 py-1 rounded-full no-underline hover:bg-orange-100 transition"
                >
                  {product.category.name}
                </Link>
              )}
              {product.brand && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">
                  🏷️ {product.brand}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                {currentCountry.flag} {currentCountry.currency.code}
              </span>
              {isUserCountry && (
                <span className="inline-flex items-center text-[10px] font-extrabold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                  YOUR PROFILE
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
              {product.name}
            </h1>

            {product.modelNumber && (
              <p className="text-xs text-gray-500 mb-2 m-0">
                Model: <span className="font-mono font-bold text-gray-700">{product.modelNumber}</span>
              </p>
            )}

            {product.averageRating > 0 && (
              <a href="#reviews" className="flex items-center gap-2.5 mb-4 no-underline group w-fit">
                <div className="flex bg-green-600 rounded-lg px-2 py-0.5 items-center gap-1">
                  <span className="text-white text-xs font-extrabold">{product.averageRating.toFixed(1)}</span>
                  <span className="text-white text-xs">★</span>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-[#D85A30] transition-colors underline">
                  {product.totalReviews} {product.totalReviews === 1 ? "review" : "reviews"}
                </span>
                {product.totalSold > 0 && (
                  <span className="text-xs text-gray-400">· {product.totalSold} sold</span>
                )}
              </a>
            )}

            {product.keyFeatures?.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-2xl border-2 border-blue-100 p-4 mb-4">
                <p className="text-xs font-extrabold text-blue-700 uppercase tracking-wider m-0 mb-2.5">✨ Key Features</p>
                <ul className="space-y-1.5 m-0 pl-0 list-none">
                  {product.keyFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl px-5 py-4 border-2 border-orange-100 mb-4">
              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#B12704]">
                  {formatPrice(effectivePrice, currentCountry)}
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
                  ✓ Inclusive of {currentCountry.tax.label} ({currentCountry.tax.rate}%)
                </p>
              ) : (
                <p className="text-xs text-gray-500 m-0">
                  + {formatPrice(effectivePrice * (currentCountry.tax.rate / 100), currentCountry)} {currentCountry.tax.label}
                </p>
              )}

              {otherSellers.length > 0 && savingsIfSwitched > 0 && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💡</span>
                    <p className="text-xs text-orange-700 font-semibold m-0">
                      Available from <strong className="text-green-600">{formatPrice(cheapestOtherPrice, currentCountry)}</strong> from other sellers
                      <a href="#other-sellers" className="text-[#D85A30] font-bold no-underline hover:underline ml-1">
                        (Save {formatPrice(savingsIfSwitched, currentCountry)}) →
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {product.bulkPricing?.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-purple-700 uppercase mb-2">📦 Bulk Discounts</p>
                <div className="space-y-1">
                  {product.bulkPricing.map((tier, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-600">Buy {tier.minQuantity}+ pieces</span>
                      <span className="font-bold text-purple-700">
                        {formatPrice(tier.pricePerUnit, currentCountry)} each
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.colors?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-bold text-gray-700 mb-2">
                  Color: <span className="text-[#D85A30]">{selectedColor?.name || "Select"}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedColor?.name === color.name
                          ? "border-[#D85A30] ring-2 ring-orange-200 scale-110"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ background: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.sizes?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-bold text-gray-700 mb-2">
                  Size: <span className="text-[#D85A30]">{selectedSize?.name || "Select"}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSize(size)}
                      disabled={size.stock === 0}
                      className={`min-w-[3rem] px-3 py-2 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all font-[inherit] ${
                        size.stock === 0
                          ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed line-through"
                          : selectedSize?.name === size.name
                          ? "bg-[#D85A30] text-white border-[#D85A30] shadow-md"
                          : "bg-white text-gray-700 border-gray-200 hover:border-[#D85A30]"
                      }`}
                    >
                      {size.name}
                      {size.priceModifier > 0 && ` (+₹${size.priceModifier})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.materials?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-bold text-gray-700 mb-2">🪵 Materials:</p>
                <div className="flex gap-1.5 flex-wrap">
                  {product.materials.map((mat, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-full font-semibold">
                      {mat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.roomType?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-bold text-gray-700 mb-2">🏠 Perfect for:</p>
                <div className="flex gap-1.5 flex-wrap">
                  {product.roomType.map((room, i) => (
                    <span key={i} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                      {roomTypeLabels[room] || room}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <ShippingBadge orderAmount={effectivePrice} />
            </div>

            {product.shortDescription && (
              <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">
                {product.shortDescription}
              </p>
            )}

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${
                product.stock > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? "bg-green-500" : "bg-red-500"}`} />
                {product.stock > 0 ? `In Stock (${product.stock} available)` : "Out of Stock"}
              </span>
              {product.stock > 0 && product.stock <= (product.lowStockThreshold || 5) && (
                <span className="text-xs text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
                  ⚠️ Only {product.stock} left!
                </span>
              )}
              {product.assemblyRequired && (
                <span className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                  🔧 Assembly: ~{product.assemblyTime}min
                </span>
              )}
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0">
                  {product.vendorStore?.storeName?.[0]?.toUpperCase() || "V"}
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide m-0">Sold by</p>
                  <p className="text-sm font-extrabold text-gray-900 m-0">{product.vendorStore?.storeName || "Verified Vendor"}</p>
                </div>
              </div>
              {otherSellers.length > 0 && (
                <a
                  href="#other-sellers"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 no-underline flex items-center gap-1"
                >
                  +{otherSellers.length} more seller{otherSellers.length > 1 ? "s" : ""}
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" />
                  </svg>
                </a>
              )}
            </div>

            {addedSuccess && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-lg shrink-0">✅</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800 m-0">Added to cart!</p>
                  <p className="text-xs text-green-600 m-0">{quantity} × {product.name}</p>
                </div>
                <button onClick={() => navigate("/cart")} className="bg-green-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl border-none cursor-pointer hover:bg-green-600 transition whitespace-nowrap font-[inherit]">
                  View Cart →
                </button>
              </div>
            )}

            {canShop && product.stock > 0 && (
              <>
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
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock}
                      className="w-11 h-11 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-30 border-none bg-transparent cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Total: <span className="font-extrabold text-[#B12704] text-base">
                      {formatPrice(totalPriceINR, currentCountry)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 mb-4">
                  <div className="flex gap-3">
                    <button
                      disabled={addingToCart}
                      onClick={handleAddToCart}
                      className="flex-1 bg-gray-900 text-white py-3.5 rounded-2xl font-extrabold text-sm hover:bg-[#D85A30] transition-all disabled:opacity-50 border-none cursor-pointer shadow-md font-[inherit]"
                    >
                      {actionType === "cart" ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Adding...
                        </span>
                      ) : "🛒 Add to Cart"}
                    </button>
                    <button
                      disabled={addingToCart}
                      onClick={handleBuyNow}
                      className="flex-1 bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white py-3.5 rounded-2xl font-extrabold text-sm hover:brightness-90 transition-all disabled:opacity-50 border-none cursor-pointer shadow-md font-[inherit]"
                    >
                      {actionType === "buy" ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : "⚡ Buy Now"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {product.warranty?.type !== "none" && product.warranty?.duration > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-white border-2 border-blue-100 rounded-2xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🛡️</div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-blue-800 m-0">
                      {product.warranty.duration} {product.warranty.unit} {product.warranty.type} warranty
                    </p>
                    {product.warranty.description && (
                      <p className="text-xs text-blue-600 mt-1 m-0">{product.warranty.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {product.returnPolicy?.returnable && (
              <div className="bg-gradient-to-r from-green-50 to-white border-2 border-green-100 rounded-2xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔄</div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-green-800 m-0">
                      {product.returnPolicy.returnWindow}-day easy returns
                    </p>
                    {product.returnPolicy.returnConditions && (
                      <p className="text-xs text-green-600 mt-1 m-0">{product.returnPolicy.returnConditions}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-indigo-800 mb-2 m-0">📦 Delivery Information</p>
              <div className="space-y-1 text-xs text-indigo-700">
                <p className="m-0">
                  📍 Shipping to: <strong>{currentCountry.flag} {currentCountry.name}</strong>
                </p>
                <p className="m-0">
                  🚚 <strong>{product.shipping?.isFreeShipping ? "FREE Shipping" : `₹${product.shipping?.shippingCost || 50}`}</strong> · {product.shipping?.estimatedDeliveryDays || 5} days
                </p>
                <p className="m-0">
                  ⏱️ Handling time: <strong>{product.shipping?.handlingTime || 1} day{product.shipping?.handlingTime > 1 ? "s" : ""}</strong>
                </p>
                {product.assemblyRequired && (
                  <p className="m-0">🔧 Assembly required: <strong>~{product.assemblyTime} minutes</strong></p>
                )}
              </div>
            </div>

            {!user && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
                <span className="text-2xl">🔐</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-800 m-0">Sign in for better experience</p>
                  <p className="text-xs text-blue-500 mt-0.5 m-0">Save cart, track orders & get recommendations</p>
                </div>
                <button onClick={() => navigate("/login")} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl border-none cursor-pointer hover:bg-blue-700 transition font-[inherit]">
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
                    <p className="text-sm font-extrabold text-amber-900 m-0 mb-1">
                      {user.role === "admin" ? "Admin Account" : "Vendor Account"}
                    </p>
                    <p className="text-xs text-amber-700 m-0 leading-relaxed">
                      You're viewing this as {user.role}. Purchasing is available for customers only.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {otherSellers.length > 0 && (
          <div id="other-sellers" className="mt-10 sm:mt-14 scroll-mt-8">
            <OtherSellers
              sellers={otherSellers}
              currency={currentCountry?.currency?.symbol || "₹"}
              currentSellerName={product.vendorStore?.storeName}
            />
          </div>
        )}

        <div className="mt-10 sm:mt-14 grid lg:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-base">📄</span>
              Description
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
              {product.description}
            </p>
          </div>

          {Object.keys(groupedSpecs).length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center text-base">📋</span>
                Specifications
              </h2>
              <div className="space-y-4">
                {Object.entries(groupedSpecs).map(([group, specs]) => (
                  <div key={group}>
                    <p className="text-xs font-extrabold text-purple-600 uppercase tracking-wider mb-2">{group}</p>
                    <div className="space-y-1">
                      {specs.map((spec, i) => (
                        <div key={i} className={`flex justify-between items-center py-2 px-3 rounded-lg text-sm ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                          <span className="text-gray-500 font-medium shrink-0 mr-4">{spec.key}</span>
                          <span className="text-gray-900 font-semibold text-right">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {(product.weight > 0 || product.dimensions?.length > 0) && (
          <div className="mt-6 bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-base">📐</span>
              Dimensions & Weight
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {product.dimensions?.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase m-0">Length</p>
                  <p className="text-lg font-extrabold text-gray-900 m-0 mt-1">{product.dimensions.length}</p>
                  <p className="text-[10px] text-gray-500 m-0">{product.dimensions.unit}</p>
                </div>
              )}
              {product.dimensions?.width > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-blue-600 uppercase m-0">Width</p>
                  <p className="text-lg font-extrabold text-gray-900 m-0 mt-1">{product.dimensions.width}</p>
                  <p className="text-[10px] text-gray-500 m-0">{product.dimensions.unit}</p>
                </div>
              )}
              {product.dimensions?.height > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-purple-600 uppercase m-0">Height</p>
                  <p className="text-lg font-extrabold text-gray-900 m-0 mt-1">{product.dimensions.height}</p>
                  <p className="text-[10px] text-gray-500 m-0">{product.dimensions.unit}</p>
                </div>
              )}
              {product.weight > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-orange-600 uppercase m-0">Weight</p>
                  <p className="text-lg font-extrabold text-gray-900 m-0 mt-1">{product.weight}</p>
                  <p className="text-[10px] text-gray-500 m-0">{product.weightUnit}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {product.faqs?.length > 0 && (
          <div className="mt-6 bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-base">❓</span>
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {product.faqs.map((faq, i) => (
                <div key={i} className="border-2 border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition text-left border-none cursor-pointer font-[inherit]"
                  >
                    <span className="text-sm font-bold text-gray-900">Q: {faq.question}</span>
                    <svg
                      width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                      className="text-gray-400 transition-transform shrink-0"
                      style={{ transform: expandedFaq === i ? "rotate(180deg)" : "rotate(0)" }}
                    >
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" />
                    </svg>
                  </button>
                  {expandedFaq === i && (
                    <div className="p-4 bg-blue-50 border-t border-gray-100">
                      <p className="text-sm text-gray-700 m-0 leading-relaxed">
                        <strong className="text-blue-600">A:</strong> {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {product.tags?.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Tags</p>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/products?search=${tag}`}
                  className="bg-white border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full hover:border-[#D85A30] hover:text-[#D85A30] transition no-underline shadow-sm"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {relatedProducts.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <h2 className="text-xl font-extrabold text-gray-900 mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#D85A30] rounded-full" />
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.slice(0, 8).map((p) => (
                <div
                  key={p._id}
                  onClick={() => navigate(`/products/${p.slug}`)}
                  className="group bg-white rounded-2xl border-2 border-gray-100 overflow-hidden cursor-pointer transition-all hover:border-[#D85A30] hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="relative w-full bg-gray-50" style={{ paddingBottom: "100%" }}>
                    <img
                      src={p.images?.[0]?.url || "https://via.placeholder.com/200"}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1.5 group-hover:text-[#D85A30] transition">
                      {p.name}
                    </h4>
                    {p.averageRating > 0 && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] text-yellow-400">★</span>
                        <span className="text-[10px] font-bold text-gray-700">{p.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                    <Price amount={p.price} comparePrice={p.comparePrice} size="sm" showSavings={false} />
                  </div>
                </div>
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
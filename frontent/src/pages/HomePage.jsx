import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllProductsQuery } from "../features/product/productApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useGetPublicCouponsQuery } from "../features/coupon/couponApi";
import { useCart } from "../hooks/useCart";
import { useSelector } from "react-redux";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import WishlistButton from "../components/WishlistButton";
import { toast } from "../components/Toast";
import { formatPrice, getShippingInfo } from "../utils/priceHelper";

const categoryIcons = {
  furniture: "🛋️", kitchen: "🍳", electronics: "📱", walls: "🧱",
  decorative: "🖼️", upholstery: "🧵", finishes: "🎨", floors: "🪵",
  furnishing: "🪟", sofas: "🛋️", chairs: "🪑", tables: "🪑",
  beds: "🛏️", wardrobes: "🚪", shelves: "📚", desks: "🖥️",
  cabinets: "🗄️", cookware: "🍳", appliances: "🔌", utensils: "🍴",
  storage: "📦", dining: "🍽️", smartphones: "📱", laptops: "💻",
  tablets: "📱", cameras: "📷", headphones: "🎧", speakers: "🔊",
  gaming: "🎮", wearables: "⌚", tv: "📺", printers: "🖨️",
  "wall art": "🖼️", wallpaper: "🎨", clocks: "🕐", mirrors: "🪞",
  shelving: "📚", decor: "🏠", fashion: "👗", clothing: "👔",
  cloth: "👕", "men's clothing": "👔", "women's clothing": "👗",
  "kids clothing": "👶", shoes: "👟", footwear: "👞", accessories: "⌚",
  bags: "👜", jewelry: "💍", watches: "⌚", sunglasses: "🕶️",
  belts: "👔", hats: "🧢", "home decor": "🏠", "home & living": "🏡",
  "living room": "🛋️", bedroom: "🛏️", bathroom: "🚿", outdoor: "🏡",
  garden: "🌿", lighting: "💡", curtains: "🪟", rugs: "🧶",
  cushions: "🛋️", beauty: "💄", skincare: "🧴", haircare: "💇",
  makeup: "💄", fragrance: "🌸", "personal care": "🧼", health: "💊",
  fitness: "💪", supplements: "💊", yoga: "🧘", sports: "⚽",
  cricket: "🏏", football: "⚽", basketball: "🏀", tennis: "🎾",
  swimming: "🏊", cycling: "🚴", camping: "⛺", hiking: "🥾",
  books: "📚", stationery: "✏️", notebooks: "📓", pens: "🖊️",
  art: "🎨", toys: "🧸", games: "🎲", puzzles: "🧩",
  "baby products": "👶", "kids furniture": "🪑", grocery: "🛒",
  food: "🍔", snacks: "🍪", beverages: "🥤", organic: "🥬",
  dairy: "🥛", bakery: "🍞", automotive: "🚗", "car accessories": "🚗",
  "bike accessories": "🏍️", office: "💼", "office furniture": "🖥️",
  "office supplies": "📎", pets: "🐾", "dog supplies": "🐕",
  "cat supplies": "🐈", music: "🎵", instruments: "🎸", movies: "🎬",
  travel: "✈️", luggage: "🧳", "travel accessories": "🎒", tools: "🔧",
  hardware: "🔩", plumbing: "🚿", electrical: "⚡", paint: "🎨",
  cleaning: "🧹", laundry: "👕", "cleaning supplies": "🧽",
  christmas: "🎄", diwali: "🪔", holi: "🎨", valentine: "❤️",
  "new year": "🎆", gifts: "🎁", crafts: "✂️", flowers: "💐",
  candles: "🕯️", antiques: "🏺", ac: "❄️", microwave: "🔥",
  refrigerator: "🧊", "washing machine": "🌀",
};

const categoryColors = [
  { bg: "bg-orange-50", icon: "bg-orange-100", hover: "hover:bg-orange-100", border: "hover:border-orange-300", text: "group-hover:text-orange-600" },
  { bg: "bg-blue-50",   icon: "bg-blue-100",   hover: "hover:bg-blue-100",   border: "hover:border-blue-300",   text: "group-hover:text-blue-600"   },
  { bg: "bg-green-50",  icon: "bg-green-100",  hover: "hover:bg-green-100",  border: "hover:border-green-300",  text: "group-hover:text-green-600"  },
  { bg: "bg-purple-50", icon: "bg-purple-100", hover: "hover:bg-purple-100", border: "hover:border-purple-300", text: "group-hover:text-purple-600" },
  { bg: "bg-pink-50",   icon: "bg-pink-100",   hover: "hover:bg-pink-100",   border: "hover:border-pink-300",   text: "group-hover:text-pink-600"   },
  { bg: "bg-yellow-50", icon: "bg-yellow-100", hover: "hover:bg-yellow-100", border: "hover:border-yellow-300", text: "group-hover:text-yellow-600" },
  { bg: "bg-teal-50",   icon: "bg-teal-100",   hover: "hover:bg-teal-100",   border: "hover:border-teal-300",   text: "group-hover:text-teal-600"   },
  { bg: "bg-red-50",    icon: "bg-red-100",    hover: "hover:bg-red-100",    border: "hover:border-red-300",    text: "group-hover:text-red-600"    },
];

const ProductCard = ({
  product, canShop, loading, isAdded,
  onAddToCart, onBuyNow, currentCountry, userRole,
}) => {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();
  const discount =
    product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  return (
    <div
      onClick={() => navigate(`/products/${product.slug}`)}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 hover:border-[#D85A30]/40 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 cursor-pointer flex-shrink-0"
      style={{ width: "220px", height: "380px" }}
    >
      <div
        className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden shrink-0"
        style={{ height: "180px" }}
      >
        <img
          src={imgError ? PLACEHOLDER_MEDIUM : product.images?.[0]?.url || PLACEHOLDER_MEDIUM}
          alt={product.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.isFeatured && (
            <span className="bg-gray-900 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-sm">
              ⭐ Featured
            </span>
          )}
          {discount > 0 && (
            <span className="bg-[#D85A30] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-sm">
              -{discount}%
            </span>
          )}
        </div>

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}

        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              Only {product.stock} left
            </span>
          </div>
        )}

        {canShop && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10">
            <div onClick={(e) => e.stopPropagation()}>
              <WishlistButton product={product} size="sm" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3 min-h-0">
        <p className="text-[10px] text-gray-400 mb-1 truncate shrink-0">
          {product.vendorStore?.storeName || "Vendor"}
          {product.category?.name && <span> · {product.category.name}</span>}
        </p>

        <h3
          className="text-[12px] sm:text-[13px] font-medium text-gray-800 mb-1.5 line-clamp-2 leading-snug shrink-0"
          style={{ minHeight: "32px" }}
        >
          {product.name}
        </h3>

        <div className="flex items-center gap-1 mb-1.5 shrink-0" style={{ minHeight: "14px" }}>
          {product.averageRating > 0 ? (
            <>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={`text-[10px] ${s <= Math.round(product.averageRating) ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                ))}
              </div>
              <span className="text-[10px] text-gray-400">({product.totalReviews || 0})</span>
            </>
          ) : (
            <span className="text-[10px] text-gray-300">No reviews yet</span>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 mb-2.5 shrink-0" style={{ minHeight: "20px" }}>
          <span className="text-sm sm:text-base font-extrabold text-[#B12704]">
            {formatPrice(product.price, currentCountry)}
          </span>
          {product.comparePrice > product.price && (
            <span className="text-[10px] text-gray-400 line-through">
              {formatPrice(product.comparePrice, currentCountry)}
            </span>
          )}
        </div>

        <div className="mt-auto shrink-0">
          {canShop && product.stock > 0 && (
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart(e, product); }}
                disabled={loading === "cart"}
                className={`flex-1 text-[10px] sm:text-[11px] font-bold py-2 rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isAdded
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border-yellow-400 hover:brightness-95"
                }`}
              >
                {loading === "cart" ? (
                  <span className="flex items-center justify-center gap-1">
                    <span className="w-2.5 h-2.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
                  </span>
                ) : isAdded ? "✓ Added" : "Add to Cart"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onBuyNow(e, product); }}
                disabled={loading === "buy"}
                className="flex-1 bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white text-[10px] sm:text-[11px] font-bold py-2 rounded-lg border-none cursor-pointer transition-all hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === "buy" ? (
                  <span className="flex items-center justify-center gap-1">
                    <span className="w-2.5 h-2.5 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
                  </span>
                ) : "Buy Now"}
              </button>
            </div>
          )}

          {canShop && product.stock <= 0 && (
            <button disabled className="w-full py-2 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-400 border-none cursor-not-allowed">
              Out of Stock
            </button>
          )}

          {!canShop && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-[10px]">{userRole === "admin" ? "👑" : "🏪"}</span>
                <p className="text-[10px] text-amber-700 m-0 font-bold capitalize">{userRole} Preview</p>
              </div>
              <div className="w-full bg-gray-900 text-white text-[11px] font-bold py-2 rounded-lg text-center">
                View Details →
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div
    className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse flex-shrink-0"
    style={{ width: "220px", height: "380px" }}
  >
    <div className="w-full bg-gray-200 shrink-0" style={{ height: "180px" }} />
    <div className="p-3 space-y-2 flex flex-col h-[200px]">
      <div className="h-2.5 bg-gray-200 rounded-full w-1/2" />
      <div className="h-3 bg-gray-200 rounded-full w-4/5" />
      <div className="h-3 bg-gray-200 rounded-full w-3/5" />
      <div className="h-4 bg-gray-200 rounded-full w-2/5" />
      <div className="flex-1" />
      <div className="h-8 bg-gray-100 rounded-lg" />
    </div>
  </div>
);

const SectionHeader = ({ icon, title, subtitle, link, linkLabel }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6">
    <div>
      {icon ? (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg sm:text-xl">{icon}</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{title}</h2>
        </div>
      ) : (
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">{title}</h2>
      )}
      {subtitle && <p className="text-gray-500 text-xs sm:text-sm">{subtitle}</p>}
    </div>
    {link && (
      <Link
        to={link}
        className="text-xs sm:text-sm font-semibold text-[#D85A30] border border-[#D85A30]/40 bg-orange-50 px-4 py-1.5 rounded-full no-underline hover:bg-[#D85A30] hover:text-white transition-all shrink-0"
      >
        {linkLabel} →
      </Link>
    )}
  </div>
);

const CategorySkeleton = () => (
  <div className="flex flex-col items-center gap-2.5 p-4 bg-white border border-gray-100 rounded-2xl animate-pulse flex-shrink-0" style={{ minWidth: "100px" }}>
    <div className="w-14 h-14 bg-gray-200 rounded-xl" />
    <div className="h-3 bg-gray-200 rounded-full w-14" />
    <div className="h-2.5 bg-gray-100 rounded-full w-10" />
  </div>
);

const CategoryCard = ({ category, index, onClick }) => {
  const color = categoryColors[index % categoryColors.length];
  const icon = categoryIcons[category.name.toLowerCase()] || "📦";
  const productCount = category.productCount || 0;

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 p-3 sm:p-4 bg-white border-2 border-gray-100 rounded-2xl cursor-pointer transition-all duration-200 flex-shrink-0 ${color.hover} ${color.border} hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]`}
      style={{ minWidth: "90px" }}
    >
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-200 ${color.icon} group-hover:scale-110 shadow-sm`}>
        {icon}
      </div>
      <p className={`text-[11px] sm:text-xs font-semibold text-gray-700 text-center leading-tight transition-colors ${color.text} max-w-[80px] line-clamp-2`}>
        {category.name}
      </p>
      {productCount > 0 && (
        <span className="text-[10px] text-gray-400 font-medium">
          {productCount > 99 ? "99+" : productCount} items
        </span>
      )}
    </div>
  );
};

const ShopByCategorySection = ({ categories, isLoading, onCategoryClick }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const INITIAL_SHOW = 16;
  const displayCategories = showAll ? categories : categories.slice(0, INITIAL_SHOW);
  const hasMore = categories.length > INITIAL_SHOW;

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [categories]);

  if (!isLoading && categories.length === 0) return null;

  return (
    <section className="bg-white py-8 sm:py-12 px-4 sm:px-6 border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🗂️</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                Shop by Category
              </h2>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm">
              Browse {isLoading ? "..." : categories.length}+ departments · Find exactly what you need
            </p>
          </div>

          <button
            onClick={() => navigate("/categories")}
            className="group flex items-center gap-2 text-sm font-semibold text-[#D85A30] border-2 border-[#D85A30]/30 bg-orange-50 px-5 py-2 rounded-full cursor-pointer hover:bg-[#D85A30] hover:text-white hover:border-[#D85A30] transition-all duration-200 shrink-0"
          >
            <span>Browse All Departments</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        <div className="block sm:hidden">
          <div className="relative">
            {showLeft && (
              <button
                onClick={() => scroll("left")}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-all text-sm"
              >
                ‹
              </button>
            )}
            {showRight && (
              <button
                onClick={() => scroll("right")}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-all text-sm"
              >
                ›
              </button>
            )}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-3 overflow-x-auto pb-3"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => <CategorySkeleton key={i} />)
                : categories.map((cat, i) => (
                    <CategoryCard
                      key={cat._id}
                      category={cat}
                      index={i}
                      onClick={() => onCategoryClick(cat)}
                    />
                  ))}
            </div>
          </div>
        </div>

        <div className="hidden sm:block">
          {isLoading ? (
            <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl animate-pulse">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl" />
                  <div className="h-3 bg-gray-200 rounded-full w-14" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
                {displayCategories.map((cat, i) => (
                  <CategoryCard
                    key={cat._id}
                    category={cat}
                    index={i}
                    onClick={() => onCategoryClick(cat)}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-600 border border-gray-200 bg-white px-6 py-2.5 rounded-full cursor-pointer hover:border-[#D85A30] hover:text-[#D85A30] transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {showAll ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                        Show Less
                      </>
                    ) : (
                      <>
                        Show {categories.length - INITIAL_SHOW} More Categories
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>


      </div>
    </section>
  );
};

const ScrollableSection = ({
  icon, title, subtitle, link, linkLabel,
  products, isLoading, canShop,
  loadingProducts, addedProducts,
  onAddToCart, onBuyNow, currentCountry, userRole,
}) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Always use scroll mode when we have products (Amazon/Flipkart style)
  const shouldScroll = products.length >= 5;

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    scrollContainerRef.current?.scrollBy({
      left: direction === "left" ? -460 : 460,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && shouldScroll) {
      container.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [shouldScroll, products.length]);

  if (!products.length && !isLoading) return null;

  const renderProducts = (productList) =>
    productList.map((product) => (
      <ProductCard
        key={product._id}
        product={product}
        canShop={canShop}
        loading={loadingProducts[product._id]}
        isAdded={addedProducts[product._id]}
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
        currentCountry={currentCountry}
        userRole={userRole}
      />
    ));

  return (
    <section className="py-8 sm:py-10 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          icon={icon} title={title} subtitle={subtitle}
          link={link} linkLabel={linkLabel}
        />

        {shouldScroll ? (
          <div className="relative group">
            {showLeftArrow && (
              <button
                onClick={() => scroll("left")}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 duration-200"
              >
                <span className="text-lg">←</span>
              </button>
            )}
            {showRightArrow && (
              <button
                onClick={() => scroll("right")}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 duration-200"
              >
                <span className="text-lg">→</span>
              </button>
            )}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 pt-2"
              style={{
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                paddingLeft: "4px",
                paddingRight: "4px",
              }}
            >
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : renderProducts(products)}
            </div>
          </div>
        ) : (
          <div className="flex gap-4 flex-wrap">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : renderProducts(products)}
          </div>
        )}
      </div>
    </section>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { currentCountry } = useSelector((state) => state.country);
  const { addItem } = useCart();
  const [addedProducts, setAddedProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});
  const [couponCopied, setCouponCopied] = useState(null);

  const { data: productsData, isLoading: productsLoading } =
    useGetAllProductsQuery({ limit: 100, sort: "newest" });
  const { data: categoryData, isLoading: categoriesLoading } =
    useGetCategoryTreeQuery();

  const isCustomer = user?.role === "customer";
  const canShop = !user || isCustomer;
  const userRole = user?.role || "guest";
  const categories = [...(categoryData?.data || [])].sort(
    (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  );
  const products = productsData?.data || [];

  const { data: couponsData } = useGetPublicCouponsQuery(
    currentCountry?.code || "IN",
    { skip: !canShop },
  );
  const activeCoupons = couponsData?.data || [];

  const featuredProducts = products.filter((p) => p.isFeatured);
  const latestProducts = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);
  const topRatedProducts = [...products].filter((p) => p.averageRating >= 4).sort((a, b) => b.averageRating - a.averageRating).slice(0, 20);
  const bestSellersProducts = [...products].filter((p) => p.totalReviews >= 10).sort((a, b) => b.totalReviews - a.totalReviews).slice(0, 20);
  const discountedProducts = [...products]
    .filter((p) => p.comparePrice > p.price)
    .sort((a, b) => {
      const dA = ((a.comparePrice - a.price) / a.comparePrice) * 100;
      const dB = ((b.comparePrice - b.price) / b.comparePrice) * 100;
      return dB - dA;
    })
    .slice(0, 20);

  const shippingInfo = getShippingInfo(499, currentCountry);

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (user && !isCustomer) return;
    setLoadingProducts((p) => ({ ...p, [product._id]: "cart" }));
    try {
      await addItem(product, 1);
      setAddedProducts((prev) => ({ ...prev, [product._id]: true }));
      toast.success("Added to cart!");
      setTimeout(() => setAddedProducts((prev) => ({ ...prev, [product._id]: false })), 2000);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to add to cart");
    } finally {
      setLoadingProducts((p) => ({ ...p, [product._id]: null }));
    }
  };

  const handleBuyNow = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (user && !isCustomer) return;
    setLoadingProducts((p) => ({ ...p, [product._id]: "buy" }));
    try {
      await addItem(product, 1);
      if (!user) navigate("/login?redirect=/checkout");
      else navigate("/checkout");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to add to cart");
      setLoadingProducts((p) => ({ ...p, [product._id]: null }));
    }
  };

  const handleCategoryClick = (category) => {
    const hasSubcategories = category.children && category.children.length > 0;
    if (hasSubcategories) {
      navigate(`/categories/${category.slug || category._id}`);
    } else {
      navigate(`/products?category=${category.slug || category._id}`);
    }
  };

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCouponCopied(code);
    toast.success(`"${code}" copied! Apply in cart.`);
    setTimeout(() => setCouponCopied(null), 2500);
  };

  const sectionProps = {
    isLoading: productsLoading,
    canShop,
    loadingProducts,
    addedProducts,
    onAddToCart: handleAddToCart,
    onBuyNow: handleBuyNow,
    currentCountry,
    userRole,
  };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* COUPON BAR - BLUE THEME (only this section)          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeCoupons.length > 0 && canShop && (
        <section className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0F172A] py-3 px-4 sm:px-6 shadow-lg shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-24 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto flex items-center gap-3 relative">
            <div className="hidden sm:flex items-center gap-2.5 shrink-0 pr-3 border-r border-white/10">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center text-lg shadow-md shadow-yellow-400/30">
                🎟️
              </div>
              <div>
                <p className="text-yellow-300 text-[10px] font-extrabold uppercase tracking-wider m-0 leading-none">
                  Save More
                </p>
                <p className="text-white text-xs font-bold m-0 leading-tight">
                  {activeCoupons.length} Active Coupon{activeCoupons.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <span className="sm:hidden text-white text-lg shrink-0">🎟️</span>

            <div
              className="flex gap-2 overflow-x-auto flex-1 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {activeCoupons.slice(0, 6).map((coupon) => {
                const isCopied = couponCopied === coupon.code;
                return (
                  <button
                    key={coupon.code}
                    onClick={() => copyCoupon(coupon.code)}
                    className={`flex items-center gap-2 border rounded-full px-3 py-1.5 transition-all cursor-pointer shrink-0 group ${
                      isCopied
                        ? "bg-green-500 border-green-400 shadow-lg shadow-green-500/40"
                        : "bg-white/10 hover:bg-white/20 border-white/20 hover:border-blue-300/50"
                    }`}
                    title={`Click to copy: ${coupon.code}`}
                  >
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        isCopied
                          ? "bg-white text-green-700"
                          : "bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900"
                      }`}
                    >
                      {isCopied ? "✓ COPIED" : coupon.code}
                    </span>
                    <span className="text-white text-[11px] font-semibold whitespace-nowrap">
                      {coupon.discountType === "percentage" && `${coupon.discountValue}% off`}
                      {coupon.discountType === "fixed" && `${currentCountry?.currency?.symbol || "₹"}${coupon.discountValue} off`}
                      {coupon.discountType === "free_shipping" && "Free Shipping"}
                    </span>
                    {!isCopied && (
                      <svg className="w-3 h-3 text-white/50 group-hover:text-white transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            <Link
              to="/cart"
              className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-[11px] font-extrabold no-underline px-3 py-1.5 rounded-full transition-all shrink-0 whitespace-nowrap shadow-md shadow-blue-500/30"
            >
              Apply in Cart
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M9 5l7 7-7 7" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Everything else - ORIGINAL ORANGE THEME */}
      <ShopByCategorySection
        categories={categories}
        isLoading={categoriesLoading}
        onCategoryClick={handleCategoryClick}
      />

      {featuredProducts.length > 0 && (
        <ScrollableSection
          icon="⭐" title="Featured Products"
          subtitle="Specially selected just for you"
          link="/products?filterType=featured" linkLabel="See More"
          products={featuredProducts.slice(0, 20)} {...sectionProps}
        />
      )}

      {latestProducts.length > 0 && (
        <ScrollableSection
          icon="🆕" title="Latest Products"
          subtitle="Fresh arrivals from verified vendors"
          link="/products?filterType=latest" linkLabel="See More"
          products={latestProducts} {...sectionProps}
        />
      )}

      {topRatedProducts.length > 0 && (
        <ScrollableSection
          icon="🏆" title="Top Rated Products"
          subtitle="Loved by customers (4+ stars)"
          link="/products?filterType=topRated" linkLabel="See More"
          products={topRatedProducts} {...sectionProps}
        />
      )}

      {bestSellersProducts.length > 0 && (
        <ScrollableSection
          icon="🔥" title="Best Sellers"
          subtitle="Most purchased by customers"
          link="/products?filterType=bestSeller" linkLabel="See More"
          products={bestSellersProducts} {...sectionProps}
        />
      )}

      {discountedProducts.length > 0 && (
        <ScrollableSection
          icon="💰" title="Great Discounts"
          subtitle="Save big on selected items"
          link="/products?filterType=discount" linkLabel="See More"
          products={discountedProducts} {...sectionProps}
        />
      )}

      <section className="py-8 sm:py-10 px-4 sm:px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 text-center mb-1">
            Why Shop With Us?
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm text-center mb-8">
            Trusted by thousands of customers · {currentCountry.flag} Shipping to {currentCountry.name}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              {
                icon: "🚚", title: "Free Delivery",
                desc: shippingInfo?.isFree
                  ? "Your order qualifies!"
                  : `On orders above ${formatPrice(currentCountry.shipping?.freeShippingThreshold / currentCountry.exchangeRate || 499, currentCountry)}`,
                color: "from-blue-50 to-blue-50/50 border-blue-100 hover:border-blue-300",
              },
              { icon: "🔄", title: "Easy Returns",   desc: "10-day hassle-free",    color: "from-green-50 to-green-50/50 border-green-100 hover:border-green-300"  },
              { icon: "🛡️", title: "Secure Payments", desc: "100% safe & encrypted", color: "from-purple-50 to-purple-50/50 border-purple-100 hover:border-purple-300" },
              { icon: "✅", title: "Verified Vendors", desc: "Manually approved",     color: "from-orange-50 to-orange-50/50 border-orange-100 hover:border-orange-300" },
              { icon: "💬", title: "24/7 Support",    desc: "Always here to help",   color: "from-pink-50 to-pink-50/50 border-pink-100 hover:border-pink-300"   },
            ].map((item) => (
              <div
                key={item.title}
                className={`bg-gradient-to-br ${item.color} border rounded-2xl p-4 sm:p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="text-3xl sm:text-4xl mb-3">{item.icon}</div>
                <p className="font-bold text-sm text-gray-900 mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {canShop && (
        <section className="py-8 sm:py-10 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-7 sm:p-10 lg:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D85A30]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="max-w-lg">
                  <div className="inline-flex items-center gap-2 bg-[#D85A30]/20 border border-[#D85A30]/30 rounded-full px-3.5 py-1 mb-4">
                    <span className="w-1.5 h-1.5 bg-[#D85A30] rounded-full" />
                    <span className="text-[#FF8C5A] text-xs font-bold">FOR SELLERS</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
                    Start Selling Today
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Join hundreds of vendors already selling on our platform. Setup your store
                    in minutes and reach thousands of customers across {currentCountry.name} and beyond.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <button
                    onClick={() => navigate("/vendor/signup")}
                    className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white font-bold text-sm px-6 py-3 rounded-xl border-none cursor-pointer shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all duration-200"
                  >
                    Register as Seller →
                  </button>
                  <button
                    onClick={() => navigate("/vendor/login")}
                    className="bg-white/8 text-white font-semibold text-sm px-6 py-3 rounded-xl border border-white/20 cursor-pointer hover:bg-white/15 transition-all"
                  >
                    Seller Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
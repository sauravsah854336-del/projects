import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useGetAllProductsQuery } from "../features/product/productApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useCart } from "../hooks/useCart";
import { useSelector } from "react-redux";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import WishlistButton from "../components/WishlistButton";
import { toast } from "../components/Toast";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const categoryIcons = {
  furniture: "🛋️", electronics: "📱", fashion: "👕",
  "home decor": "🏠", sports: "⚽", books: "📚",
  beauty: "💄", kitchen: "🍳", clothing: "👔",
  accessories: "⌚", toys: "🧸", health: "💊",
  grocery: "🛒", automotive: "🚗", garden: "🌿", office: "💼",
};

const sortOptions = [
  { label: "Newest First", value: "newest", icon: "🆕" },
  { label: "Price: Low to High", value: "price_low", icon: "⬆️" },
  { label: "Price: High to Low", value: "price_high", icon: "⬇️" },
  { label: "Most Popular", value: "popular", icon: "🔥" },
  { label: "Top Rated", value: "rating", icon: "⭐" },
];

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="w-full bg-gray-100" style={{ paddingBottom: "100%" }} />
    <div className="p-3 space-y-2">
      <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
      <div className="h-3 bg-gray-100 rounded-full w-4/5" />
      <div className="h-3 bg-gray-100 rounded-full w-3/5" />
      <div className="h-4 bg-gray-100 rounded-full w-1/3" />
      <div className="h-7 bg-gray-100 rounded-xl" />
    </div>
  </div>
);

const ProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { addItem } = useCart();
  const [addedProducts, setAddedProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});
  const [imgErrors, setImgErrors] = useState({});

  const isCustomer = user?.role === "customer";
  const canShop = !user || isCustomer;

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest",
    search: searchParams.get("search") || "",
    page: parseInt(searchParams.get("page")) || 1,
  });
  const [searchInput, setSearchInput] = useState(filters.search);
  const [expandedCategory, setExpandedCategory] = useState(filters.category);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    if (
      category !== filters.category || search !== filters.search ||
      sort !== filters.sort || minPrice !== filters.minPrice || maxPrice !== filters.maxPrice
    ) {
      setFilters((prev) => ({ ...prev, category, search, sort, minPrice, maxPrice, page: 1 }));
      setSearchInput(search);
      setExpandedCategory(category);
    }
  }, [searchParams]);

  const { data: productsData, isLoading } = useGetAllProductsQuery({ ...filters, limit: 20 });
  const { data: categoryData } = useGetCategoryTreeQuery();
  const products = productsData?.data || [];
  const pagination = productsData?.pagination;
  const categories = categoryData?.data || [];

  const selectedCategoryName = (() => {
    for (const cat of categories) {
      if (cat._id === filters.category) return cat.name;
      for (const sub of cat.children || []) {
        if (sub._id === filters.category) return sub.name;
      }
    }
    return "";
  })();

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    const params = {};
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.sort !== "newest") params.sort = newFilters.sort;
    if (newFilters.minPrice) params.minPrice = newFilters.minPrice;
    if (newFilters.maxPrice) params.maxPrice = newFilters.maxPrice;
    setSearchParams(params);
  };

  const handleSearch = (e) => { e.preventDefault(); handleFilterChange("search", searchInput); };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setFilters({ category: "", minPrice: "", maxPrice: "", sort: "newest", search: "", page: 1 });
    setSearchInput(""); setExpandedCategory(""); setSearchParams({});
  };

  const handleCategorySelect = (catId) => handleFilterChange("category", catId === filters.category ? "" : catId);
  const toggleExpandCategory = (catId) => setExpandedCategory(expandedCategory === catId ? "" : catId);

  const handleAddToCart = async (e, product) => {
    e.preventDefault(); e.stopPropagation();
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
    e.preventDefault(); e.stopPropagation();
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

  const Sidebar = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
            <path d="M3 6h18M7 12h10M11 18h2" />
          </svg>
          <span className="text-sm font-extrabold text-gray-900">Filters</span>
        </div>
        <button onClick={handleClearFilters} className="text-[11px] font-bold text-[#D85A30] bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full hover:bg-orange-100 transition cursor-pointer font-[inherit]">
          Clear All
        </button>
      </div>

      <div className="p-4 border-b border-gray-100">
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.08em] mb-3">Department</p>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => handleCategorySelect("")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] border-none cursor-pointer text-left font-[inherit] transition-all ${filters.category === "" ? "bg-gray-900 text-white font-bold" : "bg-transparent text-gray-700 hover:bg-gray-50 font-normal"}`}
          >
            <span className="text-base">🛍️</span>
            <span className="flex-1">All Products</span>
          </button>

          {categories.map((cat) => {
            const icon = categoryIcons[cat.name.toLowerCase()] || "📦";
            const isActive = filters.category === cat._id;
            const isExpanded = expandedCategory === cat._id;
            return (
              <div key={cat._id}>
                <div className="flex items-center">
                  <button
                    onClick={() => handleCategorySelect(cat._id)}
                    className={`flex items-center gap-2.5 flex-1 px-3 py-2 rounded-xl text-[13px] border-none cursor-pointer text-left font-[inherit] transition-all ${isActive ? "bg-gray-900 text-white font-bold" : "bg-transparent text-gray-700 hover:bg-gray-50 font-normal"}`}
                  >
                    <span className="text-base">{icon}</span>
                    <span className="flex-1">{cat.name}</span>
                    {cat.children?.length > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {cat.children.length}
                      </span>
                    )}
                  </button>
                  {cat.children?.length > 0 && (
                    <button
                      onClick={() => toggleExpandCategory(cat._id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:bg-gray-100 transition ml-1"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {cat.children?.length > 0 && isExpanded && (
                  <div className="ml-3 border-l-2 border-gray-100 pl-3 my-1 flex flex-col gap-0.5">
                    {cat.children.map((sub) => (
                      <button
                        key={sub._id}
                        onClick={() => handleCategorySelect(sub._id)}
                        className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs border-none cursor-pointer text-left font-[inherit] transition-all ${filters.category === sub._id ? "bg-orange-50 text-[#D85A30] font-bold" : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-normal"}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D85A30] shrink-0" />
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-b border-gray-100">
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.08em] mb-3">Price Range</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">₹</span>
            <input type="number" placeholder="Min" value={filters.minPrice}
              onChange={(e) => handleFilterChange("minPrice", e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-6 pr-2.5 py-2.5 text-xs outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 transition text-gray-900 font-[inherit]"
            />
          </div>
          <span className="text-gray-300 self-center font-bold">—</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">₹</span>
            <input type="number" placeholder="Max" value={filters.maxPrice}
              onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-6 pr-2.5 py-2.5 text-xs outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 transition text-gray-900 font-[inherit]"
            />
          </div>
        </div>
        {filters.minPrice && filters.maxPrice && (
          <p className="text-[11px] text-green-600 font-semibold mt-2">
            ₹{Number(filters.minPrice).toLocaleString()} – ₹{Number(filters.maxPrice).toLocaleString()}
          </p>
        )}
      </div>

      <div className="p-4">
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.08em] mb-3">Sort By</p>
        <div className="flex flex-col gap-0.5">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFilterChange("sort", option.value)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] border-none cursor-pointer text-left font-[inherit] transition-all ${filters.sort === option.value ? "bg-gray-900 text-white font-bold" : "bg-transparent text-gray-700 hover:bg-gray-50 font-normal"}`}
            >
              <span className="text-sm">{option.icon}</span>
              {option.label}
              {filters.sort === option.value && (
                <svg className="ml-auto" width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const activeFiltersCount = [filters.category, filters.search, filters.minPrice, filters.maxPrice].filter(Boolean).length;

  return (
    <div className="bg-gray-50 min-h-screen">

      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-5 sm:py-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">
              {selectedCategoryName || "All Products"}
            </h1>
            <p className="text-[13px] text-gray-400 mt-1 m-0">
              {isLoading ? "Loading..." : pagination?.total ? `${pagination.total.toLocaleString()} products found` : "Browse our collection"}
            </p>
          </div>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden self-start flex items-center gap-2 bg-gray-900 text-white border-none rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer font-[inherit] relative"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#D85A30] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-5">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products, brands, stores..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-11 pr-10 py-3 text-sm outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 bg-white text-gray-900 transition placeholder:text-gray-400 font-[inherit] shadow-sm"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(""); handleFilterChange("search", ""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-xl leading-none">×
              </button>
            )}
          </div>
          <button type="submit"
            className="bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border border-yellow-400 rounded-xl px-5 sm:px-6 py-3 text-sm font-bold cursor-pointer hover:brightness-95 transition whitespace-nowrap font-[inherit] shadow-sm">
            Search
          </button>
        </form>

        {(filters.category || filters.search || filters.minPrice || filters.maxPrice) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.search && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-[#D85A30] border border-orange-200 rounded-full px-3 py-1 text-xs font-semibold">
                🔍 "{filters.search}"
                <button onClick={() => { handleFilterChange("search", ""); setSearchInput(""); }} className="bg-transparent border-none cursor-pointer text-[#D85A30] text-sm leading-none p-0 hover:opacity-70">×</button>
              </span>
            )}
            {selectedCategoryName && (
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-semibold">
                📂 {selectedCategoryName}
                <button onClick={() => handleFilterChange("category", "")} className="bg-transparent border-none cursor-pointer text-green-700 text-sm leading-none p-0 hover:opacity-70">×</button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold">
                💰 ₹{filters.minPrice || "0"} – ₹{filters.maxPrice || "∞"}
                <button onClick={() => { handleFilterChange("minPrice", ""); handleFilterChange("maxPrice", ""); }} className="bg-transparent border-none cursor-pointer text-blue-700 text-sm leading-none p-0 hover:opacity-70">×</button>
              </span>
            )}
            <button onClick={handleClearFilters} className="text-xs font-bold text-[#D85A30] bg-transparent border-none cursor-pointer px-2 py-1 hover:underline font-[inherit]">
              Clear All
            </button>
          </div>
        )}

        <div className="flex gap-5 items-start">

          <div className="hidden lg:block w-[240px] shrink-0 sticky top-20">
            <Sidebar />
          </div>

          <div className="flex-1 min-w-0">

            {isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">🔍</div>
                <p className="text-lg font-extrabold text-gray-900 m-0">No products found</p>
                <p className="text-sm text-gray-400 mt-2 mb-6">Try adjusting your filters or search terms</p>
                <button onClick={handleClearFilters} className="bg-gray-900 text-white border-none rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:bg-gray-800 transition font-[inherit]">
                  Clear All Filters
                </button>
              </div>
            )}

            {!isLoading && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
                  {products.map((product) => {
                    const isAdded = addedProducts[product._id];
                    const loading = loadingProducts[product._id];
                    const hasImgError = imgErrors[product._id];
                    const discount = product.comparePrice > product.price
                      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                      : 0;

                    return (
                      <Link
                        to={`/products/${product.slug}`}
                        key={product._id}
                        className="group bg-white rounded-2xl border border-gray-100 overflow-hidden no-underline text-inherit flex flex-col transition-all duration-200 hover:border-[#D85A30]/40 hover:shadow-xl hover:shadow-orange-500/8 hover:-translate-y-0.5 shadow-sm"
                      >
                        {/* ── Image — square 1:1 with object-contain ── */}
                        <div className="relative w-full bg-gray-50 overflow-hidden" style={{ paddingBottom: "100%" }}>
                          <img
                            src={hasImgError ? PLACEHOLDER_MEDIUM : (product.images?.[0]?.url || PLACEHOLDER_MEDIUM)}
                            alt={product.name}
                            onError={() => setImgErrors((prev) => ({ ...prev, [product._id]: true }))}
                            className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {product.isFeatured && (
                              <span className="bg-gray-900 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-sm">⭐ Featured</span>
                            )}
                            {discount > 0 && (
                              <span className="bg-[#D85A30] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-sm">-{discount}%</span>
                            )}
                          </div>

                          {/* Out of stock */}
                          {product.stock <= 0 && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                              <span className="bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md">Out of Stock</span>
                            </div>
                          )}

                          {/* Low stock */}
                          {product.stock > 0 && product.stock <= 5 && (
                            <div className="absolute bottom-2 left-2">
                              <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">Only {product.stock} left</span>
                            </div>
                          )}

                          {/* Wishlist */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                            <WishlistButton product={product} size="sm" />
                          </div>
                        </div>

                        {/* ── Info ── */}
                        <div className="p-3 flex flex-col flex-1">
                          <p className="text-[10px] text-gray-400 m-0 mb-1 truncate">
                            {product.category?.name}
                            {product.category?.name && product.vendorStore?.storeName && <span className="mx-1">·</span>}
                            {product.vendorStore?.storeName}
                          </p>

                          <h3 className="text-[12px] sm:text-[13px] font-semibold text-gray-800 m-0 mb-1.5 line-clamp-2 leading-snug flex-1">
                            {product.name}
                          </h3>

                          {product.averageRating > 0 && (
                            <div className="flex items-center gap-1 mb-1.5">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <span key={s} className={`text-[10px] ${s <= Math.round(product.averageRating) ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                                ))}
                              </div>
                              <span className="text-[10px] text-gray-400">({product.totalReviews || 0})</span>
                            </div>
                          )}

                          <div className="flex items-baseline gap-1.5 mb-2.5">
                            <span className="text-sm sm:text-base font-extrabold text-[#B12704]">{formatRupee(product.price)}</span>
                            {product.comparePrice > product.price && (
                              <span className="text-[10px] text-gray-400 line-through">{formatRupee(product.comparePrice)}</span>
                            )}
                          </div>

                          {canShop && product.stock > 0 && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={(e) => handleAddToCart(e, product)}
                                disabled={loading === "cart"}
                                className={`flex-1 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border cursor-pointer transition-all font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed ${
                                  isAdded
                                    ? "bg-green-500 text-white border-green-500"
                                    : "bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border-yellow-400 hover:brightness-95"
                                }`}
                              >
                                {loading === "cart" ? (
                                  <span className="flex items-center justify-center">
                                    <span className="w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
                                  </span>
                                ) : isAdded ? "✓ Added" : "Add to Cart"}
                              </button>
                              <button
                                onClick={(e) => handleBuyNow(e, product)}
                                disabled={loading === "buy"}
                                className="flex-1 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border-none bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white cursor-pointer hover:brightness-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-[inherit]"
                              >
                                {loading === "buy" ? (
                                  <span className="flex items-center justify-center">
                                    <span className="w-3 h-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
                                  </span>
                                ) : "Buy Now"}
                              </button>
                            </div>
                          )}

                          {user && !isCustomer && (
                            <div className="py-1.5 px-2 bg-gray-50 rounded-lg text-center">
                              <p className="text-[10px] text-gray-400 m-0 font-semibold capitalize">{user.role} view only</p>
                            </div>
                          )}

                          {product.stock <= 0 && canShop && (
                            <button disabled className="w-full py-2 rounded-xl text-[11px] font-bold bg-gray-100 text-gray-400 border-none cursor-not-allowed font-[inherit]">
                              Out of Stock
                            </button>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-1.5 mt-10 flex-wrap">
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition font-[inherit] shadow-sm"
                    >
                      ← Prev
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
                        const isActive = filters.page === page;
                        const showPage = page === 1 || page === pagination.pages ||
                          (page >= filters.page - 1 && page <= filters.page + 1);
                        const showDots = page === filters.page - 2 || page === filters.page + 2;
                        if (showDots) return <span key={page} className="px-1 flex items-center text-gray-300 text-sm">···</span>;
                        if (!showPage) return null;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-xl text-sm font-bold cursor-pointer border transition-all font-[inherit] ${isActive ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page === pagination.pages}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition font-[inherit] shadow-sm"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {mobileFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
          <div
            className="fixed right-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-white z-[9999] overflow-y-auto flex flex-col shadow-2xl"
            style={{ animation: "slideLeft 0.25s ease both" }}
          >
            <style>{`@keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50 sticky top-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-gray-900">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-[#D85A30] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">{activeFiltersCount} active</span>
                )}
              </div>
              <button onClick={() => setMobileFilterOpen(false)} className="bg-gray-100 border-none rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-gray-600 text-lg font-[inherit] hover:bg-gray-200 transition">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <Sidebar />
            </div>

            <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100 flex gap-2">
              <button
                onClick={() => { handleClearFilters(); setMobileFilterOpen(false); }}
                className="flex-1 bg-gray-100 text-gray-700 border-none rounded-xl py-3 text-sm font-bold cursor-pointer hover:bg-gray-200 transition font-[inherit]"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-[2] bg-gray-900 text-white border-none rounded-xl py-3 text-sm font-bold cursor-pointer hover:bg-gray-800 transition font-[inherit]"
              >
                Show {pagination?.total || 0} Results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductsPage;
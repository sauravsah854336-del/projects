import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useGetAllProductsQuery } from "../features/product/productApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useCart } from "../hooks/useCart";
import { useSelector } from "react-redux";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import WishlistButton from "../components/WishlistButton";
import Price from "../components/Price";
import ShippingBadge from "../components/ShippingBadge";
import { toast } from "../components/Toast";
import { convertPrice, formatPrice } from "../utils/priceHelper";

const categoryIcons = {
  furniture: "🛋️",
  electronics: "📱",
  fashion: "👕",
  "home decor": "🏠",
  sports: "⚽",
  books: "📚",
  beauty: "💄",
  kitchen: "🍳",
  clothing: "👔",
  accessories: "⌚",
  toys: "🧸",
  health: "💊",
  grocery: "🛒",
  automotive: "🚗",
  garden: "🌿",
  office: "💼",
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
  const { currentCountry } = useSelector((state) => state.country);
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
    filterType: searchParams.get("filterType") || "",
    page: parseInt(searchParams.get("page")) || 1,
  });
  const [searchInput, setSearchInput] = useState(filters.search);
  const [expandedCategory, setExpandedCategory] = useState(filters.category);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const filterType = searchParams.get("filterType") || "";

    if (
      category !== filters.category ||
      search !== filters.search ||
      sort !== filters.sort ||
      minPrice !== filters.minPrice ||
      maxPrice !== filters.maxPrice ||
      filterType !== filters.filterType
    ) {
      setFilters((prev) => ({
        ...prev,
        category,
        search,
        sort,
        minPrice,
        maxPrice,
        filterType,
        page: 1,
      }));
      setSearchInput(search);
      setExpandedCategory(category);
    }
  }, [searchParams]);

  const { data: productsData, isLoading } = useGetAllProductsQuery({
    limit: 200,
  });
  const { data: categoryData } = useGetCategoryTreeQuery();
  const products = productsData?.data || [];
  const categories = categoryData?.data || [];

  useEffect(() => {
    let result = [...products];

    if (filters.filterType === "featured") {
      result = result.filter((p) => p.isFeatured);
    } else if (filters.filterType === "latest") {
      result = result.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    } else if (filters.filterType === "topRated") {
      result = result
        .filter((p) => p.averageRating >= 4)
        .sort((a, b) => b.averageRating - a.averageRating);
    } else if (filters.filterType === "bestSeller") {
      result = result
        .filter((p) => p.totalReviews >= 10)
        .sort((a, b) => b.totalReviews - a.totalReviews);
    } else if (filters.filterType === "discount") {
      result = result
        .filter((p) => p.comparePrice > p.price)
        .sort((a, b) => {
          const discountA = ((a.comparePrice - a.price) / a.comparePrice) * 100;
          const discountB = ((b.comparePrice - b.price) / b.comparePrice) * 100;
          return discountB - discountA;
        });
    }

    if (filters.category) {
      result = result.filter((p) => p.category?._id === filters.category);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query),
      );
    }

    if (filters.minPrice) {
      const minInINR =
        parseFloat(filters.minPrice) / currentCountry.exchangeRate;
      result = result.filter((p) => p.price >= minInINR);
    }
    if (filters.maxPrice) {
      const maxInINR =
        parseFloat(filters.maxPrice) / currentCountry.exchangeRate;
      result = result.filter((p) => p.price <= maxInINR);
    }

    if (!filters.filterType) {
      if (filters.sort === "newest") {
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (filters.sort === "price_low") {
        result.sort((a, b) => a.price - b.price);
      } else if (filters.sort === "price_high") {
        result.sort((a, b) => b.price - a.price);
      } else if (filters.sort === "rating") {
        result.sort((a, b) => b.averageRating - a.averageRating);
      } else if (filters.sort === "popular") {
        result.sort((a, b) => b.totalReviews - a.totalReviews);
      }
    }

    setFilteredProducts(result);
  }, [products, filters, currentCountry]);

  const selectedCategoryName = (() => {
    for (const cat of categories) {
      if (cat._id === filters.category) return cat.name;
      for (const sub of cat.children || []) {
        if (sub._id === filters.category) return sub.name;
      }
    }
    return "";
  })();

  const getPageTitle = () => {
    if (filters.filterType === "featured") return "Featured Products";
    if (filters.filterType === "latest") return "Latest Products";
    if (filters.filterType === "topRated") return "Top Rated Products";
    if (filters.filterType === "bestSeller") return "Best Sellers";
    if (filters.filterType === "discount") return "Great Discounts";
    if (selectedCategoryName) return selectedCategoryName;
    return "All Products";
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    const params = {};
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.sort !== "newest") params.sort = newFilters.sort;
    if (newFilters.minPrice) params.minPrice = newFilters.minPrice;
    if (newFilters.maxPrice) params.maxPrice = newFilters.maxPrice;
    if (newFilters.filterType) params.filterType = newFilters.filterType;
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange("search", searchInput);
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
      search: "",
      filterType: "",
      page: 1,
    });
    setSearchInput("");
    setExpandedCategory("");
    setSearchParams({});
  };

  const handleCategorySelect = (catId) =>
    handleFilterChange("category", catId === filters.category ? "" : catId);
  const toggleExpandCategory = (catId) =>
    setExpandedCategory(expandedCategory === catId ? "" : catId);

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (user && !isCustomer) return;
    setLoadingProducts((p) => ({ ...p, [product._id]: "cart" }));
    try {
      await addItem(product, 1);
      setAddedProducts((prev) => ({ ...prev, [product._id]: true }));
      toast.success("Added to cart!");
      setTimeout(
        () => setAddedProducts((prev) => ({ ...prev, [product._id]: false })),
        2000,
      );
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || "Failed to add to cart",
      );
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
      toast.error(
        err?.data?.message || err?.message || "Failed to add to cart",
      );
      setLoadingProducts((p) => ({ ...p, [product._id]: null }));
    }
  };

  const activeFiltersCount = [
    filters.category,
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.filterType,
  ].filter(Boolean).length;
  const itemsPerPage = 20;
  const paginatedProducts = filteredProducts.slice(
    (filters.page - 1) * itemsPerPage,
    filters.page * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const currencySymbol = currentCountry.currency.symbol;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 m-0">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-500 mt-1 m-0 flex items-center gap-2 flex-wrap">
              {isLoading
                ? "Loading..."
                : filteredProducts.length > 0
                  ? `${filteredProducts.length} products found`
                  : "No products found"}
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#D85A30] border border-orange-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                {currentCountry.flag} Showing in {currentCountry.currency.code}
              </span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-5">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                width="17"
                height="17"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products, brands, stores..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-10 py-3.5 text-sm outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 bg-white text-gray-900 transition placeholder:text-gray-400 font-[inherit] shadow-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  handleFilterChange("search", "");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-xl leading-none p-1"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border-2 border-yellow-500 rounded-xl px-6 sm:px-8 py-3.5 text-sm font-bold cursor-pointer hover:brightness-95 transition whitespace-nowrap font-[inherit] shadow-md hover:shadow-lg"
          >
            Search
          </button>
        </form>

        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 sm:p-5 mb-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="w-full flex items-center justify-between gap-2 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:border-[#D85A30] hover:bg-orange-50 transition cursor-pointer font-[inherit]"
              >
                <div className="flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M3 6h18M7 12h10M11 18h2" />
                  </svg>
                  <span>{selectedCategoryName || "All Categories"}</span>
                </div>
                {activeFiltersCount > 0 && (
                  <span className="bg-[#D85A30] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{
                    transform: mobileFilterOpen
                      ? "rotate(180deg)"
                      : "rotate(0)",
                    transition: "transform 0.2s",
                  }}
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                Price ({currentCountry.currency.code}):
              </span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value)
                  }
                  className="w-28 border-2 border-gray-200 rounded-xl pl-7 pr-2 py-2.5 text-xs outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 transition text-gray-900 font-[inherit]"
                />
              </div>
              <span className="text-gray-300 font-bold">—</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value)
                  }
                  className="w-28 border-2 border-gray-200 rounded-xl pl-7 pr-2 py-2.5 text-xs outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 transition text-gray-900 font-[inherit]"
                />
              </div>
            </div>

            <div className="relative min-w-[180px]">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-gray-700 hover:border-[#D85A30] hover:bg-orange-50 transition cursor-pointer font-[inherit] outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-[#D85A30] bg-orange-50 border-2 border-orange-200 px-4 py-2.5 rounded-xl hover:bg-orange-100 transition cursor-pointer font-[inherit] whitespace-nowrap"
              >
                Clear All ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>

        {(filters.category ||
          filters.search ||
          filters.minPrice ||
          filters.maxPrice ||
          filters.filterType) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {filters.filterType && (
              <span className="flex items-center gap-2 bg-purple-50 text-purple-700 border-2 border-purple-200 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm">
                ✨ {filters.filterType === "featured" && "Featured"}
                {filters.filterType === "latest" && "Latest"}
                {filters.filterType === "topRated" && "Top Rated"}
                {filters.filterType === "bestSeller" && "Best Sellers"}
                {filters.filterType === "discount" && "Discounted"}
                <button
                  onClick={() => handleFilterChange("filterType", "")}
                  className="bg-transparent border-none cursor-pointer text-purple-700 text-base leading-none p-0 hover:opacity-70 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            {filters.search && (
              <span className="flex items-center gap-2 bg-orange-50 text-[#D85A30] border-2 border-orange-200 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm">
                🔍 "{filters.search}"
                <button
                  onClick={() => {
                    handleFilterChange("search", "");
                    setSearchInput("");
                  }}
                  className="bg-transparent border-none cursor-pointer text-[#D85A30] text-base leading-none p-0 hover:opacity-70 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCategoryName && (
              <span className="flex items-center gap-2 bg-green-50 text-green-700 border-2 border-green-200 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm">
                📂 {selectedCategoryName}
                <button
                  onClick={() => handleFilterChange("category", "")}
                  className="bg-transparent border-none cursor-pointer text-green-700 text-base leading-none p-0 hover:opacity-70 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="flex items-center gap-2 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm">
                💰 {currencySymbol}
                {filters.minPrice || "0"} – {currencySymbol}
                {filters.maxPrice || "∞"}
                <button
                  onClick={() => {
                    handleFilterChange("minPrice", "");
                    handleFilterChange("maxPrice", "");
                  }}
                  className="bg-transparent border-none cursor-pointer text-blue-700 text-base leading-none p-0 hover:opacity-70 font-bold"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        <div className="w-full">
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!isLoading && filteredProducts.length === 0 && (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-gray-100 shadow-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-5 text-5xl">
                🔍
              </div>
              <p className="text-xl font-extrabold text-gray-900 mb-2">
                No products found
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={handleClearFilters}
                className="bg-gray-900 text-white border-none rounded-xl px-7 py-3.5 text-sm font-bold cursor-pointer hover:bg-gray-800 transition font-[inherit] shadow-lg"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {!isLoading && filteredProducts.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {paginatedProducts.map((product) => {
                  const isAdded = addedProducts[product._id];
                  const loading = loadingProducts[product._id];
                  const hasImgError = imgErrors[product._id];
                  const discount =
                    product.comparePrice > product.price
                      ? Math.round(
                          ((product.comparePrice - product.price) /
                            product.comparePrice) *
                            100,
                        )
                      : 0;

                  return (
                    <div
                      key={product._id}
                      onClick={() => navigate(`/products/${product.slug}`)}
                      className="group bg-white rounded-2xl border-2 border-gray-100 overflow-hidden text-inherit flex flex-col transition-all duration-300 hover:border-[#D85A30] hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 shadow-sm cursor-pointer"
                    >
                      <div
                        className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden"
                        style={{ paddingBottom: "100%" }}
                      >
                        <img
                          src={
                            hasImgError
                              ? PLACEHOLDER_MEDIUM
                              : product.images?.[0]?.url || PLACEHOLDER_MEDIUM
                          }
                          alt={product.name}
                          onError={() =>
                            setImgErrors((prev) => ({
                              ...prev,
                              [product._id]: true,
                            }))
                          }
                          className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                        />

                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                          {product.isFeatured && (
                            <span className="bg-gradient-to-r from-gray-900 to-gray-800 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-lg shadow-lg">
                              ⭐ Featured
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-lg shadow-lg">
                              -{discount}% OFF
                            </span>
                          )}
                        </div>

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
                              Only {product.stock} left!
                            </span>
                          </div>
                        )}

                        {canShop && (
                          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
                            <div onClick={(e) => e.stopPropagation()}>
                              <WishlistButton product={product} size="sm" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 flex flex-col flex-1">
                        <p className="text-[10px] text-gray-400 mb-1.5 truncate">
                          {product.category?.name}
                          {product.category?.name &&
                            product.vendorStore?.storeName && (
                              <span className="mx-1">·</span>
                            )}
                          {product.vendorStore?.storeName}
                        </p>

                        <h3 className="text-[13px] sm:text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug flex-1 group-hover:text-[#D85A30] transition-colors">
                          {product.name}
                        </h3>

                        {product.averageRating > 0 && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span
                                  key={s}
                                  className={`text-xs ${s <= Math.round(product.averageRating) ? "text-yellow-400" : "text-gray-200"}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">
                              ({product.totalReviews || 0})
                            </span>
                          </div>
                        )}

                        <div className="mb-2">
                          <Price
                            amount={product.price}
                            comparePrice={product.comparePrice}
                            size="md"
                            showSavings={false}
                          />
                        </div>

                        <div className="mb-3">
                          <ShippingBadge orderAmount={product.price} />
                        </div>

                        {canShop && product.stock > 0 && (
                          <div
                            className="flex gap-2 mt-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(e, product);
                              }}
                              disabled={loading === "cart"}
                              className={`flex-1 text-xs font-bold py-2.5 rounded-xl border-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                                isAdded
                                  ? "bg-green-500 text-white border-green-500"
                                  : "bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border-yellow-500 hover:shadow-md hover:shadow-yellow-400/30"
                              }`}
                            >
                              {loading === "cart" ? (
                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                              ) : isAdded ? (
                                "✓ Added"
                              ) : (
                                "Add to Cart"
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyNow(e, product);
                              }}
                              disabled={loading === "buy"}
                              className="flex-1 bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white text-xs font-bold py-2.5 rounded-xl border-none cursor-pointer transition-all hover:shadow-md hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading === "buy" ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                              ) : (
                                "Buy Now"
                              )}
                            </button>
                          </div>
                        )}

                        {canShop && product.stock <= 0 && (
                          <button
                            disabled
                            className="w-full py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 border-none cursor-not-allowed mt-auto"
                          >
                            Out of Stock
                          </button>
                        )}

                        {user && !isCustomer && (
                          <div className="flex flex-col gap-1.5 mt-auto">
                            <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-50 border border-amber-200 rounded-lg">
                              <span className="text-[10px]">
                                {user.role === "admin" ? "👑" : "🏪"}
                              </span>
                              <p className="text-[10px] text-amber-700 m-0 font-bold capitalize">
                                {user.role} Preview
                              </p>
                            </div>
                            <div className="w-full bg-gray-900 text-white text-[11px] font-bold py-2 rounded-lg text-center">
                              View Details →
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-300 transition font-[inherit] shadow-sm"
                  >
                    ← Prev
                  </button>

                  <div className="flex gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        const isActive = filters.page === page;
                        const showPage =
                          page === 1 ||
                          page === totalPages ||
                          (page >= filters.page - 1 &&
                            page <= filters.page + 1);
                        const showDots =
                          page === filters.page - 2 ||
                          page === filters.page + 2;
                        if (showDots)
                          return (
                            <span
                              key={page}
                              className="px-2 flex items-center text-gray-300 text-sm font-bold"
                            >
                              ···
                            </span>
                          );
                        if (!showPage) return null;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`min-w-[44px] h-11 rounded-xl text-sm font-bold cursor-pointer border-2 transition-all font-[inherit] ${
                              isActive
                                ? "bg-gray-900 text-white border-gray-900 shadow-md"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-300 transition font-[inherit] shadow-sm"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {mobileFilterOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[500px] max-h-[80vh] bg-white z-[9999] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ animation: "scaleIn 0.2s ease both" }}
          >
            <style>{`@keyframes scaleIn { from { transform: translate(-50%, -50%) scale(0.9); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }`}</style>

            <div className="flex items-center justify-between px-6 py-5 border-b-2 border-gray-100 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-extrabold text-gray-900">
                  Select Category
                </span>
                {activeFiltersCount > 0 && (
                  <span className="bg-[#D85A30] text-white text-[10px] font-extrabold px-2 py-1 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-9 h-9 bg-gray-100 border-none rounded-xl flex items-center justify-center cursor-pointer text-gray-600 text-xl font-[inherit] hover:bg-gray-200 transition"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    handleCategorySelect("");
                    setMobileFilterOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm border-none cursor-pointer text-left font-[inherit] transition-all ${
                    filters.category === ""
                      ? "bg-gray-900 text-white font-bold shadow-lg"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 font-normal"
                  }`}
                >
                  <span className="text-xl">🛍️</span>
                  <span className="flex-1">All Products</span>
                  {filters.category === "" && (
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                {categories.map((cat) => {
                  const icon = categoryIcons[cat.name.toLowerCase()] || "📦";
                  const isActive = filters.category === cat._id;
                  const isExpanded = expandedCategory === cat._id;
                  return (
                    <div key={cat._id}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            handleCategorySelect(cat._id);
                            setMobileFilterOpen(false);
                          }}
                          className={`flex items-center gap-3 flex-1 px-4 py-3.5 rounded-xl text-sm border-none cursor-pointer text-left font-[inherit] transition-all ${
                            isActive
                              ? "bg-gray-900 text-white font-bold shadow-lg"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 font-normal"
                          }`}
                        >
                          <span className="text-xl">{icon}</span>
                          <span className="flex-1">{cat.name}</span>
                          {cat.children?.length > 0 && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {cat.children.length}
                            </span>
                          )}
                          {isActive && (
                            <svg
                              width="18"
                              height="18"
                              fill="none"
                              stroke="white"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                        {cat.children?.length > 0 && (
                          <button
                            onClick={() => toggleExpandCategory(cat._id)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 border-none cursor-pointer text-gray-400 hover:bg-gray-100 transition shrink-0"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              style={{
                                transform: isExpanded
                                  ? "rotate(180deg)"
                                  : "rotate(0)",
                                transition: "transform 0.2s",
                              }}
                            >
                              <path d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {cat.children?.length > 0 && isExpanded && (
                        <div className="ml-6 mt-1.5 border-l-2 border-orange-200 pl-4 space-y-1">
                          {cat.children.map((sub) => (
                            <button
                              key={sub._id}
                              onClick={() => {
                                handleCategorySelect(sub._id);
                                setMobileFilterOpen(false);
                              }}
                              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs border-none cursor-pointer text-left font-[inherit] transition-all ${
                                filters.category === sub._id
                                  ? "bg-orange-50 text-[#D85A30] font-bold"
                                  : "bg-transparent text-gray-600 hover:bg-gray-50 font-normal"
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-[#D85A30] shrink-0" />
                              <span className="flex-1">{sub.name}</span>
                              {filters.category === sub._id && (
                                <svg
                                  width="14"
                                  height="14"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M5 13l4 4L19 7"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 bg-gray-50 border-t-2 border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  handleClearFilters();
                  setMobileFilterOpen(false);
                }}
                className="flex-1 bg-white text-gray-700 border-2 border-gray-200 rounded-xl py-3.5 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-[2] bg-gray-900 text-white border-none rounded-xl py-3.5 text-sm font-bold cursor-pointer hover:bg-gray-800 transition font-[inherit] shadow-lg"
              >
                Show {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductsPage;

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetAllProductsQuery,
  useGetProductFiltersQuery,
} from "../features/product/productApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useCart } from "../hooks/useCart";
import { useSelector } from "react-redux";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import WishlistButton from "../components/WishlistButton";
import Price from "../components/Price";
import ShippingBadge from "../components/ShippingBadge";
import { toast } from "../components/Toast";

const categoryIcons = {
  furniture: "🛋️", kitchen: "🍳", electronics: "📱", walls: "🧱",
  decorative: "🖼️", upholstery: "🧵", finishes: "🎨", floors: "🪵",
  furnishing: "🪟", bathroom: "🚿", sofas: "🛋️", chairs: "🪑",
  tables: "🪑", beds: "🛏️", wardrobes: "🚪", shelves: "📚",
  desks: "🖥️", cabinets: "🗄️", cookware: "🍳", appliances: "🔌",
  ac: "❄️", microwave: "🔥", refrigerator: "🧊", tv: "📺",
  "washing machine": "🌀", smartphones: "📱", laptops: "💻",
  headphones: "🎧", cameras: "📷", speakers: "🔊", gaming: "🎮",
  fashion: "👗", clothing: "👔", shoes: "👟", bedroom: "🛏️",
  outdoor: "🏡", garden: "🌿", lighting: "💡", beauty: "💄",
  health: "💊", sports: "⚽", books: "📚", toys: "🧸",
  grocery: "🛒", automotive: "🚗", office: "💼", pets: "🐾",
  tools: "🔧", gifts: "🎁",
};

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

const sortOptions = [
  { label: "Newest", value: "newest", icon: "🆕" },
  { label: "Price ↑", value: "price_low", icon: "⬆️" },
  { label: "Price ↓", value: "price_high", icon: "⬇️" },
  { label: "Popular", value: "popular", icon: "🔥" },
  { label: "Rating", value: "rating", icon: "⭐" },
  { label: "Discount", value: "discount", icon: "💰" },
];

const filterTypeLabels = {
  featured: "Featured",
  latest: "Latest",
  topRated: "Top Rated",
  bestSeller: "Best Sellers",
  discount: "Discounted",
};

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

const FilterDropdown = ({ label, icon, isOpen, onToggle, activeCount, children, width = "280px" }) => {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onToggle(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => onToggle(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer font-[inherit] shrink-0 ${
          activeCount > 0
            ? "bg-[#D85A30] text-white border-[#D85A30] shadow-md shadow-orange-500/25"
            : isOpen
            ? "bg-orange-50 text-[#D85A30] border-[#D85A30]"
            : "bg-white text-gray-700 border-gray-200 hover:border-[#D85A30] hover:text-[#D85A30]"
        }`}
      >
        {icon && <span className="text-sm">{icon}</span>}
        <span>{label}</span>
        {activeCount > 0 && (
          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
            activeCount > 0 ? "bg-white text-[#D85A30]" : "bg-[#D85A30] text-white"
          }`}>
            {activeCount}
          </span>
        )}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+8px)] left-0 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 z-50 overflow-hidden"
          style={{ width, animation: "fadeSlide 0.15s ease" }}
        >
          <style>{`@keyframes fadeSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          {children}
        </div>
      )}
    </div>
  );
};

const CheckboxRow = ({ label, count, checked, onChange, colorHex, icon }) => (
  <label className="flex items-center gap-2.5 py-2 px-3 cursor-pointer hover:bg-orange-50 rounded-lg transition group">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 accent-[#D85A30] cursor-pointer shrink-0"
    />
    {colorHex && (
      <span
        className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0"
        style={{ background: colorHex }}
      />
    )}
    {icon && !colorHex && <span className="text-base shrink-0">{icon}</span>}
    <span className={`flex-1 text-xs font-medium ${checked ? "text-[#D85A30] font-bold" : "text-gray-700"} group-hover:text-[#D85A30]`}>
      {label}
    </span>
    {count !== undefined && (
      <span className="text-[10px] text-gray-400 font-semibold">({count})</span>
    )}
  </label>
);

const ProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { currentCountry, isUserCountry } = useSelector((state) => state.country);
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
    brands: searchParams.get("brands") || "",
    colors: searchParams.get("colors") || "",
    sizes: searchParams.get("sizes") || "",
    materials: searchParams.get("materials") || "",
    roomType: searchParams.get("roomType") || "",
    minRating: searchParams.get("minRating") || "",
    inStock: searchParams.get("inStock") || "",
    hasDiscount: searchParams.get("hasDiscount") || "",
    freeShipping: searchParams.get("freeShipping") || "",
    assemblyRequired: searchParams.get("assemblyRequired") || "",
    page: parseInt(searchParams.get("page")) || 1,
  });

  const [searchInput, setSearchInput] = useState(filters.search);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const { data: productsData, isLoading } = useGetAllProductsQuery({
    ...filters,
    limit: 20,
  });
  const { data: categoryData } = useGetCategoryTreeQuery();
  const { data: filtersData } = useGetProductFiltersQuery({
    category: filters.category,
    search: filters.search,
  });

  const products = productsData?.data || [];
  const pagination = productsData?.pagination || { page: 1, pages: 1, total: 0 };
  const filterOptions = filtersData?.data || {};

  const categories = useMemo(
    () => [...(categoryData?.data || [])].sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    ),
    [categoryData]
  );

  useEffect(() => {
    const newFilters = {};
    ["category", "minPrice", "maxPrice", "sort", "search", "filterType",
      "brands", "colors", "sizes", "materials", "roomType", "minRating",
      "inStock", "hasDiscount", "freeShipping", "assemblyRequired"].forEach((k) => {
      newFilters[k] = searchParams.get(k) || (k === "sort" ? "newest" : "");
    });
    newFilters.page = parseInt(searchParams.get("page")) || 1;

    const changed = Object.keys(newFilters).some((k) => newFilters[k] !== filters[k]);
    if (changed) {
      setFilters(newFilters);
      setSearchInput(newFilters.search);
    }
  }, [searchParams]);

  const resolveCategoryId = (value) => {
    if (!value || !categories.length) return value;
    for (const cat of categories) {
      if (cat._id === value || cat.slug === value) return cat._id;
      for (const sub of cat.children || []) {
        if (sub._id === value || sub.slug === value) return sub._id;
      }
    }
    return value;
  };

  const resolvedCategoryId = resolveCategoryId(filters.category);
  const parentCatResolved = useMemo(() => {
    for (const cat of categories) {
      if (cat.children?.some((c) => c._id === resolvedCategoryId)) return cat;
    }
    return null;
  }, [categories, resolvedCategoryId]);

  const selectedCategoryName = (() => {
    for (const cat of categories) {
      if (cat._id === resolvedCategoryId) return cat.name;
      for (const sub of cat.children || []) {
        if (sub._id === resolvedCategoryId) return sub.name;
      }
    }
    return "";
  })();

  const getPageTitle = () => {
    if (filters.filterType === "featured") return "⭐ Featured Products";
    if (filters.filterType === "latest") return "🆕 Latest Products";
    if (filters.filterType === "topRated") return "🏆 Top Rated Products";
    if (filters.filterType === "bestSeller") return "🔥 Best Sellers";
    if (filters.filterType === "discount") return "💰 Great Discounts";
    if (selectedCategoryName) return selectedCategoryName;
    return "All Products";
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    const params = {};
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && !(k === "sort" && v === "newest") && !(k === "page" && v === 1)) {
        params[k] = v;
      }
    });
    setSearchParams(params);
  };

  const toggleMultiFilter = (key, value) => {
    const current = filters[key] ? filters[key].split(",").filter(Boolean) : [];
    const has = current.includes(value);
    const updated = has ? current.filter((v) => v !== value) : [...current, value];
    handleFilterChange(key, updated.join(","));
  };

  const isSelected = (key, value) => {
    const arr = filters[key] ? filters[key].split(",").filter(Boolean) : [];
    return arr.includes(value);
  };

  const getMultiCount = (key) => {
    return filters[key] ? filters[key].split(",").filter(Boolean).length : 0;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange("search", searchInput);
  };

  const handlePageChange = (newPage) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    const params = {};
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && !(k === "sort" && v === "newest") && !(k === "page" && v === 1)) {
        params[k] = v;
      }
    });
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setFilters({
      category: "", minPrice: "", maxPrice: "", sort: "newest", search: "",
      filterType: "", brands: "", colors: "", sizes: "", materials: "",
      roomType: "", minRating: "", inStock: "", hasDiscount: "",
      freeShipping: "", assemblyRequired: "", page: 1,
    });
    setSearchInput("");
    setSearchParams({});
  };

  const handleSmartBack = () => {
    if (parentCatResolved) {
      handleFilterChange("category", parentCatResolved._id);
    } else if (Object.values(filters).some((v) => v && v !== "newest" && v !== 1)) {
      handleClearFilters();
    } else {
      navigate("/");
    }
  };

  const getBackLabel = () => {
    if (parentCatResolved) return `Back to ${parentCatResolved.name}`;
    if (Object.values(filters).some((v) => v && v !== "newest" && v !== 1)) return "Clear Filters";
    return "Back to Home";
  };

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

  const activeFiltersCount = [
    filters.category, filters.search, filters.minPrice, filters.maxPrice,
    filters.filterType, filters.brands, filters.colors, filters.sizes,
    filters.materials, filters.roomType, filters.minRating, filters.inStock,
    filters.hasDiscount, filters.freeShipping,
  ].filter(Boolean).length;

  const currencySymbol = currentCountry.currency.symbol;

  const setDD = (name) => setOpenDropdown(openDropdown === name ? null : name);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSmartBack}
              className="flex items-center gap-2 bg-white hover:bg-gray-900 text-gray-700 hover:text-white border-2 border-gray-200 hover:border-gray-900 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold cursor-pointer transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">{getBackLabel()}</span>
              <span className="sm:hidden">Back</span>
            </button>

            <nav className="hidden md:flex items-center gap-1.5 text-xs">
              <button onClick={() => navigate("/")} className="text-gray-500 hover:text-[#D85A30] font-semibold bg-transparent border-none cursor-pointer">Home</button>
              <span className="text-gray-300">›</span>
              <button onClick={() => navigate("/categories")} className="text-gray-500 hover:text-[#D85A30] font-semibold bg-transparent border-none cursor-pointer">Categories</button>
              {parentCatResolved && (
                <>
                  <span className="text-gray-300">›</span>
                  <button onClick={() => handleFilterChange("category", parentCatResolved._id)} className="text-gray-500 hover:text-[#D85A30] font-semibold bg-transparent border-none cursor-pointer">{parentCatResolved.name}</button>
                </>
              )}
              {selectedCategoryName && (
                <>
                  <span className="text-gray-300">›</span>
                  <span className="text-gray-900 font-bold">{selectedCategoryName}</span>
                </>
              )}
            </nav>

            <button
              onClick={() => navigate("/")}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#D85A30] bg-orange-50 hover:bg-[#D85A30] hover:text-white border-2 border-[#D85A30]/30 hover:border-[#D85A30] rounded-xl px-3 py-2 cursor-pointer transition-all"
            >
              🏠 Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-5 sm:py-6">
        <div className="relative bg-gradient-to-br from-white via-orange-50/40 to-white rounded-2xl border-2 border-orange-100 p-5 sm:p-6 mb-5 shadow-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-100/50 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 m-0 mb-2">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-600 m-0 flex items-center gap-2 flex-wrap">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-[#D85A30] border-t-transparent rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                <span className="font-semibold">
                  <span className="text-[#D85A30]">{pagination.total}</span> products found
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 bg-white text-[#D85A30] border-2 border-orange-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm">
                {currentCountry.flag} {currentCountry.currency.code}
              </span>
              {isUserCountry && (
                <span className="inline-flex items-center bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                  ✓ YOUR REGION
                </span>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, brand, color, size, material, room type..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-10 py-3.5 text-sm outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 bg-white text-gray-900 transition placeholder:text-gray-400 font-[inherit] shadow-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(""); handleFilterChange("search", ""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-xl leading-none p-1"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border-2 border-yellow-500 rounded-xl px-6 sm:px-8 py-3.5 text-sm font-bold cursor-pointer hover:brightness-95 transition whitespace-nowrap font-[inherit] shadow-md"
          >
            Search
          </button>
        </form>

        {(filterOptions.colors?.length > 0 || filterOptions.materials?.length > 0) && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">Quick:</span>
            {filterOptions.colors?.slice(0, 4).map((c) => (
              <button
                key={c.name}
                onClick={() => toggleMultiFilter("colors", c.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border-2 cursor-pointer transition-all font-[inherit] ${
                  isSelected("colors", c.name)
                    ? "bg-[#D85A30] text-white border-[#D85A30]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#D85A30]"
                }`}
              >
                <span className="w-3 h-3 rounded-full border border-gray-300" style={{ background: c.hex }} />
                {c.name}
              </button>
            ))}
            {filterOptions.materials?.slice(0, 3).map((m) => (
              <button
                key={m.name}
                onClick={() => toggleMultiFilter("materials", m.name)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border-2 cursor-pointer transition-all font-[inherit] ${
                  isSelected("materials", m.name)
                    ? "bg-[#D85A30] text-white border-[#D85A30]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#D85A30]"
                }`}
              >
                🪵 {m.name}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border-2 border-gray-100 p-3 sm:p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-[#D85A30] rounded-lg flex items-center justify-center shadow-md">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 6h18M7 12h10M11 18h2" />
                </svg>
              </div>
              <span className="text-sm font-extrabold text-gray-900">FILTERS</span>
              {activeFiltersCount > 0 && (
                <span className="bg-[#D85A30] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <div className="flex-1" />
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-[11px] font-bold text-[#D85A30] bg-transparent border-none cursor-pointer hover:underline font-[inherit]"
              >
                CLEAR ALL
              </button>
            )}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 bg-[#D85A30] text-white border-none rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer font-[inherit]"
            >
              All Filters
            </button>
          </div>

          <div className="hidden lg:flex flex-wrap items-center gap-2">
<FilterDropdown
  label={selectedCategoryName || "Category"}
  icon="📂"
  isOpen={openDropdown === "category"}
  onToggle={() => setDD("category")}
  activeCount={filters.category ? 1 : 0}
  width="360px"
>
  <div className="max-h-[500px] overflow-y-auto">
    {/* Header */}
    <div className="sticky top-0 bg-white border-b border-gray-100 px-3 py-2 z-10">
      <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider m-0">
        Browse Categories
      </p>
    </div>

    <div className="p-2">
      <button
        onClick={() => { handleFilterChange("category", ""); setOpenDropdown(null); }}
        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 mb-1 ${
          !filters.category
            ? "bg-gradient-to-r from-orange-500 to-[#D85A30] text-white shadow-md shadow-orange-500/25"
            : "bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-[#D85A30]"
        }`}
      >
        <span className="text-base">🛍️</span>
        <span className="flex-1">All Categories</span>
        {!filters.category && (
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {categories.length === 0 && (
        <div className="text-center py-6">
          <p className="text-xs text-gray-400 m-0">No categories available</p>
        </div>
      )}

      {categories.map((cat) => {
        const isSelected = resolvedCategoryId === cat._id;
        const hasChildren = cat.children?.length > 0;
        const isChildSelected = cat.children?.some((c) => c._id === resolvedCategoryId);
        const isExpanded = isSelected || isChildSelected;
        const icon = categoryIcons[cat.name.toLowerCase()] || "📦";

        return (
          <div key={cat._id} className="mb-0.5">
            <button
              onClick={() => {
                handleFilterChange("category", cat._id);
                if (!hasChildren) setOpenDropdown(null);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                isSelected
                  ? "bg-orange-100 text-[#D85A30]"
                  : isChildSelected
                  ? "bg-orange-50/50 text-gray-800"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span className="text-base shrink-0">{icon}</span>
              <span className="flex-1">{cat.name}</span>
              {hasChildren && (
                <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-bold">
                  {cat.children.length}
                </span>
              )}
              {isSelected && (
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                </svg>
              )}
            </button>

            {hasChildren && isExpanded && (
              <div className="ml-3 mt-1 mb-2 border-l-2 border-orange-200 pl-2 space-y-0.5">
                {cat.children.map((sub) => {
                  const isSubSelected = resolvedCategoryId === sub._id;
                  const subIcon = categoryIcons[sub.name?.toLowerCase()] || "📁";
                  return (
                    <button
                      key={sub._id}
                      onClick={() => {
                        handleFilterChange("category", sub._id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition flex items-center gap-2 ${
                        isSubSelected
                          ? "bg-[#D85A30] text-white shadow-sm"
                          : "text-gray-600 hover:bg-orange-50 hover:text-[#D85A30]"
                      }`}
                    >
                      <span className="text-xs shrink-0">{subIcon}</span>
                      <span className="flex-1">{sub.name}</span>
                      {isSubSelected && (
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>

    {filters.category && (
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-white/95 border-t border-gray-100 p-2">
        <button
          onClick={() => { handleFilterChange("category", ""); setOpenDropdown(null); }}
          className="w-full text-center py-2 rounded-lg text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 border-none cursor-pointer transition font-[inherit]"
        >
          ✕ Clear Selection
        </button>
      </div>
    )}
  </div>
</FilterDropdown>

            <FilterDropdown
              label={`Price ${filters.minPrice || filters.maxPrice ? `(${currencySymbol}${filters.minPrice || 0}-${currencySymbol}${filters.maxPrice || "∞"})` : ""}`}
              icon="💰"
              isOpen={openDropdown === "price"}
              onToggle={() => setDD("price")}
              activeCount={(filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0)}
              width="320px"
            >
              <div className="p-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Price Range ({currentCountry.currency.code})</p>
                {filterOptions.priceRange && (
                  <p className="text-[10px] text-gray-400 mb-3">
                    Available: {currencySymbol}{Math.round(filterOptions.priceRange.min)} - {currencySymbol}{Math.round(filterOptions.priceRange.max)}
                  </p>
                )}
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">{currencySymbol}</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg pl-6 pr-2 py-2 text-xs outline-none focus:border-[#D85A30] font-[inherit]"
                    />
                  </div>
                  <span className="text-gray-300 font-bold">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">{currencySymbol}</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg pl-6 pr-2 py-2 text-xs outline-none focus:border-[#D85A30] font-[inherit]"
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    { label: "Under 500", min: 0, max: 500 },
                    { label: "500-2K", min: 500, max: 2000 },
                    { label: "2K-10K", min: 2000, max: 10000 },
                    { label: "10K+", min: 10000, max: "" },
                  ].map((r) => (
                    <button
                      key={r.label}
                      onClick={() => {
                        handleFilterChange("minPrice", r.min);
                        handleFilterChange("maxPrice", r.max);
                      }}
                      className="text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-orange-100 hover:text-[#D85A30] px-2.5 py-1 rounded-full transition cursor-pointer border-none font-[inherit]"
                    >
                      {currencySymbol}{r.label}
                    </button>
                  ))}
                </div>
              </div>
            </FilterDropdown>

            {/* Rating */}
            <FilterDropdown
              label={filters.minRating ? `${filters.minRating}★ & up` : "Rating"}
              icon="⭐"
              isOpen={openDropdown === "rating"}
              onToggle={() => setDD("rating")}
              activeCount={filters.minRating ? 1 : 0}
              width="240px"
            >
              <div className="p-2">
                {[4, 3, 2, 1].map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition ${
                      filters.minRating === String(r) ? "bg-orange-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.minRating === String(r)}
                      onChange={() => {
                        handleFilterChange("minRating", filters.minRating === String(r) ? "" : String(r));
                        setOpenDropdown(null);
                      }}
                      className="w-4 h-4 accent-[#D85A30] cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={`text-sm ${s <= r ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-700 ml-1">& up</span>
                    {filterOptions.ratings?.[`${r}plus`] !== undefined && (
                      <span className="text-[10px] text-gray-400 ml-auto">({filterOptions.ratings[`${r}plus`]})</span>
                    )}
                  </label>
                ))}
              </div>
            </FilterDropdown>

            {filterOptions.brands?.length > 0 && (
              <FilterDropdown
                label="Brand"
                icon="🏷️"
                isOpen={openDropdown === "brand"}
                onToggle={() => setDD("brand")}
                activeCount={getMultiCount("brands")}
                width="280px"
              >
                <div className="p-2 max-h-[320px] overflow-y-auto">
                  {filterOptions.brands.map((brand) => (
                    <CheckboxRow
                      key={brand}
                      label={brand}
                      checked={isSelected("brands", brand)}
                      onChange={() => toggleMultiFilter("brands", brand)}
                    />
                  ))}
                </div>
              </FilterDropdown>
            )}

            {filterOptions.colors?.length > 0 && (
              <FilterDropdown
                label="Color"
                icon="🎨"
                isOpen={openDropdown === "color"}
                onToggle={() => setDD("color")}
                activeCount={getMultiCount("colors")}
                width="280px"
              >
                <div className="p-2 max-h-[320px] overflow-y-auto">
                  {filterOptions.colors.map((color) => (
                    <CheckboxRow
                      key={color.name}
                      label={color.name}
                      count={color.count}
                      colorHex={color.hex}
                      checked={isSelected("colors", color.name)}
                      onChange={() => toggleMultiFilter("colors", color.name)}
                    />
                  ))}
                </div>
              </FilterDropdown>
            )}

            {filterOptions.materials?.length > 0 && (
              <FilterDropdown
                label="Material"
                icon="🪵"
                isOpen={openDropdown === "material"}
                onToggle={() => setDD("material")}
                activeCount={getMultiCount("materials")}
                width="260px"
              >
                <div className="p-2 max-h-[320px] overflow-y-auto">
                  {filterOptions.materials.map((mat) => (
                    <CheckboxRow
                      key={mat.name}
                      label={mat.name}
                      count={mat.count}
                      checked={isSelected("materials", mat.name)}
                      onChange={() => toggleMultiFilter("materials", mat.name)}
                    />
                  ))}
                </div>
              </FilterDropdown>
            )}

            {filterOptions.roomTypes?.length > 0 && (
              <FilterDropdown
                label="Room"
                icon="🏠"
                isOpen={openDropdown === "room"}
                onToggle={() => setDD("room")}
                activeCount={getMultiCount("roomType")}
                width="260px"
              >
                <div className="p-2 max-h-[320px] overflow-y-auto">
                  {filterOptions.roomTypes.map((room) => (
                    <CheckboxRow
                      key={room.name}
                      label={roomTypeLabels[room.name] || room.name}
                      count={room.count}
                      checked={isSelected("roomType", room.name)}
                      onChange={() => toggleMultiFilter("roomType", room.name)}
                    />
                  ))}
                </div>
              </FilterDropdown>
            )}

            <FilterDropdown
              label="More"
              icon="✨"
              isOpen={openDropdown === "more"}
              onToggle={() => setDD("more")}
              activeCount={
                (filters.inStock === "true" ? 1 : 0) +
                (filters.hasDiscount === "true" ? 1 : 0) +
                (filters.freeShipping === "true" ? 1 : 0) +
                (filters.assemblyRequired === "false" ? 1 : 0)
              }
              width="280px"
            >
              <div className="p-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase px-3 pt-1 pb-2">Availability & Offers</p>
                <CheckboxRow
                  label="In Stock Only"
                  icon="✅"
                  checked={filters.inStock === "true"}
                  onChange={() => handleFilterChange("inStock", filters.inStock === "true" ? "" : "true")}
                />
                <CheckboxRow
                  label="On Discount"
                  icon="💰"
                  checked={filters.hasDiscount === "true"}
                  onChange={() => handleFilterChange("hasDiscount", filters.hasDiscount === "true" ? "" : "true")}
                />
                <CheckboxRow
                  label="Free Shipping"
                  icon="🚚"
                  checked={filters.freeShipping === "true"}
                  onChange={() => handleFilterChange("freeShipping", filters.freeShipping === "true" ? "" : "true")}
                />
                <CheckboxRow
                  label="No Assembly"
                  icon="🔧"
                  checked={filters.assemblyRequired === "false"}
                  onChange={() => handleFilterChange("assemblyRequired", filters.assemblyRequired === "false" ? "" : "false")}
                />
              </div>
            </FilterDropdown>

            <div className="flex-1" />

            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="appearance-none bg-gray-900 text-white border-2 border-gray-900 rounded-xl px-4 py-2.5 pr-9 text-xs font-bold cursor-pointer font-[inherit] outline-none hover:bg-gray-800"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-3 h-3 text-white"
                fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
              >
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-xs font-bold cursor-pointer font-[inherit] outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {filters.filterType && (
              <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-3 py-1 text-xs font-bold">
                ✨ {filterTypeLabels[filters.filterType]}
                <button onClick={() => handleFilterChange("filterType", "")} className="bg-transparent border-none cursor-pointer text-purple-700 hover:opacity-70 font-bold">×</button>
              </span>
            )}
            {filters.search && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-[#D85A30] border border-orange-200 rounded-full px-3 py-1 text-xs font-bold">
                🔍 "{filters.search}"
                <button onClick={() => { handleFilterChange("search", ""); setSearchInput(""); }} className="bg-transparent border-none cursor-pointer text-[#D85A30] hover:opacity-70 font-bold">×</button>
              </span>
            )}
            {selectedCategoryName && (
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-bold">
                📂 {selectedCategoryName}
                <button onClick={() => handleFilterChange("category", "")} className="bg-transparent border-none cursor-pointer text-green-700 hover:opacity-70 font-bold">×</button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-bold">
                💰 {currencySymbol}{filters.minPrice || "0"}–{currencySymbol}{filters.maxPrice || "∞"}
                <button onClick={() => { handleFilterChange("minPrice", ""); handleFilterChange("maxPrice", ""); }} className="bg-transparent border-none cursor-pointer text-blue-700 hover:opacity-70 font-bold">×</button>
              </span>
            )}
            {filters.minRating && (
              <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-3 py-1 text-xs font-bold">
                {filters.minRating}★ & up
                <button onClick={() => handleFilterChange("minRating", "")} className="bg-transparent border-none cursor-pointer text-yellow-700 hover:opacity-70 font-bold">×</button>
              </span>
            )}
            {filters.brands && filters.brands.split(",").map((b) => (
              <span key={b} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-xs font-bold">
                🏷️ {b}
                <button onClick={() => toggleMultiFilter("brands", b)} className="bg-transparent border-none cursor-pointer text-indigo-700 hover:opacity-70 font-bold">×</button>
              </span>
            ))}
            {filters.colors && filters.colors.split(",").map((c) => (
              <span key={c} className="flex items-center gap-1.5 bg-pink-50 text-pink-700 border border-pink-200 rounded-full px-3 py-1 text-xs font-bold">
                🎨 {c}
                <button onClick={() => toggleMultiFilter("colors", c)} className="bg-transparent border-none cursor-pointer text-pink-700 hover:opacity-70 font-bold">×</button>
              </span>
            ))}
            {filters.materials && filters.materials.split(",").map((m) => (
              <span key={m} className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs font-bold">
                🪵 {m}
                <button onClick={() => toggleMultiFilter("materials", m)} className="bg-transparent border-none cursor-pointer text-amber-700 hover:opacity-70 font-bold">×</button>
              </span>
            ))}
            {filters.roomType && filters.roomType.split(",").map((r) => (
              <span key={r} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs font-bold">
                {roomTypeLabels[r] || r}
                <button onClick={() => toggleMultiFilter("roomType", r)} className="bg-transparent border-none cursor-pointer text-emerald-700 hover:opacity-70 font-bold">×</button>
              </span>
            ))}
            {filters.inStock === "true" && (
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-bold">
                ✅ In Stock
                <button onClick={() => handleFilterChange("inStock", "")} className="bg-transparent border-none cursor-pointer text-green-700 hover:opacity-70 font-bold">×</button>
              </span>
            )}
            {filters.hasDiscount === "true" && (
              <span className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-1 text-xs font-bold">
                💰 Discounted
                <button onClick={() => handleFilterChange("hasDiscount", "")} className="bg-transparent border-none cursor-pointer text-red-700 hover:opacity-70 font-bold">×</button>
              </span>
            )}
            {filters.freeShipping === "true" && (
              <span className="flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-3 py-1 text-xs font-bold">
                🚚 Free Ship
                <button onClick={() => handleFilterChange("freeShipping", "")} className="bg-transparent border-none cursor-pointer text-teal-700 hover:opacity-70 font-bold">×</button>
              </span>
            )}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!isLoading && products.length === 0 && (
  <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm text-center py-16 sm:py-24 px-4">
    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-5 text-5xl shadow-inner">
      {filters.filterType === "featured" ? "⭐" :
       filters.filterType === "topRated" ? "🏆" :
       filters.filterType === "bestSeller" ? "🔥" :
       filters.filterType === "discount" ? "💰" :
       filters.filterType === "latest" ? "🆕" : "🔍"}
    </div>
    <p className="text-xl font-extrabold text-gray-900 mb-2">
      {filters.filterType === "featured" && "No featured products yet"}
      {filters.filterType === "topRated" && "No top rated products yet"}
      {filters.filterType === "bestSeller" && "No best sellers yet"}
      {filters.filterType === "discount" && "No discounted products right now"}
      {filters.filterType === "latest" && "No new products yet"}
      {!filters.filterType && "No products found"}
    </p>
    <p className="text-sm text-gray-500 mb-6">
      {filters.filterType === "topRated" && "Products need 4+ star ratings to appear here"}
      {filters.filterType === "bestSeller" && "Products need 10+ reviews to appear here"}
      {filters.filterType === "discount" && "Vendors haven't added discounts yet"}
      {filters.filterType === "featured" && "Admin hasn't featured any products yet"}
      {filters.filterType === "latest" && "Check back soon for new arrivals"}
      {!filters.filterType && "Try adjusting your filters or search terms"}
    </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={handleClearFilters}
                className="bg-gray-900 text-white border-none rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:bg-gray-800 transition font-[inherit] shadow-lg"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-white text-gray-700 border-2 border-gray-200 rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
              >
                🏠 Back to Home
              </button>
            </div>
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {products.map((product) => {
                const isAdded = addedProducts[product._id];
                const loading = loadingProducts[product._id];
                const hasImgError = imgErrors[product._id];
                const discount = product.comparePrice > product.price
                  ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                  : 0;

                return (
                  <div
                    key={product._id}
                    onClick={() => navigate(`/products/${product.slug}`)}
                    className="group bg-white rounded-2xl border-2 border-gray-100 overflow-hidden flex flex-col transition-all duration-300 hover:border-[#D85A30] hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 shadow-sm cursor-pointer"
                  >
                    <div className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden" style={{ paddingBottom: "100%" }}>
                      <img
                        src={hasImgError ? PLACEHOLDER_MEDIUM : product.images?.[0]?.url || PLACEHOLDER_MEDIUM}
                        alt={product.name}
                        onError={() => setImgErrors((prev) => ({ ...prev, [product._id]: true }))}
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
                        {product.isNewArrival && !product.isFeatured && (
                          <span className="bg-blue-500 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-lg shadow-lg">
                            🆕 NEW
                          </span>
                        )}
                      </div>
                      {product.shipping?.isFreeShipping && (
                        <div className="absolute bottom-2.5 right-2.5">
                          <span className="bg-blue-500 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow">
                            🎁 FREE SHIP
                          </span>
                        </div>
                      )}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                          <span className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">Out of Stock</span>
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
                        {product.brand && <span className="font-bold text-gray-600">{product.brand}</span>}
                        {product.brand && product.vendorStore?.storeName && <span className="mx-1">·</span>}
                        {product.vendorStore?.storeName}
                      </p>
                      <h3 className="text-[13px] sm:text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug flex-1 group-hover:text-[#D85A30] transition-colors">
                        {product.name}
                      </h3>

                      {product.colors?.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {product.colors.slice(0, 5).map((c, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-gray-200"
                              style={{ background: c.hex }}
                              title={c.name}
                            />
                          ))}
                          {product.colors.length > 5 && (
                            <span className="text-[9px] text-gray-400 font-bold ml-0.5">+{product.colors.length - 5}</span>
                          )}
                        </div>
                      )}

                      {product.averageRating > 0 && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            {product.averageRating.toFixed(1)} ★
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium">({product.totalReviews || 0})</span>
                        </div>
                      )}

                      <div className="mb-2">
                        <Price amount={product.price} comparePrice={product.comparePrice} size="md" showSavings={false} />
                      </div>

                      <div className="mb-3 flex items-center gap-1 flex-wrap">
                        <ShippingBadge orderAmount={product.price} />
                        {product.assemblyRequired === false && (
                          <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                            No Assembly
                          </span>
                        )}
                      </div>

                      {canShop && product.stock > 0 && (
                        <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={loading === "cart"}
                            className={`flex-1 text-xs font-bold py-2.5 rounded-xl border-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                              isAdded
                                ? "bg-green-500 text-white border-green-500"
                                : "bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border-yellow-500 hover:shadow-md"
                            }`}
                          >
                            {loading === "cart" ? (
                              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                            ) : isAdded ? "✓ Added" : "Add to Cart"}
                          </button>
                          <button
                            onClick={(e) => handleBuyNow(e, product)}
                            disabled={loading === "buy"}
                            className="flex-1 bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white text-xs font-bold py-2.5 rounded-xl border-none cursor-pointer transition-all hover:shadow-md disabled:opacity-50"
                          >
                            {loading === "buy" ? (
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                            ) : "Buy Now"}
                          </button>
                        </div>
                      )}

                      {canShop && product.stock <= 0 && (
                        <button disabled className="w-full py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 border-none cursor-not-allowed mt-auto">
                          Out of Stock
                        </button>
                      )}

                      {user && !isCustomer && (
                        <div className="flex flex-col gap-1.5 mt-auto">
                          <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <span className="text-[10px]">{user.role === "admin" ? "👑" : "🏪"}</span>
                            <p className="text-[10px] text-amber-700 m-0 font-bold capitalize">{user.role} Preview</p>
                          </div>
                          <div className="w-full bg-gray-900 text-white text-[11px] font-bold py-2 rounded-lg text-center">View Details →</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition font-[inherit] shadow-sm"
                >
                  ← Prev
                </button>
                <div className="flex gap-1.5">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
                    const showPage = page === 1 || page === pagination.pages || (page >= pagination.page - 1 && page <= pagination.page + 1);
                    const showDots = page === pagination.page - 2 || page === pagination.page + 2;
                    if (showDots) return <span key={page} className="px-2 flex items-center text-gray-300 text-sm font-bold">···</span>;
                    if (!showPage) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[44px] h-11 rounded-xl text-sm font-bold cursor-pointer border-2 transition-all font-[inherit] ${
                          pagination.page === page
                            ? "bg-gray-900 text-white border-gray-900 shadow-md"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition font-[inherit] shadow-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {mobileFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm lg:hidden" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-[380px] bg-white z-[9999] overflow-y-auto lg:hidden" style={{ animation: "slideRight 0.2s ease" }}>
            <style>{`@keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>

            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b-2 border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-gray-900 m-0">Filters</h2>
                {activeFiltersCount > 0 && (
                  <span className="bg-[#D85A30] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-9 h-9 bg-gray-100 border-none rounded-xl flex items-center justify-center cursor-pointer text-gray-600 text-xl hover:bg-gray-200 transition"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">

{categories.length > 0 && (
  <div>
    <p className="text-xs font-extrabold text-gray-500 uppercase mb-2">📂 Category</p>
    <div className="space-y-0.5 max-h-72 overflow-y-auto bg-gray-50 rounded-xl p-2">
      <button
        onClick={() => handleFilterChange("category", "")}
        className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2 mb-1 transition ${
          !filters.category
            ? "bg-gradient-to-r from-orange-500 to-[#D85A30] text-white shadow-md"
            : "bg-white text-gray-700"
        }`}
      >
        <span className="text-base">🛍️</span>
        <span className="flex-1">All Categories</span>
      </button>

      {categories.map((cat) => {
        const isSelected = resolvedCategoryId === cat._id;
        const hasChildren = cat.children?.length > 0;
        const isChildSelected = cat.children?.some((c) => c._id === resolvedCategoryId);
        const isExpanded = isSelected || isChildSelected;
        const icon = categoryIcons[cat.name.toLowerCase()] || "📦";

        return (
          <div key={cat._id}>
            <button
              onClick={() => handleFilterChange("category", cat._id)}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                isSelected
                  ? "bg-orange-100 text-[#D85A30]"
                  : isChildSelected
                  ? "bg-orange-50 text-gray-800"
                  : "bg-white text-gray-700"
              }`}
            >
              <span className="text-base shrink-0">{icon}</span>
              <span className="flex-1">{cat.name}</span>
              {hasChildren && (
                <span className="text-[9px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full font-bold">
                  {cat.children.length}
                </span>
              )}
            </button>

            {hasChildren && isExpanded && (
              <div className="ml-3 mt-1 mb-1.5 border-l-2 border-orange-200 pl-2 space-y-0.5">
                {cat.children.map((sub) => {
                  const isSubSelected = resolvedCategoryId === sub._id;
                  const subIcon = categoryIcons[sub.name?.toLowerCase()] || "📁";
                  return (
                    <button
                      key={sub._id}
                      onClick={() => handleFilterChange("category", sub._id)}
                      className={`w-full text-left py-1.5 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-2 transition ${
                        isSubSelected
                          ? "bg-[#D85A30] text-white shadow-sm"
                          : "bg-white text-gray-600"
                      }`}
                    >
                      <span className="text-xs shrink-0">{subIcon}</span>
                      <span className="flex-1">{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}

              <div>
                <p className="text-xs font-extrabold text-gray-500 uppercase mb-2">💰 Price</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder={`${currencySymbol} Min`}
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                    className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#D85A30] font-[inherit]"
                  />
                  <span className="text-gray-300">—</span>
                  <input
                    type="number"
                    placeholder={`${currencySymbol} Max`}
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                    className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#D85A30] font-[inherit]"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-extrabold text-gray-500 uppercase mb-2">⭐ Rating</p>
                <div className="space-y-1">
                  {[4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleFilterChange("minRating", filters.minRating === String(r) ? "" : String(r))}
                      className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs ${
                        filters.minRating === String(r) ? "bg-orange-100 text-[#D85A30] font-bold" : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={`text-sm ${s <= r ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                        ))}
                      </div>
                      <span>& up</span>
                    </button>
                  ))}
                </div>
              </div>

              {filterOptions.brands?.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold text-gray-500 uppercase mb-2">🏷️ Brand</p>
                  <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-2">
                    {filterOptions.brands.map((brand) => (
                      <CheckboxRow key={brand} label={brand} checked={isSelected("brands", brand)} onChange={() => toggleMultiFilter("brands", brand)} />
                    ))}
                  </div>
                </div>
              )}

              {filterOptions.colors?.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold text-gray-500 uppercase mb-2">🎨 Color</p>
                  <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-2">
                    {filterOptions.colors.map((color) => (
                      <CheckboxRow key={color.name} label={color.name} count={color.count} colorHex={color.hex} checked={isSelected("colors", color.name)} onChange={() => toggleMultiFilter("colors", color.name)} />
                    ))}
                  </div>
                </div>
              )}

              {filterOptions.materials?.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold text-gray-500 uppercase mb-2">🪵 Material</p>
                  <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-2">
                    {filterOptions.materials.map((mat) => (
                      <CheckboxRow key={mat.name} label={mat.name} count={mat.count} checked={isSelected("materials", mat.name)} onChange={() => toggleMultiFilter("materials", mat.name)} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-extrabold text-gray-500 uppercase mb-2">✨ Availability & Offers</p>
                <div className="bg-gray-50 rounded-xl p-2 space-y-0.5">
                  <CheckboxRow label="In Stock Only" icon="✅" checked={filters.inStock === "true"} onChange={() => handleFilterChange("inStock", filters.inStock === "true" ? "" : "true")} />
                  <CheckboxRow label="On Discount" icon="💰" checked={filters.hasDiscount === "true"} onChange={() => handleFilterChange("hasDiscount", filters.hasDiscount === "true" ? "" : "true")} />
                  <CheckboxRow label="Free Shipping" icon="🚚" checked={filters.freeShipping === "true"} onChange={() => handleFilterChange("freeShipping", filters.freeShipping === "true" ? "" : "true")} />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-4 border-t-2 border-gray-100 flex gap-2 shadow-lg">
              <button
                onClick={handleClearFilters}
                className="flex-1 bg-white text-gray-700 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold cursor-pointer font-[inherit]"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-[2] bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-xl py-3 text-sm font-bold cursor-pointer font-[inherit] shadow-lg"
              >
                Show {pagination.total} Results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductsPage;
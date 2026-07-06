import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useGetAllProductsQuery } from "../features/product/productApi";

const categoryIcons = {
  furniture: "🛋️", kitchen: "🍳", electronics: "📱", walls: "🧱",
  decorative: "🖼️", upholstery: "🧵", finishes: "🎨", floors: "🪵",
  furnishing: "🪟", bathroom: "🚿", sofas: "🛋️", chairs: "🪑",
  tables: "🪑", beds: "🛏️", wardrobes: "🚪", shelves: "📚",
  desks: "🖥️", cabinets: "🗄️", cookware: "🍳", appliances: "🔌",
  utensils: "🍴", storage: "📦", dining: "🍽️", smartphones: "📱",
  laptops: "💻", tablets: "📱", cameras: "📷", headphones: "🎧",
  speakers: "🔊", gaming: "🎮", wearables: "⌚", tv: "📺",
  printers: "🖨️", "wall art": "🖼️", wallpaper: "🎨", clocks: "🕐",
  mirrors: "🪞", paints: "🎨", ac: "❄️", microwave: "🔥",
  refrigerator: "🧊", "washing machine": "🌀",
  fashion: "👗", clothing: "👔", shoes: "👟", accessories: "⌚",
  bags: "👜", jewelry: "💍", "home decor": "🏠", bedroom: "🛏️",
  outdoor: "🏡", garden: "🌿", lighting: "💡", beauty: "💄",
  health: "💊", sports: "⚽", books: "📚", toys: "🧸",
  grocery: "🛒", automotive: "🚗", office: "💼", pets: "🐾",
  tools: "🔧", gifts: "🎁",
};

const gradients = [
  "from-orange-100 to-white border-orange-200 hover:border-orange-400",
  "from-blue-100 to-white border-blue-200 hover:border-blue-400",
  "from-purple-100 to-white border-purple-200 hover:border-purple-400",
  "from-green-100 to-white border-green-200 hover:border-green-400",
  "from-pink-100 to-white border-pink-200 hover:border-pink-400",
  "from-yellow-100 to-white border-yellow-200 hover:border-yellow-400",
  "from-teal-100 to-white border-teal-200 hover:border-teal-400",
  "from-red-100 to-white border-red-200 hover:border-red-400",
];

const SubcategoriesPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categoryData, isLoading } = useGetCategoryTreeQuery();
  const { data: productsData } = useGetAllProductsQuery({ limit: 500 });

  const products = productsData?.data || [];
  const categories = categoryData?.data || [];

  const mainCategory = useMemo(() => {
    return categories.find((c) => c.slug === slug || c._id === slug);
  }, [categories, slug]);

  const subcategories = useMemo(() => {
    if (!mainCategory?.children) return [];
    return [...mainCategory.children].sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
  }, [mainCategory]);

  const filteredSubs = useMemo(() => {
    if (!searchQuery.trim()) return subcategories;
    const q = searchQuery.toLowerCase();
    return subcategories.filter((sub) => sub.name.toLowerCase().includes(q));
  }, [subcategories, searchQuery]);

  const getSubProductCount = (subId) =>
    products.filter((p) => p.category?._id === subId).length;

  const totalProducts = mainCategory
    ? products.filter((p) =>
        mainCategory.children?.some((c) => c._id === p.category?._id)
      ).length
    : 0;

  const mainIcon = mainCategory
    ? categoryIcons[mainCategory.name?.toLowerCase()] || "📂"
    : "📂";

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Loading category...</p>
        </div>
      </div>
    );
  }

  // Category not found
  if (!mainCategory) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-12">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-5 text-5xl shadow-inner">
              😕
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              Department not found
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              The category you're looking for doesn't exist or has been removed.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => navigate("/categories")}
                className="bg-gray-900 text-white border-none rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:bg-gray-800 transition font-[inherit] shadow-lg"
              >
                ← All Departments
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-white text-gray-700 border-2 border-gray-200 rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
              >
                🏠 Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Sticky Back Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => navigate("/categories")}
              className="flex items-center gap-2 bg-white hover:bg-gray-900 text-gray-700 hover:text-white border-2 border-gray-200 hover:border-gray-900 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold cursor-pointer transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">All Departments</span>
              <span className="sm:hidden">Back</span>
            </button>

            <nav className="hidden md:flex items-center gap-1.5 text-xs">
              <button onClick={() => navigate("/")} className="text-gray-500 hover:text-[#D85A30] font-semibold bg-transparent border-none cursor-pointer">Home</button>
              <span className="text-gray-300">›</span>
              <button onClick={() => navigate("/categories")} className="text-gray-500 hover:text-[#D85A30] font-semibold bg-transparent border-none cursor-pointer">Departments</button>
              <span className="text-gray-300">›</span>
              <span className="text-gray-900 font-bold">{mainCategory.name}</span>
            </nav>

            <button
              onClick={() => navigate(`/products?category=${mainCategory._id}`)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#D85A30] bg-orange-50 hover:bg-[#D85A30] hover:text-white border-2 border-[#D85A30]/30 hover:border-[#D85A30] rounded-xl px-3 py-2 cursor-pointer transition-all"
            >
              🛍️ All in {mainCategory.name}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-white via-orange-50/40 to-white rounded-3xl border-2 border-orange-100 p-6 sm:p-10 mb-6 shadow-md overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-200/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-start gap-5">
            {/* Big icon */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl flex items-center justify-center text-5xl sm:text-6xl shrink-0 shadow-lg border-2 border-orange-200">
              {mainCategory.image ? (
                <img src={mainCategory.image} alt={mainCategory.name} className="w-full h-full object-cover rounded-3xl" />
              ) : (
                mainIcon
              )}
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-[#D85A30] text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full mb-3">
                Department
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 m-0 mb-2 leading-tight">
                {mainCategory.name}
              </h1>
              {mainCategory.description && (
                <p className="text-sm sm:text-base text-gray-600 m-0 mb-4 max-w-2xl">
                  {mainCategory.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 bg-white border-2 border-orange-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-base">📂</span>
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase m-0 leading-none">Categories</p>
                    <p className="text-sm font-black text-[#D85A30] m-0">{subcategories.length}</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 bg-white border-2 border-green-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-base">🛍️</span>
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase m-0 leading-none">Products</p>
                    <p className="text-sm font-black text-green-600 m-0">{totalProducts}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search subcategories */}
          {subcategories.length > 5 && (
            <div className="relative max-w-xl mt-6">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder={`Search in ${mainCategory.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-2 border-orange-200 rounded-xl pl-11 pr-10 py-3 text-sm outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 bg-white text-gray-900 placeholder:text-gray-400 font-[inherit] shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-xl leading-none p-1"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        {/* No subcategories */}
        {subcategories.length === 0 && (
          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm text-center py-16 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-5 text-5xl shadow-inner">
              📦
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
              No subcategories yet
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              This department doesn't have subcategories yet, but you can still browse products directly.
            </p>
            <button
              onClick={() => navigate(`/products?category=${mainCategory._id}`)}
              className="bg-[#D85A30] text-white border-none rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:brightness-90 transition font-[inherit] shadow-lg"
            >
              Browse {mainCategory.name} Products →
            </button>
          </div>
        )}

        {/* No search results */}
        {subcategories.length > 0 && filteredSubs.length === 0 && searchQuery && (
          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm text-center py-16 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-5 text-5xl shadow-inner">
              🔍
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
              No categories found
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              No category matches "<strong>{searchQuery}</strong>" in {mainCategory.name}
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="bg-gray-900 text-white border-none rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:bg-gray-800 transition font-[inherit] shadow-lg"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Subcategories Grid */}
        {filteredSubs.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm text-gray-500 font-semibold m-0">
                {searchQuery
                  ? `Found ${filteredSubs.length} categor${filteredSubs.length === 1 ? "y" : "ies"}`
                  : `Choose a category to see products`}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredSubs.map((sub, index) => {
                const count = getSubProductCount(sub._id);
                const g = gradients[index % gradients.length];
                const icon = categoryIcons[sub.name?.toLowerCase()] || "📁";
                const hasProducts = count > 0;

                return (
                  <div
                    key={sub._id}
                    onClick={() => navigate(`/products?category=${sub._id}`)}
                    className={`group relative bg-gradient-to-br ${g} border-2 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden`}
                  >
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/40 rounded-full blur-xl pointer-events-none" />

                    <div className="relative flex flex-col items-center text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mb-3 shadow-md border border-gray-100 group-hover:scale-110 group-hover:rotate-6 transition-all">
                        {sub.image ? (
                          <img src={sub.image} alt={sub.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          icon
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold text-gray-900 m-0 mb-2 leading-tight">
                        {sub.name}
                      </h3>

                      {hasProducts ? (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                          {count} {count === 1 ? "product" : "products"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full border border-gray-200">
                          Coming soon
                        </span>
                      )}

                      <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 group-hover:text-[#D85A30] transition-colors">
                        {hasProducts ? "Browse" : "View"}
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M9 5l7 7-7 7" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Browse all in this department CTA */}
        {subcategories.length > 0 && totalProducts > 0 && (
          <div className="mt-8 sm:mt-10 relative bg-gradient-to-br from-gray-900 to-slate-800 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D85A30]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white m-0 mb-1">
                  Or browse all {mainCategory.name}
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm m-0">
                  See {totalProducts} products across all categories
                </p>
              </div>
              <button
                onClick={() => navigate(`/products?category=${mainCategory._id}`)}
                className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-xl px-5 py-3 text-sm font-extrabold cursor-pointer shadow-lg hover:scale-105 transition-all font-[inherit] whitespace-nowrap"
              >
                View {totalProducts} Products →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubcategoriesPage;
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useGetAllProductsQuery } from "../features/product/productApi";

const categoryIcons = {
  furniture: "🛋️", kitchen: "🍳", electronics: "📱", walls: "🧱",
  decorative: "🖼️", upholstery: "🧵", finishes: "🎨", floors: "🪵",
  furnishing: "🪟", bathroom: "🚿", "home decor": "🏠", bedroom: "🛏️",
  outdoor: "🏡", garden: "🌿", lighting: "💡", fashion: "👗",
  clothing: "👔", shoes: "👟", beauty: "💄", health: "💊",
  sports: "⚽", books: "📚", toys: "🧸", grocery: "🛒",
  automotive: "🚗", office: "💼", pets: "🐾", tools: "🔧",
  gifts: "🎁",
};

const gradients = [
  { bg: "from-orange-400 via-orange-500 to-red-500", accent: "bg-orange-100 text-orange-700" },
  { bg: "from-blue-400 via-blue-500 to-indigo-600", accent: "bg-blue-100 text-blue-700" },
  { bg: "from-purple-400 via-purple-500 to-pink-500", accent: "bg-purple-100 text-purple-700" },
  { bg: "from-green-400 via-emerald-500 to-teal-600", accent: "bg-green-100 text-green-700" },
  { bg: "from-pink-400 via-pink-500 to-rose-500", accent: "bg-pink-100 text-pink-700" },
  { bg: "from-yellow-400 via-amber-500 to-orange-500", accent: "bg-yellow-100 text-yellow-700" },
  { bg: "from-teal-400 via-cyan-500 to-blue-500", accent: "bg-teal-100 text-teal-700" },
  { bg: "from-red-400 via-rose-500 to-pink-600", accent: "bg-red-100 text-red-700" },
  { bg: "from-indigo-400 via-violet-500 to-purple-600", accent: "bg-indigo-100 text-indigo-700" },
  { bg: "from-cyan-400 via-sky-500 to-blue-600", accent: "bg-cyan-100 text-cyan-700" },
];

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categoryData, isLoading } = useGetCategoryTreeQuery();
  const { data: productsData } = useGetAllProductsQuery({ limit: 500 });

  const products = productsData?.data || [];

  const categories = useMemo(
    () =>
      [...(categoryData?.data || [])].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      ),
    [categoryData]
  );

  const getMainCategoryProductCount = (cat) => {
    if (cat.children?.length > 0) {
      const childIds = cat.children.map((c) => c._id);
      return products.filter((p) => childIds.includes(p.category?._id)).length;
    }
    return products.filter((p) => p.category?._id === cat._id).length;
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter((cat) => {
      if (cat.name.toLowerCase().includes(q)) return true;
      return cat.children?.some((sub) => sub.name.toLowerCase().includes(q));
    });
  }, [categories, searchQuery]);

  const totalCategories = categories.length;
  const totalSubcategories = categories.reduce((sum, c) => sum + (c.children?.length || 0), 0);
  const totalProducts = products.length;

  const openCategory = (cat) => {
    if (cat.slug) {
      navigate(`/categories/${cat.slug}`);
    } else {
      navigate(`/categories/${cat._id}`);
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Sticky Back Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 bg-white hover:bg-gray-900 text-gray-700 hover:text-white border-2 border-gray-200 hover:border-gray-900 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold cursor-pointer transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </button>

            <nav className="hidden md:flex items-center gap-1.5 text-xs">
              <button onClick={() => navigate("/")} className="text-gray-500 hover:text-[#D85A30] font-semibold bg-transparent border-none cursor-pointer">Home</button>
              <span className="text-gray-300">›</span>
              <span className="text-gray-900 font-bold">All Categories</span>
            </nav>

            <button
              onClick={() => navigate("/products")}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#D85A30] bg-orange-50 hover:bg-[#D85A30] hover:text-white border-2 border-[#D85A30]/30 hover:border-[#D85A30] rounded-xl px-3 py-2 cursor-pointer transition-all"
            >
              🛍️ All Products
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-white via-orange-50/50 to-white rounded-3xl border-2 border-orange-100 p-6 sm:p-10 mb-6 shadow-md overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-200/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-[#D85A30] text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full mb-3">
              🗂️ Explore Departments
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 m-0 mb-3 leading-tight">
              Shop by Department
            </h1>
            <p className="text-sm sm:text-base text-gray-600 m-0 max-w-2xl mb-5">
              Explore our main departments. Each one has multiple subcategories to help you find exactly what you need.
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <div className="bg-white border-2 border-orange-200 rounded-xl px-4 py-2 shadow-sm">
                <p className="text-[10px] font-bold text-gray-500 uppercase m-0">Departments</p>
                <p className="text-xl font-black text-[#D85A30] m-0">{totalCategories}</p>
              </div>
              <div className="bg-white border-2 border-blue-200 rounded-xl px-4 py-2 shadow-sm">
                <p className="text-[10px] font-bold text-gray-500 uppercase m-0">Categories</p>
                <p className="text-xl font-black text-blue-600 m-0">{totalSubcategories}</p>
              </div>
              <div className="bg-white border-2 border-green-200 rounded-xl px-4 py-2 shadow-sm">
                <p className="text-[10px] font-bold text-gray-500 uppercase m-0">Products</p>
                <p className="text-xl font-black text-green-600 m-0">{totalProducts}+</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-xl">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search departments or categories..."
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
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl h-80 animate-pulse border-2 border-gray-100" />
            ))}
          </div>
        )}

        {/* No search results */}
        {!isLoading && filteredCategories.length === 0 && searchQuery && (
          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm text-center py-16 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-5 text-5xl shadow-inner">
              🔍
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">No departments found</h2>
            <p className="text-sm text-gray-500 mb-6">No department matches "<strong>{searchQuery}</strong>"</p>
            <button
              onClick={() => setSearchQuery("")}
              className="bg-gray-900 text-white border-none rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:bg-gray-800 transition font-[inherit] shadow-lg"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* No categories at all */}
        {!isLoading && categories.length === 0 && !searchQuery && (
          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm text-center py-20 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl flex items-center justify-center mx-auto mb-5 text-5xl shadow-inner">
              📂
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">No departments yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Departments are being set up. Check back soon.
            </p>
            <button
              onClick={() => navigate("/products")}
              className="bg-[#D85A30] text-white border-none rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:brightness-90 transition font-[inherit] shadow-lg"
            >
              Browse All Products →
            </button>
          </div>
        )}

        {/* Main Categories Grid */}
        {!isLoading && filteredCategories.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm text-gray-500 font-semibold m-0">
                {searchQuery
                  ? `Found ${filteredCategories.length} department${filteredCategories.length === 1 ? "" : "s"}`
                  : `${filteredCategories.length} departments available`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredCategories.map((cat, index) => {
                const productCount = getMainCategoryProductCount(cat);
                const subCount = cat.children?.length || 0;
                const g = gradients[index % gradients.length];
                const icon = categoryIcons[cat.name.toLowerCase()] || "📦";

                return (
                  <div
                    key={cat._id}
                    onClick={() => openCategory(cat)}
                    className="group relative bg-white rounded-3xl border-2 border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-transparent"
                  >
                    {/* Colored Header */}
                    <div className={`relative h-32 bg-gradient-to-br ${g.bg} overflow-hidden`}>
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
                      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />

                      {/* Icon */}
                      <div className="absolute top-4 left-5 w-16 h-16 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          icon
                        )}
                      </div>

                      {/* Product count badge */}
                      <div className="absolute top-4 right-4">
                        {productCount > 0 ? (
                          <span className="bg-white/95 text-gray-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                            {productCount} items
                          </span>
                        ) : (
                          <span className="bg-white/70 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            Coming soon
                          </span>
                        )}
                      </div>

                      {/* Category name overlay */}
                      <div className="absolute bottom-3 left-5 right-5">
                        <h3 className="text-2xl font-black text-white m-0 drop-shadow-md">
                          {cat.name}
                        </h3>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {cat.description && (
                        <p className="text-xs text-gray-600 m-0 mb-3 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      )}

                      {/* Subcategories preview */}
                      {subCount > 0 ? (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${g.accent}`}>
                              {subCount} {subCount === 1 ? "Category" : "Categories"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {cat.children.slice(0, 4).map((sub) => (
                              <span
                                key={sub._id}
                                className="text-[11px] font-semibold bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                              >
                                {categoryIcons[sub.name?.toLowerCase()] || ""} {sub.name}
                              </span>
                            ))}
                            {subCount > 4 && (
                              <span className="text-[11px] font-bold bg-gray-900 text-white px-2.5 py-1 rounded-full">
                                +{subCount - 4} more
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic mb-4">
                          No subcategories yet
                        </p>
                      )}

                      {/* CTA Button */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs font-bold text-gray-900 m-0">
                            {subCount > 0 ? "Browse categories" : "Explore department"}
                          </p>
                          <p className="text-[10px] text-gray-500 m-0">
                            {productCount > 0 ? `${productCount} products available` : "Coming soon"}
                          </p>
                        </div>
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${g.bg} flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-12 transition-all shadow-md`}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M9 5l7 7-7 7" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Bottom CTA */}
        {!isLoading && categories.length > 0 && (
          <div className="mt-10 sm:mt-14 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-7 sm:p-10 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D85A30]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white m-0 mb-2">
                  Can't find what you need?
                </h2>
                <p className="text-slate-300 text-sm m-0">
                  Browse all products across every department in one place
                </p>
              </div>
              <button
                onClick={() => navigate("/products")}
                className="bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-2xl px-6 py-3.5 text-sm font-extrabold cursor-pointer shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all font-[inherit] whitespace-nowrap"
              >
                🛍️ View All Products →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
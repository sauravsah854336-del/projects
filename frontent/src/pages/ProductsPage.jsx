import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useGetAllProductsQuery } from "../features/product/productApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const ProductsPage = () => {
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

  useEffect(() => {
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    if (category !== filters.category || search !== filters.search) {
      setFilters((prev) => ({
        ...prev,
        category,
        search,
        page: 1,
      }));
      setSearchInput(search);
      setExpandedCategory(category);
    }
  }, [searchParams]);

  const { data: productsData, isLoading } = useGetAllProductsQuery({
    ...filters,
    limit: 12,
  });

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
      page: 1,
    });
    setSearchInput("");
    setExpandedCategory("");
    setSearchParams({});
  };

  const handleCategorySelect = (catId) => {
    handleFilterChange("category", catId === filters.category ? "" : catId);
  };

  const toggleExpandCategory = (catId) => {
    setExpandedCategory(expandedCategory === catId ? "" : catId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {selectedCategoryName || "All Products"}
        </h1>
        <p className="text-gray-500 mt-1">
          {pagination?.total
            ? `${pagination.total} products found`
            : "Browse our collection"}
        </p>

        {(filters.category ||
          filters.search ||
          filters.minPrice ||
          filters.maxPrice) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.search && (
              <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                Search: "{filters.search}"
                <button
                  onClick={() => {
                    handleFilterChange("search", "");
                    setSearchInput("");
                  }}
                  className="text-gray-500 hover:text-black bg-transparent border-none cursor-pointer text-lg leading-none"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCategoryName && (
              <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                Category: {selectedCategoryName}
                <button
                  onClick={() => handleFilterChange("category", "")}
                  className="text-gray-500 hover:text-black bg-transparent border-none cursor-pointer text-lg leading-none"
                >
                  ×
                </button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                Price: {filters.minPrice || "0"} - {filters.maxPrice || "∞"}
                <button
                  onClick={() => {
                    handleFilterChange("minPrice", "");
                    handleFilterChange("maxPrice", "");
                  }}
                  className="text-gray-500 hover:text-black bg-transparent border-none cursor-pointer text-lg leading-none"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-sm text-[#D85A30] hover:underline bg-transparent border-none cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-black"
        />
        <button
          type="submit"
          className="bg-black text-white px-6 py-3 rounded-xl font-medium"
        >
          Search
        </button>
      </form>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-500 hover:text-black bg-transparent border-none cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-3">
                Category
              </h4>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategorySelect("")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors bg-transparent border-none cursor-pointer ${
                    filters.category === ""
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All Categories
                </button>

                {categories.map((cat) => (
                  <div key={cat._id}>
                    <div className="flex items-center">
                      <button
                        onClick={() => handleCategorySelect(cat._id)}
                        className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors bg-transparent border-none cursor-pointer ${
                          filters.category === cat._id
                            ? "bg-black text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {cat.name}
                      </button>

                      {cat.children?.length > 0 && (
                        <button
                          onClick={() => toggleExpandCategory(cat._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 bg-transparent border-none cursor-pointer"
                        >
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                              expandedCategory === cat._id ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {cat.children?.length > 0 &&
                      expandedCategory === cat._id && (
                        <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                          {cat.children.map((sub) => (
                            <button
                              key={sub._id}
                              onClick={() => handleCategorySelect(sub._id)}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors bg-transparent border-none cursor-pointer ${
                                filters.category === sub._id
                                  ? "bg-black text-white"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                              }`}
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-3">
                Price Range
              </h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value)
                  }
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value)
                  }
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-3">
                Sort By
              </h4>
              <div className="space-y-1">
                {[
                  { label: "Newest First", value: "newest" },
                  { label: "Price: Low to High", value: "price_low" },
                  { label: "Price: High to Low", value: "price_high" },
                  { label: "Most Popular", value: "popular" },
                  { label: "Top Rated", value: "rating" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange("sort", option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors bg-transparent border-none cursor-pointer ${
                      filters.sort === option.value
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {isLoading && (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading products...</p>
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-gray-500 text-lg">No products found</p>
              <button
                onClick={handleClearFilters}
                className="mt-4 bg-black text-white px-6 py-3 rounded-xl border-none cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                to={`/products/${product.slug}`}
                key={product._id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition group no-underline"
              >
                <div className="relative">
                  <img
                    src={product.images?.[0]?.url || PLACEHOLDER_MEDIUM}
                    alt={product.name}
                    className="w-full h-52 object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = PLACEHOLDER_MEDIUM;
                    }}
                  />
                  {product.isFeatured && (
                    <span className="absolute top-3 left-3 bg-black text-white text-xs px-3 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                  {product.comparePrice > product.price && (
                    <span className="absolute top-3 right-3 bg-[#D85A30] text-white text-xs px-3 py-1 rounded-full">
                      {Math.round(
                        ((product.comparePrice - product.price) /
                          product.comparePrice) *
                          100
                      )}
                      % OFF
                    </span>
                  )}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-xs text-gray-500 mb-1">
                    {product.category?.name}
                  </p>
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    By {product.vendorStore?.storeName || "Vendor"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[#D85A30] font-bold text-lg">
                        {formatRupee(product.price)}
                      </span>
                      {product.comparePrice > 0 && (
                        <span className="text-xs text-gray-400 line-through ml-2">
                          {formatRupee(product.comparePrice)}
                        </span>
                      )}
                    </div>
                    {product.averageRating > 0 && (
                      <span className="text-xs text-gray-500">
                        ⭐ {product.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40 bg-white cursor-pointer"
              >
                Previous
              </button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg text-sm cursor-pointer ${
                      filters.page === page
                        ? "bg-black text-white border-none"
                        : "border border-gray-300 bg-white"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.pages}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40 bg-white cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useGetAllProductsQuery } from "../features/product/productApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useAddToCartMutation } from "../features/cart/cartApi";
import { useSelector } from "react-redux";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";

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

const ProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [addToCart] = useAddToCartMutation();
  const [addedProducts, setAddedProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});

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
      category !== filters.category ||
      search !== filters.search ||
      sort !== filters.sort ||
      minPrice !== filters.minPrice ||
      maxPrice !== filters.maxPrice
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

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange("search", searchInput);
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setFilters({ category: "", minPrice: "", maxPrice: "", sort: "newest", search: "", page: 1 });
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

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    if (!isCustomer) return;
    setLoadingProducts((p) => ({ ...p, [productId]: "cart" }));
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      setAddedProducts((prev) => ({ ...prev, [productId]: true }));
      setTimeout(() => setAddedProducts((prev) => ({ ...prev, [productId]: false })), 2000);
    } catch (err) {
      alert(err?.data?.message || "Failed to add to cart");
    } finally {
      setLoadingProducts((p) => ({ ...p, [productId]: null }));
    }
  };

  const handleBuyNow = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    if (!isCustomer) return;
    setLoadingProducts((p) => ({ ...p, [productId]: "buy" }));
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      navigate("/checkout");
    } catch (err) {
      alert(err?.data?.message || "Failed to add to cart");
      setLoadingProducts((p) => ({ ...p, [productId]: null }));
    }
  };

  const Sidebar = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{
        background: "white", borderRadius: 12,
        border: "1px solid #E5E7EB", overflow: "hidden",
      }}>
        <div style={{
          padding: "14px 16px", borderBottom: "1px solid #E5E7EB",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#F9FAFB",
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>Filters</span>
          <button
            onClick={handleClearFilters}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#D85A30", fontSize: 12, fontWeight: 600 }}
          >
            Clear All
          </button>
        </div>

        <div style={{ padding: "16px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Department
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <button
              onClick={() => handleCategorySelect("")}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", borderRadius: 8,
                background: filters.category === "" ? "#111" : "transparent",
                color: filters.category === "" ? "white" : "#374151",
                border: "none", cursor: "pointer", textAlign: "left",
                fontSize: 13, fontWeight: filters.category === "" ? 700 : 400,
              }}
            >
              <span>🛍️</span>
              <span style={{ flex: 1 }}>All Products</span>
            </button>
            {categories.map((cat) => {
              const icon = categoryIcons[cat.name.toLowerCase()] || "📦";
              const isActive = filters.category === cat._id;
              const isExpanded = expandedCategory === cat._id;
              return (
                <div key={cat._id}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={() => handleCategorySelect(cat._id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        flex: 1, padding: "8px 10px", borderRadius: 8,
                        background: isActive ? "#111" : "transparent",
                        color: isActive ? "white" : "#374151",
                        border: "none", cursor: "pointer", textAlign: "left",
                        fontSize: 13, fontWeight: isActive ? 700 : 400,
                      }}
                    >
                      <span>{icon}</span>
                      <span style={{ flex: 1 }}>{cat.name}</span>
                    </button>
                    {cat.children?.length > 0 && (
                      <button
                        onClick={() => toggleExpandCategory(cat._id)}
                        style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {cat.children?.length > 0 && isExpanded && (
                    <div style={{ marginLeft: 12, borderLeft: "2px solid #F3F4F6", paddingLeft: 8, marginTop: 2, marginBottom: 2 }}>
                      {cat.children.map((sub) => (
                        <button
                          key={sub._id}
                          onClick={() => handleCategorySelect(sub._id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            width: "100%", padding: "6px 10px", borderRadius: 6,
                            background: filters.category === sub._id ? "#FFF5F0" : "transparent",
                            color: filters.category === sub._id ? "#D85A30" : "#6B7280",
                            border: "none", cursor: "pointer", textAlign: "left",
                            fontSize: 12, fontWeight: filters.category === sub._id ? 700 : 400,
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#D85A30", flexShrink: 0 }}></span>
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

        <div style={{ padding: "16px", borderBottom: "1px solid #F3F4F6" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Price Range
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number" placeholder="Min ₹"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange("minPrice", e.target.value)}
              style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", color: "#111" }}
            />
            <input
              type="number" placeholder="Max ₹"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
              style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", color: "#111" }}
            />
          </div>
        </div>

        <div style={{ padding: "16px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Sort By
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { label: "Newest First", value: "newest", icon: "🆕" },
              { label: "Price: Low to High", value: "price_low", icon: "⬆️" },
              { label: "Price: High to Low", value: "price_high", icon: "⬇️" },
              { label: "Most Popular", value: "popular", icon: "🔥" },
              { label: "Top Rated", value: "rating", icon: "⭐" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterChange("sort", option.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", borderRadius: 8,
                  background: filters.sort === option.value ? "#111" : "transparent",
                  color: filters.sort === option.value ? "white" : "#374151",
                  border: "none", cursor: "pointer", textAlign: "left",
                  fontSize: 13, fontWeight: filters.sort === option.value ? 700 : 400,
                }}
              >
                <span style={{ fontSize: 14 }}>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .product-card-list {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          transition: all 0.2s;
        }
        .product-card-list:hover {
          border-color: #D85A30;
          box-shadow: 0 4px 20px rgba(216,90,48,0.12);
          transform: translateY(-2px);
        }
        .btn-cart {
          flex: 1;
          background: linear-gradient(180deg, #FFD814, #F7CA00);
          color: #111;
          border: 1px solid #FCD200;
          border-radius: 6px;
          padding: 7px 4px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .btn-cart:hover { filter: brightness(0.95); }
        .btn-cart.added { background: #22C55E; color: white; border-color: #22C55E; }
        .btn-cart:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-buy {
          flex: 1;
          background: linear-gradient(135deg, #D85A30, #FF8C5A);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 7px 4px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .btn-buy:hover { filter: brightness(0.92); }
        .btn-buy:disabled { opacity: 0.6; cursor: not-allowed; }
        .mobile-filter-btn { display: none; }
        @media (max-width: 1024px) {
          .desktop-sidebar { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
        }
        .filter-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9998; }
        .filter-panel { position: fixed; left: 0; top: 0; bottom: 0; width: 300px; max-width: 85vw; background: white; z-index: 9999; overflow-y: auto; padding: 20px; }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px" }}>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: 0 }}>
                {selectedCategoryName || "All Products"}
              </h1>
              <p style={{ color: "#6B7280", fontSize: 13, margin: "4px 0 0" }}>
                {pagination?.total ? `${pagination.total} products found` : "Browse our collection"}
              </p>
            </div>
            <button
              className="mobile-filter-btn"
              onClick={() => setMobileFilterOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "#111", color: "white", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 6h18M7 12h10M11 18h2" />
              </svg>
              Filters
            </button>
          </div>

          {(filters.category || filters.search || filters.minPrice || filters.maxPrice) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {filters.search && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFF5F0", color: "#D85A30", border: "1px solid #FDBA74", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
                  🔍 "{filters.search}"
                  <button onClick={() => { handleFilterChange("search", ""); setSearchInput(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#D85A30", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              )}
              {selectedCategoryName && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, background: "#F0FDF4", color: "#16A34A", border: "1px solid #86EFAC", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
                  📂 {selectedCategoryName}
                  <button onClick={() => handleFilterChange("category", "")} style={{ background: "none", border: "none", cursor: "pointer", color: "#16A34A", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, background: "#EFF6FF", color: "#2563EB", border: "1px solid #93C5FD", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
                  💰 ₹{filters.minPrice || "0"} – ₹{filters.maxPrice || "∞"}
                  <button onClick={() => { handleFilterChange("minPrice", ""); handleFilterChange("maxPrice", ""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              )}
              <button onClick={handleClearFilters} style={{ background: "none", border: "none", cursor: "pointer", color: "#D85A30", fontSize: 12, fontWeight: 700, padding: "4px 8px" }}>
                Clear All
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <input
            type="text" placeholder="Search products, brands, vendors..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 16px", fontSize: 14, outline: "none", background: "white", color: "#111" }}
          />
          <button type="submit" style={{ background: "linear-gradient(180deg, #FFD814, #F7CA00)", color: "#111", border: "1px solid #FCD200", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div className="desktop-sidebar" style={{ width: 240, flexShrink: 0, position: "sticky", top: 80 }}>
            <Sidebar />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {isLoading && (
              <div style={{ textAlign: "center", padding: 80 }}>
                <div style={{ width: 36, height: 36, border: "3px solid #D85A30", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 16px" }}></div>
                <p style={{ color: "#6B7280", fontSize: 14 }}>Loading products...</p>
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}>
                <p style={{ fontSize: 52, margin: "0 0 16px" }}>📦</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: 0 }}>No products found</p>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8 }}>Try adjusting your filters or search terms</p>
                <button onClick={handleClearFilters} style={{ marginTop: 20, background: "#111", color: "white", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Clear Filters
                </button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {products.map((product) => {
                const isAdded = addedProducts[product._id];
                const loading = loadingProducts[product._id];
                return (
                  <Link to={`/products/${product.slug}`} key={product._id} className="product-card-list">
                    <div style={{ position: "relative", paddingTop: "72%", background: "#F9FAFB", overflow: "hidden" }}>
                      <img
                        src={product.images?.[0]?.url || PLACEHOLDER_MEDIUM}
                        alt={product.name}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                        onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_MEDIUM; }}
                      />
                      {product.isFeatured && (
                        <span style={{ position: "absolute", top: 8, left: 8, background: "#111", color: "white", padding: "3px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>
                          Featured
                        </span>
                      )}
                      {product.comparePrice > product.price && (
                        <span style={{ position: "absolute", top: 8, right: 8, background: "#D85A30", color: "white", padding: "3px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700 }}>
                          {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                        </span>
                      )}
                      {product.stock <= 0 && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ background: "white", color: "#111", padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1 }}>
                      <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0, marginBottom: 3 }}>
                        {product.category?.name} • {product.vendorStore?.storeName || "Vendor"}
                      </p>
                      <h3 style={{
                        fontSize: 13, fontWeight: 500, color: "#111", margin: "0 0 4px",
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4,
                      }}>{product.name}</h3>
                      {product.averageRating > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
                          <span style={{ color: "#F59E0B", fontSize: 11 }}>★</span>
                          <span style={{ fontSize: 11, color: "#6B7280" }}>{product.averageRating.toFixed(1)} ({product.totalReviews || 0})</span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#B12704" }}>{formatRupee(product.price)}</span>
                        {product.comparePrice > 0 && (
                          <span style={{ fontSize: 11, color: "#9CA3AF", textDecoration: "line-through" }}>{formatRupee(product.comparePrice)}</span>
                        )}
                      </div>

                      {canShop && product.stock > 0 && (
                        <div style={{ display: "flex", gap: 5, marginTop: "auto" }}>
                          <button
                            onClick={(e) => handleAddToCart(e, product._id)}
                            disabled={loading === "cart"}
                            className={`btn-cart ${isAdded ? "added" : ""}`}
                          >
                            {loading === "cart" ? "..." : isAdded ? "✓ Added" : "Add to Cart"}
                          </button>
                          <button
                            onClick={(e) => handleBuyNow(e, product._id)}
                            disabled={loading === "buy"}
                            className="btn-buy"
                          >
                            {loading === "buy" ? "..." : "Buy Now"}
                          </button>
                        </div>
                      )}

                      {user && !isCustomer && (
                        <div style={{ marginTop: "auto", padding: "6px 8px", background: "#F3F4F6", borderRadius: 6, textAlign: "center" }}>
                          <p style={{ fontSize: 10, color: "#6B7280", margin: 0, fontWeight: 600 }}>
                            {user.role === "admin" ? "Admin view only" : "Vendor view only"}
                          </p>
                        </div>
                      )}

                      {product.stock <= 0 && canShop && (
                        <button
                          disabled
                          style={{ marginTop: "auto", background: "#F3F4F6", color: "#9CA3AF", border: "none", borderRadius: 6, padding: "7px", fontSize: 11, fontWeight: 700, cursor: "not-allowed" }}
                        >
                          Out of Stock
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {pagination && pagination.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40, flexWrap: "wrap" }}>
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, cursor: "pointer", opacity: filters.page === 1 ? 0.4 : 1 }}
                >
                  ← Prev
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      padding: "10px 16px", borderRadius: 8,
                      background: filters.page === page ? "#111" : "white",
                      color: filters.page === page ? "white" : "#111",
                      border: filters.page === page ? "none" : "1px solid #E5E7EB",
                      fontSize: 13, fontWeight: filters.page === page ? 700 : 400, cursor: "pointer",
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === pagination.pages}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, cursor: "pointer", opacity: filters.page === pagination.pages ? 0.4 : 1 }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileFilterOpen && (
        <>
          <div className="filter-overlay" onClick={() => setMobileFilterOpen(false)}></div>
          <div className="filter-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>Filters</span>
              <button onClick={() => setMobileFilterOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#111" }}>×</button>
            </div>
            <Sidebar />
          </div>
        </>
      )}
    </div>
  );
};

export default ProductsPage;
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useGetCartQuery } from "../features/cart/cartApi";
import { useSearchSuggestionsQuery } from "../features/search/searchApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useDebounce } from "../hooks/useDebounce";
import { PLACEHOLDER_TINY } from "../utils/placeholder";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const Navbar = () => {
  const { user, refreshToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutAPI] = useLogoutMutation();

  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [searchCategory, setSearchCategory] = useState("all");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");

  const accountTimer = useRef(null);
  const searchBoxRef = useRef(null);
  const inputRef = useRef(null);

  const trimmedQuery = searchQuery.trim();
  const debouncedQuery = useDebounce(trimmedQuery, 250);

  const { data: cartData } = useGetCartQuery(undefined, {
    skip: !user || user.role !== "customer",
  });

  const { data: sugData, isFetching, isLoading } = useSearchSuggestionsQuery(
    debouncedQuery,
    {
      skip: debouncedQuery.length < 1,
      refetchOnMountOrArgChange: true,
    }
  );

  const { data: categoryData } = useGetCategoryTreeQuery();

  const cartCount = cartData?.data?.totalItems || 0;
  const isCustomer = user?.role === "customer";
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";
  const categories = categoryData?.data || [];

  const suggestions = sugData?.data || {
    products: [],
    categories: [],
    vendors: [],
  };

  const allSuggestions = [
    ...(suggestions.categories?.map((c) => ({ type: "category", data: c })) ||
      []),
    ...(suggestions.vendors?.map((v) => ({ type: "vendor", data: v })) || []),
    ...(suggestions.products?.map((p) => ({ type: "product", data: p })) || []),
  ];

  const hasResults = allSuggestions.length > 0;
  const showDropdown = searchFocus && trimmedQuery.length >= 1;
  const isSearching =
    isFetching ||
    isLoading ||
    (trimmedQuery !== debouncedQuery && trimmedQuery.length >= 1);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
    setSearchFocus(false);
    setSearchQuery("");
    setHighlightIndex(-1);
  }, [location.pathname]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchFocus(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const go = (path) => {
    setAccountOpen(false);
    setMobileOpen(false);
    setSearchFocus(false);
    setSearchQuery("");
    navigate(path);
  };

  const dash = (role) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "vendor") return "/vendor/dashboard";
    return "/dashboard";
  };

  const doSearch = (customQuery) => {
    const q = (customQuery || searchQuery).trim();
    if (!q) return;
    let url = `/products?search=${encodeURIComponent(q)}`;
    if (searchCategory !== "all") url += `&category=${searchCategory}`;
    go(url);
  };

  const handleSuggestionClick = (item) => {
    if (item.type === "category") go(`/products?category=${item.data._id}`);
    else if (item.type === "vendor")
      go(`/products?search=${item.data.storeName}`);
    else if (item.type === "product") go(`/products/${item.data.slug}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < allSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (highlightIndex >= 0 && allSuggestions[highlightIndex]) {
        handleSuggestionClick(allSuggestions[highlightIndex]);
      } else {
        doSearch();
      }
    } else if (e.key === "Escape") {
      setSearchFocus(false);
      inputRef.current?.blur();
    }
  };

  const doLogout = async () => {
    setAccountOpen(false);
    try {
      await logoutAPI({ refreshToken }).unwrap();
    } catch (e) {}
    dispatch(authApi.util.resetApiState());
    dispatch(logout());
    navigate("/login");
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} style={{ fontWeight: 800, color: "#C45500" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <style>{`
        @keyframes ddIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }

        .nav-main {
          background: #131921;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          position: sticky;
          top: 0;
          z-index: 9000;
          overflow: visible;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .nav-logo:hover { border-color: white; }
        .nav-logo-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #D85A30, #FF8C5A);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 900; font-size: 15px;
        }
        .nav-logo-text {
          color: white; font-weight: 800; font-size: 18px;
        }
        .search-wrapper {
          flex: 1;
          display: flex;
          justify-content: center;
          max-width: 650px;
          margin: 0 auto;
          position: relative;
          z-index: 9999;
        }
        .search-container {
          width: 100%;
          display: flex;
          height: 42px;
          border-radius: 8px;
          overflow: visible;
          position: relative;
          background: white;
          z-index: 9999;
        }
        .search-container.focused { box-shadow: 0 0 0 3px #FF9900; }
        .search-cat-select {
          background: linear-gradient(180deg, #F3F3F3, #E7E9EC);
          border: none;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 600;
          color: #111;
          cursor: pointer;
          border-right: 1px solid #CDCDCD;
          outline: none;
          max-width: 100px;
          border-top-left-radius: 8px;
          border-bottom-left-radius: 8px;
        }
        .search-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 14px;
          font-size: 14px;
          background: white;
          color: #111;
          min-width: 0;
        }
        .search-btn {
          background: linear-gradient(180deg, #FFD814, #F7CA00);
          border: none;
          padding: 0 18px;
          cursor: pointer;
          color: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top-right-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .search-dd {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
          max-height: 500px;
          overflow-y: auto;
          z-index: 99999;
          animation: ddIn 0.12s ease both;
          border: 1px solid #E5E5E5;
        }
        .sd-section { padding: 6px 0; }
        .sd-section + .sd-section { border-top: 1px solid #F0F0F0; }
        .sd-label {
          padding: 8px 16px 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #888;
          display: flex;
          justify-content: space-between;
        }
        .sd-count {
          background: #FFF5F0;
          color: #D85A30;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
        }
        .sd-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          width: 100%;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
        }
        .sd-item:hover, .sd-item.highlight { background: #FFF8F3; }
        .sd-item.highlight { border-left: 3px solid #D85A30; padding-left: 13px; }
        .sd-empty { padding: 28px 16px; text-align: center; }
        .sd-empty-icon {
          width: 48px; height: 48px;
          background: #F5F5F5;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 10px;
          font-size: 22px;
        }
        .sd-loading { padding: 24px; text-align: center; }
        .sd-spinner {
          width: 24px; height: 24px;
          border: 2.5px solid #F90;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin: 0 auto 10px;
        }
        .sd-see-all {
          width: 100%;
          padding: 12px 16px;
          background: #F7F7F7;
          border: none;
          border-top: 1px solid #EEE;
          cursor: pointer;
          color: #0066C0;
          font-size: 13px;
          font-weight: 600;
        }
        .nav-link {
          padding: 8px 10px;
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          color: white;
          display: flex;
          flex-direction: column;
          background: transparent;
          text-align: left;
          flex-shrink: 0;
          line-height: 1.2;
        }
        .nav-link:hover { border-color: white; }
        .nav-link-top { color: #CCC; font-size: 11px; }
        .nav-link-bottom { color: white; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 3px; }
        .nav-cart {
          padding: 8px 10px;
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          color: white;
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          flex-shrink: 0;
        }
        .nav-cart:hover { border-color: white; }
        .nav-cart-icon-wrap { position: relative; display: flex; align-items: center; }
        .cart-count {
          position: absolute;
          top: -8px; right: -8px;
          background: linear-gradient(135deg, #F90, #FFA826);
          color: white;
          font-size: 11px;
          font-weight: 800;
          min-width: 20px; height: 20px;
          border-radius: 99px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 6px;
          border: 2px solid #131921;
        }
        .account-dd {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          min-width: 340px;
          z-index: 99999;
          animation: ddIn 0.15s ease both;
          overflow: hidden;
        }
        .account-dd-header { padding: 16px 20px; border-bottom: 1px solid #EEE; text-align: center; }
        .account-dd-body { display: flex; }
        .account-dd-col { flex: 1; padding: 16px; }
        .account-dd-col:not(:last-child) { border-right: 1px solid #EEE; }
        .account-dd-col-title { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 8px; }
        .account-dd-link {
          display: block;
          padding: 5px 0;
          font-size: 13px;
          color: #555;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          width: 100%;
        }
        .account-dd-link:hover { color: #E47911; text-decoration: underline; }
        .slide-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 99998;
        }
        .slide-panel {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 320px;
          max-width: 85vw;
          background: white;
          z-index: 99999;
          overflow-y: auto;
          animation: slideRight 0.2s ease both;
        }
        .slide-header {
          background: #232F3E;
          color: white;
          padding: 16px 20px;
          font-size: 17px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .slide-section { padding: 12px 0; border-bottom: 6px solid #F3F3F3; }
        .slide-section-title { font-size: 17px; font-weight: 800; color: #111; padding: 4px 20px 8px; }
        .slide-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          font-size: 14px;
          color: #333;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }
        .slide-item:hover { background: #F2F2F2; }
        .mobile-only { display: none; }
        .desktop-only { display: flex; }
        @media (max-width: 1024px) { .nav-logo-text { display: none; } }
        @media (max-width: 900px) {
          .search-cat-select { display: none; }
          .nav-link { display: none; }
          .search-wrapper { max-width: none; }
        }
        @media (max-width: 640px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          .nav-main { padding: 8px 10px; gap: 8px; }
          .search-container { height: 40px; }
        }
        .mobile-menu-btn {
          padding: 8px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        }
        .mobile-menu-btn:hover { border-color: white; }
      `}</style>

      <nav className="nav-main">
        <button
          onClick={() => setMobileOpen(true)}
          className="mobile-menu-btn mobile-only"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="nav-logo" onClick={() => go("/")}>
          <div className="nav-logo-icon">E</div>
          <span className="nav-logo-text">Commerce</span>
        </div>

        <div className="nav-link desktop-only" onClick={() => go("/products")}>
          <span className="nav-link-top">Deliver to</span>
          <span className="nav-link-bottom">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
            India
          </span>
        </div>

        {/* SEARCH */}
        <div className="search-wrapper">
          <div
            className={`search-container ${searchFocus ? "focused" : ""}`}
            ref={searchBoxRef}
          >
            <select
              className="search-cat-select"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            >
              <option value="all">All</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <input
              ref={inputRef}
              type="text"
              placeholder="Search E-Commerce"
              className="search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchFocus(true);
              }}
              onFocus={() => setSearchFocus(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
            />

            <button onClick={() => doSearch()} className="search-btn">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* SEARCH DROPDOWN */}
            {showDropdown && (
              <div
                className="search-dd"
                onMouseDown={(e) => e.preventDefault()}
              >
                {isSearching && (
                  <div className="sd-loading">
                    <div className="sd-spinner"></div>
                    <p style={{ fontSize: 12, color: "#888" }}>Searching...</p>
                  </div>
                )}

                {!isSearching && !hasResults && debouncedQuery && (
                  <div className="sd-empty">
                    <div className="sd-empty-icon">🔍</div>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111",
                        marginBottom: 4,
                      }}
                    >
                      No results found
                    </p>
                    <p style={{ fontSize: 12, color: "#888" }}>
                      Nothing matches "<strong>{searchQuery}</strong>"
                    </p>
                    <button
                      onClick={() => doSearch()}
                      style={{
                        marginTop: 12,
                        padding: "8px 16px",
                        background: "#FFD814",
                        border: "1px solid #FCD200",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Search anyway
                    </button>
                  </div>
                )}

                {!isSearching && hasResults && (
                  <>
                    {suggestions.categories?.length > 0 && (
                      <div className="sd-section">
                        <div className="sd-label">
                          <span>Categories</span>
                          <span className="sd-count">
                            {suggestions.categories.length}
                          </span>
                        </div>
                        {suggestions.categories.map((c, idx) => (
                          <button
                            key={c._id}
                            onClick={() =>
                              handleSuggestionClick({
                                type: "category",
                                data: c,
                              })
                            }
                            onMouseEnter={() => setHighlightIndex(idx)}
                            className={`sd-item ${
                              highlightIndex === idx ? "highlight" : ""
                            }`}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                background: "#FFF5F0",
                                borderRadius: 6,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="#D85A30"
                                strokeWidth="2"
                              >
                                <path
                                  d="M4 6h16M4 12h16M4 18h7"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#111",
                                }}
                              >
                                {highlightText(c.name, debouncedQuery)}
                              </p>
                              <p style={{ fontSize: 11, color: "#888" }}>
                                in Categories
                              </p>
                            </div>
                            <svg
                              width="14"
                              height="14"
                              fill="none"
                              stroke="#999"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            >
                              <path d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    )}

                    {suggestions.vendors?.length > 0 && (
                      <div className="sd-section">
                        <div className="sd-label">
                          <span>Stores</span>
                          <span className="sd-count">
                            {suggestions.vendors.length}
                          </span>
                        </div>
                        {suggestions.vendors.map((v, idx) => {
                          const gIdx =
                            (suggestions.categories?.length || 0) + idx;
                          return (
                            <button
                              key={v._id}
                              onClick={() =>
                                handleSuggestionClick({
                                  type: "vendor",
                                  data: v,
                                })
                              }
                              onMouseEnter={() => setHighlightIndex(gIdx)}
                              className={`sd-item ${
                                highlightIndex === gIdx ? "highlight" : ""
                              }`}
                            >
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  background: "#EFF6FF",
                                  borderRadius: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#3B82F6",
                                  fontSize: 13,
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {v.storeName?.charAt(0)?.toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#111",
                                  }}
                                >
                                  {highlightText(v.storeName, debouncedQuery)}
                                </p>
                                <p style={{ fontSize: 11, color: "#888" }}>
                                  Store
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {suggestions.products?.length > 0 && (
                      <div className="sd-section">
                        <div className="sd-label">
                          <span>Products</span>
                          <span className="sd-count">
                            {suggestions.products.length}
                          </span>
                        </div>
                        {suggestions.products.map((p, idx) => {
                          const gIdx =
                            (suggestions.categories?.length || 0) +
                            (suggestions.vendors?.length || 0) +
                            idx;
                          return (
                            <button
                              key={p._id}
                              onClick={() =>
                                handleSuggestionClick({
                                  type: "product",
                                  data: p,
                                })
                              }
                              onMouseEnter={() => setHighlightIndex(gIdx)}
                              className={`sd-item ${
                                highlightIndex === gIdx ? "highlight" : ""
                              }`}
                            >
                              <img
                                src={p.images?.[0]?.url || PLACEHOLDER_TINY}
                                alt=""
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 6,
                                  objectFit: "cover",
                                  flexShrink: 0,
                                  border: "1px solid #EEE",
                                }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = PLACEHOLDER_TINY;
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                  style={{
                                    fontSize: 13,
                                    color: "#111",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontWeight: 500,
                                  }}
                                >
                                  {highlightText(p.name, debouncedQuery)}
                                </p>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginTop: 2,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: "#B12704",
                                    }}
                                  >
                                    {formatRupee(p.price)}
                                  </span>
                                  {p.comparePrice > p.price && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "#999",
                                        textDecoration: "line-through",
                                      }}
                                    >
                                      {formatRupee(p.comparePrice)}
                                    </span>
                                  )}
                                  {p.brand && (
                                    <span
                                      style={{ fontSize: 11, color: "#888" }}
                                    >
                                      • {p.brand}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <button onClick={() => doSearch()} className="sd-see-all">
                      See all results for "{searchQuery}" →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Account */}
        <div
          style={{ position: "relative" }}
          className="desktop-only"
          onMouseEnter={() => {
            clearTimeout(accountTimer.current);
            setAccountOpen(true);
          }}
          onMouseLeave={() => {
            accountTimer.current = setTimeout(() => setAccountOpen(false), 200);
          }}
        >
          <button className="nav-link">
            <span className="nav-link-top">
              {user ? `Hello, ${user.firstName}` : "Hello, sign in"}
            </span>
            <span className="nav-link-bottom">
              Account & Lists
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </span>
          </button>

          {accountOpen && (
            <div className="account-dd">
              {!user && (
                <div className="account-dd-header">
                  <button
                    onClick={() => go("/login")}
                    style={{
                      background: "linear-gradient(180deg, #FFD814, #F7CA00)",
                      color: "#111",
                      padding: "8px 24px",
                      border: "1px solid #FCD200",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: 8,
                    }}
                  >
                    Sign In
                  </button>
                  <p style={{ fontSize: 12, color: "#555" }}>
                    New customer?{" "}
                    <button
                      onClick={() => go("/signup")}
                      style={{
                        color: "#0066C0",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Start here.
                    </button>
                  </p>
                </div>
              )}

              <div className="account-dd-body">
                <div className="account-dd-col">
                  <p className="account-dd-col-title">Your Account</p>
                  {user && (
                    <>
                      <button
                        onClick={() => go(dash(user.role))}
                        className="account-dd-link"
                      >
                        Your Account
                      </button>
                      {isCustomer && (
                        <button
                          onClick={() => go("/orders")}
                          className="account-dd-link"
                        >
                          Your Orders
                        </button>
                      )}
                      {isCustomer && (
                        <button
                          onClick={() => go("/cart")}
                          className="account-dd-link"
                        >
                          Your Cart
                        </button>
                      )}
                      {isVendor && (
                        <button
                          onClick={() => go("/vendor/dashboard")}
                          className="account-dd-link"
                        >
                          Your Store
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => go("/admin/dashboard")}
                          className="account-dd-link"
                        >
                          Admin Panel
                        </button>
                      )}
                      <button
                        onClick={doLogout}
                        className="account-dd-link"
                        style={{ color: "#0066C0", marginTop: 8 }}
                      >
                        Sign Out
                      </button>
                    </>
                  )}
                  {!user && (
                    <>
                      <button
                        onClick={() => go("/orders")}
                        className="account-dd-link"
                      >
                        Your Orders
                      </button>
                      <button
                        onClick={() => go("/cart")}
                        className="account-dd-link"
                      >
                        Your Cart
                      </button>
                    </>
                  )}
                </div>

                <div className="account-dd-col">
                  <p className="account-dd-col-title">Sell on E-Commerce</p>
                  <button
                    onClick={() => go("/vendor/signup")}
                    className="account-dd-link"
                  >
                    Become a Seller
                  </button>
                  <button
                    onClick={() => go("/vendor/login")}
                    className="account-dd-link"
                  >
                    Seller Login
                  </button>
                  <button
                    onClick={() => go("/policy/seller-guidelines")}
                    className="account-dd-link"
                  >
                    Seller Guidelines
                  </button>
                  <button
                    onClick={() => go("/policy/commission-policy")}
                    className="account-dd-link"
                  >
                    Commission
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {user && isCustomer && (
          <button
            onClick={() => go("/orders")}
            className="nav-link desktop-only"
          >
            <span className="nav-link-top">Returns</span>
            <span className="nav-link-bottom">& Orders</span>
          </button>
        )}

        <button onClick={() => go("/cart")} className="nav-cart">
          <div className="nav-cart-icon-wrap">
            {cartCount > 0 && (
              <span className="cart-count">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <span
            style={{ fontSize: 13, fontWeight: 700, marginTop: 10 }}
            className="desktop-only"
          >
            Cart
          </span>
        </button>
      </nav>

      {mobileOpen && (
        <>
          <div
            className="slide-overlay"
            onClick={() => setMobileOpen(false)}
          ></div>
          <div className="slide-panel">
            <div className="slide-header">
              {user && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 800,
                  }}
                >
                  {user.firstName?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <span>Hello, {user ? user.firstName : "Sign in"}</span>
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="slide-section">
              <p className="slide-section-title">Shop by Category</p>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => go(`/products?category=${cat._id}`)}
                  className="slide-item"
                >
                  <span>{cat.name}</span>
                  {cat.children?.length > 0 && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="slide-section">
              <p className="slide-section-title">Account</p>
              {user ? (
                <>
                  <button
                    onClick={() => go(dash(user.role))}
                    className="slide-item"
                  >
                    Your Account
                  </button>
                  {isCustomer && (
                    <button
                      onClick={() => go("/orders")}
                      className="slide-item"
                    >
                      Your Orders
                    </button>
                  )}
                  {isCustomer && (
                    <button onClick={() => go("/cart")} className="slide-item">
                      Cart ({cartCount})
                    </button>
                  )}
                  <button
                    onClick={doLogout}
                    className="slide-item"
                    style={{ color: "#0066C0" }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => go("/login")}
                    className="slide-item"
                    style={{ color: "#0066C0", fontWeight: 600 }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => go("/signup")}
                    className="slide-item"
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>
            <div className="slide-section">
              <p className="slide-section-title">Sell with Us</p>
              <button
                onClick={() => go("/vendor/signup")}
                className="slide-item"
              >
                Become a Seller
              </button>
              <button
                onClick={() => go("/vendor/login")}
                className="slide-item"
              >
                Seller Login
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
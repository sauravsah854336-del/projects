import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useSearchSuggestionsQuery } from "../features/search/searchApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useDebounce } from "../hooks/useDebounce";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
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

  const [locationOpen, setLocationOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(() => {
    return localStorage.getItem("deliveryLocation") || "India";
  });
  const [pincodeInput, setPincodeInput] = useState("");
  const [locationError, setLocationError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  const accountTimer = useRef(null);
  const searchBoxRef = useRef(null);
  const inputRef = useRef(null);

  const trimmedQuery = searchQuery.trim();
  const debouncedQuery = useDebounce(trimmedQuery, 300);

  const isCustomer = user?.role === "customer";
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";
  const isGuest = !user;

  const { cart } = useCart();
  const cartCount = cart?.totalItems || 0;
  const { total: wishlistCount } = useWishlist();
  const showShoppingFeatures = isCustomer || isGuest;

  const shouldSkipSearch = debouncedQuery.length < 1 || (!isCustomer && !isGuest);

  const { data: sugData, isFetching, isLoading } = useSearchSuggestionsQuery(
    debouncedQuery,
    {
      skip: shouldSkipSearch,
      refetchOnMountOrArgChange: true,
    }
  );

  const { data: categoryData } = useGetCategoryTreeQuery(undefined, {
    skip: !isCustomer && !isGuest,
  });

  const categories = categoryData?.data || [];

  const suggestions = {
    products: sugData?.data?.products || [],
    categories: sugData?.data?.categories || [],
    vendors: sugData?.data?.vendors || [],
  };

  const allSuggestions = [
    ...suggestions.categories.map((c) => ({ type: "category", data: c })),
    ...suggestions.vendors.map((v) => ({ type: "vendor", data: v })),
    ...suggestions.products.map((p) => ({ type: "product", data: p })),
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
    setLocationOpen(false);
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
    setLocationOpen(false);
    navigate(path);
  };

  const dash = (role) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "vendor") return "/vendor/dashboard";
    return "/dashboard";
  };

  const doSearch = (customQuery) => {
    const q = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (!q) return;
    let url = `/products?search=${encodeURIComponent(q)}`;
    if (searchCategory !== "all") url += `&category=${searchCategory}`;
    go(url);
  };

  const handleSuggestionClick = (item) => {
    if (item.type === "category") {
      go(`/products?category=${item.data._id}`);
    } else if (item.type === "vendor") {
      go(`/products?search=${encodeURIComponent(item.data.storeName)}`);
    } else if (item.type === "product") {
      go(`/products/${item.data.slug}`);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
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
      setHighlightIndex(-1);
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

  const handleSetLocation = (loc) => {
    setCurrentLocation(loc);
    localStorage.setItem("deliveryLocation", loc);
    setLocationOpen(false);
    setPincodeInput("");
    setLocationError("");
  };

  const handlePincodeSubmit = () => {
    const pin = pincodeInput.trim();
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setLocationError("Enter a valid 6-digit PIN code");
      return;
    }
    handleSetLocation(`PIN ${pin}`);
  };

  const handleDetectLocation = () => {
    setDetectingLocation(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
      setDetectingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.state ||
            "Unknown";
          const country = data.address?.country || "India";
          handleSetLocation(`${city}, ${country}`);
        } catch {
          setLocationError("Failed to detect location. Try entering PIN instead.");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setLocationError("Location access denied. Enter PIN manually.");
        setDetectingLocation(false);
      }
    );
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="font-extrabold text-[#C45500]">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const navBg = isAdmin
    ? "bg-gradient-to-b from-red-900 to-red-800"
    : isVendor
    ? "bg-gradient-to-b from-indigo-900 to-indigo-800"
    : "bg-[#131921]";

  const NavLink = ({ top, bottom, onClick, className = "" }) => (
    <button
      onClick={onClick}
      className={`hidden lg:flex flex-col px-2.5 py-2 border border-transparent rounded hover:border-white transition-colors cursor-pointer bg-transparent shrink-0 text-left font-[inherit] ${className}`}
    >
      <span className="text-[11px] text-gray-400 leading-tight">{top}</span>
      <span className="text-[13px] font-bold text-white leading-tight flex items-center gap-1">
        {bottom}
      </span>
    </button>
  );

  const DDLink = ({ onClick, children }) => (
    <button
      onClick={onClick}
      className="block w-full text-left px-0 py-1.5 text-[13px] text-gray-600 bg-transparent border-none cursor-pointer hover:text-[#E47911] hover:underline font-[inherit]"
    >
      {children}
    </button>
  );

  const SlideItem = ({ onClick, children, className = "" }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-5 py-2.5 text-sm text-gray-700 bg-transparent border-none cursor-pointer hover:bg-gray-100 text-left font-[inherit] ${className}`}
    >
      {children}
    </button>
  );

  const catOffset = suggestions.categories.length;
  const vendorOffset = catOffset + suggestions.vendors.length;

  return (
    <>
      <style>{`
        @keyframes ddIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn { from { opacity:0; transform:translate(-50%,-48%) scale(0.96); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes slideRight { from { transform:translateX(-100%); } to { transform:translateX(0); } }
        .search-dd { animation: ddIn 0.12s ease both; }
        .account-dd { animation: ddIn 0.15s ease both; }
        .loc-modal { animation: modalIn 0.2s ease both; }
        .slide-panel { animation: slideRight 0.2s ease both; }
        .sd-item { border-left: 3px solid transparent; }
        .sd-item.highlighted { border-left: 3px solid #D85A30; background-color: #fff7f0; }
      `}</style>

      <nav
        className={`${navBg} px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3.5 sticky top-0 z-[9000] overflow-visible`}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 border border-transparent rounded hover:border-white text-white bg-transparent cursor-pointer shrink-0"
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

        <div
          onClick={() => go(user ? dash(user.role) : "/")}
          className="flex items-center gap-2 px-2 py-1.5 border border-transparent rounded hover:border-white cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-[#D85A30] to-[#FF8C5A] rounded-md flex items-center justify-center text-white font-black text-sm">
            E
          </div>
          <span className="hidden lg:block text-white font-extrabold text-lg">
            Commerce
          </span>
          {isVendor && (
            <span className="text-[9px] bg-white/15 text-white px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
              Vendor
            </span>
          )}
          {isAdmin && (
            <span className="text-[9px] bg-white/15 text-white px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
              Admin
            </span>
          )}
        </div>

        {showShoppingFeatures && (
          <NavLink
            top={user ? `Deliver to ${user.firstName}` : "Deliver to"}
            bottom={
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
                <span className="max-w-[100px] truncate">{currentLocation}</span>
              </>
            }
            onClick={() => setLocationOpen(true)}
          />
        )}

        {showShoppingFeatures && (
          <div
            className="flex-1 flex justify-center max-w-2xl mx-auto relative z-[9999]"
            ref={searchBoxRef}
          >
            <div
              className={`w-full flex h-10 sm:h-[42px] rounded-lg bg-white relative overflow-visible ${
                searchFocus ? "ring-[3px] ring-yellow-400" : ""
              }`}
            >
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="hidden sm:block bg-gradient-to-b from-gray-100 to-gray-200 border-none border-r border-gray-300 px-2.5 text-xs font-semibold text-gray-900 cursor-pointer outline-none max-w-[100px] rounded-l-lg"
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
                placeholder="Search products, brands, stores..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocus(true);
                }}
                onFocus={() => setSearchFocus(true)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck="false"
                className="flex-1 border-none outline-none px-3.5 text-sm text-gray-900 bg-white min-w-0"
              />

              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchFocus(true);
                    inputRef.current?.focus();
                  }}
                  className="px-2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}

              <button
                onClick={() => doSearch()}
                className="bg-gradient-to-b from-yellow-300 to-yellow-400 border-none px-4 sm:px-5 cursor-pointer text-gray-900 flex items-center justify-center rounded-r-lg hover:brightness-95 transition"
              >
                <svg
                  width="20"
                  height="20"
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

              {showDropdown && (
                <div className="search-dd absolute top-[calc(100%+6px)] left-0 right-0 bg-white rounded-lg shadow-2xl max-h-[520px] overflow-y-auto z-[99999] border border-gray-200">
                  {isSearching && (
                    <div className="p-6 text-center">
                      <div className="w-6 h-6 border-[2.5px] border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
                      <p className="text-xs text-gray-500 m-0">Searching...</p>
                    </div>
                  )}

                  {!isSearching && !hasResults && debouncedQuery && (
                    <div className="p-7 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2.5 text-2xl">
                        🔍
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1 m-0">
                        No results found
                      </p>
                      <p className="text-xs text-gray-500 m-0">
                        Nothing matches &ldquo;
                        <strong>{searchQuery}</strong>&rdquo;
                      </p>
                      <button
                        onClick={() => doSearch()}
                        className="mt-3 px-4 py-2 bg-yellow-300 border border-yellow-400 rounded-md text-xs font-semibold cursor-pointer hover:brightness-95 font-[inherit]"
                      >
                        Search anyway →
                      </button>
                    </div>
                  )}

                  {!isSearching && hasResults && (
                    <>
                      {suggestions.categories.length > 0 && (
                        <div className="py-1.5 border-b border-gray-100">
                          <div className="flex justify-between items-center px-4 py-2">
                            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">
                              Categories
                            </span>
                            <span className="bg-orange-50 text-[#D85A30] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {suggestions.categories.length}
                            </span>
                          </div>
                          {suggestions.categories.map((c, idx) => (
                            <button
                              key={c._id}
                              onClick={() =>
                                handleSuggestionClick({ type: "category", data: c })
                              }
                              onMouseEnter={() => setHighlightIndex(idx)}
                              onMouseLeave={() => setHighlightIndex(-1)}
                              className={`sd-item flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-left hover:bg-orange-50 transition-colors ${
                                highlightIndex === idx ? "highlighted" : ""
                              }`}
                            >
                              <div className="w-8 h-8 bg-orange-50 rounded-md flex items-center justify-center shrink-0">
                                <svg
                                  width="16"
                                  height="16"
                                  fill="none"
                                  stroke="#D85A30"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-900 m-0">
                                  {highlightText(c.name, debouncedQuery)}
                                </p>
                                <p className="text-[11px] text-gray-400 m-0">
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
                                viewBox="0 0 24 24"
                              >
                                <path d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      )}

                      {suggestions.vendors.length > 0 && (
                        <div className="py-1.5 border-b border-gray-100">
                          <div className="flex justify-between items-center px-4 py-2">
                            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">
                              Stores
                            </span>
                            <span className="bg-orange-50 text-[#D85A30] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {suggestions.vendors.length}
                            </span>
                          </div>
                          {suggestions.vendors.map((v, idx) => {
                            const gIdx = catOffset + idx;
                            return (
                              <button
                                key={v._id}
                                onClick={() =>
                                  handleSuggestionClick({ type: "vendor", data: v })
                                }
                                onMouseEnter={() => setHighlightIndex(gIdx)}
                                onMouseLeave={() => setHighlightIndex(-1)}
                                className={`sd-item flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-left hover:bg-orange-50 transition-colors ${
                                  highlightIndex === gIdx ? "highlighted" : ""
                                }`}
                              >
                                <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center text-blue-500 text-sm font-extrabold shrink-0">
                                  {v.storeName?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-gray-900 m-0">
                                    {highlightText(v.storeName, debouncedQuery)}
                                  </p>
                                  <p className="text-[11px] text-gray-400 m-0">
                                    Official Store
                                  </p>
                                </div>
                                <svg
                                  width="14"
                                  height="14"
                                  fill="none"
                                  stroke="#999"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {suggestions.products.length > 0 && (
                        <div className="py-1.5">
                          <div className="flex justify-between items-center px-4 py-2">
                            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">
                              Products
                            </span>
                            <span className="bg-orange-50 text-[#D85A30] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {suggestions.products.length}
                            </span>
                          </div>
                          {suggestions.products.map((p, idx) => {
                            const gIdx = vendorOffset + idx;
                            return (
                              <button
                                key={p._id}
                                onClick={() =>
                                  handleSuggestionClick({ type: "product", data: p })
                                }
                                onMouseEnter={() => setHighlightIndex(gIdx)}
                                onMouseLeave={() => setHighlightIndex(-1)}
                                className={`sd-item flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-left hover:bg-orange-50 transition-colors ${
                                  highlightIndex === gIdx ? "highlighted" : ""
                                }`}
                              >
                                <img
                                  src={p.images?.[0]?.url || PLACEHOLDER_TINY}
                                  alt={p.name}
                                  className="w-11 h-11 rounded-md object-cover shrink-0 border border-gray-200"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = PLACEHOLDER_TINY;
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] text-gray-900 font-medium m-0 truncate">
                                    {highlightText(p.name, debouncedQuery)}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-[13px] font-bold text-[#B12704]">
                                      {formatRupee(p.price)}
                                    </span>
                                    {p.comparePrice > p.price && (
                                      <span className="text-[11px] text-gray-400 line-through">
                                        {formatRupee(p.comparePrice)}
                                      </span>
                                    )}
                                    {p.brand && (
                                      <span className="text-[11px] text-gray-400">
                                        • {p.brand}
                                      </span>
                                    )}
                                    {p.vendorStore?.storeName && (
                                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold">
                                        {p.vendorStore.storeName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <button
                        onClick={() => doSearch()}
                        className="w-full px-4 py-3 bg-gray-50 border-none border-t border-gray-200 cursor-pointer text-blue-700 text-[13px] font-semibold hover:bg-gray-100 transition text-left font-[inherit]"
                      >
                        See all results for &ldquo;{searchQuery}&rdquo; →
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {(isVendor || isAdmin) && <div className="flex-1" />}

        <div
          className="hidden lg:block relative"
          onMouseEnter={() => {
            clearTimeout(accountTimer.current);
            setAccountOpen(true);
          }}
          onMouseLeave={() => {
            accountTimer.current = setTimeout(() => setAccountOpen(false), 200);
          }}
        >
          <NavLink
            top={user ? `Hello, ${user.firstName}` : "Hello, sign in"}
            bottom={
              <>
                Account & Lists
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </>
            }
          />

          {accountOpen && (
            <div className="account-dd absolute top-[calc(100%+8px)] right-0 bg-white rounded-lg shadow-2xl min-w-[340px] z-[99999] overflow-hidden">
              {!user && (
                <div className="px-5 py-4 border-b border-gray-100 text-center">
                  <button
                    onClick={() => go("/login")}
                    className="bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 px-6 py-2 rounded-md text-sm font-semibold border border-yellow-400 cursor-pointer hover:brightness-95 mb-2 font-[inherit]"
                  >
                    Sign In
                  </button>
                  <p className="text-xs text-gray-500 m-0">
                    New customer?{" "}
                    <button
                      onClick={() => go("/signup")}
                      className="text-blue-700 bg-transparent border-none cursor-pointer text-xs hover:underline font-[inherit]"
                    >
                      Start here.
                    </button>
                  </p>
                </div>
              )}

              <div className="flex">
                <div className="flex-1 p-4 border-r border-gray-100">
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    {isCustomer
                      ? "Your Account"
                      : isVendor
                      ? "Vendor Panel"
                      : isAdmin
                      ? "Admin Panel"
                      : "Your Account"}
                  </p>
                  {isCustomer && (
                    <>
                      <DDLink onClick={() => go("/dashboard")}>Dashboard</DDLink>
                      <DDLink onClick={() => go("/profile")}>Profile & Addresses</DDLink>
                      <DDLink onClick={() => go("/orders")}>Your Orders</DDLink>
                      <DDLink onClick={() => go("/cart")}>Your Cart</DDLink>
                      <DDLink onClick={() => go("/wishlist")}>
                        Your Wishlist{wishlistCount > 0 && ` (${wishlistCount})`}
                      </DDLink>
                      <DDLink onClick={doLogout}>
                        <span className="text-blue-700">Sign Out</span>
                      </DDLink>
                    </>
                  )}
                  {isVendor && (
                    <>
                      <DDLink onClick={() => go("/vendor/dashboard")}>Dashboard</DDLink>
                      <DDLink onClick={() => go("/vendor/dashboard?tab=products")}>
                        My Products
                      </DDLink>
                      <DDLink onClick={() => go("/vendor/dashboard?tab=orders")}>
                        Orders
                      </DDLink>
                      <DDLink onClick={() => go("/vendor/dashboard?tab=reviews")}>
                        Reviews
                      </DDLink>
                      <DDLink onClick={doLogout}>
                        <span className="text-blue-700">Sign Out</span>
                      </DDLink>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <DDLink onClick={() => go("/admin/dashboard")}>Dashboard</DDLink>
                      <DDLink onClick={() => go("/admin/dashboard?tab=vendors")}>
                        Vendors
                      </DDLink>
                      <DDLink onClick={() => go("/admin/dashboard?tab=categories")}>
                        Categories
                      </DDLink>
                      <DDLink onClick={() => go("/admin/dashboard?tab=products")}>
                        Products
                      </DDLink>
                      <DDLink onClick={() => go("/admin/dashboard?tab=orders")}>
                        Orders
                      </DDLink>
                      <DDLink onClick={() => go("/admin/dashboard?tab=reviews")}>
                        Reviews
                      </DDLink>
                      <DDLink onClick={doLogout}>
                        <span className="text-blue-700">Sign Out</span>
                      </DDLink>
                    </>
                  )}
                  {isGuest && (
                    <>
                      <DDLink onClick={() => go("/orders")}>Your Orders</DDLink>
                      <DDLink onClick={() => go("/cart")}>
                        Your Cart{cartCount > 0 && ` (${cartCount})`}
                      </DDLink>
                      <DDLink onClick={() => go("/wishlist")}>
                        Your Wishlist{wishlistCount > 0 && ` (${wishlistCount})`}
                      </DDLink>
                    </>
                  )}
                </div>

                <div className="flex-1 p-4">
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    {isCustomer
                      ? "Help & Settings"
                      : isVendor
                      ? "Resources"
                      : isAdmin
                      ? "Quick Links"
                      : "Sell on E-Commerce"}
                  </p>
                  {isCustomer && (
                    <>
                      <DDLink onClick={() => go("/help")}>Customer Service</DDLink>
                      <DDLink onClick={() => go("/contact")}>Contact Us</DDLink>
                      <DDLink onClick={() => go("/policy/returns")}>Returns Policy</DDLink>
                      <DDLink onClick={() => go("/policy/shipping-info")}>
                        Shipping Info
                      </DDLink>
                    </>
                  )}
                  {isVendor && (
                    <>
                      <DDLink onClick={() => go("/policy/seller-guidelines")}>
                        Seller Guidelines
                      </DDLink>
                      <DDLink onClick={() => go("/policy/commission-policy")}>
                        Commission
                      </DDLink>
                      <DDLink onClick={() => go("/policy/vendor-agreement")}>
                        Vendor Agreement
                      </DDLink>
                      <DDLink onClick={() => go("/help")}>Support</DDLink>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <DDLink onClick={() => go("/")}>View Storefront</DDLink>
                      <DDLink onClick={() => go("/products")}>All Products</DDLink>
                      <DDLink onClick={() => go("/help")}>Help Center</DDLink>
                    </>
                  )}
                  {isGuest && (
                    <>
                      <DDLink onClick={() => go("/vendor/signup")}>
                        Become a Seller
                      </DDLink>
                      <DDLink onClick={() => go("/vendor/login")}>Seller Login</DDLink>
                      <DDLink onClick={() => go("/policy/seller-guidelines")}>
                        Seller Guidelines
                      </DDLink>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {isCustomer && (
          <NavLink top="Returns" bottom="& Orders" onClick={() => go("/orders")} />
        )}

        {showShoppingFeatures && (
          <button
            onClick={() => go("/wishlist")}
            title="Your Wishlist"
            className="hidden lg:flex items-center gap-1 px-2.5 py-2 border border-transparent rounded hover:border-white text-white bg-transparent cursor-pointer shrink-0 font-[inherit]"
          >
            <div className="relative flex items-center">
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-400 text-white text-[11px] font-extrabold min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 border-2 border-[#131921] z-10">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill={wishlistCount > 0 ? "#EF4444" : "none"}
                stroke={wishlistCount > 0 ? "#EF4444" : "currentColor"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight mt-1">
              <span className="text-[10px] text-gray-400">
                {wishlistCount > 0 ? `${wishlistCount} items` : "Wishlist"}
              </span>
              <span className="text-[13px] font-bold">Wishlist</span>
            </div>
          </button>
        )}

        {showShoppingFeatures && (
          <button
            onClick={() => go("/cart")}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-2 border border-transparent rounded hover:border-white text-white bg-transparent cursor-pointer shrink-0 font-[inherit]"
          >
            <div className="relative flex items-center">
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-500 to-yellow-400 text-white text-[11px] font-extrabold min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 border-2 border-[#131921] z-10">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
              <svg
                width="28"
                height="28"
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
            <span className="hidden lg:block text-[13px] font-bold mt-2.5">Cart</span>
          </button>
        )}

        {(isVendor || isAdmin) && (
          <button
            onClick={doLogout}
            className="hidden lg:flex items-center gap-1.5 bg-red-500/20 text-white text-sm font-bold px-3.5 py-2 rounded-md border border-red-400/40 cursor-pointer hover:bg-red-500/30 transition shrink-0 font-[inherit]"
          >
            🚪 Sign Out
          </button>
        )}
      </nav>

      {locationOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[99998]"
            onClick={() => {
              setLocationOpen(false);
              setPincodeInput("");
              setLocationError("");
            }}
          />
          <div className="loc-modal fixed top-1/2 left-1/2 w-[92vw] max-w-[460px] bg-white rounded-2xl z-[99999] shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#131921] to-[#232F3E] px-5 sm:px-6 py-4 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white m-0">
                    Choose Your Location
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 m-0">
                    Select delivery location for accurate prices
                  </p>
                </div>
                <button
                  onClick={() => {
                    setLocationOpen(false);
                    setPincodeInput("");
                    setLocationError("");
                  }}
                  className="bg-white/10 border border-white/15 text-white rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-white/20 transition shrink-0"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-orange-50/50 border border-orange-200 rounded-xl p-3.5 mb-4">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-lg shrink-0">
                  📍
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide m-0">
                    Current Location
                  </p>
                  <p className="text-sm font-extrabold text-gray-900 mt-0.5 m-0">
                    {currentLocation}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-extrabold text-white border-none cursor-pointer transition-all mb-4 ${
                  detectingLocation
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] hover:brightness-95 shadow-lg shadow-orange-500/20"
                }`}
              >
                {detectingLocation ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Detecting your location...
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                    </svg>
                    Use Current Location
                  </>
                )}
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">
                  OR
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Enter PIN Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 400001"
                    value={pincodeInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setPincodeInput(val);
                      setLocationError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handlePincodeSubmit()}
                    maxLength={6}
                    className={`flex-1 border-[1.5px] rounded-xl px-3.5 py-3 text-sm font-bold text-gray-900 bg-gray-50 outline-none font-mono tracking-widest transition ${
                      locationError
                        ? "border-red-300"
                        : "border-gray-200 focus:border-gray-900"
                    }`}
                  />
                  <button
                    onClick={handlePincodeSubmit}
                    disabled={pincodeInput.length !== 6}
                    className={`px-5 py-3 rounded-xl text-sm font-extrabold border-none cursor-pointer transition font-[inherit] ${
                      pincodeInput.length === 6
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Apply
                  </button>
                </div>
                {locationError && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1.5 m-0">
                    ⚠️ {locationError}
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide mb-2.5 m-0">
                  Popular Cities
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Mumbai","Delhi","Bangalore","Hyderabad","Chennai",
                    "Kolkata","Pune","Ahmedabad","Jaipur","Lucknow",
                  ].map((city) => {
                    const isActive = currentLocation.includes(city);
                    return (
                      <button
                        key={city}
                        onClick={() => handleSetLocation(`${city}, India`)}
                        className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border cursor-pointer transition font-[inherit] ${
                          isActive
                            ? "bg-orange-50 text-[#D85A30] border-orange-200 font-extrabold"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-[#D85A30] hover:text-[#D85A30]"
                        }`}
                      >
                        {isActive && "✓ "}
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>

              {user && (
                <div className="mt-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3.5">
                  <span className="text-xl">💡</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-green-800 m-0">
                      Save delivery addresses
                    </p>
                    <p className="text-[11px] text-green-600 m-0">
                      Add addresses to your profile for faster checkout
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setLocationOpen(false);
                      go("/profile");
                    }}
                    className="bg-green-500 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg border-none cursor-pointer hover:bg-green-600 transition whitespace-nowrap font-[inherit]"
                  >
                    Go to Profile
                  </button>
                </div>
              )}

              {!user && (
                <div className="mt-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                  <span className="text-xl">🔐</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-800 m-0">
                      Sign in for better experience
                    </p>
                    <p className="text-[11px] text-blue-600 m-0">
                      Save addresses and get faster delivery
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setLocationOpen(false);
                      go("/login");
                    }}
                    className="bg-blue-600 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg border-none cursor-pointer hover:bg-blue-700 transition whitespace-nowrap font-[inherit]"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[99998]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="slide-panel fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-[99999] overflow-y-auto">
            <div className="bg-[#232F3E] text-white px-5 py-4 flex items-center gap-2.5">
              {user && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D85A30] to-[#FF8C5A] flex items-center justify-center text-white font-extrabold shrink-0">
                  {user.firstName?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <span className="text-[17px] font-bold flex-1">
                Hello, {user ? user.firstName : "Sign in"}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="bg-transparent border-none text-white cursor-pointer ml-auto"
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

            {showShoppingFeatures && (
              <div className="border-b-[6px] border-gray-100 py-3">
                <SlideItem
                  onClick={() => {
                    setMobileOpen(false);
                    setLocationOpen(true);
                  }}
                  className="bg-orange-50 font-bold"
                >
                  <span className="flex items-center gap-2">
                    📍 Deliver to {currentLocation}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </SlideItem>
              </div>
            )}

            {showShoppingFeatures && (
              <div className="border-b-[6px] border-gray-100 py-3">
                <p className="text-[17px] font-extrabold text-gray-900 px-5 pb-2 m-0">
                  Shop by Category
                </p>
                {categories.map((cat) => (
                  <SlideItem
                    key={cat._id}
                    onClick={() => go(`/products?category=${cat._id}`)}
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
                        strokeLinecap="round"
                      >
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </SlideItem>
                ))}
              </div>
            )}

            {isCustomer && (
              <div className="border-b-[6px] border-gray-100 py-3">
                <p className="text-[17px] font-extrabold text-gray-900 px-5 pb-2 m-0">
                  My Account
                </p>
                <SlideItem onClick={() => go("/dashboard")}>Dashboard</SlideItem>
                <SlideItem onClick={() => go("/profile")}>Profile</SlideItem>
                <SlideItem onClick={() => go("/orders")}>Your Orders</SlideItem>
                <SlideItem onClick={() => go("/cart")}>
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-yellow-400 text-gray-900 rounded-full text-[11px] font-extrabold px-2 py-0.5">
                      {cartCount}
                    </span>
                  )}
                </SlideItem>
                <SlideItem onClick={() => go("/wishlist")}>
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="bg-red-500 text-white rounded-full text-[11px] font-extrabold px-2 py-0.5">
                      {wishlistCount}
                    </span>
                  )}
                </SlideItem>
                <SlideItem onClick={doLogout} className="text-blue-700 font-semibold">
                  Sign Out
                </SlideItem>
              </div>
            )}

            {isVendor && (
              <div className="border-b-[6px] border-gray-100 py-3">
                <p className="text-[17px] font-extrabold text-gray-900 px-5 pb-2 m-0">
                  Vendor Panel
                </p>
                <SlideItem onClick={() => go("/vendor/dashboard")}>Dashboard</SlideItem>
                <SlideItem onClick={() => go("/vendor/dashboard?tab=products")}>
                  My Products
                </SlideItem>
                <SlideItem onClick={() => go("/vendor/dashboard?tab=orders")}>
                  Orders
                </SlideItem>
                <SlideItem onClick={() => go("/vendor/dashboard?tab=reviews")}>
                  Reviews
                </SlideItem>
                <SlideItem onClick={doLogout} className="text-blue-700 font-semibold">
                  Sign Out
                </SlideItem>
              </div>
            )}

            {isAdmin && (
              <div className="border-b-[6px] border-gray-100 py-3">
                <p className="text-[17px] font-extrabold text-gray-900 px-5 pb-2 m-0">
                  Admin Panel
                </p>
                <SlideItem onClick={() => go("/admin/dashboard")}>Dashboard</SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=vendors")}>
                  Vendors
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=categories")}>
                  Categories
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=products")}>
                  Products
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=orders")}>
                  Orders
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=reviews")}>
                  Reviews
                </SlideItem>
                <SlideItem onClick={doLogout} className="text-blue-700 font-semibold">
                  Sign Out
                </SlideItem>
              </div>
            )}

            {isGuest && (
              <div className="border-b-[6px] border-gray-100 py-3">
                <p className="text-[17px] font-extrabold text-gray-900 px-5 pb-2 m-0">
                  Account
                </p>
                <SlideItem
                  onClick={() => go("/login")}
                  className="text-blue-700 font-semibold"
                >
                  Sign In
                </SlideItem>
                <SlideItem onClick={() => go("/signup")}>Create Account</SlideItem>
                {cartCount > 0 && (
                  <SlideItem onClick={() => go("/cart")}>
                    <span>Cart</span>
                    <span className="bg-yellow-400 text-gray-900 rounded-full text-[11px] font-extrabold px-2 py-0.5">
                      {cartCount}
                    </span>
                  </SlideItem>
                )}
                <SlideItem onClick={() => go("/wishlist")}>
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="bg-red-500 text-white rounded-full text-[11px] font-extrabold px-2 py-0.5">
                      {wishlistCount}
                    </span>
                  )}
                </SlideItem>
              </div>
            )}

            {(isGuest || isCustomer) && (
              <div className="py-3">
                <p className="text-[17px] font-extrabold text-gray-900 px-5 pb-2 m-0">
                  Sell with Us
                </p>
                <SlideItem onClick={() => go("/vendor/signup")}>
                  Become a Seller
                </SlideItem>
                <SlideItem onClick={() => go("/vendor/login")}>Seller Login</SlideItem>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
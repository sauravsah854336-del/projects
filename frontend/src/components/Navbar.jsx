import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useSearchSuggestionsQuery } from "../features/search/searchApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import {
  useGetAllCountriesQuery,
  useDetectUserCountryQuery,
} from "../features/country/countryApi";
import {
  setCountry,
  setAllCountries,
  resetCountry,
} from "../features/country/countrySlice";
import {
  useGetProfileQuery,
  useSetDefaultAddressMutation,
} from "../features/customer/customerApi";
import {
  verifyPincode,
  estimateDeliveryDays,
  getDeliveryDate,
  savePincodeToStorage,
  getPincodeFromStorage,
  clearPincodeFromStorage,
} from "../utils/pincodeApi";
import { useDebounce } from "../hooks/useDebounce";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { PLACEHOLDER_TINY } from "../utils/placeholder";
import { formatPrice } from "../utils/priceHelper";
import { toast } from "./Toast";
import PlatformLogo from "../assets/PlatformLogo.jpeg";

const categoryIcons = {
  furniture: "🛋️",
  kitchen: "🍳",
  electronics: "📱",
  walls: "🧱",
  decorative: "🖼️",
  upholstery: "🧵",
  finishes: "🎨",
  floors: "🪵",
  furnishing: "🪟",
  bathroom: "🚿",
  sofas: "🛋️",
  chairs: "🪑",
  tables: "🪑",
  beds: "🛏️",
  wardrobes: "🚪",
  shelves: "📚",
  desks: "🖥️",
  cabinets: "🗄️",
  cookware: "🍳",
  appliances: "🔌",
  utensils: "🍴",
  storage: "📦",
  dining: "🍽️",
  smartphones: "📱",
  laptops: "💻",
  tablets: "📱",
  cameras: "📷",
  headphones: "🎧",
  speakers: "🔊",
  gaming: "🎮",
  wearables: "⌚",
  tv: "📺",
  printers: "🖨️",
  "wall art": "🖼️",
  wallpaper: "🎨",
  clocks: "🕐",
  mirrors: "🪞",
  paints: "🎨",
  ac: "❄️",
  microwave: "🔥",
  refrigerator: "🧊",
  "washing machine": "🌀",
  fashion: "👗",
  clothing: "👔",
  shoes: "👟",
  accessories: "⌚",
  bags: "👜",
  jewelry: "💍",
  "home decor": "🏠",
  bedroom: "🛏️",
  outdoor: "🏡",
  garden: "🌿",
  lighting: "💡",
  beauty: "💄",
  health: "💊",
  sports: "⚽",
  books: "📚",
  toys: "🧸",
  grocery: "🛒",
  automotive: "🚗",
  office: "💼",
  pets: "🐾",
  tools: "🔧",
  gifts: "🎁",
};

const THEME = {
  navBg: "bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0F172A]",
  roleBadge: "bg-white/15 text-blue-100 border-blue-300/30",
  signOutBtn: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-300/40",
};

const Navbar = () => {
  const { user, refreshToken } = useSelector((state) => state.auth);
  const { currentCountry, isUserCountry } = useSelector(
    (state) => state.country,
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutAPI] = useLogoutMutation();

  const [accountOpen, setAccountOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [searchCategory, setSearchCategory] = useState("all");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [pincodeInput, setPincodeInput] = useState("");
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeResult, setPincodeResult] = useState(null);
  const [checkedPincode, setCheckedPincode] = useState(getPincodeFromStorage());
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const accountTimer = useRef(null);
  const categoriesTimer = useRef(null);
  const locationTimer = useRef(null);
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

  const { data: countriesData } = useGetAllCountriesQuery();
  const { data: detectedData } = useDetectUserCountryQuery(undefined, {
    skip: !!localStorage.getItem("userCountry") || !!user,
  });

  const { data: profileData } = useGetProfileQuery(undefined, {
    skip: !user || !isCustomer,
  });
  const [setDefaultAddressAPI] = useSetDefaultAddressMutation();

  const savedAddresses = profileData?.data?.addresses || [];
  const defaultAddress =
    savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  useEffect(() => {
    if (countriesData?.data) dispatch(setAllCountries(countriesData.data));
  }, [countriesData, dispatch]);

  useEffect(() => {
    if (
      detectedData?.data &&
      !localStorage.getItem("userCountry") &&
      !isUserCountry &&
      !user
    ) {
      dispatch(setCountry(detectedData.data));
      toast.info(
        `📍 Showing prices for ${detectedData.data.flag} ${detectedData.data.name}`,
      );
    }
  }, [detectedData, dispatch, isUserCountry, user]);

  const shouldSkipSearch =
    debouncedQuery.length < 1 || (!isCustomer && !isGuest);

  const {
    data: sugData,
    isFetching,
    isLoading,
  } = useSearchSuggestionsQuery(
    { q: debouncedQuery, category: searchCategory },
    {
      skip: shouldSkipSearch,
      refetchOnMountOrArgChange: true,
    },
  );

  const { data: categoryData } = useGetCategoryTreeQuery(undefined, {
    skip: !isCustomer && !isGuest,
  });

  const categories = [...(categoryData?.data || [])].sort(
    (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
  );

  const selectedCategory = categories.find((c) => c._id === searchCategory);
  const selectedCategoryName = selectedCategory?.name || "";
  const selectedCategoryIcon = selectedCategory
    ? categoryIcons[selectedCategory.name.toLowerCase()] || "📦"
    : null;

  const suggestions = {
    products: sugData?.data?.products || [],
    categories: sugData?.data?.categories || [],
    vendors: sugData?.data?.vendors || [],
  };

  const searchContext = sugData?.data?.context;

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
    setCategoriesOpen(false);
    setSearchFocus(false);
    setSearchQuery("");
    setHighlightIndex(-1);
    setLocationOpen(false);
  }, [location.pathname]);

  useEffect(() => setHighlightIndex(-1), [searchQuery, searchCategory]);

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
    setCategoriesOpen(false);
    setMobileOpen(false);
    setSearchFocus(false);
    setSearchQuery("");
    setLocationOpen(false);
    navigate(path);
  };

  const dash = (role) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "vendor") return "/vendor/dashboard";
    return "/";
  };

  const doSearch = (customQuery) => {
    const q = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (!q) return;
    let url = `/products?search=${encodeURIComponent(q)}`;
    if (searchCategory !== "all") url += `&category=${searchCategory}`;
    go(url);
  };

  const openCategory = (cat) => {
    const hasSubcategories = cat.children?.length > 0;
    if (hasSubcategories) {
      go(`/categories/${cat.slug || cat._id}`);
    } else {
      go(`/products?category=${cat.slug || cat._id}`);
    }
  };

  const handleSuggestionClick = (item) => {
    if (item.type === "category") {
      const cat = categories.find((c) => c._id === item.data._id);
      if (cat) openCategory(cat);
      else go(`/products?category=${item.data._id}`);
    } else if (item.type === "vendor") {
      let url = `/products?search=${encodeURIComponent(item.data.storeName)}`;
      if (searchCategory !== "all") url += `&category=${searchCategory}`;
      go(url);
    } else if (item.type === "product") {
      go(`/products/${item.data.slug}`);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < allSuggestions.length - 1 ? prev + 1 : prev,
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
    dispatch(resetCountry());
    setTimeout(() => navigate("/", { replace: true }), 100);
  };

  const handleSetDefault = async (addressId) => {
    try {
      await setDefaultAddressAPI(addressId).unwrap();
      toast.success("📍 Delivery address updated");
      setLocationOpen(false);
    } catch (err) {
      toast.error("Failed to update address");
    }
  };

  const handlePincodeCheck = async () => {
    if (pincodeInput.length !== 6) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }

    setPincodeChecking(true);
    setPincodeResult(null);

    try {
      const result = await verifyPincode(pincodeInput);

      if (!result.valid) {
        toast.error(result.error || "Pincode not serviceable");
        setPincodeChecking(false);
        return;
      }

      const delivery = estimateDeliveryDays(result.state);
      const enrichedResult = {
        ...result,
        minDays: delivery.min,
        maxDays: delivery.max,
        earliestDate: getDeliveryDate(delivery.min),
        latestDate: getDeliveryDate(delivery.max),
        checkedAt: new Date().toISOString(),
      };

      setPincodeResult(enrichedResult);
      setCheckedPincode(enrichedResult);
      savePincodeToStorage(enrichedResult);

      toast.success(`✅ Delivery available to ${result.city}, ${result.state}`);
    } catch (err) {
      toast.error("Failed to check pincode. Try again.");
    } finally {
      setPincodeChecking(false);
    }
  };

  const handleClearPincode = () => {
    setCheckedPincode(null);
    setPincodeResult(null);
    setPincodeInput("");
    clearPincodeFromStorage();
    toast.info("Pincode cleared");
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span
          key={i}
          className="font-extrabold text-blue-600 bg-yellow-100 px-0.5 rounded"
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const NavLink = ({ top, bottom, onClick, className = "" }) => (
    <button
      onClick={onClick}
      className={`hidden lg:flex flex-col px-2.5 py-2 border border-transparent rounded-md hover:border-blue-300/50 hover:bg-white/5 transition-all cursor-pointer bg-transparent shrink-0 text-left font-[inherit] ${className}`}
    >
      <span className="text-[11px] text-blue-200/70 leading-tight">{top}</span>
      <span className="text-[13px] font-bold text-white leading-tight flex items-center gap-1">
        {bottom}
      </span>
    </button>
  );

  const DDLink = ({ onClick, children }) => (
    <button
      onClick={onClick}
      className="block w-full text-left px-0 py-1.5 text-[13px] text-gray-600 bg-transparent border-none cursor-pointer hover:text-blue-600 hover:underline font-[inherit] transition-colors"
    >
      {children}
    </button>
  );

  const SlideItem = ({ onClick, children, className = "" }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-5 py-2.5 text-sm text-gray-700 bg-transparent border-none cursor-pointer hover:bg-blue-50 text-left font-[inherit] transition-colors ${className}`}
    >
      {children}
    </button>
  );

  const catOffset = suggestions.categories.length;
  const vendorOffset = catOffset + suggestions.vendors.length;
  const roleLabel = isAdmin ? "Admin" : isVendor ? "Vendor" : null;

  const currentHoveredCategory =
    hoveredCategory ||
    (categories[0] && showShoppingFeatures ? categories[0] : null);

  return (
    <>
      <style>{`
        @keyframes ddIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideRight { from { transform:translateX(-100%); } to { transform:translateX(0); } }
        @keyframes megaIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseIn { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.02); } 100% { transform: scale(1); opacity: 1; } }
        .search-dd { animation: ddIn 0.15s ease both; }
        .account-dd { animation: ddIn 0.15s ease both; }
        .mega-menu { animation: megaIn 0.18s ease both; }
        .slide-panel { animation: slideRight 0.2s ease both; }
        .context-badge { animation: pulseIn 0.3s ease both; }
        .sd-item { border-left: 3px solid transparent; transition: all 0.15s ease; }
        .sd-item.highlighted { border-left: 3px solid #3B82F6; background: linear-gradient(to right, #EFF6FF, #DBEAFE); }
      `}</style>

      <nav
        className={`${THEME.navBg} px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3.5 sticky top-0 z-[9000] overflow-visible shadow-lg shadow-blue-900/20`}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 border border-transparent rounded-md hover:border-blue-300/50 hover:bg-white/5 text-white bg-transparent cursor-pointer shrink-0 transition-all"
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
          className="flex items-center gap-2.5 px-2 py-1.5 border border-transparent rounded-md hover:border-blue-300/50 hover:bg-white/5 cursor-pointer shrink-0 transition-all"
        >
          <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-white/20 shadow-md shadow-blue-500/30 bg-white/5">
            <img
              src={PlatformLogo}
              alt="shop.design"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="hidden lg:flex flex-col leading-tight">
            <span className="text-white font-extrabold text-lg tracking-tight">
              shop<span className="text-blue-400">.</span>design
            </span>
            <span className="text-[9px] text-blue-300/70 uppercase tracking-wider font-semibold">
              Design your space
            </span>
          </span>
          {roleLabel && (
            <span
              className={`text-[9px] ${THEME.roleBadge} border px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider`}
            >
              {roleLabel}
            </span>
          )}
        </div>

        {showShoppingFeatures && (
          <div
            className="hidden lg:block relative shrink-0"
            onMouseEnter={() => {
              clearTimeout(locationTimer.current);
              setLocationOpen(true);
            }}
            onMouseLeave={() => {
              locationTimer.current = setTimeout(
                () => setLocationOpen(false),
                200,
              );
            }}
          >
            <button
              onClick={() => {
                if (!user) {
                  go("/login");
                } else if (savedAddresses.length === 0) {
                  go("/profile");
                }
              }}
              className="flex items-start gap-2 px-2.5 py-1.5 border border-transparent rounded-md hover:border-blue-300/50 hover:bg-white/5 transition-all cursor-pointer bg-transparent text-left font-[inherit] max-w-[240px]"
              title={
                defaultAddress
                  ? `Delivering to ${defaultAddress.fullName}, ${defaultAddress.city} ${defaultAddress.postalCode}`
                  : "Select a delivery location"
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-300 mt-1 shrink-0"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-[10px] text-blue-200/70">
                  {user
                    ? `Deliver to ${user.firstName}`
                    : checkedPincode
                      ? `Deliver to`
                      : "Hello, sign in"}
                </span>
                <span className="text-[13px] font-extrabold text-white flex items-center gap-1 truncate">
                  {defaultAddress ? (
                    <span className="truncate">
                      {defaultAddress.city} {defaultAddress.postalCode}
                    </span>
                  ) : checkedPincode ? (
                    <span className="truncate">
                      {checkedPincode.city} {checkedPincode.pincode}
                    </span>
                  ) : user ? (
                    "Select address"
                  ) : (
                    "Select location"
                  )}
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="shrink-0"
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </span>
              </div>
            </button>

            {locationOpen && user && (
              <div className="account-dd absolute top-[calc(100%+8px)] left-0 bg-white rounded-xl shadow-2xl min-w-[380px] max-w-[420px] z-[99999] overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-extrabold text-gray-900 m-0 flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                        strokeLinecap="round"
                      />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Choose your location
                  </h3>
                  <p className="text-[11px] text-gray-600 m-0 mt-1 leading-snug">
                    Delivery options and speeds may vary for your location
                  </p>
                </div>

                {savedAddresses.length > 0 ? (
                  <>
                    <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
                      <p className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider m-0">
                        📍 Your addresses ({savedAddresses.length})
                      </p>
                      <button
                        onClick={() => go("/profile")}
                        className="text-[10px] font-bold text-blue-600 bg-transparent border-none cursor-pointer hover:underline font-[inherit]"
                      >
                        Manage all →
                      </button>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto">
                      {savedAddresses.map((addr) => {
                        const isSelected = defaultAddress?._id === addr._id;
                        return (
                          <button
                            key={addr._id}
                            onClick={() =>
                              !isSelected && handleSetDefault(addr._id)
                            }
                            disabled={isSelected}
                            className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer border-none hover:bg-blue-50 transition font-[inherit] disabled:cursor-default ${
                              isSelected ? "bg-blue-50/50" : "bg-transparent"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg ${
                                  isSelected ? "bg-blue-100" : "bg-gray-100"
                                }`}
                              >
                                🏠
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  {isSelected && (
                                    <span className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded font-extrabold">
                                      CURRENT
                                    </span>
                                  )}
                                  {addr.isDefault && !isSelected && (
                                    <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-extrabold">
                                      DEFAULT
                                    </span>
                                  )}
                                </div>
                                <p className="text-[13px] font-bold text-gray-900 m-0 truncate leading-tight">
                                  {addr.fullName}
                                </p>
                                <p className="text-[11px] text-gray-600 m-0 leading-snug line-clamp-2 mt-0.5">
                                  {addr.street}
                                </p>
                                <p className="text-[11px] text-gray-600 m-0 leading-snug">
                                  {addr.city}, {addr.state} -{" "}
                                  <span className="font-bold text-gray-800">
                                    {addr.postalCode}
                                  </span>
                                </p>
                                {addr.phone && (
                                  <p className="text-[11px] text-gray-500 m-0 mt-0.5">
                                    📞 +91 {addr.phone}
                                  </p>
                                )}
                              </div>
                              {isSelected ? (
                                <svg
                                  width="18"
                                  height="18"
                                  fill="none"
                                  stroke="#22C55E"
                                  strokeWidth="3"
                                  viewBox="0 0 24 24"
                                  className="shrink-0 mt-1"
                                >
                                  <path
                                    d="M5 13l4 4L19 7"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              ) : (
                                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded shrink-0 mt-1">
                                  Select
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                      📍
                    </div>
                    <p className="text-sm font-bold text-gray-900 m-0 mb-1">
                      No saved addresses
                    </p>
                    <p className="text-[12px] text-gray-500 m-0 leading-snug mb-4">
                      Add an address to see accurate delivery estimates &
                      availability
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2">
                  <button
                    onClick={() => go("/profile")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 text-[12px] font-bold rounded-lg cursor-pointer transition font-[inherit]"
                  >
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    {savedAddresses.length > 0
                      ? "Add another address"
                      : "Add your first address"}
                  </button>

                  <div className="space-y-2">
                    {checkedPincode && !pincodeResult && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-start gap-2">
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                          className="mt-0.5 shrink-0"
                        >
                          <path
                            d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
                            strokeLinecap="round"
                          />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-extrabold text-blue-900 m-0 leading-tight">
                            Checking delivery to {checkedPincode.pincode}
                          </p>
                          <p className="text-[10px] text-blue-700 m-0 mt-0.5 truncate">
                            {checkedPincode.city}, {checkedPincode.state}
                          </p>
                          <p className="text-[10px] text-green-700 font-bold m-0 mt-0.5">
                            🚚 {checkedPincode.earliestDate} -{" "}
                            {checkedPincode.latestDate}
                          </p>
                        </div>
                        <button
                          onClick={handleClearPincode}
                          className="text-[10px] text-red-600 font-bold bg-white hover:bg-red-50 border border-red-200 px-2 py-1 rounded cursor-pointer transition font-[inherit] shrink-0"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {pincodeResult && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 animate-in fade-in">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              viewBox="0 0 24 24"
                            >
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-extrabold text-green-900 m-0">
                              Delivery Available!
                            </p>
                            <p className="text-[11px] text-green-800 m-0 mt-0.5 font-semibold">
                              📍 {pincodeResult.city}, {pincodeResult.state}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white rounded-md p-2 mb-2">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide m-0 mb-1">
                            🚚 Estimated Delivery
                          </p>
                          <p className="text-[12px] font-extrabold text-gray-900 m-0">
                            {pincodeResult.earliestDate} -{" "}
                            {pincodeResult.latestDate}
                          </p>
                          <p className="text-[10px] text-gray-600 m-0 mt-0.5">
                            {pincodeResult.minDays}-{pincodeResult.maxDays}{" "}
                            business days
                          </p>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setLocationOpen(false);
                              if (user) {
                                go("/profile");
                              } else {
                                go("/signup");
                              }
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-2 rounded cursor-pointer transition border-none font-[inherit]"
                          >
                            {user ? "Save as address" : "Sign up to save"}
                          </button>
                          <button
                            onClick={() => {
                              setPincodeResult(null);
                              setPincodeInput("");
                            }}
                            className="text-[11px] text-gray-700 font-bold bg-white hover:bg-gray-100 border border-gray-300 px-2 py-1.5 rounded cursor-pointer transition font-[inherit]"
                          >
                            Check another
                          </button>
                        </div>
                      </div>
                    )}

                    {!pincodeResult && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter pincode to check delivery"
                          value={pincodeInput}
                          onChange={(e) =>
                            setPincodeInput(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handlePincodeCheck();
                          }}
                          maxLength={6}
                          disabled={pincodeChecking}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-900 outline-none focus:border-blue-500 font-[inherit] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <button
                          onClick={handlePincodeCheck}
                          disabled={
                            pincodeChecking || pincodeInput.length !== 6
                          }
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[12px] font-bold rounded-lg cursor-pointer transition border-none font-[inherit] flex items-center gap-1"
                        >
                          {pincodeChecking ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Checking
                            </>
                          ) : (
                            "Check"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {locationOpen && !user && (
              <div className="account-dd absolute top-[calc(100%+8px)] left-0 bg-white rounded-xl shadow-2xl min-w-[340px] z-[99999] overflow-hidden border border-gray-100 p-5 text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                  📍
                </div>
                <h3 className="text-sm font-extrabold text-gray-900 m-0 mb-1">
                  Where should we deliver?
                </h3>
                <p className="text-[12px] text-gray-500 m-0 mb-4 leading-snug">
                  Sign in to see your saved addresses and delivery times.
                </p>
                <button
                  onClick={() => go("/login")}
                  className="w-full px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-bold rounded-lg cursor-pointer transition border-none font-[inherit] shadow-md shadow-blue-500/30 mb-2"
                >
                  Sign in to select address
                </button>
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <p className="text-[11px] text-gray-500 m-0">
                    New to shop.design?{" "}
                    <button
                      onClick={() => go("/signup")}
                      className="text-blue-600 font-bold hover:underline cursor-pointer bg-transparent border-none font-[inherit]"
                    >
                      Create an account
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {showShoppingFeatures && (
          <div
            className="flex-1 flex justify-center max-w-2xl mx-auto relative z-[9999]"
            ref={searchBoxRef}
          >
            <div
              className={`w-full flex h-10 sm:h-[42px] rounded-lg bg-white relative overflow-visible transition-all ${
                searchFocus
                  ? "ring-[3px] ring-blue-400 shadow-xl shadow-blue-400/40"
                  : "shadow-md"
              }`}
            >
              <div className="hidden sm:flex items-center relative">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className={`appearance-none bg-gradient-to-b from-gray-100 to-gray-200 border-none border-r border-gray-300 pl-3 pr-8 h-full text-xs font-bold text-gray-900 cursor-pointer outline-none rounded-l-lg hover:from-gray-200 hover:to-gray-300 transition ${
                    searchCategory !== "all"
                      ? "bg-gradient-to-b from-blue-100 to-blue-200 text-blue-700"
                      : ""
                  }`}
                  style={{ maxWidth: "140px", minWidth: "80px" }}
                >
                  <option value="all">🛍️ All</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {categoryIcons[cat.name.toLowerCase()] || "📦"} {cat.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-2 pointer-events-none w-3 h-3 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" />
                </svg>
              </div>

              <div className="flex-1 relative flex items-center">
                {searchCategory !== "all" && selectedCategory && (
                  <span className="hidden sm:flex context-badge items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-2 border border-blue-200 shrink-0">
                    <span>{selectedCategoryIcon}</span>
                    <span className="max-w-[80px] truncate">
                      In {selectedCategoryName}
                    </span>
                  </span>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    searchCategory !== "all" && selectedCategory
                      ? `Search in ${selectedCategoryName}...`
                      : "Search products, brands, stores..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocus(true);
                  }}
                  onFocus={() => setSearchFocus(true)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  spellCheck="false"
                  className="flex-1 border-none outline-none px-3 text-sm text-gray-900 bg-white min-w-0 h-full"
                />
              </div>

              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchFocus(true);
                    inputRef.current?.focus();
                  }}
                  className="px-2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer transition-colors"
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
                className="bg-gradient-to-r from-blue-500 to-blue-600 border-none px-4 sm:px-5 cursor-pointer text-white flex items-center justify-center rounded-r-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-inner group"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="group-hover:scale-110 transition-transform"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>

              {showDropdown && (
                <div className="search-dd absolute top-[calc(100%+6px)] left-0 right-0 bg-white rounded-2xl shadow-2xl max-h-[560px] overflow-y-auto z-[99999] border-2 border-blue-100">
                  {searchContext && (
                    <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 border-b-2 border-blue-400 z-10 flex items-center gap-2">
                      <span className="text-lg">
                        {categoryIcons[searchContext.name?.toLowerCase()] ||
                          "📂"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider m-0 leading-none">
                          Searching in
                        </p>
                        <p className="text-sm font-extrabold text-white m-0 leading-tight truncate">
                          {searchContext.name}
                        </p>
                      </div>
                      <button
                        onClick={() => setSearchCategory("all")}
                        className="text-[10px] font-bold bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-full border border-white/30 cursor-pointer transition font-[inherit] shrink-0"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {isSearching && (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-600 font-semibold m-0">
                        Searching
                        {searchContext ? ` in ${searchContext.name}` : ""}...
                      </p>
                    </div>
                  )}

                  {!isSearching && !hasResults && debouncedQuery && (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                        🔍
                      </div>
                      <p className="text-base font-extrabold text-gray-900 mb-1 m-0">
                        No results found
                      </p>
                      <p className="text-xs text-gray-500 m-0 leading-relaxed">
                        Nothing matches &ldquo;
                        <strong className="text-gray-700">{searchQuery}</strong>
                        &rdquo;
                        {searchContext && (
                          <>
                            <br />
                            in{" "}
                            <strong className="text-blue-600">
                              {searchContext.name}
                            </strong>
                          </>
                        )}
                      </p>
                      <div className="flex gap-2 justify-center mt-4">
                        {searchContext && (
                          <button
                            onClick={() => setSearchCategory("all")}
                            className="px-4 py-2 bg-white text-blue-600 border-2 border-blue-200 rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-50 font-[inherit] transition-colors"
                          >
                            Search All Categories
                          </button>
                        )}
                        <button
                          onClick={() => doSearch()}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-lg text-xs font-bold cursor-pointer hover:brightness-110 font-[inherit] transition-all shadow-md"
                        >
                          Search anyway →
                        </button>
                      </div>
                    </div>
                  )}

                  {!isSearching && hasResults && (
                    <>
                      {suggestions.categories.length > 0 && (
                        <div className="py-2 border-b border-gray-100">
                          <div className="flex justify-between items-center px-4 py-1.5">
                            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                              📂 Categories
                            </span>
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
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
                              onMouseLeave={() => setHighlightIndex(-1)}
                              className={`sd-item flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-left hover:bg-blue-50 ${highlightIndex === idx ? "highlighted" : ""}`}
                            >
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center shrink-0 text-lg border border-blue-100">
                                {categoryIcons[c.name?.toLowerCase()] || "📦"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-gray-900 m-0">
                                  {highlightText(c.name, debouncedQuery)}
                                </p>
                                <p className="text-[11px] text-gray-500 m-0">
                                  {c.parent
                                    ? `↳ in ${c.parent.name}`
                                    : "Main Department"}
                                </p>
                              </div>
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                stroke="#3B82F6"
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
                        <div className="py-2 border-b border-gray-100">
                          <div className="flex justify-between items-center px-4 py-1.5">
                            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                              🏪 Stores
                            </span>
                            <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              {suggestions.vendors.length}
                            </span>
                          </div>
                          {suggestions.vendors.map((v, idx) => {
                            const gIdx = catOffset + idx;
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
                                onMouseLeave={() => setHighlightIndex(-1)}
                                className={`sd-item flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-left hover:bg-blue-50 ${highlightIndex === gIdx ? "highlighted" : ""}`}
                              >
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-white text-sm font-extrabold shrink-0 shadow-md">
                                  {v.storeName?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-bold text-gray-900 m-0">
                                    {highlightText(v.storeName, debouncedQuery)}
                                  </p>
                                  <p className="text-[11px] text-gray-500 m-0">
                                    {searchContext
                                      ? `Store in ${searchContext.name}`
                                      : "Official Store"}
                                  </p>
                                </div>
                                <svg
                                  width="14"
                                  height="14"
                                  fill="none"
                                  stroke="#3B82F6"
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
                        <div className="py-2">
                          <div className="flex justify-between items-center px-4 py-1.5">
                            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                              📦 Products
                            </span>
                            <span className="bg-green-100 text-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              {suggestions.products.length}
                            </span>
                          </div>
                          {suggestions.products.map((p, idx) => {
                            const gIdx = vendorOffset + idx;
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
                                onMouseLeave={() => setHighlightIndex(-1)}
                                className={`sd-item flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-left hover:bg-blue-50 ${highlightIndex === gIdx ? "highlighted" : ""}`}
                              >
                                <img
                                  src={p.images?.[0]?.url || PLACEHOLDER_TINY}
                                  alt={p.name}
                                  className="w-12 h-12 rounded-xl object-cover shrink-0 border-2 border-gray-100 shadow-sm bg-white p-1"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = PLACEHOLDER_TINY;
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] text-gray-900 font-semibold m-0 line-clamp-1 leading-tight">
                                    {highlightText(p.name, debouncedQuery)}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <span className="text-[13px] font-extrabold text-blue-700">
                                      {formatPrice(p.price, currentCountry)}
                                    </span>
                                    {p.comparePrice > p.price && (
                                      <span className="text-[11px] text-gray-400 line-through">
                                        {formatPrice(
                                          p.comparePrice,
                                          currentCountry,
                                        )}
                                      </span>
                                    )}
                                    {p.brand && (
                                      <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold">
                                        {p.brand}
                                      </span>
                                    )}
                                    {p.category?.name && (
                                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                                        {categoryIcons[
                                          p.category.name.toLowerCase()
                                        ] || ""}{" "}
                                        {p.category.name}
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
                        className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 border-none cursor-pointer text-white text-[13px] font-extrabold hover:brightness-110 transition text-center font-[inherit] flex items-center justify-center gap-2 sticky bottom-0"
                      >
                        <span>
                          See all results for &ldquo;{searchQuery}&rdquo;
                          {searchContext ? ` in ${searchContext.name}` : ""}
                        </span>
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 5l7 7-7 7" strokeLinecap="round" />
                        </svg>
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
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </>
            }
          />

          {accountOpen && (
            <div className="account-dd absolute top-[calc(100%+8px)] right-0 bg-white rounded-xl shadow-2xl min-w-[340px] z-[99999] overflow-hidden border border-gray-100">
              {!user && (
                <div className="px-5 py-4 border-b border-gray-100 text-center bg-gradient-to-b from-blue-50 to-white">
                  <button
                    onClick={() => go("/login")}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold border-none cursor-pointer hover:from-blue-600 hover:to-blue-700 mb-2 font-[inherit] shadow-md shadow-blue-500/30 transition-all"
                  >
                    Sign In
                  </button>
                  <p className="text-xs text-gray-500 m-0">
                    New customer?{" "}
                    <button
                      onClick={() => go("/signup")}
                      className="text-blue-600 bg-transparent border-none cursor-pointer text-xs hover:underline font-[inherit] font-semibold"
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
                      <DDLink onClick={() => go("/dashboard")}>
                        Dashboard
                      </DDLink>
                      <DDLink onClick={() => go("/profile")}>
                        Profile & Addresses
                      </DDLink>
                      <DDLink onClick={() => go("/orders")}>Your Orders</DDLink>
                      <DDLink onClick={() => go("/cart")}>Your Cart</DDLink>
                      <DDLink onClick={() => go("/wishlist")}>
                        Your Wishlist
                        {wishlistCount > 0 && ` (${wishlistCount})`}
                      </DDLink>
                      <DDLink onClick={doLogout}>
                        <span className="text-blue-600 font-semibold">
                          Sign Out
                        </span>
                      </DDLink>
                    </>
                  )}
                  {isVendor && (
                    <>
                      <DDLink onClick={() => go("/vendor/dashboard")}>
                        Dashboard
                      </DDLink>
                      <DDLink onClick={() => go("/vendor/profile")}>
                        My Profile
                      </DDLink>
                      <DDLink
                        onClick={() => go("/vendor/dashboard?tab=products")}
                      >
                        My Products
                      </DDLink>
                      <DDLink
                        onClick={() => go("/vendor/dashboard?tab=orders")}
                      >
                        Orders
                      </DDLink>
                      <DDLink
                        onClick={() => go("/vendor/dashboard?tab=reviews")}
                      >
                        Reviews
                      </DDLink>
                      <DDLink onClick={doLogout}>
                        <span className="text-blue-600 font-semibold">
                          Sign Out
                        </span>
                      </DDLink>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <DDLink onClick={() => go("/admin/dashboard")}>
                        Dashboard
                      </DDLink>
                      <DDLink onClick={() => go("/admin/profile")}>
                        My Profile
                      </DDLink>
                      <DDLink
                        onClick={() => go("/admin/dashboard?tab=analytics")}
                      >
                        📈 Analytics
                      </DDLink>
                      <DDLink
                        onClick={() => go("/admin/dashboard?tab=vendors")}
                      >
                        Vendors
                      </DDLink>
                      <DDLink
                        onClick={() => go("/admin/dashboard?tab=customers")}
                      >
                        Customers
                      </DDLink>
                      <DDLink
                        onClick={() => go("/admin/dashboard?tab=categories")}
                      >
                        Categories
                      </DDLink>
                      <DDLink
                        onClick={() => go("/admin/dashboard?tab=products")}
                      >
                        Products
                      </DDLink>
                      <DDLink onClick={() => go("/admin/dashboard?tab=orders")}>
                        Orders
                      </DDLink>
                      <DDLink
                        onClick={() => go("/admin/dashboard?tab=coupons")}
                      >
                        🎟️ Coupons
                      </DDLink>
                      <DDLink
                        onClick={() => go("/admin/dashboard?tab=reviews")}
                      >
                        Reviews
                      </DDLink>
                      <DDLink onClick={doLogout}>
                        <span className="text-blue-600 font-semibold">
                          Sign Out
                        </span>
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
                        Your Wishlist
                        {wishlistCount > 0 && ` (${wishlistCount})`}
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
                          : "Sell on shop.design"}
                  </p>
                  {isCustomer && (
                    <>
                      <DDLink onClick={() => go("/profile")}>
                        📍 Manage Addresses
                        {savedAddresses.length > 0 &&
                          ` (${savedAddresses.length})`}
                      </DDLink>
                      <DDLink onClick={() => go("/help")}>
                        Customer Service
                      </DDLink>
                      <DDLink onClick={() => go("/contact")}>Contact Us</DDLink>
                      <DDLink onClick={() => go("/policy/returns")}>
                        Returns Policy
                      </DDLink>
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
                      <DDLink onClick={() => go("/categories")}>
                        All Categories
                      </DDLink>
                      <DDLink onClick={() => go("/products")}>
                        All Products
                      </DDLink>
                      <DDLink
                        onClick={() => go("/admin/dashboard?tab=countries")}
                      >
                        🌍 Countries
                      </DDLink>
                      <DDLink onClick={() => go("/admin/dashboard?tab=admins")}>
                        👑 Admins
                      </DDLink>
                      <DDLink onClick={() => go("/help")}>Help Center</DDLink>
                    </>
                  )}
                  {isGuest && (
                    <>
                      <DDLink onClick={() => go("/login")}>
                        📍 Sign in for delivery
                      </DDLink>
                      <DDLink onClick={() => go("/vendor/signup")}>
                        Become a Seller
                      </DDLink>
                      <DDLink onClick={() => go("/vendor/login")}>
                        Seller Login
                      </DDLink>
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
          <NavLink
            top="Returns"
            bottom="& Orders"
            onClick={() => go("/orders")}
          />
        )}

        {showShoppingFeatures && (
          <button
            onClick={() => go("/wishlist")}
            title="Your Wishlist"
            className="hidden lg:flex items-center gap-1 px-2.5 py-2 border border-transparent rounded-md hover:border-blue-300/50 hover:bg-white/5 text-white bg-transparent cursor-pointer shrink-0 font-[inherit] transition-all"
          >
            <div className="relative flex items-center">
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-pink-500 to-red-500 text-white text-[11px] font-extrabold min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 border-2 border-[#1E3A8A] z-10 shadow-lg">
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
              <span className="text-[10px] text-blue-200/70">
                {wishlistCount > 0 ? `${wishlistCount} items` : "Wishlist"}
              </span>
              <span className="text-[13px] font-bold">Wishlist</span>
            </div>
          </button>
        )}

        {showShoppingFeatures && (
          <button
            onClick={() => go("/cart")}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-2 border border-transparent rounded-md hover:border-blue-300/50 hover:bg-white/5 text-white bg-transparent cursor-pointer shrink-0 font-[inherit] transition-all"
          >
            <div className="relative flex items-center">
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-blue-400 to-blue-500 text-white text-[11px] font-extrabold min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 border-2 border-[#1E3A8A] z-10 shadow-lg">
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
            <span className="hidden lg:block text-[13px] font-bold mt-2.5">
              Cart
            </span>
          </button>
        )}

        {(isVendor || isAdmin) && (
          <button
            onClick={doLogout}
            className={`hidden lg:flex items-center gap-1.5 ${THEME.signOutBtn} text-white text-sm font-bold px-3.5 py-2 rounded-lg border cursor-pointer transition-all shrink-0 font-[inherit] shadow-sm`}
          >
            🚪 Sign Out
          </button>
        )}
      </nav>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[99998] backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="slide-panel fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-[99999] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E3A8A] text-white px-5 py-4 flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-lg overflow-hidden ring-2 ring-blue-400/40 shadow-lg shrink-0">
                <img
                  src={PlatformLogo}
                  alt="shop.design"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[15px] font-black text-white block leading-tight">
                  shop<span className="text-blue-400">.</span>design
                </span>
                <span className="text-[11px] text-blue-200/70 block truncate">
                  Hello, {user ? user.firstName : "Sign in"}
                </span>
                {roleLabel && (
                  <span className="text-[9px] bg-white/15 text-blue-100 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider border border-blue-300/30 mt-1 inline-block">
                    {roleLabel}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="bg-transparent border-none text-white cursor-pointer ml-auto hover:bg-white/10 rounded-lg p-1.5 transition shrink-0"
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
              <div className="border-b-[6px] border-gray-100 py-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="px-5 py-2">
                  <p className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider m-0 mb-1 flex items-center gap-1">
                    📍 Delivery Location
                  </p>
                  {defaultAddress ? (
                    <>
                      <p className="text-[13px] font-extrabold text-gray-900 m-0 leading-tight">
                        {defaultAddress.fullName}
                      </p>
                      <p className="text-[11px] text-gray-600 m-0 leading-tight mt-0.5 line-clamp-2">
                        {defaultAddress.street}, {defaultAddress.city}
                      </p>
                      <p className="text-[11px] text-gray-600 m-0 leading-tight">
                        {defaultAddress.state} -{" "}
                        <span className="font-bold">
                          {defaultAddress.postalCode}
                        </span>
                      </p>
                    </>
                  ) : user ? (
                    <p className="text-[13px] font-bold text-gray-700 m-0">
                      No address saved yet
                    </p>
                  ) : (
                    <p className="text-[13px] font-bold text-gray-700 m-0">
                      Sign in to add address
                    </p>
                  )}
                </div>
                <SlideItem
                  onClick={() => go(user ? "/profile" : "/login")}
                  className="text-blue-600 font-bold"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    {savedAddresses.length > 0
                      ? "Change or add address"
                      : user
                        ? "Add new address"
                        : "Sign in"}
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
                <div className="flex items-center justify-between px-5 pb-2">
                  <p className="text-[17px] font-extrabold text-gray-900 m-0">
                    Shop by Category
                  </p>
                  <button
                    onClick={() => go("/categories")}
                    className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 cursor-pointer hover:bg-blue-100 transition font-[inherit]"
                  >
                    View All →
                  </button>
                </div>
                {categories.map((cat) => {
                  const hasSubcategories = cat.children?.length > 0;
                  return (
                    <SlideItem
                      key={cat._id}
                      onClick={() =>
                        hasSubcategories
                          ? go(`/categories/${cat.slug || cat._id}`)
                          : go(`/products?category=${cat.slug || cat._id}`)
                      }
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">
                          {categoryIcons[cat.name.toLowerCase()] || "📦"}
                        </span>
                        <span>{cat.name}</span>
                        {hasSubcategories && (
                          <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                            {cat.children.length}
                          </span>
                        )}
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
                  );
                })}
              </div>
            )}

            {isCustomer && (
              <div className="border-b-[6px] border-gray-100 py-3">
                <p className="text-[17px] font-extrabold text-gray-900 px-5 pb-2 m-0">
                  My Account
                </p>
                <SlideItem onClick={() => go("/dashboard")}>
                  Dashboard
                </SlideItem>
                <SlideItem onClick={() => go("/profile")}>Profile</SlideItem>
                <SlideItem onClick={() => go("/orders")}>Your Orders</SlideItem>
                <SlideItem onClick={() => go("/cart")}>
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-blue-500 text-white rounded-full text-[11px] font-extrabold px-2 py-0.5">
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
                <SlideItem
                  onClick={doLogout}
                  className="text-blue-600 font-semibold"
                >
                  Sign Out
                </SlideItem>
              </div>
            )}

            {isVendor && (
              <div className="border-b-[6px] border-gray-100 py-3">
                <p className="text-[17px] font-extrabold text-gray-900 px-5 pb-2 m-0">
                  Vendor Panel
                </p>
                <SlideItem onClick={() => go("/vendor/dashboard")}>
                  Dashboard
                </SlideItem>
                <SlideItem onClick={() => go("/vendor/profile")}>
                  My Profile
                </SlideItem>
                <SlideItem onClick={() => go("/vendor/dashboard?tab=products")}>
                  My Products
                </SlideItem>
                <SlideItem onClick={() => go("/vendor/dashboard?tab=orders")}>
                  Orders
                </SlideItem>
                <SlideItem onClick={() => go("/vendor/dashboard?tab=reviews")}>
                  Reviews
                </SlideItem>
                <SlideItem
                  onClick={doLogout}
                  className="text-blue-600 font-semibold"
                >
                  Sign Out
                </SlideItem>
              </div>
            )}

            {isAdmin && (
              <div className="border-b-[6px] border-gray-100 py-3">
                <p className="text-[17px] font-extrabold text-gray-900 px-5 pb-2 m-0">
                  Admin Panel
                </p>
                <SlideItem onClick={() => go("/admin/dashboard")}>
                  Dashboard
                </SlideItem>
                <SlideItem onClick={() => go("/admin/profile")}>
                  My Profile
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=analytics")}>
                  📈 Analytics
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=vendors")}>
                  Vendors
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=customers")}>
                  Customers
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=admins")}>
                  👑 Admins
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=countries")}>
                  🌍 Countries
                </SlideItem>
                <SlideItem
                  onClick={() => go("/admin/dashboard?tab=categories")}
                >
                  Categories
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=products")}>
                  Products
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=orders")}>
                  Orders
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=coupons")}>
                  🎟️ Coupons
                </SlideItem>
                <SlideItem onClick={() => go("/admin/dashboard?tab=reviews")}>
                  Reviews
                </SlideItem>
                <SlideItem
                  onClick={doLogout}
                  className="text-blue-600 font-semibold"
                >
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
                  className="text-blue-600 font-semibold"
                >
                  Sign In
                </SlideItem>
                <SlideItem onClick={() => go("/signup")}>
                  Create Account
                </SlideItem>
                {cartCount > 0 && (
                  <SlideItem onClick={() => go("/cart")}>
                    <span>Cart</span>
                    <span className="bg-blue-500 text-white rounded-full text-[11px] font-extrabold px-2 py-0.5">
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
                <SlideItem onClick={() => go("/vendor/login")}>
                  Seller Login
                </SlideItem>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;

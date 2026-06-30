import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useGetCartQuery } from "../features/cart/cartApi";
import { useWishlist } from "../hooks/useWishlist";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useMemo, useState } from "react";

const categoryIcons = {
  furniture: "🛋️", electronics: "📱", fashion: "👕", "home decor": "🏠",
  sports: "⚽", books: "📚", beauty: "💄", kitchen: "🍳", clothing: "👔",
  accessories: "⌚", toys: "🧸", health: "💊", grocery: "🛒",
  automotive: "🚗", garden: "🌿", office: "💼",
};

const SbTitle = ({ children }) => (
  <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-400 px-4 pt-4 pb-2 m-0">
    {children}
  </p>
);

const SbSep = () => <div className="border-t border-gray-200 my-2" />;

const SbIcon = ({ children, active, theme = "orange" }) => {
  const themes = {
    orange: active ? "bg-orange-100 border-orange-300 text-[#D85A30]" : "bg-gray-100 border-gray-200 text-gray-600",
    indigo: active ? "bg-indigo-100 border-indigo-300 text-[#4f46e5]" : "bg-gray-100 border-gray-200 text-gray-600",
    red: active ? "bg-red-100 border-red-300 text-red-600" : "bg-gray-100 border-gray-200 text-gray-600",
  };
  return (
    <span className={`w-8 h-8 flex items-center justify-center rounded-lg border text-base shrink-0 transition-all ${themes[theme]}`}>
      {children}
    </span>
  );
};

const SbItem = ({ onClick, active, children, disabled, className = "", theme = "orange" }) => {
  const themes = {
    orange: active
      ? "bg-gradient-to-r from-orange-50 via-orange-50/50 to-transparent text-[#D85A30] font-extrabold border-l-4 border-[#D85A30] pl-3 shadow-sm"
      : "bg-transparent text-gray-700 hover:bg-gray-50 font-medium",
    indigo: active
      ? "bg-gradient-to-r from-indigo-50 via-indigo-50/50 to-transparent text-[#4f46e5] font-extrabold border-l-4 border-[#4f46e5] pl-3 shadow-sm"
      : "bg-transparent text-gray-700 hover:bg-gray-50 font-medium",
    red: active
      ? "bg-gradient-to-r from-red-50 via-red-50/50 to-transparent text-red-600 font-extrabold border-l-4 border-red-600 pl-3 shadow-sm"
      : "bg-transparent text-gray-700 hover:bg-gray-50 font-medium",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 w-full px-4 py-3 border-none cursor-pointer text-left text-[13px] transition-all font-[inherit] ${themes[theme]} ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

const SbName = ({ children }) => (
  <span className="flex-1">{children}</span>
);

const SbBadge = ({ count, color = "bg-[#D85A30]" }) =>
  count > 0 ? (
    <span className={`${color} text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm`}>
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

const SoonBadge = () => (
  <span className="text-[9px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-extrabold border border-yellow-200">Soon</span>
);

const CategorySidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, refreshToken } = useSelector((state) => state.auth);
  const [logoutAPI] = useLogoutMutation();

  const { data: categoryData } = useGetCategoryTreeQuery();
  const { data: cartData } = useGetCartQuery(undefined, {
    skip: !user || user.role !== "customer",
  });
  const { total: wishlistCount } = useWishlist();

  const [expandedCat, setExpandedCat] = useState(null);

  const categories = categoryData?.data || [];
  const cartCount = cartData?.data?.totalItems || 0;
  const role = user?.role;
  const isCustomer = role === "customer";
  const isVendor = role === "vendor";
  const isAdmin = role === "admin";

  const isProductsPage = location.pathname === "/products";
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeCategory = params.get("category");

  const isActive = (catId) => activeCategory === catId;
  const isPathActive = (path) => location.pathname === path;
  const go = (url) => navigate(url);
  const toggleExpand = (catId) => setExpandedCat((prev) => (prev === catId ? null : catId));

  const handleLogout = async () => {
    try { await logoutAPI({ refreshToken }).unwrap(); } catch (err) { console.log(err); }
    finally { dispatch(authApi.util.resetApiState()); dispatch(logout()); navigate("/login"); }
  };

  return (
    <aside className="hidden xl:block w-[260px] bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto shrink-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">

      {/* ═══ USER PROFILE SECTION ═══ */}
      {user && (
        <div className={`px-4 py-5 border-b border-gray-200 ${
          isVendor ? "bg-gradient-to-br from-indigo-50 to-white" :
          isAdmin ? "bg-gradient-to-br from-red-50 to-white" :
          "bg-gradient-to-br from-orange-50 to-white"
        }`}>
          <button
            onClick={() => {
              if (isVendor) go("/vendor/profile");
              else if (isAdmin) go("/admin/profile");
              else if (isCustomer) go("/profile");
            }}
            className="flex items-center gap-3 w-full bg-transparent border-none cursor-pointer p-0 hover:opacity-90 transition group"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg overflow-hidden shrink-0 shadow-md group-hover:scale-105 transition-transform ${
              isVendor ? "bg-gradient-to-br from-[#4338ca] to-[#6366f1]" :
              isAdmin ? "bg-gradient-to-br from-red-500 to-red-600" :
              "bg-gradient-to-br from-[#D85A30] to-[#FF8C5A]"
            }`}>
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
              ) : (
                user.firstName?.[0]?.toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-extrabold text-gray-900 m-0 truncate">
                Hello, {user.firstName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {isCustomer && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">CUSTOMER</span>}
                {isVendor && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">VENDOR</span>}
                {isAdmin && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">ADMIN</span>}
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* ═══ GUEST WELCOME SECTION ═══ */}
      {!user && (
        <div className="px-4 py-5 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-md">
              👋
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-gray-900 m-0">Welcome!</p>
              <p className="text-[11px] text-gray-500 m-0 mt-0.5">Sign in for best experience</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => go("/login")}
              className="w-full bg-gradient-to-r from-[#D85A30] to-[#FF8C5A] text-white border-none rounded-xl py-2.5 text-sm font-bold cursor-pointer shadow-md hover:shadow-lg hover:brightness-110 transition font-[inherit]"
            >
              Sign In
            </button>
            <button
              onClick={() => go("/signup")}
              className="w-full bg-white text-gray-700 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition font-[inherit]"
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      <div className="py-2">

        {/* ═══ CUSTOMER NAVIGATION ═══ */}
        {isCustomer && (
          <>
            <SbTitle>Your Account</SbTitle>
            <SbItem onClick={() => go("/dashboard")} active={isPathActive("/dashboard")}>
              <SbIcon active={isPathActive("/dashboard")}>📊</SbIcon>
              <SbName>Dashboard</SbName>
            </SbItem>
            <SbItem onClick={() => go("/orders")} active={isPathActive("/orders")}>
              <SbIcon active={isPathActive("/orders")}>📦</SbIcon>
              <SbName>My Orders</SbName>
            </SbItem>
            <SbItem onClick={() => go("/cart")} active={isPathActive("/cart")}>
              <SbIcon active={isPathActive("/cart")}>🛒</SbIcon>
              <SbName>Shopping Cart</SbName>
              <SbBadge count={cartCount} />
            </SbItem>
            <SbItem onClick={() => go("/wishlist")} active={isPathActive("/wishlist")}>
              <SbIcon active={isPathActive("/wishlist")}>❤️</SbIcon>
              <SbName>Wishlist</SbName>
              <SbBadge count={wishlistCount} color="bg-red-500" />
            </SbItem>
            <SbItem onClick={() => go("/profile")} active={isPathActive("/profile")}>
              <SbIcon active={isPathActive("/profile")}>👤</SbIcon>
              <SbName>Account Settings</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Customer Service</SbTitle>
            <SbItem onClick={() => go("/help")}>
              <SbIcon>💬</SbIcon>
              <SbName>Help Center</SbName>
            </SbItem>
            <SbItem onClick={() => go("/contact")}>
              <SbIcon>📬</SbIcon>
              <SbName>Contact Us</SbName>
            </SbItem>
            <SbItem onClick={() => go("/policy/returns")}>
              <SbIcon>🔄</SbIcon>
              <SbName>Returns & Refunds</SbName>
            </SbItem>
            <SbItem onClick={() => go("/policy/shipping-info")}>
              <SbIcon>🚚</SbIcon>
              <SbName>Shipping Information</SbName>
            </SbItem>

            <SbSep />
            <div className="px-4 py-3">
              <button 
                onClick={handleLogout}
                className="w-full py-2.5 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl text-sm font-bold cursor-pointer hover:bg-red-100 hover:border-red-300 transition font-[inherit] flex items-center justify-center gap-2"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}

        {/* ═══ VENDOR NAVIGATION ═══ */}
        {isVendor && (
          <>
            <SbTitle>Vendor Dashboard</SbTitle>
            <SbItem theme="indigo" onClick={() => go("/vendor/dashboard")} active={isPathActive("/vendor/dashboard") && !params.get("tab")}>
              <SbIcon theme="indigo" active={isPathActive("/vendor/dashboard") && !params.get("tab")}>📊</SbIcon>
              <SbName>Overview</SbName>
            </SbItem>
            <SbItem theme="indigo" onClick={() => go("/vendor/dashboard?tab=products")} active={params.get("tab") === "products"}>
              <SbIcon theme="indigo" active={params.get("tab") === "products"}>📦</SbIcon>
              <SbName>Manage Products</SbName>
            </SbItem>
            <SbItem theme="indigo" onClick={() => go("/vendor/dashboard?tab=orders")} active={params.get("tab") === "orders"}>
              <SbIcon theme="indigo" active={params.get("tab") === "orders"}>🛒</SbIcon>
              <SbName>Orders</SbName>
            </SbItem>
            <SbItem theme="indigo" onClick={() => go("/vendor/dashboard?tab=reviews")} active={params.get("tab") === "reviews"}>
              <SbIcon theme="indigo" active={params.get("tab") === "reviews"}>⭐</SbIcon>
              <SbName>Reviews & Ratings</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Account & Settings</SbTitle>
            <SbItem theme="indigo" onClick={() => go("/vendor/profile")} active={isPathActive("/vendor/profile")}>
              <SbIcon theme="indigo" active={isPathActive("/vendor/profile")}>👤</SbIcon>
              <SbName>Store Profile</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Quick Actions</SbTitle>
            <SbItem theme="indigo" onClick={() => go("/vendor/dashboard?tab=products")}>
              <SbIcon theme="indigo">➕</SbIcon>
              <SbName>Add New Product</SbName>
            </SbItem>
            <SbItem theme="indigo" onClick={() => go("/products")}>
              <SbIcon theme="indigo">🛍️</SbIcon>
              <SbName>View Storefront</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Analytics & Reports</SbTitle>
            <SbItem theme="indigo" disabled>
              <SbIcon theme="indigo">📈</SbIcon>
              <SbName>Sales Analytics</SbName>
              <SoonBadge />
            </SbItem>
            <SbItem theme="indigo" disabled>
              <SbIcon theme="indigo">💰</SbIcon>
              <SbName>Earnings Report</SbName>
              <SoonBadge />
            </SbItem>

            <SbSep />
            <SbTitle>Resources</SbTitle>
            <SbItem theme="indigo" onClick={() => go("/policy/seller-guidelines")}>
              <SbIcon theme="indigo">📋</SbIcon>
              <SbName>Seller Guidelines</SbName>
            </SbItem>
            <SbItem theme="indigo" onClick={() => go("/policy/commission-policy")}>
              <SbIcon theme="indigo">💵</SbIcon>
              <SbName>Commission Policy</SbName>
            </SbItem>
            <SbItem theme="indigo" onClick={() => go("/help")}>
              <SbIcon theme="indigo">💬</SbIcon>
              <SbName>Vendor Support</SbName>
            </SbItem>

            <SbSep />
            <div className="px-4 py-3">
              <button 
                onClick={handleLogout}
                className="w-full py-2.5 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl text-sm font-bold cursor-pointer hover:bg-red-100 hover:border-red-300 transition font-[inherit] flex items-center justify-center gap-2"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}

        {/* ═══ ADMIN NAVIGATION ═══ */}
        {isAdmin && (
          <>
            <SbTitle>Admin Control Panel</SbTitle>
            <SbItem theme="red" onClick={() => go("/admin/dashboard")} active={isPathActive("/admin/dashboard") && !params.get("tab")}>
              <SbIcon theme="red" active={isPathActive("/admin/dashboard") && !params.get("tab")}>📊</SbIcon>
              <SbName>Dashboard</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>User Management</SbTitle>
            <SbItem theme="red" onClick={() => go("/admin/dashboard?tab=vendors")} active={params.get("tab") === "vendors"}>
              <SbIcon theme="red" active={params.get("tab") === "vendors"}>🏪</SbIcon>
              <SbName>Vendors</SbName>
            </SbItem>
            <SbItem theme="red" onClick={() => go("/admin/dashboard?tab=customers")} active={params.get("tab") === "customers"}>
              <SbIcon theme="red" active={params.get("tab") === "customers"}>👥</SbIcon>
              <SbName>Customers</SbName>
            </SbItem>
            <SbItem theme="red" onClick={() => go("/admin/dashboard?tab=admins")} active={params.get("tab") === "admins"}>
              <SbIcon theme="red" active={params.get("tab") === "admins"}>👑</SbIcon>
              <SbName>Administrators</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Catalog Management</SbTitle>
            <SbItem theme="red" onClick={() => go("/admin/dashboard?tab=categories")} active={params.get("tab") === "categories"}>
              <SbIcon theme="red" active={params.get("tab") === "categories"}>📂</SbIcon>
              <SbName>Categories</SbName>
            </SbItem>
            <SbItem theme="red" onClick={() => go("/admin/dashboard?tab=products")} active={params.get("tab") === "products"}>
              <SbIcon theme="red" active={params.get("tab") === "products"}>📦</SbIcon>
              <SbName>All Products</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Operations</SbTitle>
            <SbItem theme="red" onClick={() => go("/admin/dashboard?tab=orders")} active={params.get("tab") === "orders"}>
              <SbIcon theme="red" active={params.get("tab") === "orders"}>🛒</SbIcon>
              <SbName>Orders</SbName>
            </SbItem>
            <SbItem theme="red" onClick={() => go("/admin/dashboard?tab=reviews")} active={params.get("tab") === "reviews"}>
              <SbIcon theme="red" active={params.get("tab") === "reviews"}>⭐</SbIcon>
              <SbName>Reviews</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Settings</SbTitle>
            <SbItem theme="red" onClick={() => go("/admin/profile")} active={isPathActive("/admin/profile")}>
              <SbIcon theme="red" active={isPathActive("/admin/profile")}>👤</SbIcon>
              <SbName>My Profile</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Advanced Features</SbTitle>
            <SbItem theme="red" disabled>
              <SbIcon theme="red">📈</SbIcon>
              <SbName>Analytics</SbName>
              <SoonBadge />
            </SbItem>
            <SbItem theme="red" disabled>
              <SbIcon theme="red">💳</SbIcon>
              <SbName>Payment Gateway</SbName>
              <SoonBadge />
            </SbItem>
            <SbItem theme="red" disabled>
              <SbIcon theme="red">🎟️</SbIcon>
              <SbName>Coupon Manager</SbName>
              <SoonBadge />
            </SbItem>

            <SbSep />
            <SbTitle>Quick Links</SbTitle>
            <SbItem theme="red" onClick={() => go("/")}>
              <SbIcon theme="red">🏠</SbIcon>
              <SbName>View Homepage</SbName>
            </SbItem>
            <SbItem theme="red" onClick={() => go("/products")}>
              <SbIcon theme="red">🛍️</SbIcon>
              <SbName>Browse Products</SbName>
            </SbItem>

            <SbSep />
            <div className="px-4 py-3">
              <button 
                onClick={handleLogout}
                className="w-full py-2.5 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl text-sm font-bold cursor-pointer hover:bg-red-100 hover:border-red-300 transition font-[inherit] flex items-center justify-center gap-2"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}

        {/* ═══ GUEST NAVIGATION ═══ */}
        {!user && (
          <>
            <SbTitle>Browse</SbTitle>
            <SbItem onClick={() => go("/products")}>
              <SbIcon>🛍️</SbIcon>
              <SbName>All Products</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products?sort=newest")}>
              <SbIcon>✨</SbIcon>
              <SbName>New Arrivals</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products?sort=popular")}>
              <SbIcon>🔥</SbIcon>
              <SbName>Best Sellers</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products?sort=rating")}>
              <SbIcon>⭐</SbIcon>
              <SbName>Top Rated</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Sell With Us</SbTitle>
            <SbItem onClick={() => go("/vendor/signup")}>
              <SbIcon>🏪</SbIcon>
              <SbName>Become a Seller</SbName>
            </SbItem>
            <SbItem onClick={() => go("/vendor/login")}>
              <SbIcon>🔓</SbIcon>
              <SbName>Seller Login</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Help & Information</SbTitle>
            <SbItem onClick={() => go("/help")}>
              <SbIcon>💬</SbIcon>
              <SbName>Customer Service</SbName>
            </SbItem>
            <SbItem onClick={() => go("/contact")}>
              <SbIcon>📬</SbIcon>
              <SbName>Contact Us</SbName>
            </SbItem>
            <SbItem onClick={() => go("/about")}>
              <SbIcon>ℹ️</SbIcon>
              <SbName>About Us</SbName>
            </SbItem>

            <SbSep />
            <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-white rounded-2xl mx-4 mb-4 border border-blue-100">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg shrink-0">
                  🎁
                </div>
                <div className="flex-1">
                  <p className="text-xs font-extrabold text-gray-900 m-0">New Customer?</p>
                  <p className="text-[11px] text-gray-600 m-0 mt-0.5 leading-relaxed">
                    Get exclusive deals on your first order!
                  </p>
                </div>
              </div>
              <button
                onClick={() => go("/signup")}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-lg py-2 text-xs font-bold cursor-pointer shadow-md hover:shadow-lg hover:brightness-110 transition font-[inherit]"
              >
                Sign Up Now
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default CategorySidebar;
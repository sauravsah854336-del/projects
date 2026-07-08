import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useGetCartQuery } from "../features/cart/cartApi";
import { useWishlist } from "../hooks/useWishlist";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useMemo } from "react";

const SbTitle = ({ children, action }) => (
  <div className="flex items-center justify-between px-4 pt-5 pb-2">
    <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-400 m-0">
      {children}
    </p>
    {action}
  </div>
);

const SbSep = () => <div className="border-t border-gray-100 my-2 mx-4" />;

const SbIcon = ({ children, active, theme = "blue" }) => {
  const themes = {
    blue: active
      ? "bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 text-blue-700 shadow-sm"
      : "bg-gray-50 border-gray-200 text-gray-500 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-700",
    indigo: active
      ? "bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-300 text-[#4f46e5] shadow-sm"
      : "bg-gray-50 border-gray-200 text-gray-500 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-[#4f46e5]",
  };
  return (
    <span
      className={`w-9 h-9 flex items-center justify-center rounded-xl border-2 text-base shrink-0 transition-all duration-200 ${themes[theme]}`}
    >
      {children}
    </span>
  );
};

const SbItem = ({
  onClick,
  active,
  children,
  disabled,
  className = "",
  theme = "blue",
}) => {
  const themes = {
    blue: active
      ? "bg-gradient-to-r from-blue-50 via-blue-50/60 to-transparent text-blue-700 font-extrabold border-l-[3px] border-blue-600 shadow-sm"
      : "bg-transparent text-gray-700 hover:bg-blue-50/50 font-medium border-l-[3px] border-transparent hover:text-blue-700",
    indigo: active
      ? "bg-gradient-to-r from-indigo-50 via-indigo-50/60 to-transparent text-[#4f46e5] font-extrabold border-l-[3px] border-[#4f46e5] shadow-sm"
      : "bg-transparent text-gray-700 hover:bg-gray-50 font-medium border-l-[3px] border-transparent",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-3 w-full pl-4 pr-4 py-2.5 border-none border-l-[3px] cursor-pointer text-left text-[13px] transition-all duration-200 font-[inherit] ${themes[theme]} ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

const SbName = ({ children }) => (
  <span className="flex-1 truncate">{children}</span>
);

const SbBadge = ({ count, color = "bg-blue-600" }) =>
  count > 0 ? (
    <span
      className={`${color} text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm`}
    >
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

const SoonBadge = () => (
  <span className="text-[9px] bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-extrabold border border-amber-200">
    Soon
  </span>
);

const CategorySidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, refreshToken } = useSelector((state) => state.auth);
  const [logoutAPI] = useLogoutMutation();

  const { data: cartData } = useGetCartQuery(undefined, {
    skip: !user || user.role !== "customer",
  });
  const { total: wishlistCount } = useWishlist();

  const cartCount = cartData?.data?.totalItems || 0;
  const role = user?.role;
  const isCustomer = role === "customer";
  const isVendor = role === "vendor";
  const isAdmin = role === "admin";

  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const isPathActive = (path) => location.pathname === path;
  const go = (url) => navigate(url);

  const handleLogout = async () => {
    try {
      await logoutAPI({ refreshToken }).unwrap();
    } catch (err) {
      console.log(err);
    } finally {
      dispatch(authApi.util.resetApiState());
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <aside className="hidden xl:block w-[260px] bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto shrink-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
      {user && (
        <div
          className={`relative px-4 py-5 border-b border-gray-100 overflow-hidden ${
            isVendor
              ? "bg-gradient-to-br from-indigo-50 via-indigo-50/50 to-white"
              : "bg-gradient-to-br from-blue-50 via-blue-50/50 to-white"
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl pointer-events-none" />
          <button
            onClick={() => {
              if (isVendor) go("/vendor/profile");
              else if (isAdmin) go("/admin/profile");
              else if (isCustomer) go("/profile");
            }}
            className="relative flex items-center gap-3 w-full bg-transparent border-none cursor-pointer p-0 hover:opacity-95 transition group"
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform ${
                isVendor
                  ? "bg-gradient-to-br from-[#4338ca] to-[#6366f1] shadow-indigo-200"
                  : "bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-200"
              }`}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                user.firstName?.[0]?.toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-extrabold text-gray-900 m-0 truncate">
                Hello, {user.firstName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {isCustomer && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    CUSTOMER
                  </span>
                )}
                {isVendor && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                    VENDOR
                  </span>
                )}
                {isAdmin && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    ADMIN
                  </span>
                )}
              </div>
            </div>
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {!user && (
        <div className="relative px-4 py-5 border-b border-gray-100 bg-gradient-to-br from-blue-50 via-blue-50/50 to-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200">
              👋
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-gray-900 m-0">
                Welcome!
              </p>
              <p className="text-[11px] text-gray-500 m-0 mt-0.5">
                Sign in for best experience
              </p>
            </div>
          </div>
          <div className="relative flex flex-col gap-2">
            <button
              onClick={() => go("/login")}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-xl py-2.5 text-sm font-bold cursor-pointer shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:brightness-105 transition font-[inherit]"
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
        {isCustomer && (
          <>
            <SbTitle>Your Account</SbTitle>
            <SbItem
              onClick={() => go("/dashboard")}
              active={isPathActive("/dashboard")}
            >
              <SbIcon active={isPathActive("/dashboard")}>📊</SbIcon>
              <SbName>Dashboard</SbName>
            </SbItem>
            <SbItem
              onClick={() => go("/orders")}
              active={isPathActive("/orders")}
            >
              <SbIcon active={isPathActive("/orders")}>📦</SbIcon>
              <SbName>My Orders</SbName>
            </SbItem>
            <SbItem onClick={() => go("/cart")} active={isPathActive("/cart")}>
              <SbIcon active={isPathActive("/cart")}>🛒</SbIcon>
              <SbName>Shopping Cart</SbName>
              <SbBadge count={cartCount} />
            </SbItem>
            <SbItem
              onClick={() => go("/wishlist")}
              active={isPathActive("/wishlist")}
            >
              <SbIcon active={isPathActive("/wishlist")}>❤️</SbIcon>
              <SbName>Wishlist</SbName>
              <SbBadge count={wishlistCount} color="bg-red-500" />
            </SbItem>
            <SbItem
              onClick={() => go("/profile")}
              active={isPathActive("/profile")}
            >
              <SbIcon active={isPathActive("/profile")}>👤</SbIcon>
              <SbName>Account Settings</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Quick Browse</SbTitle>
            <SbItem onClick={() => go("/products")}>
              <SbIcon>🛍️</SbIcon>
              <SbName>All Products</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products?filterType=latest")}>
              <SbIcon>✨</SbIcon>
              <SbName>New Arrivals</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products?filterType=discount")}>
              <SbIcon>💰</SbIcon>
              <SbName>Deals & Offers</SbName>
            </SbItem>
            <SbItem onClick={() => go("/categories")}>
              <SbIcon>🗂️</SbIcon>
              <SbName>All Categories</SbName>
            </SbItem>

            <SbSep />
          </>
        )}

        {isVendor && (
          <>
            <SbTitle>Vendor Dashboard</SbTitle>
            <SbItem
              theme="indigo"
              onClick={() => go("/vendor/dashboard")}
              active={isPathActive("/vendor/dashboard") && !params.get("tab")}
            >
              <SbIcon
                theme="indigo"
                active={isPathActive("/vendor/dashboard") && !params.get("tab")}
              >
                📊
              </SbIcon>
              <SbName>Overview</SbName>
            </SbItem>
            <SbItem
              theme="indigo"
              onClick={() => go("/vendor/dashboard?tab=products")}
              active={params.get("tab") === "products"}
            >
              <SbIcon theme="indigo" active={params.get("tab") === "products"}>
                📦
              </SbIcon>
              <SbName>Manage Products</SbName>
            </SbItem>
            <SbItem
              theme="indigo"
              onClick={() => go("/vendor/dashboard?tab=orders")}
              active={params.get("tab") === "orders"}
            >
              <SbIcon theme="indigo" active={params.get("tab") === "orders"}>
                🛒
              </SbIcon>
              <SbName>Orders</SbName>
            </SbItem>
            <SbItem
              theme="indigo"
              onClick={() => go("/vendor/dashboard?tab=reviews")}
              active={params.get("tab") === "reviews"}
            >
              <SbIcon theme="indigo" active={params.get("tab") === "reviews"}>
                ⭐
              </SbIcon>
              <SbName>Reviews & Ratings</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Account & Settings</SbTitle>
            <SbItem
              theme="indigo"
              onClick={() => go("/vendor/profile")}
              active={isPathActive("/vendor/profile")}
            >
              <SbIcon theme="indigo" active={isPathActive("/vendor/profile")}>
                👤
              </SbIcon>
              <SbName>Store Profile</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Quick Actions</SbTitle>
            <SbItem
              theme="indigo"
              onClick={() => go("/vendor/dashboard?tab=products")}
            >
              <SbIcon theme="indigo">➕</SbIcon>
              <SbName>Add New Product</SbName>
            </SbItem>
            <SbItem theme="indigo" onClick={() => go("/products")}>
              <SbIcon theme="indigo">🛍️</SbIcon>
              <SbName>View Storefront</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Analytics & Reports</SbTitle>
            <SbItem
              theme="indigo"
              onClick={() => go("/vendor/sales-report")}
              active={isPathActive("/vendor/sales-report")}
            >
              <SbIcon
                theme="indigo"
                active={isPathActive("/vendor/sales-report")}
              >
                📈
              </SbIcon>
              <SbName>Sales Report</SbName>
            </SbItem>
          </>
        )}

        {isAdmin && (
          <>
            <SbTitle>Admin Control Panel</SbTitle>
            <SbItem
              onClick={() => go("/admin/dashboard")}
              active={isPathActive("/admin/dashboard") && !params.get("tab")}
            >
              <SbIcon
                active={isPathActive("/admin/dashboard") && !params.get("tab")}
              >
                📊
              </SbIcon>
              <SbName>Dashboard</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>User Management</SbTitle>
            <SbItem
              onClick={() => go("/admin/dashboard?tab=vendors")}
              active={params.get("tab") === "vendors"}
            >
              <SbIcon active={params.get("tab") === "vendors"}>🏪</SbIcon>
              <SbName>Vendors</SbName>
            </SbItem>
            <SbItem
              onClick={() => go("/admin/dashboard?tab=customers")}
              active={params.get("tab") === "customers"}
            >
              <SbIcon active={params.get("tab") === "customers"}>👥</SbIcon>
              <SbName>Customers</SbName>
            </SbItem>
            <SbItem
              onClick={() => go("/admin/dashboard?tab=admins")}
              active={params.get("tab") === "admins"}
            >
              <SbIcon active={params.get("tab") === "admins"}>👑</SbIcon>
              <SbName>Administrators</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Catalog Management</SbTitle>
            <SbItem
              onClick={() => go("/admin/dashboard?tab=categories")}
              active={params.get("tab") === "categories"}
            >
              <SbIcon active={params.get("tab") === "categories"}>📂</SbIcon>
              <SbName>Categories</SbName>
            </SbItem>
            <SbItem
              onClick={() => go("/admin/dashboard?tab=products")}
              active={params.get("tab") === "products"}
            >
              <SbIcon active={params.get("tab") === "products"}>📦</SbIcon>
              <SbName>All Products</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Operations</SbTitle>
            <SbItem
              onClick={() => go("/admin/dashboard?tab=orders")}
              active={params.get("tab") === "orders"}
            >
              <SbIcon active={params.get("tab") === "orders"}>🛒</SbIcon>
              <SbName>Orders</SbName>
            </SbItem>
            <SbItem
              onClick={() => go("/admin/dashboard?tab=coupons")}
              active={params.get("tab") === "coupons"}
            >
              <SbIcon active={params.get("tab") === "coupons"}>🎟️</SbIcon>
              <SbName>Coupons</SbName>
            </SbItem>
            <SbItem
              onClick={() => go("/admin/dashboard?tab=reviews")}
              active={params.get("tab") === "reviews"}
            >
              <SbIcon active={params.get("tab") === "reviews"}>⭐</SbIcon>
              <SbName>Reviews</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Settings</SbTitle>
            <SbItem
              onClick={() => go("/admin/profile")}
              active={isPathActive("/admin/profile")}
            >
              <SbIcon active={isPathActive("/admin/profile")}>👤</SbIcon>
              <SbName>My Profile</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Advanced Features</SbTitle>
            <SbItem
              onClick={() => go("/admin/dashboard?tab=analytics")}
              active={params.get("tab") === "analytics"}
            >
              <SbIcon active={params.get("tab") === "analytics"}>📈</SbIcon>
              <SbName>Analytics</SbName>
            </SbItem>
            <SbItem
              onClick={() => go("/admin/sales-report")}
              active={isPathActive("/admin/sales-report")}
            >
              <SbIcon active={isPathActive("/admin/sales-report")}>📊</SbIcon>
              <SbName>Sales Report</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Quick Links</SbTitle>
            <SbItem onClick={() => go("/")}>
              <SbIcon>🏠</SbIcon>
              <SbName>View Homepage</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products")}>
              <SbIcon>🛍️</SbIcon>
              <SbName>Browse Products</SbName>
            </SbItem>

            <SbSep />
          </>
        )}

        {!user && (
          <>
            <SbTitle>Browse</SbTitle>
            <SbItem onClick={() => go("/products")}>
              <SbIcon>🛍️</SbIcon>
              <SbName>All Products</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products?filterType=latest")}>
              <SbIcon>✨</SbIcon>
              <SbName>New Arrivals</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products?filterType=bestSeller")}>
              <SbIcon>🔥</SbIcon>
              <SbName>Best Sellers</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products?filterType=topRated")}>
              <SbIcon>⭐</SbIcon>
              <SbName>Top Rated</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products?filterType=discount")}>
              <SbIcon>💰</SbIcon>
              <SbName>Deals & Offers</SbName>
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

            <div className="px-4 pt-5 pb-4">
              <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-4 overflow-hidden shadow-lg shadow-blue-200">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg shrink-0 border border-white/30">
                      🎁
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-extrabold text-white m-0">
                        New Customer?
                      </p>
                      <p className="text-[11px] text-blue-100 m-0 mt-0.5 leading-relaxed">
                        Get exclusive first-order deals!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => go("/signup")}
                    className="w-full bg-white text-blue-600 border-none rounded-lg py-2 text-xs font-extrabold cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.02] transition font-[inherit]"
                  >
                    Sign Up Now →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default CategorySidebar;

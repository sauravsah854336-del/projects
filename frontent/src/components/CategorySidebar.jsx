import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useGetCartQuery } from "../features/cart/cartApi";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useMemo, useState } from "react";

const categoryIcons = {
  furniture: "🛋️",
  electronics: "📱",
  fashion: "👕",
  "home decor": "🏠",
  sports: "⚽",
  books: "📚",
  beauty: "💄",
  kitchen: "🍳",
  clothing: "👔",
  accessories: "⌚",
  toys: "🧸",
  health: "💊",
  grocery: "🛒",
  automotive: "🚗",
  garden: "🌿",
  office: "💼",
};

const SbTitle = ({ children }) => (
  <p className="text-[11px] font-black uppercase tracking-[0.08em] text-gray-500 px-4 pt-3 pb-2 m-0">
    {children}
  </p>
);

const SbSep = () => <div className="border-t-[6px] border-gray-100 mt-3.5" />;

const SbIcon = ({ children, active }) => (
  <span className={`w-7 h-7 flex items-center justify-center rounded-[10px] border text-sm shrink-0 transition-colors ${active ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
    {children}
  </span>
);

const SbItem = ({ onClick, active, children, disabled, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2.5 w-full px-4 py-2.5 border-none cursor-pointer text-left text-[13px] transition-all font-[inherit] ${
      active
        ? "bg-gradient-to-r from-orange-50 to-transparent text-[#D85A30] font-black border-l-[4px] border-[#D85A30] pl-3"
        : "bg-transparent text-gray-900 hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent hover:text-[#D85A30]"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
  >
    {children}
  </button>
);

const SbName = ({ children }) => (
  <span className="flex-1 font-bold">{children}</span>
);

const SoonBadge = () => (
  <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-extrabold">
    Soon
  </span>
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

  const [expandedCat, setExpandedCat] = useState(null);

  const categories = categoryData?.data || [];
  const cartCount = cartData?.data?.totalItems || 0;
  const role = user?.role;

  const isCustomer = role === "customer";
  const isVendor = role === "vendor";
  const isAdmin = role === "admin";

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeCategory = params.get("category");

  const isActive = (catId) => activeCategory === catId;
  const isPathActive = (path) => location.pathname === path;

  const go = (url) => navigate(url);

  const toggleExpand = (catId) => {
    setExpandedCat((prev) => (prev === catId ? null : catId));
  };

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

  const CategoryList = () => (
    <>
      <SbItem
        onClick={() => go("/products")}
        active={isPathActive("/products") && !activeCategory}
      >
        <SbIcon active={isPathActive("/products") && !activeCategory}>🛍️</SbIcon>
        <SbName>All Products</SbName>
      </SbItem>

      {categories.map((cat) => {
        const icon = categoryIcons[cat.name.toLowerCase()] || "📦";
        const hasChildren = cat.children?.length > 0;
        const isExpanded = expandedCat === cat._id;
        const active = isActive(cat._id);

        return (
          <div key={cat._id}>
            <div className="flex items-center">
              <SbItem
                onClick={() => go(`/products?category=${cat._id}`)}
                active={active}
                className="flex-1"
              >
                <SbIcon active={active}>{icon}</SbIcon>
                <SbName>{cat.name}</SbName>
              </SbItem>
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(cat._id)}
                  className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-transparent border border-transparent hover:bg-gray-50 hover:border-gray-200 cursor-pointer text-gray-400 transition-all shrink-0 mr-2"
                >
                  <svg
                    width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {hasChildren && isExpanded && (
              <div className="bg-gray-50 py-1.5 border-y border-gray-100">
                {cat.children.map((sub) => (
                  <button
                    key={sub._id}
                    onClick={() => go(`/products?category=${sub._id}`)}
                    className={`flex items-center gap-2.5 w-full pl-[46px] pr-4 py-2 border-none cursor-pointer text-left text-[12.5px] bg-transparent transition-all font-[inherit] ${
                      isActive(sub._id)
                        ? "text-[#D85A30] font-black"
                        : "text-gray-600 hover:bg-orange-50 hover:text-[#D85A30]"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D85A30] shrink-0"></span>
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  const ProgramsSection = () => (
    <>
      <SbSep />
      <SbTitle>Programs & Features</SbTitle>
      <SbItem onClick={() => go("/products?sort=newest")}>
        <SbIcon>✨</SbIcon><SbName>New Arrivals</SbName>
      </SbItem>
      <SbItem onClick={() => go("/products?sort=popular")}>
        <SbIcon>🔥</SbIcon><SbName>Best Sellers</SbName>
      </SbItem>
      <SbItem onClick={() => go("/products?sort=rating")}>
        <SbIcon>⭐</SbIcon><SbName>Top Rated</SbName>
      </SbItem>
    </>
  );

  const LogoutBtn = () => (
    <button
      onClick={handleLogout}
      className="w-[calc(100%-32px)] mx-4 mt-3 py-2.5 bg-red-100 text-red-900 border border-red-300 rounded-xl text-[13px] font-bold cursor-pointer text-center font-[inherit] hover:bg-red-300 hover:text-white transition-all"
    >
      🚪 Sign Out
    </button>
  );

  return (
    <aside className="hidden xl:block w-[252px] bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto shrink-0">

      {user && (
        <div className="px-4 py-4 bg-gradient-to-br from-orange-50 to-orange-50/30 border-b border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D85A30] to-[#FF8C5A] flex items-center justify-center text-white font-black text-base overflow-hidden shrink-0 shadow-md shadow-orange-500/20">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                user.firstName?.[0]?.toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-extrabold text-gray-900 m-0 truncate">
                {user.firstName} {user.lastName}
              </p>
              {isCustomer && (
                <span className="inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide mt-0.5 bg-blue-100 text-blue-800">
                  {role}
                </span>
              )}
              {(isVendor || isAdmin) && (
                <p className="text-[11px] text-gray-500 m-0 mt-0.5 truncate">{user.email}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="py-4">

        {isCustomer && (
          <>
            <SbTitle>My Account</SbTitle>
            <SbItem onClick={() => go("/dashboard")} active={isPathActive("/dashboard")}>
              <SbIcon active={isPathActive("/dashboard")}>📊</SbIcon><SbName>Dashboard</SbName>
            </SbItem>
            <SbItem onClick={() => go("/orders")} active={isPathActive("/orders")}>
              <SbIcon active={isPathActive("/orders")}>📦</SbIcon><SbName>My Orders</SbName>
            </SbItem>
            <SbItem onClick={() => go("/cart")} active={isPathActive("/cart")}>
              <SbIcon active={isPathActive("/cart")}>🛒</SbIcon>
              <SbName>My Cart</SbName>
              {cartCount > 0 && (
                <span className="bg-[#D85A30] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full min-w-[18px] text-center">
                  {cartCount}
                </span>
              )}
            </SbItem>
            <SbItem onClick={() => go("/wishlist")} active={isPathActive("/wishlist")}>
              <SbIcon active={isPathActive("/wishlist")}>❤️</SbIcon><SbName>Wishlist</SbName>
            </SbItem>
            <SbItem onClick={() => go("/profile")} active={isPathActive("/profile")}>
              <SbIcon active={isPathActive("/profile")}>👤</SbIcon><SbName>My Profile</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Shop by Department</SbTitle>
            <CategoryList />
            <ProgramsSection />

            <SbSep />
            <SbTitle>Help & Support</SbTitle>
            <SbItem onClick={() => go("/help")} active={isPathActive("/help")}>
              <SbIcon active={isPathActive("/help")}>💬</SbIcon><SbName>Help Center</SbName>
            </SbItem>
            <SbItem onClick={() => go("/contact")} active={isPathActive("/contact")}>
              <SbIcon active={isPathActive("/contact")}>📬</SbIcon><SbName>Contact Us</SbName>
            </SbItem>
            <SbItem onClick={() => go("/policy/returns")}>
              <SbIcon>🔄</SbIcon><SbName>Returns Policy</SbName>
            </SbItem>
            <SbItem onClick={() => go("/policy/shipping-info")}>
              <SbIcon>🚚</SbIcon><SbName>Shipping Info</SbName>
            </SbItem>
            <LogoutBtn />
          </>
        )}

        {isVendor && (
          <>
            <SbTitle>Vendor Panel</SbTitle>
            <SbItem onClick={() => go("/vendor/dashboard")} active={isPathActive("/vendor/dashboard") && !params.get("tab")}>
              <SbIcon active={isPathActive("/vendor/dashboard") && !params.get("tab")}>📊</SbIcon><SbName>Dashboard</SbName>
            </SbItem>
            <SbItem onClick={() => go("/vendor/dashboard?tab=products")} active={params.get("tab") === "products"}>
              <SbIcon active={params.get("tab") === "products"}>📦</SbIcon><SbName>My Products</SbName>
            </SbItem>
            <SbItem onClick={() => go("/vendor/dashboard?tab=orders")} active={params.get("tab") === "orders"}>
              <SbIcon active={params.get("tab") === "orders"}>🛒</SbIcon><SbName>Orders</SbName>
            </SbItem>
            <SbItem onClick={() => go("/vendor/dashboard?tab=reviews")} active={params.get("tab") === "reviews"}>
              <SbIcon active={params.get("tab") === "reviews"}>⭐</SbIcon><SbName>Reviews</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Quick Actions</SbTitle>
            <SbItem onClick={() => go("/vendor/dashboard?tab=products&action=add")}>
              <SbIcon>➕</SbIcon><SbName>Add Product</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products")}>
              <SbIcon>🛍️</SbIcon><SbName>View Store</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Insights</SbTitle>
            <SbItem disabled>
              <SbIcon>📈</SbIcon><SbName>Sales Reports</SbName><SoonBadge />
            </SbItem>
            <SbItem disabled>
              <SbIcon>💰</SbIcon><SbName>Earnings</SbName><SoonBadge />
            </SbItem>

            <SbSep />
            <SbTitle>Resources</SbTitle>
            <SbItem onClick={() => go("/policy/seller-guidelines")}>
              <SbIcon>📋</SbIcon><SbName>Seller Guidelines</SbName>
            </SbItem>
            <SbItem onClick={() => go("/policy/commission-policy")}>
              <SbIcon>💵</SbIcon><SbName>Commission Policy</SbName>
            </SbItem>
            <SbItem onClick={() => go("/policy/vendor-agreement")}>
              <SbIcon>📝</SbIcon><SbName>Vendor Agreement</SbName>
            </SbItem>
            <SbItem onClick={() => go("/help")}>
              <SbIcon>💬</SbIcon><SbName>Support</SbName>
            </SbItem>
            <LogoutBtn />
          </>
        )}

        {isAdmin && (
          <>
            <SbTitle>Admin Panel</SbTitle>
            <SbItem onClick={() => go("/admin/dashboard")} active={isPathActive("/admin/dashboard") && !params.get("tab")}>
              <SbIcon active={isPathActive("/admin/dashboard") && !params.get("tab")}>📊</SbIcon><SbName>Dashboard</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Management</SbTitle>
            <SbItem onClick={() => go("/admin/dashboard?tab=vendors")} active={params.get("tab") === "vendors"}>
              <SbIcon active={params.get("tab") === "vendors"}>🏪</SbIcon><SbName>Vendors</SbName>
            </SbItem>
            <SbItem onClick={() => go("/admin/dashboard?tab=categories")} active={params.get("tab") === "categories"}>
              <SbIcon active={params.get("tab") === "categories"}>📂</SbIcon><SbName>Categories</SbName>
            </SbItem>
            <SbItem onClick={() => go("/admin/dashboard?tab=products")} active={params.get("tab") === "products"}>
              <SbIcon active={params.get("tab") === "products"}>📦</SbIcon><SbName>Products</SbName>
            </SbItem>
            <SbItem onClick={() => go("/admin/dashboard?tab=orders")} active={params.get("tab") === "orders"}>
              <SbIcon active={params.get("tab") === "orders"}>🛒</SbIcon><SbName>Orders</SbName>
            </SbItem>
            <SbItem onClick={() => go("/admin/dashboard?tab=reviews")} active={params.get("tab") === "reviews"}>
              <SbIcon active={params.get("tab") === "reviews"}>⭐</SbIcon><SbName>Reviews</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Coming Soon</SbTitle>
            <SbItem disabled><SbIcon>👥</SbIcon><SbName>Users</SbName><SoonBadge /></SbItem>
            <SbItem disabled><SbIcon>📈</SbIcon><SbName>Analytics</SbName><SoonBadge /></SbItem>
            <SbItem disabled><SbIcon>💳</SbIcon><SbName>Payments</SbName><SoonBadge /></SbItem>
            <SbItem disabled><SbIcon>🎟️</SbIcon><SbName>Coupons</SbName><SoonBadge /></SbItem>

            <SbSep />
            <SbTitle>Quick Links</SbTitle>
            <SbItem onClick={() => go("/")}>
              <SbIcon>🏠</SbIcon><SbName>View Storefront</SbName>
            </SbItem>
            <SbItem onClick={() => go("/products")}>
              <SbIcon>🛍️</SbIcon><SbName>All Products</SbName>
            </SbItem>
            <LogoutBtn />
          </>
        )}

        {!user && (
          <>
            <SbTitle>Shop by Department</SbTitle>
            <CategoryList />
            <ProgramsSection />

            <SbSep />
            <SbTitle>Get Started</SbTitle>
            <SbItem
              onClick={() => go("/login")}
              className="bg-gradient-to-r from-orange-50 to-transparent text-[#D85A30] font-extrabold"
            >
              <SbIcon>🔑</SbIcon><SbName>Sign In</SbName>
            </SbItem>
            <SbItem onClick={() => go("/signup")}>
              <SbIcon>✨</SbIcon><SbName>Create Account</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Sell with Us</SbTitle>
            <SbItem onClick={() => go("/vendor/signup")}>
              <SbIcon>🏪</SbIcon><SbName>Become a Seller</SbName>
            </SbItem>
            <SbItem onClick={() => go("/vendor/login")}>
              <SbIcon>🔓</SbIcon><SbName>Seller Login</SbName>
            </SbItem>

            <SbSep />
            <SbTitle>Help & Settings</SbTitle>
            <SbItem onClick={() => go("/help")}>
              <SbIcon>💬</SbIcon><SbName>Customer Service</SbName>
            </SbItem>
            <SbItem onClick={() => go("/contact")}>
              <SbIcon>📬</SbIcon><SbName>Contact Us</SbName>
            </SbItem>
            <SbItem onClick={() => go("/about")}>
              <SbIcon>ℹ️</SbIcon><SbName>About</SbName>
            </SbItem>
          </>
        )}
      </div>
    </aside>
  );
};

export default CategorySidebar;
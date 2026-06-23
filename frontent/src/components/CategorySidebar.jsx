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

  return (
    <aside className="sb-root">
      <style>{`
        .sb-root {
          width: 252px;
          background: white;
          border-right: 1px solid #E5E7EB;
          height: calc(100vh - 64px);
          position: sticky;
          top: 64px;
          overflow-y: auto;
          flex-shrink: 0;
        }
        @media (max-width: 1024px) {
          .sb-root { display: none !important; }
        }
        .sb-pad { padding: 16px 0; }
        .sb-title {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6B7280;
          padding: 12px 16px 8px;
        }
        .sb-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 13px;
          color: #111;
          transition: all 0.12s;
          font-family: inherit;
        }
        .sb-item:hover {
          background: linear-gradient(90deg, #FFF5F0, transparent);
          color: #D85A30;
        }
        .sb-item.active {
          background: linear-gradient(90deg, #FFF5F0, transparent);
          color: #D85A30;
          font-weight: 900;
          border-left: 4px solid #D85A30;
          padding-left: 12px;
        }
        .sb-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          flex-shrink: 0;
          font-size: 14px;
        }
        .sb-item.active .sb-icon {
          background: #FFF5F0;
          border-color: #FDBA74;
        }
        .sb-name { flex: 1; font-weight: 700; color: inherit; }
        .sb-badge {
          background: #D85A30;
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 99px;
          min-width: 18px;
          text-align: center;
        }
        .sb-chevron {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          color: #9CA3AF;
          transition: all 0.12s;
          flex-shrink: 0;
        }
        .sb-chevron:hover { background: #F9FAFB; border-color: #E5E7EB; }
        .sb-subwrap { background: #FAFAFA; padding: 6px 0; border-top: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6; }
        .sb-sub-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 16px 8px 46px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 12.5px;
          color: #4B5563;
          transition: all 0.12s;
          font-family: inherit;
        }
        .sb-sub-item:hover { background: #FFF5F0; color: #D85A30; }
        .sb-sub-item.active { color: #D85A30; font-weight: 900; }
        .sb-dot { width: 6px; height: 6px; border-radius: 50%; background: #D85A30; flex-shrink: 0; }
        .sb-sep { border-top: 6px solid #F3F4F6; margin-top: 14px; }
        .sb-user-card {
          padding: 16px;
          background: linear-gradient(135deg, #FFF5F0, #FFFBF9);
          border-bottom: 1px solid #FDBA74;
        }
        .sb-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D85A30, #FF8C5A);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 16px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(216,90,48,0.25);
        }
        .sb-role-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }
        .role-customer { background: #DBEAFE; color: #1E40AF; }
        .role-vendor { background: #EDE9FE; color: #5B21B6; }
        .role-admin { background: #FEE2E2; color: #7F1D1D; }
        .sb-logout-btn {
          width: 100%;
          padding: 10px 16px;
          background: #FEE2E2;
          color: #7F1D1D;
          border: 1px solid #FCA5A5;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          text-align: center;
          font-family: inherit;
          margin: 12px 16px 0;
          width: calc(100% - 32px);
          transition: all 0.15s;
        }
        .sb-logout-btn:hover { background: #FCA5A5; color: white; }
      `}</style>

{user && (
  <div className="sb-user-card">
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div className="sb-user-avatar">
        {user.avatar ? (
          <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          user.firstName?.[0]?.toUpperCase()
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.firstName} {user.lastName}
        </p>
        {isCustomer && (
          <span className={`sb-role-badge role-${role}`}>
            {role}
          </span>
        )}
        {isVendor && (
          <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </p>
        )}
        {isAdmin && (
          <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </p>
        )}
      </div>
    </div>
  </div>
)}

      {role === "customer" && (
        <div className="sb-pad">
          <p className="sb-title">My Account</p>
          <button onClick={() => go("/dashboard")} className={`sb-item ${isPathActive("/dashboard") ? "active" : ""}`}>
            <span className="sb-icon">📊</span>
            <span className="sb-name">Dashboard</span>
          </button>
          <button onClick={() => go("/orders")} className={`sb-item ${isPathActive("/orders") ? "active" : ""}`}>
            <span className="sb-icon">📦</span>
            <span className="sb-name">My Orders</span>
          </button>
          <button onClick={() => go("/cart")} className={`sb-item ${isPathActive("/cart") ? "active" : ""}`}>
            <span className="sb-icon">🛒</span>
            <span className="sb-name">My Cart</span>
            {cartCount > 0 && <span className="sb-badge">{cartCount}</span>}
          </button>
          <button onClick={() => go("/wishlist")} className={`sb-item ${isPathActive("/wishlist") ? "active" : ""}`}>
            <span className="sb-icon">❤️</span>
            <span className="sb-name">Wishlist</span>
          </button>
          <button onClick={() => go("/profile")} className={`sb-item ${isPathActive("/profile") ? "active" : ""}`}>
            <span className="sb-icon">👤</span>
            <span className="sb-name">My Profile</span>
          </button>

          <div className="sb-sep"></div>

          <p className="sb-title">Shop by Department</p>
          <button
            onClick={() => go("/products")}
            className={`sb-item ${isPathActive("/products") && !activeCategory ? "active" : ""}`}
          >
            <span className="sb-icon">🛍️</span>
            <span className="sb-name">All Products</span>
          </button>

          {categories.map((cat) => {
            const icon = categoryIcons[cat.name.toLowerCase()] || "📦";
            const hasChildren = cat.children?.length > 0;
            const isExpanded = expandedCat === cat._id;

            return (
              <div key={cat._id}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button
                    onClick={() => go(`/products?category=${cat._id}`)}
                    className={`sb-item ${isActive(cat._id) ? "active" : ""}`}
                    style={{ flex: 1 }}
                  >
                    <span className="sb-icon">{icon}</span>
                    <span className="sb-name">{cat.name}</span>
                  </button>
                  {hasChildren && (
                    <button onClick={() => toggleExpand(cat._id)} className="sb-chevron">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {hasChildren && isExpanded && (
                  <div className="sb-subwrap">
                    {cat.children.map((sub) => (
                      <button
                        key={sub._id}
                        onClick={() => go(`/products?category=${sub._id}`)}
                        className={`sb-sub-item ${isActive(sub._id) ? "active" : ""}`}
                      >
                        <span className="sb-dot"></span>
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="sb-sep"></div>

          <p className="sb-title">Programs & Features</p>
          <button onClick={() => go("/products?sort=newest")} className="sb-item">
            <span className="sb-icon">✨</span>
            <span className="sb-name">New Arrivals</span>
          </button>
          <button onClick={() => go("/products?sort=popular")} className="sb-item">
            <span className="sb-icon">🔥</span>
            <span className="sb-name">Best Sellers</span>
          </button>
          <button onClick={() => go("/products?sort=rating")} className="sb-item">
            <span className="sb-icon">⭐</span>
            <span className="sb-name">Top Rated</span>
          </button>

          <div className="sb-sep"></div>

          <p className="sb-title">Help & Support</p>
          <button onClick={() => go("/help")} className={`sb-item ${isPathActive("/help") ? "active" : ""}`}>
            <span className="sb-icon">💬</span>
            <span className="sb-name">Help Center</span>
          </button>
          <button onClick={() => go("/contact")} className={`sb-item ${isPathActive("/contact") ? "active" : ""}`}>
            <span className="sb-icon">📬</span>
            <span className="sb-name">Contact Us</span>
          </button>
          <button onClick={() => go("/policy/returns")} className="sb-item">
            <span className="sb-icon">🔄</span>
            <span className="sb-name">Returns Policy</span>
          </button>
          <button onClick={() => go("/policy/shipping-info")} className="sb-item">
            <span className="sb-icon">🚚</span>
            <span className="sb-name">Shipping Info</span>
          </button>

          <button onClick={handleLogout} className="sb-logout-btn">
            🚪 Sign Out
          </button>
        </div>
      )}

{role === "vendor" && (
  <div className="sb-pad">
    <p className="sb-title">Vendor Panel</p>
    <button onClick={() => go("/vendor/dashboard")} className={`sb-item ${isPathActive("/vendor/dashboard") && !params.get("tab") ? "active" : ""}`}>
      <span className="sb-icon">📊</span>
      <span className="sb-name">Dashboard</span>
    </button>
    <button onClick={() => go("/vendor/dashboard?tab=products")} className={`sb-item ${params.get("tab") === "products" ? "active" : ""}`}>
      <span className="sb-icon">📦</span>
      <span className="sb-name">My Products</span>
    </button>
    <button onClick={() => go("/vendor/dashboard?tab=orders")} className={`sb-item ${params.get("tab") === "orders" ? "active" : ""}`}>
      <span className="sb-icon">🛒</span>
      <span className="sb-name">Orders</span>
    </button>
    <button onClick={() => go("/vendor/dashboard?tab=reviews")} className={`sb-item ${params.get("tab") === "reviews" ? "active" : ""}`}>
      <span className="sb-icon">⭐</span>
      <span className="sb-name">Reviews</span>
    </button>

    <div className="sb-sep"></div>

    <p className="sb-title">Quick Actions</p>
    <button onClick={() => go("/vendor/dashboard?tab=products&action=add")} className="sb-item">
      <span className="sb-icon">➕</span>
      <span className="sb-name">Add Product</span>
    </button>
    <button onClick={() => go("/products")} className="sb-item">
      <span className="sb-icon">🛍️</span>
      <span className="sb-name">View Store</span>
    </button>

    <div className="sb-sep"></div>

    <p className="sb-title">Insights</p>
    <button className="sb-item" style={{ opacity: 0.5, cursor: "not-allowed" }}>
      <span className="sb-icon">📈</span>
      <span className="sb-name">Sales Reports</span>
      <span style={{ fontSize: 9, background: "#FEF9C3", color: "#854D0E", padding: "2px 6px", borderRadius: 99, fontWeight: 800 }}>Soon</span>
    </button>
    <button className="sb-item" style={{ opacity: 0.5, cursor: "not-allowed" }}>
      <span className="sb-icon">💰</span>
      <span className="sb-name">Earnings</span>
      <span style={{ fontSize: 9, background: "#FEF9C3", color: "#854D0E", padding: "2px 6px", borderRadius: 99, fontWeight: 800 }}>Soon</span>
    </button>

    <div className="sb-sep"></div>

    <p className="sb-title">Resources</p>
    <button onClick={() => go("/policy/seller-guidelines")} className="sb-item">
      <span className="sb-icon">📋</span>
      <span className="sb-name">Seller Guidelines</span>
    </button>
    <button onClick={() => go("/policy/commission-policy")} className="sb-item">
      <span className="sb-icon">💵</span>
      <span className="sb-name">Commission Policy</span>
    </button>
    <button onClick={() => go("/policy/vendor-agreement")} className="sb-item">
      <span className="sb-icon">📝</span>
      <span className="sb-name">Vendor Agreement</span>
    </button>
    <button onClick={() => go("/help")} className="sb-item">
      <span className="sb-icon">💬</span>
      <span className="sb-name">Support</span>
    </button>

    <button onClick={handleLogout} className="sb-logout-btn">
      🚪 Sign Out
    </button>
  </div>
)}

{role === "admin" && (
  <div className="sb-pad">
    <p className="sb-title">Admin Panel</p>
    <button onClick={() => go("/admin/dashboard")} className={`sb-item ${isPathActive("/admin/dashboard") && !params.get("tab") ? "active" : ""}`}>
      <span className="sb-icon">📊</span>
      <span className="sb-name">Dashboard</span>
    </button>

    <div className="sb-sep"></div>

    <p className="sb-title">Management</p>
    <button onClick={() => go("/admin/dashboard?tab=vendors")} className={`sb-item ${params.get("tab") === "vendors" ? "active" : ""}`}>
      <span className="sb-icon">🏪</span>
      <span className="sb-name">Vendors</span>
    </button>
    <button onClick={() => go("/admin/dashboard?tab=categories")} className={`sb-item ${params.get("tab") === "categories" ? "active" : ""}`}>
      <span className="sb-icon">📂</span>
      <span className="sb-name">Categories</span>
    </button>
    <button onClick={() => go("/admin/dashboard?tab=products")} className={`sb-item ${params.get("tab") === "products" ? "active" : ""}`}>
      <span className="sb-icon">📦</span>
      <span className="sb-name">Products</span>
    </button>
    <button onClick={() => go("/admin/dashboard?tab=orders")} className={`sb-item ${params.get("tab") === "orders" ? "active" : ""}`}>
      <span className="sb-icon">🛒</span>
      <span className="sb-name">Orders</span>
    </button>
    <button onClick={() => go("/admin/dashboard?tab=reviews")} className={`sb-item ${params.get("tab") === "reviews" ? "active" : ""}`}>
      <span className="sb-icon">⭐</span>
      <span className="sb-name">Reviews</span>
    </button>

    <div className="sb-sep"></div>

    <p className="sb-title">Coming Soon</p>
    <button className="sb-item" style={{ opacity: 0.5, cursor: "not-allowed" }}>
      <span className="sb-icon">👥</span>
      <span className="sb-name">Users</span>
      <span style={{ fontSize: 9, background: "#FEF9C3", color: "#854D0E", padding: "2px 6px", borderRadius: 99, fontWeight: 800 }}>Soon</span>
    </button>
    <button className="sb-item" style={{ opacity: 0.5, cursor: "not-allowed" }}>
      <span className="sb-icon">📈</span>
      <span className="sb-name">Analytics</span>
      <span style={{ fontSize: 9, background: "#FEF9C3", color: "#854D0E", padding: "2px 6px", borderRadius: 99, fontWeight: 800 }}>Soon</span>
    </button>
    <button className="sb-item" style={{ opacity: 0.5, cursor: "not-allowed" }}>
      <span className="sb-icon">💳</span>
      <span className="sb-name">Payments</span>
      <span style={{ fontSize: 9, background: "#FEF9C3", color: "#854D0E", padding: "2px 6px", borderRadius: 99, fontWeight: 800 }}>Soon</span>
    </button>
    <button className="sb-item" style={{ opacity: 0.5, cursor: "not-allowed" }}>
      <span className="sb-icon">🎟️</span>
      <span className="sb-name">Coupons</span>
      <span style={{ fontSize: 9, background: "#FEF9C3", color: "#854D0E", padding: "2px 6px", borderRadius: 99, fontWeight: 800 }}>Soon</span>
    </button>

    <div className="sb-sep"></div>

    <p className="sb-title">Quick Links</p>
    <button onClick={() => go("/")} className="sb-item">
      <span className="sb-icon">🏠</span>
      <span className="sb-name">View Storefront</span>
    </button>
    <button onClick={() => go("/products")} className="sb-item">
      <span className="sb-icon">🛍️</span>
      <span className="sb-name">All Products</span>
    </button>

    <button onClick={handleLogout} className="sb-logout-btn">
      🚪 Sign Out
    </button>
  </div>
)}

      {!user && (
        <div className="sb-pad">
          <p className="sb-title">Shop by Department</p>
          <button
            onClick={() => go("/products")}
            className={`sb-item ${isPathActive("/products") && !activeCategory ? "active" : ""}`}
          >
            <span className="sb-icon">🛍️</span>
            <span className="sb-name">All Products</span>
          </button>

          {categories.map((cat) => {
            const icon = categoryIcons[cat.name.toLowerCase()] || "📦";
            const hasChildren = cat.children?.length > 0;
            const isExpanded = expandedCat === cat._id;

            return (
              <div key={cat._id}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button
                    onClick={() => go(`/products?category=${cat._id}`)}
                    className={`sb-item ${isActive(cat._id) ? "active" : ""}`}
                    style={{ flex: 1 }}
                  >
                    <span className="sb-icon">{icon}</span>
                    <span className="sb-name">{cat.name}</span>
                  </button>
                  {hasChildren && (
                    <button onClick={() => toggleExpand(cat._id)} className="sb-chevron">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {hasChildren && isExpanded && (
                  <div className="sb-subwrap">
                    {cat.children.map((sub) => (
                      <button
                        key={sub._id}
                        onClick={() => go(`/products?category=${sub._id}`)}
                        className={`sb-sub-item ${isActive(sub._id) ? "active" : ""}`}
                      >
                        <span className="sb-dot"></span>
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="sb-sep"></div>

          <p className="sb-title">Programs & Features</p>
          <button onClick={() => go("/products?sort=newest")} className="sb-item">
            <span className="sb-icon">✨</span>
            <span className="sb-name">New Arrivals</span>
          </button>
          <button onClick={() => go("/products?sort=popular")} className="sb-item">
            <span className="sb-icon">🔥</span>
            <span className="sb-name">Best Sellers</span>
          </button>
          <button onClick={() => go("/products?sort=rating")} className="sb-item">
            <span className="sb-icon">⭐</span>
            <span className="sb-name">Top Rated</span>
          </button>

          <div className="sb-sep"></div>

          <p className="sb-title">Get Started</p>
          <button
            onClick={() => go("/login")}
            className="sb-item"
            style={{ background: "linear-gradient(135deg, #FFF5F0, #FFFBF9)", color: "#D85A30", fontWeight: 800 }}
          >
            <span className="sb-icon">🔑</span>
            <span className="sb-name">Sign In</span>
          </button>
          <button onClick={() => go("/signup")} className="sb-item">
            <span className="sb-icon">✨</span>
            <span className="sb-name">Create Account</span>
          </button>

          <div className="sb-sep"></div>

          <p className="sb-title">Sell with Us</p>
          <button onClick={() => go("/vendor/signup")} className="sb-item">
            <span className="sb-icon">🏪</span>
            <span className="sb-name">Become a Seller</span>
          </button>
          <button onClick={() => go("/vendor/login")} className="sb-item">
            <span className="sb-icon">🔓</span>
            <span className="sb-name">Seller Login</span>
          </button>

          <div className="sb-sep"></div>

          <p className="sb-title">Help & Settings</p>
          <button onClick={() => go("/help")} className="sb-item">
            <span className="sb-icon">💬</span>
            <span className="sb-name">Customer Service</span>
          </button>
          <button onClick={() => go("/contact")} className="sb-item">
            <span className="sb-icon">📬</span>
            <span className="sb-name">Contact Us</span>
          </button>
          <button onClick={() => go("/about")} className="sb-item">
            <span className="sb-icon">ℹ️</span>
            <span className="sb-name">About</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default CategorySidebar;
import { useNavigate, useLocation } from "react-router-dom";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useState } from "react";

const CategorySidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: categoryData } = useGetCategoryTreeQuery();
  const [expandedCat, setExpandedCat] = useState(null);

  const categories = categoryData?.data || [];

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

  const isActive = (catId) => {
    const params = new URLSearchParams(location.search);
    return params.get("category") === catId;
  };

  const toggleExpand = (catId) => {
    setExpandedCat(expandedCat === catId ? null : catId);
  };

  return (
    <aside style={{
      width: 240,
      background: "white",
      borderRight: "1px solid #EEE",
      height: "calc(100vh - 60px)",
      position: "sticky",
      top: 60,
      overflowY: "auto",
      flexShrink: 0,
    }} className="sidebar-desktop">
      <style>{`
        @media (max-width: 1024px) {
          .sidebar-desktop { display: none !important; }
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
          color: #333;
          transition: all 0.12s;
        }
        .sb-item:hover {
          background: linear-gradient(90deg, #FFF5F0, transparent);
          color: #D85A30;
        }
        .sb-item.active {
          background: linear-gradient(90deg, #FFF5F0, transparent);
          color: #D85A30;
          font-weight: 700;
          border-left: 3px solid #D85A30;
          padding-left: 13px;
        }
        .sb-sub-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 16px 8px 44px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          font-size: 12.5px;
          color: #555;
          transition: all 0.12s;
        }
        .sb-sub-item:hover {
          background: #FFF5F0;
          color: #D85A30;
        }
        .sb-sub-item.active {
          color: #D85A30;
          font-weight: 700;
        }
        .sb-section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #888;
          padding: 14px 16px 6px;
        }
      `}</style>

      <div style={{ padding: "16px 0" }}>
        <p className="sb-section-title">Shop by Department</p>

        <button
          onClick={() => navigate("/products")}
          className={`sb-item ${location.pathname === "/products" && !location.search ? "active" : ""}`}
        >
          <span style={{ fontSize: 16 }}>🛍️</span>
          <span style={{ flex: 1, fontWeight: 600 }}>All Products</span>
        </button>

        {categories.map((cat) => {
          const icon = categoryIcons[cat.name.toLowerCase()] || "📦";
          const hasChildren = cat.children?.length > 0;
          const isExpanded = expandedCat === cat._id;

          return (
            <div key={cat._id}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleExpand(cat._id);
                  }
                  navigate(`/products?category=${cat._id}`);
                }}
                className={`sb-item ${isActive(cat._id) ? "active" : ""}`}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ flex: 1 }}>{cat.name}</span>
                {hasChildren && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {hasChildren && isExpanded && (
                <div style={{ background: "#FAFAFA", padding: "4px 0" }}>
                  {cat.children.map((sub) => (
                    <button
                      key={sub._id}
                      onClick={() => navigate(`/products?category=${sub._id}`)}
                      className={`sb-sub-item ${isActive(sub._id) ? "active" : ""}`}
                    >
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#D85A30" }}></span>
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: "6px solid #F3F3F3", padding: "16px 0" }}>
        <p className="sb-section-title">Programs & Features</p>

        <button onClick={() => navigate("/products?sort=newest")} className="sb-item">
          <span style={{ fontSize: 16 }}>✨</span>
          <span style={{ flex: 1 }}>New Arrivals</span>
        </button>
        <button onClick={() => navigate("/products?sort=popular")} className="sb-item">
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{ flex: 1 }}>Best Sellers</span>
        </button>
        <button onClick={() => navigate("/products?sort=rating")} className="sb-item">
          <span style={{ fontSize: 16 }}>⭐</span>
          <span style={{ flex: 1 }}>Top Rated</span>
        </button>
      </div>

      <div style={{ borderTop: "6px solid #F3F3F3", padding: "16px 0" }}>
        <p className="sb-section-title">Sell with Us</p>
        <button onClick={() => navigate("/vendor/signup")} className="sb-item">
          <span style={{ fontSize: 16 }}>🏪</span>
          <span style={{ flex: 1 }}>Become a Seller</span>
        </button>
        <button onClick={() => navigate("/vendor/login")} className="sb-item">
          <span style={{ fontSize: 16 }}>🔑</span>
          <span style={{ flex: 1 }}>Seller Login</span>
        </button>
      </div>

      <div style={{ borderTop: "6px solid #F3F3F3", padding: "16px 0" }}>
        <p className="sb-section-title">Help & Settings</p>
        <button onClick={() => navigate("/help")} className="sb-item">
          <span style={{ fontSize: 16 }}>💬</span>
          <span style={{ flex: 1 }}>Customer Service</span>
        </button>
        <button onClick={() => navigate("/contact")} className="sb-item">
          <span style={{ fontSize: 16 }}>📬</span>
          <span style={{ flex: 1 }}>Contact Us</span>
        </button>
        <button onClick={() => navigate("/about")} className="sb-item">
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <span style={{ flex: 1 }}>About</span>
        </button>
      </div>
    </aside>
  );
};

export default CategorySidebar;
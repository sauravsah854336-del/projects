import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetAllProductsQuery } from "../features/product/productApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
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

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");

  const isCustomer = user?.role === "customer";
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";

  const { data: productsData } = useGetAllProductsQuery({ limit: 4, sort: "popular" });
  const { data: categoryData } = useGetCategoryTreeQuery();

  const products = productsData?.data || [];
  const categories = (categoryData?.data || []).slice(0, 8);

  const getDashboard = () => {
    if (isAdmin) return "/admin/dashboard";
    if (isVendor) return "/vendor/dashboard";
    if (isCustomer) return "/dashboard";
    return "/";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div style={{ background: "#F3F4F6", minHeight: "calc(100vh - 64px)" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes drift {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(15px) translateY(-10px); }
          50% { transform: translateX(0) translateY(-20px); }
          75% { transform: translateX(-15px) translateY(-10px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        .nf-section { animation: fadeUp 0.6s ease both; }
        .nf-box-anim { animation: wiggle 3s ease-in-out infinite; }
        .nf-eye { animation: blink 3s ease-in-out infinite; }
        .nf-cloud { animation: drift 8s ease-in-out infinite; }
        .nf-orbit { animation: spin-slow 20s linear infinite; }

        .nf-product-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
          display: block;
        }
        .nf-product-card:hover {
          border-color: #D85A30;
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(216,90,48,0.15);
        }
        .nf-cat-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 14px 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          color: inherit;
        }
        .nf-cat-card:hover {
          border-color: #D85A30;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(216,90,48,0.12);
        }
      `}</style>

      <section style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)",
        padding: "40px 20px 60px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div className="nf-cloud" style={{ position: "absolute", top: "20%", left: "10%", width: 120, height: 120, background: "rgba(216,90,48,0.15)", borderRadius: "50%", filter: "blur(40px)" }}></div>
        <div className="nf-cloud" style={{ position: "absolute", bottom: "10%", right: "10%", width: 180, height: 180, background: "rgba(124,58,237,0.15)", borderRadius: "50%", filter: "blur(50px)", animationDelay: "2s" }}></div>
        <div className="nf-cloud" style={{ position: "absolute", top: "50%", right: "30%", width: 100, height: 100, background: "rgba(99,102,241,0.1)", borderRadius: "50%", filter: "blur(40px)", animationDelay: "4s" }}></div>

        <div className="nf-section" style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", position: "relative", zIndex: 1 }}>

          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 99,
              padding: "5px 14px",
              marginBottom: 16,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block" }}></span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#FCA5A5", letterSpacing: "0.06em" }}>ERROR 404</span>
            </div>

            <h1 style={{
              fontSize: 48,
              fontWeight: 900,
              color: "white",
              margin: "0 0 14px",
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}>
              Lost in the<br />
              <span style={{
                background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                marketplace?
              </span>
            </h1>

            <p style={{ fontSize: 15, color: "#94A3B8", lineHeight: 1.7, margin: "0 0 28px", maxWidth: 380 }}>
              We searched everywhere but couldn't find this page. It might have been moved, deleted, or never existed.
            </p>

            <form
              onSubmit={handleSearch}
              style={{
                background: "white",
                borderRadius: 14,
                padding: "5px",
                display: "flex",
                gap: 4,
                marginBottom: 20,
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", padding: "0 14px" }}>
                <svg width="18" height="18" fill="none" stroke="#9CA3AF" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: "#111",
                  padding: "11px 0",
                  background: "transparent",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "linear-gradient(180deg, #FFD814, #F7CA00)",
                  color: "#111",
                  border: "1px solid #FCD200",
                  borderRadius: 10,
                  padding: "10px 22px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Search
              </button>
            </form>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  padding: "11px 22px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "inherit",
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <Link
                to={getDashboard()}
                style={{
                  background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: 10,
                  padding: "11px 24px",
                  fontSize: 13,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 8px 20px rgba(216,90,48,0.4)",
                }}
              >
                🏠 {user ? "My Dashboard" : "Home"}
              </Link>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>

            <div className="nf-orbit" style={{ position: "absolute", width: 280, height: 280, border: "2px dashed rgba(255,255,255,0.1)", borderRadius: "50%" }}>
              <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", fontSize: 22 }}>🛒</div>
              <div style={{ position: "absolute", top: "50%", right: -8, transform: "translateY(-50%)", fontSize: 22 }}>📦</div>
              <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", fontSize: 22 }}>⭐</div>
              <div style={{ position: "absolute", top: "50%", left: -8, transform: "translateY(-50%)", fontSize: 22 }}>🎁</div>
            </div>

            <div className="nf-box-anim" style={{
              position: "relative",
              width: 200,
              height: 200,
              background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
              borderRadius: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 60px rgba(216,90,48,0.5)",
              border: "4px solid rgba(255,255,255,0.1)",
            }}>
              <div style={{ display: "flex", gap: 18, marginBottom: 12 }}>
                <div className="nf-eye" style={{ width: 28, height: 28, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 12, height: 12, background: "#111", borderRadius: "50%" }}></div>
                </div>
                <div className="nf-eye" style={{ width: 28, height: 28, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", animationDelay: "0.5s" }}>
                  <div style={{ width: 12, height: 12, background: "#111", borderRadius: "50%" }}></div>
                </div>
              </div>
              <div style={{
                width: 60,
                height: 12,
                background: "rgba(255,255,255,0.4)",
                borderRadius: 99,
                marginTop: 8,
              }}></div>
              <p style={{ fontSize: 80, fontWeight: 900, color: "white", margin: "16px 0 0", lineHeight: 1, textShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                404
              </p>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section style={{ background: "white", padding: "32px 20px", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111", margin: 0 }}>
                  💡 Maybe you were looking for these?
                </h2>
                <p style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 0" }}>
                  Browse our popular categories
                </p>
              </div>
              <Link
                to="/products"
                style={{
                  color: "#0066C0",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  padding: "6px 14px",
                  border: "1px solid #0066C0",
                  borderRadius: 8,
                }}
              >
                View All →
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
              {categories.map((cat) => (
                <Link key={cat._id} to={`/products?category=${cat._id}`} className="nf-cat-card">
                  <div style={{
                    width: 44,
                    height: 44,
                    background: "linear-gradient(135deg, #FFF5F0, #FFE8DF)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                    fontSize: 22,
                  }}>
                    {categoryIcons[cat.name.toLowerCase()] || "📦"}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#111", margin: 0 }}>{cat.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section style={{ padding: "32px 20px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111", margin: 0 }}>
                  🔥 Trending right now
                </h2>
                <p style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 0" }}>
                  Don't miss these popular products
                </p>
              </div>
              <Link
                to="/products?sort=popular"
                style={{
                  color: "#0066C0",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  padding: "6px 14px",
                  border: "1px solid #0066C0",
                  borderRadius: 8,
                }}
              >
                See All →
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {products.map((product) => (
                <Link key={product._id} to={`/products/${product.slug}`} className="nf-product-card">
                  <div style={{ position: "relative", paddingTop: "70%", background: "#F9FAFB", overflow: "hidden" }}>
                    <img
                      src={product.images?.[0]?.url || PLACEHOLDER_MEDIUM}
                      alt={product.name}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }}
                    />
                    {product.comparePrice > product.price && (
                      <span style={{
                        position: "absolute", top: 8, right: 8,
                        background: "#D85A30", color: "white",
                        padding: "3px 8px", borderRadius: 5,
                        fontSize: 10, fontWeight: 800,
                      }}>
                        {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "12px" }}>
                    <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0, marginBottom: 3 }}>
                      {product.vendorStore?.storeName || "Vendor"}
                    </p>
                    <h3 style={{
                      fontSize: 13, fontWeight: 600, color: "#111",
                      margin: "0 0 6px",
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4,
                    }}>{product.name}</h3>
                    {product.averageRating > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
                        <span style={{ color: "#F59E0B", fontSize: 11 }}>★</span>
                        <span style={{ fontSize: 11, color: "#6B7280" }}>{product.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#B12704" }}>{formatRupee(product.price)}</span>
                      {product.comparePrice > 0 && (
                        <span style={{ fontSize: 11, color: "#9CA3AF", textDecoration: "line-through" }}>{formatRupee(product.comparePrice)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section style={{ background: "white", padding: "32px 20px", borderTop: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: "#111", textAlign: "center", margin: "0 0 6px" }}>
            🆘 Still need help?
          </h3>
          <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center", margin: "0 0 24px" }}>
            Our team is here to assist you
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <Link
              to="/help"
              style={{
                background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                border: "1px solid #93C5FD",
                borderRadius: 14,
                padding: "20px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 14,
                transition: "all 0.2s",
              }}
            >
              <div style={{ width: 44, height: 44, background: "white", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                💬
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#1E40AF", margin: 0 }}>Help Center</p>
                <p style={{ fontSize: 11, color: "#3B82F6", margin: "2px 0 0" }}>Browse FAQs and guides</p>
              </div>
            </Link>

            <Link
              to="/contact"
              style={{
                background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
                border: "1px solid #86EFAC",
                borderRadius: 14,
                padding: "20px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 14,
                transition: "all 0.2s",
              }}
            >
              <div style={{ width: 44, height: 44, background: "white", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                📬
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#166534", margin: 0 }}>Contact Support</p>
                <p style={{ fontSize: 11, color: "#16A34A", margin: "2px 0 0" }}>Get in touch with our team</p>
              </div>
            </Link>

            <Link
              to="/orders"
              style={{
                background: "linear-gradient(135deg, #FFF5F0, #FFE8DF)",
                border: "1px solid #FDBA74",
                borderRadius: 14,
                padding: "20px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 14,
                transition: "all 0.2s",
              }}
            >
              <div style={{ width: 44, height: 44, background: "white", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                📦
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#9A3412", margin: 0 }}>Track Order</p>
                <p style={{ fontSize: 11, color: "#C2410C", margin: "2px 0 0" }}>Check your order status</p>
              </div>
            </Link>
          </div>

          <div style={{
            marginTop: 24,
            padding: "14px 20px",
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Error code: <strong style={{ color: "#111", fontFamily: "monospace" }}>404_PAGE_NOT_FOUND</strong></span>
            <span style={{ color: "#E5E7EB" }}>•</span>
            <span style={{ fontSize: 13, color: "#6B7280" }}>If this seems like a mistake, <Link to="/contact" style={{ color: "#D85A30", fontWeight: 700, textDecoration: "none" }}>let us know</Link></span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NotFoundPage;
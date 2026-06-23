import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllProductsQuery } from "../features/product/productApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useCart } from "../hooks/useCart";
import { useSelector } from "react-redux";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

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

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { addItem } = useCart();
  const [addedProducts, setAddedProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});

  const { data: productsData, isLoading: productsLoading } =
    useGetAllProductsQuery({ limit: 16, sort: "newest" });
  const { data: categoryData } = useGetCategoryTreeQuery();

  const isCustomer = user?.role === "customer";
  const canShop = !user || isCustomer;
  const categories = categoryData?.data || [];
  const products = productsData?.data || [];
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);
  const latestProducts = products.slice(0, 16);

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (user && !isCustomer) return;
    setLoadingProducts((p) => ({ ...p, [product._id]: "cart" }));
    try {
      await addItem(product, 1);
      setAddedProducts((prev) => ({ ...prev, [product._id]: true }));
      setTimeout(
        () => setAddedProducts((prev) => ({ ...prev, [product._id]: false })),
        2000,
      );
    } catch (err) {
      alert(err?.data?.message || err?.message || "Failed to add to cart");
    } finally {
      setLoadingProducts((p) => ({ ...p, [product._id]: null }));
    }
  };

  const handleBuyNow = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (user && !isCustomer) return;
    setLoadingProducts((p) => ({ ...p, [product._id]: "buy" }));
    try {
      await addItem(product, 1);
      if (!user) {
        navigate("/login?redirect=/checkout");
      } else {
        navigate("/checkout");
      }
    } catch (err) {
      alert(err?.data?.message || err?.message || "Failed to add to cart");
      setLoadingProducts((p) => ({ ...p, [product._id]: null }));
    }
  };

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hero-gradient {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%);
        }
        .product-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #E5E7EB;
          transition: all 0.2s ease;
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .product-card:hover {
          border-color: #D85A30;
          box-shadow: 0 8px 30px rgba(216,90,48,0.15);
          transform: translateY(-3px);
        }
        .cat-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 16px 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cat-card:hover {
          border-color: #D85A30;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(216,90,48,0.12);
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
        .section-title {
          font-size: 22px;
          font-weight: 800;
          color: #111;
          margin: 0;
        }
        .see-all {
          color: #0066C0;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          padding: 6px 14px;
          border: 1px solid #0066C0;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .see-all:hover {
          background: #0066C0;
          color: white;
        }
        .trust-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          flex: 1;
          min-width: 160px;
        }
        .vendor-banner {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-radius: 16px;
          padding: 48px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
      `}</style>

      {categories.length > 0 && (
        <section style={{ background: "white", padding: "40px 20px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div>
                <h2 className="section-title">Shop by Category</h2>
                <p
                  style={{
                    color: "#6B7280",
                    fontSize: 13,
                    marginTop: 4,
                    marginBottom: 0,
                  }}
                >
                  Browse products across all departments
                </p>
              </div>
              <a href="/products" className="see-all">
                View All
              </a>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: 12,
              }}
            >
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="cat-card"
                  onClick={() => navigate(`/products?category=${cat._id}`)}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      background: "linear-gradient(135deg, #FFF5F0, #FFE8DF)",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                      fontSize: 24,
                    }}
                  >
                    {categoryIcons[cat.name.toLowerCase()] || "📦"}
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#111",
                      margin: 0,
                    }}
                  >
                    {cat.name}
                  </p>
                  {cat.children?.length > 0 && (
                    <p
                      style={{
                        fontSize: 10,
                        color: "#D85A30",
                        marginTop: 3,
                        marginBottom: 0,
                        fontWeight: 600,
                      }}
                    >
                      {cat.children.length} subcategories
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section
          style={{
            background: "linear-gradient(135deg, #FFF5F0, #FFF8F5)",
            padding: "40px 20px",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 20 }}>⭐</span>
                  <h2 className="section-title">Featured Products</h2>
                </div>
                <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>
                  Handpicked by our team
                </p>
              </div>
              <Link to="/products?sort=popular" className="see-all">
                See All
              </Link>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {featuredProducts.map((product) => {
                const isAdded = addedProducts[product._id];
                const loading = loadingProducts[product._id];
                return (
                  <Link
                    key={product._id}
                    to={`/products/${product.slug}`}
                    className="product-card"
                  >
                    <div
                      style={{
                        position: "relative",
                        paddingTop: "72%",
                        background: "#F9FAFB",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={product.images?.[0]?.url || PLACEHOLDER_MEDIUM}
                        alt={product.name}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_MEDIUM;
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          background: "#111",
                          color: "white",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        ⭐ Featured
                      </span>
                      {product.comparePrice > product.price && (
                        <span
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            background: "#D85A30",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {Math.round(
                            ((product.comparePrice - product.price) /
                              product.comparePrice) *
                              100,
                          )}
                          % OFF
                        </span>
                      )}
                    </div>
                    <div style={{ padding: "14px 12px" }}>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#9CA3AF",
                          margin: 0,
                          marginBottom: 4,
                        }}
                      >
                        {product.vendorStore?.storeName || "Vendor"}
                      </p>
                      <h3
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#111",
                          margin: 0,
                          marginBottom: 6,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.4,
                        }}
                      >
                        {product.name}
                      </h3>
                      {product.averageRating > 0 && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ color: "#F59E0B", fontSize: 12 }}>
                            ★
                          </span>
                          <span style={{ fontSize: 11, color: "#6B7280" }}>
                            {product.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: "#B12704",
                          }}
                        >
                          {formatRupee(product.price)}
                        </span>
                        {product.comparePrice > 0 && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#9CA3AF",
                              textDecoration: "line-through",
                            }}
                          >
                            {formatRupee(product.comparePrice)}
                          </span>
                        )}
                      </div>
                      {canShop && product.stock > 0 && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={loading === "cart"}
                            className={`btn-cart ${isAdded ? "added" : ""}`}
                          >
                            {loading === "cart"
                              ? "..."
                              : isAdded
                                ? "✓ Added"
                                : "Add to Cart"}
                          </button>
                          <button
                            onClick={(e) => handleBuyNow(e, product)}
                            disabled={loading === "buy"}
                            className="btn-buy"
                          >
                            {loading === "buy" ? "..." : "Buy Now"}
                          </button>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section style={{ padding: "40px 20px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 20 }}>🆕</span>
                <h2 className="section-title">Latest Products</h2>
              </div>
              <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>
                Fresh arrivals from verified vendors
              </p>
            </div>
            <Link to="/products" className="see-all">
              See All
            </Link>
          </div>

          {productsLoading && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: "3px solid #D85A30",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                  margin: "0 auto 12px",
                }}
              ></div>
              <p style={{ color: "#6B7280", fontSize: 13 }}>
                Loading products...
              </p>
            </div>
          )}

          {!productsLoading && latestProducts.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "white",
                borderRadius: 16,
                border: "1px solid #E5E7EB",
              }}
            >
              <p style={{ fontSize: 48, margin: "0 0 12px" }}>📦</p>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111",
                  margin: 0,
                }}
              >
                No products yet
              </p>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6 }}>
                Check back soon for new arrivals
              </p>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 14,
            }}
          >
            {latestProducts.map((product) => {
              const isAdded = addedProducts[product._id];
              const loading = loadingProducts[product._id];
              return (
                <Link
                  key={product._id}
                  to={`/products/${product.slug}`}
                  className="product-card"
                >
                  <div
                    style={{
                      position: "relative",
                      paddingTop: "72%",
                      background: "#F9FAFB",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={product.images?.[0]?.url || PLACEHOLDER_MEDIUM}
                      alt={product.name}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_MEDIUM;
                      }}
                    />
                    {product.comparePrice > product.price && (
                      <span
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "#D85A30",
                          color: "white",
                          padding: "3px 8px",
                          borderRadius: 5,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {Math.round(
                          ((product.comparePrice - product.price) /
                            product.comparePrice) *
                            100,
                        )}
                        % OFF
                      </span>
                    )}
                    {product.stock <= 0 && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.45)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            background: "white",
                            color: "#111",
                            padding: "5px 12px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "12px" }}>
                    <p
                      style={{
                        fontSize: 10,
                        color: "#9CA3AF",
                        margin: 0,
                        marginBottom: 3,
                      }}
                    >
                      {product.vendorStore?.storeName || "Vendor"}
                    </p>
                    <h3
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#111",
                        margin: 0,
                        marginBottom: 4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.4,
                      }}
                    >
                      {product.name}
                    </h3>
                    {product.averageRating > 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: "#F59E0B", fontSize: 11 }}>
                          ★
                        </span>
                        <span style={{ fontSize: 11, color: "#6B7280" }}>
                          {product.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#B12704",
                        }}
                      >
                        {formatRupee(product.price)}
                      </span>
                      {product.comparePrice > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#9CA3AF",
                            textDecoration: "line-through",
                          }}
                        >
                          {formatRupee(product.comparePrice)}
                        </span>
                      )}
                    </div>
                    {canShop && product.stock > 0 && (
                      <div style={{ display: "flex", gap: 5 }}>
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={loading === "cart"}
                          className={`btn-cart ${isAdded ? "added" : ""}`}
                        >
                          {loading === "cart"
                            ? "..."
                            : isAdded
                              ? "✓ Added"
                              : "Add to Cart"}
                        </button>
                        <button
                          onClick={(e) => handleBuyNow(e, product)}
                          disabled={loading === "buy"}
                          className="btn-buy"
                        >
                          {loading === "buy" ? "..." : "Buy Now"}
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section style={{ background: "white", padding: "40px 20px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h2
            className="section-title"
            style={{ textAlign: "center", marginBottom: 8 }}
          >
            Why Shop With Us?
          </h2>
          <p
            style={{
              color: "#6B7280",
              fontSize: 13,
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            Trusted by thousands of customers across India
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {[
              {
                icon: "🚚",
                title: "Free Delivery",
                desc: "On orders above ₹499 across India",
              },
              {
                icon: "🔄",
                title: "Easy Returns",
                desc: "10-day hassle-free return policy",
              },
              {
                icon: "🛡️",
                title: "Secure Payments",
                desc: "100% safe and encrypted transactions",
              },
              {
                icon: "✅",
                title: "Verified Vendors",
                desc: "All sellers are manually approved",
              },
              {
                icon: "💬",
                title: "24/7 Support",
                desc: "Always here to help you out",
              },
            ].map((item) => (
              <div key={item.title} className="trust-card">
                <div style={{ fontSize: 36, marginBottom: 12 }}>
                  {item.icon}
                </div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#111",
                    margin: 0,
                    marginBottom: 6,
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#6B7280",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {canShop && (
        <section style={{ padding: "40px 20px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="vendor-banner">
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(216,90,48,0.15)",
                    border: "1px solid rgba(216,90,48,0.3)",
                    borderRadius: 99,
                    padding: "4px 12px",
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{ color: "#D85A30", fontSize: 11, fontWeight: 700 }}
                  >
                    FOR SELLERS
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "white",
                    margin: 0,
                    marginBottom: 8,
                  }}
                >
                  Start Selling Today
                </h2>
                <p
                  style={{
                    color: "#94A3B8",
                    fontSize: 14,
                    margin: 0,
                    maxWidth: 400,
                  }}
                >
                  Join hundreds of vendors already selling on our platform.
                  Setup your store in minutes and reach thousands of customers.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => navigate("/vendor/signup")}
                  style={{
                    background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    padding: "14px 28px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(216,90,48,0.3)",
                  }}
                >
                  Register as Seller →
                </button>
                <button
                  onClick={() => navigate("/vendor/login")}
                  style={{
                    background: "transparent",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 10,
                    padding: "14px 28px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Seller Login
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
export default Home;

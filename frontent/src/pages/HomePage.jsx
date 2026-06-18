import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllProductsQuery } from "../features/product/productApi";
import { useGetCategoryTreeQuery } from "../features/category/categoryApi";
import { useAddToCartMutation } from "../features/cart/cartApi";
import { useSelector } from "react-redux";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [addToCart] = useAddToCartMutation();
  const [addedProducts, setAddedProducts] = useState({});

  const { data: productsData, isLoading: productsLoading } =
    useGetAllProductsQuery({ limit: 12, sort: "newest" });

  const { data: categoryData } = useGetCategoryTreeQuery();

  const isCustomer = user?.role === "customer";

  const categoryIcons = {
    furniture: "🛋️", electronics: "📱", fashion: "👕",
    "home decor": "🏠", sports: "⚽", books: "📚",
    beauty: "💄", kitchen: "🍳", clothing: "👔",
    accessories: "⌚", toys: "🧸", health: "💊",
    grocery: "🛒", automotive: "🚗", garden: "🌿", office: "💼",
  };

  const categories =
    categoryData?.data?.length > 0
      ? categoryData.data.map((cat) => ({
          name: cat.name,
          icon: categoryIcons[cat.name.toLowerCase()] || "📦",
          slug: cat.slug,
          id: cat._id,
          children: cat.children || [],
        }))
      : [];

  const products = productsData?.data || [];

  const handleCategoryClick = (cat) => {
    if (cat.id) navigate(`/products?category=${cat.id}`);
  };

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      setAddedProducts((prev) => ({ ...prev, [productId]: true }));
      setTimeout(() => setAddedProducts((prev) => ({ ...prev, [productId]: false })), 2000);
    } catch (err) { alert(err?.data?.message || "Failed to add to cart"); }
  };

  const handleBuyNow = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      navigate("/checkout");
    } catch (err) { alert(err?.data?.message || "Failed to add to cart"); }
  };

  return (
    <div style={{ background: "#EAEDED", minHeight: "100vh" }}>

      {categories.length > 0 && (
        <section style={{ padding: "30px 20px", background: "white" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 20 }}>
              Shop by Category
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
            }}>
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat)}
                  style={{
                    background: "white",
                    border: "1px solid #EEE",
                    borderRadius: 12,
                    padding: "16px 12px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#D85A30";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(216,90,48,0.15)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#EEE";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{
                    width: 48, height: 48,
                    background: "linear-gradient(135deg, #FFF5F0, #FFE8DF)",
                    borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 8px",
                    fontSize: 22,
                  }}>{cat.icon}</div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{cat.name}</p>
                  {cat.children?.length > 0 && (
                    <p style={{ fontSize: 10, color: "#D85A30", marginTop: 2, fontWeight: 600 }}>
                      {cat.children.length} sub
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section style={{ padding: "30px 20px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>Latest Products</h2>
              <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Fresh from our verified vendors</p>
            </div>
            <Link to="/products" style={{
              color: "#0066C0",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}>
              See all →
            </Link>
          </div>

          {productsLoading && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ width: 32, height: 32, border: "3px solid #D85A30", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 12px" }}></div>
              <p style={{ color: "#666" }}>Loading products...</p>
            </div>
          )}

          {!productsLoading && products.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 12 }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>📦</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>No products available yet</p>
              <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Check back soon for new arrivals</p>
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}>
            {products.map((product) => (
              <Link
                key={product._id}
                to={`/products/${product.slug}`}
                style={{
                  background: "white",
                  borderRadius: 12,
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid #EEE",
                  transition: "all 0.2s",
                  display: "block",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "#D85A30";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "#EEE";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ position: "relative", paddingTop: "75%", background: "#F5F5F5", overflow: "hidden" }}>
                  <img
                    src={product.images?.[0]?.url || PLACEHOLDER_MEDIUM}
                    alt={product.name}
                    style={{
                      position: "absolute",
                      top: 0, left: 0,
                      width: "100%", height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }}
                  />
                  {product.isFeatured && (
                    <span style={{
                      position: "absolute",
                      top: 8, left: 8,
                      background: "#111",
                      color: "white",
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}>Featured</span>
                  )}
                  {product.comparePrice > product.price && (
                    <span style={{
                      position: "absolute",
                      top: 8, right: 8,
                      background: "#D85A30",
                      color: "white",
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                    }}>
                      {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                    </span>
                  )}
                  {product.stock <= 0 && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{
                        background: "white",
                        color: "#111",
                        padding: "6px 14px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                      }}>Out of Stock</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: 12 }}>
                  <p style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                    {product.vendorStore?.storeName || "Vendor"}
                  </p>
                  <h3 style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#111",
                    minHeight: 36,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.4,
                  }}>
                    {product.name}
                  </h3>

                  {product.averageRating > 0 && (
                    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#F90", fontSize: 12 }}>★</span>
                      <span style={{ fontSize: 11, color: "#666" }}>{product.averageRating.toFixed(1)}</span>
                    </div>
                  )}

                  <div style={{ marginTop: 6 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#B12704" }}>
                      {formatRupee(product.price)}
                    </span>
                    {product.comparePrice > 0 && (
                      <span style={{ fontSize: 11, color: "#999", textDecoration: "line-through", marginLeft: 6 }}>
                        {formatRupee(product.comparePrice)}
                      </span>
                    )}
                  </div>

                  {(!user || isCustomer) && product.stock > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                      <button
                        onClick={(e) => handleAddToCart(e, product._id)}
                        style={{
                          flex: 1,
                          background: addedProducts[product._id] ? "#22C55E" : "linear-gradient(180deg, #FFD814, #F7CA00)",
                          color: addedProducts[product._id] ? "white" : "#111",
                          border: "1px solid #FCD200",
                          borderRadius: 6,
                          padding: "6px",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {addedProducts[product._id] ? "✓ Added" : "Add to Cart"}
                      </button>
                      <button
                        onClick={(e) => handleBuyNow(e, product._id)}
                        style={{
                          flex: 1,
                          background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Buy Now
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Home;
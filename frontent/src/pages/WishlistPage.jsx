import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "../hooks/useWishlist";
import { useCart } from "../hooks/useCart";
import { useState } from "react";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const WishlistPage = () => {
  const navigate = useNavigate();
  const { items, total, isLoading, removeItem, isGuest } = useWishlist();
  const { addItem } = useCart();
  const [movingToCart, setMovingToCart] = useState({});
  const [removing, setRemoving] = useState({});

  const handleMoveToCart = async (product) => {
    setMovingToCart((p) => ({ ...p, [product._id]: true }));
    try {
      await addItem(product, 1);
      await removeItem(product._id);
    } catch (err) {
      console.log(err);
    } finally {
      setMovingToCart((p) => ({ ...p, [product._id]: false }));
    }
  };

  const handleRemove = async (productId) => {
    setRemoving((p) => ({ ...p, [productId]: true }));
    try {
      await removeItem(productId);
    } catch (err) {
      console.log(err);
    } finally {
      setRemoving((p) => ({ ...p, [productId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #EF4444", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "#6B7280", fontSize: 14 }}>Loading wishlist...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
        <div style={{ textAlign: "center", background: "white", padding: 56, borderRadius: 20, border: "1px solid #E5E7EB", maxWidth: 440 }}>
          <p style={{ fontSize: 64, marginBottom: 16 }}>❤️</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 8 }}>Your wishlist is empty</h2>
          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 28 }}>Save products you love to buy them later</p>
          <Link to="/products" style={{
            background: "linear-gradient(135deg, #D85A30, #FF8C5A)",
            color: "white", textDecoration: "none",
            padding: "12px 32px", borderRadius: 10,
            fontWeight: 700, fontSize: 14,
            display: "inline-block",
            boxShadow: "0 4px 12px rgba(216,90,48,0.3)",
          }}>
            Explore Products
          </Link>
          {isGuest && (
            <div style={{ marginTop: 24, padding: "14px 18px", background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: 12, textAlign: "left" }}>
              <p style={{ fontSize: 12, color: "#1E40AF", fontWeight: 700, margin: 0 }}>
                💡 Sign in to save your wishlist
              </p>
              <p style={{ fontSize: 11, color: "#2563EB", margin: "2px 0 0" }}>
                Your wishlist will sync when you sign in
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh", padding: "24px 16px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .wl-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          overflow: hidden;
          transition: all 0.2s;
        }
        .wl-card:hover {
          border-color: #D85A30;
          box-shadow: 0 8px 24px rgba(216,90,48,0.12);
          transform: translateY(-2px);
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>❤️</span> My Wishlist
            </h1>
            <p style={{ color: "#6B7280", fontSize: 13, margin: "4px 0 0" }}>
              {total} {total === 1 ? "item" : "items"} saved
            </p>
          </div>
          <Link
            to="/products"
            style={{
              background: "white", color: "#374151",
              textDecoration: "none", border: "1px solid #E5E7EB",
              borderRadius: 10, padding: "10px 20px",
              fontSize: 13, fontWeight: 700,
            }}
          >
            Continue Shopping
          </Link>
        </div>

        {isGuest && (
          <div style={{
            background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
            border: "1px solid #93C5FD",
            borderRadius: 14, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 14, marginBottom: 20,
          }}>
            <span style={{ fontSize: 26 }}>🔐</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#1E40AF", margin: 0 }}>Sign in to save your wishlist</p>
              <p style={{ fontSize: 12, color: "#2563EB", margin: "2px 0 0" }}>Your items will sync to your account</p>
            </div>
            <button
              onClick={() => navigate("/login?redirect=/wishlist")}
              style={{
                background: "#2563EB", color: "white", border: "none",
                borderRadius: 10, padding: "10px 20px", fontSize: 13,
                fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              Sign In →
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {items.map((product) => {
            const discount = product.comparePrice > product.price
              ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
              : 0;

            return (
              <div key={product._id} className="wl-card" style={{ opacity: removing[product._id] ? 0.5 : 1 }}>
                <Link to={`/products/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ position: "relative", paddingTop: "72%", background: "#F9FAFB", overflow: "hidden" }}>
                    <img
                      src={product.images?.[0]?.url || PLACEHOLDER_MEDIUM}
                      alt={product.name}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }}
                    />
                    {discount > 0 && (
                      <span style={{ position: "absolute", top: 10, left: 10, background: "#D85A30", color: "white", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                        {discount}% OFF
                      </span>
                    )}
                    {product.stock <= 0 && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ background: "white", color: "#111", padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Out of Stock</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(product._id); }}
                      style={{
                        position: "absolute", top: 10, right: 10,
                        width: 32, height: 32, borderRadius: "50%",
                        background: "#FEE2E2", border: "1px solid #FCA5A5",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="14" height="14" fill="#EF4444" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                  </div>
                </Link>

                <div style={{ padding: "14px" }}>
                  <p style={{ fontSize: 10, color: "#9CA3AF", margin: "0 0 4px" }}>
                    {product.vendorStore?.storeName || "Vendor"}
                  </p>
                  <Link to={`/products/${product.slug}`} style={{ textDecoration: "none" }}>
                    <h3 style={{
                      fontSize: 13, fontWeight: 600, color: "#111",
                      margin: "0 0 6px",
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4,
                    }}>{product.name}</h3>
                  </Link>

                  {product.averageRating > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                      <span style={{ color: "#F59E0B", fontSize: 12 }}>★</span>
                      <span style={{ fontSize: 11, color: "#6B7280" }}>
                        {product.averageRating.toFixed(1)} ({product.totalReviews})
                      </span>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: "#B12704" }}>{formatRupee(product.price)}</span>
                    {product.comparePrice > 0 && (
                      <span style={{ fontSize: 11, color: "#9CA3AF", textDecoration: "line-through" }}>{formatRupee(product.comparePrice)}</span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {product.stock > 0 ? (
                      <button
                        onClick={() => handleMoveToCart(product)}
                        disabled={movingToCart[product._id]}
                        style={{
                          flex: 1,
                          background: "linear-gradient(180deg, #FFD814, #F7CA00)",
                          color: "#111", border: "1px solid #FCD200",
                          borderRadius: 8, padding: "9px",
                          fontSize: 12, fontWeight: 700,
                          cursor: movingToCart[product._id] ? "not-allowed" : "pointer",
                          opacity: movingToCart[product._id] ? 0.6 : 1,
                          fontFamily: "inherit",
                        }}
                      >
                        {movingToCart[product._id] ? "Moving..." : "🛒 Move to Cart"}
                      </button>
                    ) : (
                      <button
                        disabled
                        style={{
                          flex: 1,
                          background: "#F3F4F6", color: "#9CA3AF",
                          border: "none", borderRadius: 8,
                          padding: "9px", fontSize: 12,
                          fontWeight: 700, cursor: "not-allowed",
                        }}
                      >
                        Out of Stock
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(product._id)}
                      style={{
                        background: "#FEE2E2", color: "#7F1D1D",
                        border: "1px solid #FCA5A5", borderRadius: 8,
                        padding: "9px 14px", fontSize: 12,
                        fontWeight: 700, cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
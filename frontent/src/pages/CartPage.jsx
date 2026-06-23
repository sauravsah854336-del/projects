import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, isLoading, updateItem, removeItem, clear, isGuest } = useCart();
  const [updatingItems, setUpdatingItems] = useState({});
  const [removingItems, setRemovingItems] = useState({});

  const items = cart?.items || [];

  const getProductId = (item) => item.product?._id || item.productId || item.product;

  const handleQuantityChange = async (productId, newQty) => {
    if (newQty < 1) return;
    setUpdatingItems((prev) => ({ ...prev, [productId]: true }));
    try {
      await updateItem(productId, newQty);
    } catch (err) {
      console.log(err);
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemove = async (productId) => {
    setRemovingItems((prev) => ({ ...prev, [productId]: true }));
    try {
      await removeItem(productId);
    } catch (err) {
      console.log(err);
    } finally {
      setRemovingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleClearCart = async () => {
    try {
      await clear();
    } catch (err) {
      console.log(err);
    }
  };

  const handleCheckout = () => {
    if (isGuest) {
      navigate("/login?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #D85A30", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "#6B7280", fontSize: 14 }}>Loading your cart...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
        <div style={{ textAlign: "center", background: "white", padding: 56, borderRadius: 20, border: "1px solid #E5E7EB", maxWidth: 440 }}>
          <p style={{ fontSize: 64, marginBottom: 16 }}>🛒</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 8 }}>Your cart is empty</h2>
          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 28 }}>Looks like you haven't added anything yet. Start shopping!</p>
          <Link to="/products" style={{
            background: "linear-gradient(180deg, #FFD814, #F7CA00)",
            color: "#111", textDecoration: "none",
            padding: "12px 32px", borderRadius: 10,
            fontWeight: 700, fontSize: 14,
            display: "inline-block",
            border: "1px solid #FCD200",
          }}>
            Continue Shopping
          </Link>

          {isGuest && (
            <div style={{ marginTop: 24, padding: "14px 18px", background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: 12, textAlign: "left" }}>
              <p style={{ fontSize: 12, color: "#1E40AF", fontWeight: 700, margin: 0 }}>
                💡 Sign in to save your cart
              </p>
              <p style={{ fontSize: 11, color: "#2563EB", margin: "2px 0 0" }}>
                Your cart will be synced when you sign in
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh", padding: "24px 16px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: 0 }}>Shopping Cart</h1>
            <p style={{ color: "#6B7280", fontSize: 13, margin: "4px 0 0" }}>
              {cart?.totalItems} {cart?.totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <button
            onClick={handleClearCart}
            style={{
              background: "none", border: "1px solid #FCA5A5",
              color: "#EF4444", borderRadius: 8,
              padding: "8px 16px", fontSize: 12,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            Clear Cart
          </button>
        </div>

        {isGuest && (
          <div style={{
            background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
            border: "1px solid #93C5FD",
            borderRadius: 14, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 14, marginBottom: 16,
          }}>
            <span style={{ fontSize: 26 }}>🔐</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#1E40AF", margin: 0 }}>
                Sign in to save your cart
              </p>
              <p style={{ fontSize: 12, color: "#2563EB", margin: "2px 0 0" }}>
                Your cart items will be saved to your account when you sign in. You'll need to sign in to complete checkout.
              </p>
            </div>
            <button
              onClick={() => navigate("/login?redirect=/cart")}
              style={{
                background: "#2563EB", color: "white", border: "none",
                borderRadius: 10, padding: "10px 20px", fontSize: 13,
                fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
              }}
            >
              Sign In →
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            <div style={{
              background: "white", borderRadius: 12,
              border: "1px solid #E5E7EB", padding: "12px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Product</span>
              <div style={{ display: "flex", gap: 80 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Quantity</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Total</span>
              </div>
            </div>

            {items.map((item) => {
              const productId = getProductId(item);
              return (
                <div
                  key={productId}
                  style={{
                    background: "white", borderRadius: 12,
                    border: "1px solid #E5E7EB", padding: 20,
                    display: "flex", gap: 16, alignItems: "flex-start",
                    opacity: removingItems[productId] ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <Link to={`/products/${item.product?.slug || ""}`} style={{ flexShrink: 0 }}>
                    <img
                      src={item.image || PLACEHOLDER_MEDIUM}
                      alt={item.name}
                      style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 10, border: "1px solid #E5E7EB" }}
                      onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }}
                    />
                  </Link>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Link
                          to={`/products/${item.product?.slug || ""}`}
                          style={{ fontWeight: 600, fontSize: 14, color: "#111", textDecoration: "none", lineHeight: 1.4, display: "block" }}
                        >
                          {item.name}
                        </Link>
                        <p style={{ fontSize: 12, color: "#9CA3AF", margin: "4px 0 0" }}>
                          Sold by: {item.storeName || "Vendor"}
                        </p>
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <Link
                            to={`/products/${item.product?.slug || ""}`}
                            style={{ fontSize: 11, color: "#0066C0", textDecoration: "none" }}
                          >
                            View Details
                          </Link>
                          <span style={{ color: "#E5E7EB" }}>|</span>
                          <button
                            onClick={() => handleRemove(productId)}
                            style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: "#B12704", margin: 0 }}>
                          {formatRupee(item.price * item.quantity)}
                        </p>
                        {item.comparePrice > 0 && (
                          <p style={{ fontSize: 11, color: "#9CA3AF", textDecoration: "line-through", margin: "2px 0 0" }}>
                            {formatRupee(item.comparePrice * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                      <div style={{
                        display: "flex", alignItems: "center",
                        border: "1px solid #E5E7EB", borderRadius: 8,
                        overflow: "hidden", width: "fit-content",
                      }}>
                        <button
                          onClick={() => handleQuantityChange(productId, item.quantity - 1)}
                          disabled={updatingItems[productId] || item.quantity <= 1}
                          style={{
                            width: 36, height: 36,
                            background: "#F9FAFB", border: "none",
                            cursor: "pointer", fontSize: 18,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#111", opacity: (updatingItems[productId] || item.quantity <= 1) ? 0.4 : 1,
                          }}
                        >
                          −
                        </button>
                        <span style={{
                          width: 44, textAlign: "center",
                          fontSize: 14, fontWeight: 700, color: "#111",
                          borderLeft: "1px solid #E5E7EB", borderRight: "1px solid #E5E7EB",
                          height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {updatingItems[productId] ? (
                            <div style={{ width: 14, height: 14, border: "2px solid #D85A30", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }}></div>
                          ) : item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(productId, item.quantity + 1)}
                          disabled={updatingItems[productId] || item.quantity >= item.maxQuantity}
                          style={{
                            width: 36, height: 36,
                            background: "#F9FAFB", border: "none",
                            cursor: "pointer", fontSize: 18,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#111", opacity: (updatingItems[productId] || item.quantity >= item.maxQuantity) ? 0.4 : 1,
                          }}
                        >
                          +
                        </button>
                      </div>
                      <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
                        {formatRupee(item.price)} each
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{
              background: "#F0FDF4", border: "1px solid #86EFAC",
              borderRadius: 12, padding: "16px 20px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>🚚</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#166534", margin: 0 }}>Free Delivery</p>
                <p style={{ fontSize: 12, color: "#16A34A", margin: 0 }}>Your order qualifies for free delivery</p>
              </div>
            </div>
          </div>

          <div style={{ position: "sticky", top: 80 }}>
            <div style={{
              background: "white", borderRadius: 12,
              border: "1px solid #E5E7EB", overflow: "hidden",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: 0 }}>Order Summary</h2>
              </div>
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>Subtotal ({cart?.totalItems} items)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{formatRupee(cart?.subtotal || 0)}</span>
                  </div>
                  {cart?.coupon?.discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#16A34A" }}>Discount</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>− {formatRupee(cart.coupon.discount)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>Shipping</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>FREE</span>
                  </div>
                  <div style={{ borderTop: "2px solid #E5E7EB", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>Total</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#B12704" }}>{formatRupee(cart?.total || cart?.subtotal || 0)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  style={{
                    width: "100%", marginTop: 20,
                    background: "linear-gradient(180deg, #FFD814, #F7CA00)",
                    color: "#111", border: "1px solid #FCD200",
                    borderRadius: 10, padding: "14px",
                    fontSize: 15, fontWeight: 800, cursor: "pointer",
                  }}
                >
                  {isGuest
                    ? `🔐 Sign in to Checkout (${cart?.totalItems})`
                    : `Proceed to Checkout (${cart?.totalItems})`}
                </button>

                <button
                  onClick={() => navigate("/products")}
                  style={{
                    width: "100%", marginTop: 10,
                    background: "transparent", color: "#0066C0",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10, padding: "12px",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Continue Shopping
                </button>

                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { icon: "🔒", text: "Secure checkout" },
                    { icon: "🔄", text: "Easy returns" },
                    { icon: "✅", text: "Verified vendors" },
                  ].map((item) => (
                    <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
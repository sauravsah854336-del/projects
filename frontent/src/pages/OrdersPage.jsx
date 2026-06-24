import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetMyOrdersQuery,
  useCancelOrderMutation,
} from "../features/order/orderApi";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getStatusStyle = (status) => {
  const map = {
    pending: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
    processing: { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
    shipped: { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" },
    out_for_delivery: { bg: "#FFEDD5", text: "#9A3412", border: "#FDBA74" },
    delivered: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
    cancelled: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
    returned: { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
    refunded: { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
  };
  return map[status] || { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" };
};

const getStatusLabel = (status) => {
  const labels = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
    refunded: "Refunded",
  };
  return labels[status] || status;
};

const getStatusIcon = (status) => {
  const icons = {
    pending: "🕐",
    processing: "⚙️",
    shipped: "🚚",
    out_for_delivery: "🛵",
    delivered: "✅",
    cancelled: "❌",
    returned: "↩️",
    refunded: "💰",
  };
  return icons[status] || "📦";
};

const OrdersPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetMyOrdersQuery({ page, limit: 10 });
  const [cancelOrder] = useCancelOrderMutation();
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const orders = data?.data || [];
  const pagination = data?.pagination;

  const handleCancel = async (id) => {
    setCancelError("");
    setCancelLoading(true);
    try {
      await cancelOrder({ id, reason: cancelReason }).unwrap();
      setCancellingId(null);
      setCancelReason("");
    } catch (err) {
      setCancelError(err?.data?.message || "Failed to cancel order");
    } finally {
      setCancelLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #D85A30", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "#6B7280", fontSize: 14 }}>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
        <div style={{ textAlign: "center", background: "white", padding: 56, borderRadius: 20, border: "1px solid #E5E7EB", maxWidth: 440 }}>
          <p style={{ fontSize: 64, marginBottom: 16 }}>📦</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 8 }}>No orders yet</h2>
          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 28 }}>You haven't placed any orders yet. Start shopping!</p>
          <Link
            to="/products"
            style={{
              background: "linear-gradient(180deg, #FFD814, #F7CA00)",
              color: "#111", textDecoration: "none",
              padding: "12px 32px", borderRadius: 10,
              fontWeight: 700, fontSize: 14,
              display: "inline-block",
              border: "1px solid #FCD200",
            }}
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh", padding: "24px 16px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .order-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 16px;
          animation: fadeIn 0.2s ease both;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .order-card:hover {
          border-color: #D85A30;
          box-shadow: 0 4px 20px rgba(216,90,48,0.08);
        }
        .order-item-row {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px 20px;
          border-bottom: 1px solid #F9FAFB;
        }
        .order-item-row:last-child { border-bottom: none; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: 0 }}>My Orders</h1>
            <p style={{ color: "#6B7280", fontSize: 13, margin: "4px 0 0" }}>
              {pagination?.total || orders.length} {(pagination?.total || orders.length) === 1 ? "order" : "orders"} placed
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

        {orders.map((order) => {
          const statusStyle = getStatusStyle(order.orderStatus);
          const isCancelOpen = cancellingId === order._id;

          return (
            <div key={order._id} className="order-card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", background: "#F9FAFB", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>
                      {order.orderNumber}
                    </span>
                    <span style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                      padding: "2px 10px",
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                      {getStatusIcon(order.orderStatus)} {getStatusLabel(order.orderStatus)}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                    Placed on {formatDate(order.createdAt)} • {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#B12704" }}>
                    {formatRupee(order.total)}
                  </span>
                  <Link
                    to={`/orders/${order._id}`}
                    style={{
                      background: "#111", color: "white",
                      textDecoration: "none", borderRadius: 8,
                      padding: "8px 16px", fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    View Details →
                  </Link>
                </div>
              </div>

              <div>
                {order.items.slice(0, 2).map((item, index) => (
                  <div key={index} className="order-item-row">
                    <img
                      src={item.image || PLACEHOLDER_MEDIUM}
                      alt={item.name}
                      style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, border: "1px solid #E5E7EB", flexShrink: 0 }}
                      onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>
                        {item.storeName} • Qty: {item.quantity}
                      </p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", flexShrink: 0 }}>
                      {formatRupee(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <div style={{ padding: "10px 20px", background: "#FAFAFA" }}>
                    <Link
                      to={`/orders/${order._id}`}
                      style={{ fontSize: 12, color: "#0066C0", textDecoration: "none", fontWeight: 600 }}
                    >
                      + {order.items.length - 2} more item{order.items.length - 2 > 1 ? "s" : ""} — View all
                    </Link>
                  </div>
                )}
              </div>

              <div style={{ padding: "12px 20px", borderTop: "1px solid #F3F4F6", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {order.paymentMethod === "cod" ? "💵 Cash on Delivery" : "💳 Online"}
                  </span>
                  <span style={{ color: "#E5E7EB" }}>•</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: order.paymentStatus === "paid" ? "#16A34A" : order.paymentStatus === "refunded" ? "#9D174D" : "#D97706",
                  }}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {["pending", "processing"].includes(order.orderStatus) && (
                    <button
                      onClick={() => {
                        setCancellingId(isCancelOpen ? null : order._id);
                        setCancelReason("");
                        setCancelError("");
                      }}
                      style={{
                        background: isCancelOpen ? "#FEE2E2" : "white",
                        color: "#DC2626",
                        border: "1px solid #FCA5A5",
                        borderRadius: 8,
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {isCancelOpen ? "✕ Close" : "Cancel Order"}
                    </button>
                  )}
                </div>
              </div>

              {isCancelOpen && (
                <div style={{ padding: "16px 20px", borderTop: "1px solid #FEE2E2", background: "#FFF5F5", animation: "fadeIn 0.15s ease both" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 10px" }}>
                    Confirm cancellation
                  </p>
                  <textarea
                    placeholder="Reason for cancellation (optional)"
                    value={cancelReason}
                    onChange={(e) => { setCancelReason(e.target.value); setCancelError(""); }}
                    rows={2}
                    style={{
                      width: "100%", border: "1px solid #E5E7EB",
                      borderRadius: 8, padding: "10px 14px",
                      fontSize: 13, color: "#111", outline: "none",
                      resize: "none", fontFamily: "inherit",
                      boxSizing: "border-box", marginBottom: 10,
                    }}
                  />
                  {cancelError && (
                    <p style={{ fontSize: 12, color: "#EF4444", margin: "0 0 10px", fontWeight: 600 }}>
                      ⚠️ {cancelError}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleCancel(order._id)}
                      disabled={cancelLoading}
                      style={{
                        background: "#DC2626", color: "white",
                        border: "none", borderRadius: 8,
                        padding: "8px 20px", fontSize: 12,
                        fontWeight: 700, cursor: cancelLoading ? "not-allowed" : "pointer",
                        opacity: cancelLoading ? 0.6 : 1,
                        fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      {cancelLoading && (
                        <span style={{ width: 12, height: 12, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }}></span>
                      )}
                      {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
                    </button>
                    <button
                      onClick={() => { setCancellingId(null); setCancelReason(""); setCancelError(""); }}
                      style={{
                        background: "white", color: "#374151",
                        border: "1px solid #E5E7EB", borderRadius: 8,
                        padding: "8px 20px", fontSize: 12,
                        fontWeight: 700, cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Keep Order
                    </button>
                  </div>
                </div>
              )}

              {order.cancelReason && order.orderStatus === "cancelled" && (
                <div style={{ padding: "10px 20px", borderTop: "1px solid #FEE2E2", background: "#FEF2F2" }}>
                  <p style={{ fontSize: 12, color: "#DC2626", margin: 0, fontWeight: 600 }}>
                    ❌ Cancelled: {order.cancelReason}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {pagination && pagination.pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32, flexWrap: "wrap" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, cursor: "pointer", opacity: page === 1 ? 0.4 : 1 }}
            >
              ← Prev
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: "10px 16px", borderRadius: 8,
                  background: page === p ? "#111" : "white",
                  color: page === p ? "white" : "#111",
                  border: page === p ? "none" : "1px solid #E5E7EB",
                  fontSize: 13, fontWeight: page === p ? 700 : 400, cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", fontSize: 13, cursor: "pointer", opacity: page === pagination.pages ? 0.4 : 1 }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
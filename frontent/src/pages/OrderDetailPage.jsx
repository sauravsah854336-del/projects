import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useGetSingleOrderQuery,
  useCancelOrderMutation,
} from "../features/order/orderApi";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import jsPDF from "jspdf";

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
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDateShort = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: "📋" },
  { key: "processing", label: "Processing", icon: "⚙️" },
  { key: "shipped", label: "Shipped", icon: "🚚" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
  { key: "delivered", label: "Delivered", icon: "✅" },
];

const RETURNED_STEPS = [
  { key: "pending", label: "Order Placed", icon: "📋" },
  { key: "processing", label: "Processing", icon: "⚙️" },
  { key: "shipped", label: "Shipped", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "✅" },
  { key: "returned", label: "Returned", icon: "↩️" },
];

const REFUNDED_STEPS = [
  { key: "pending", label: "Order Placed", icon: "📋" },
  { key: "processing", label: "Processing", icon: "⚙️" },
  { key: "delivered", label: "Delivered", icon: "✅" },
  { key: "returned", label: "Returned", icon: "↩️" },
  { key: "refunded", label: "Refunded", icon: "💰" },
];

const getStatusSteps = (status) => {
  if (status === "returned") return RETURNED_STEPS;
  if (status === "refunded") return REFUNDED_STEPS;
  return STATUS_STEPS;
};

const getStatusIndex = (steps, currentStatus) =>
  steps.findIndex((s) => s.key === currentStatus);

const getStatusColor = (status) => {
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
    pending: "Order Placed",
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

const downloadInvoice = (order) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  const rupee = (amt) =>
    "Rs. " +
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amt);

  doc.setFillColor(19, 25, 33);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("E-Commerce", 20, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TAX INVOICE", pageW - 20, 22, { align: "right" });
  doc.setFontSize(9);
  doc.text("www.ecommerce.com", pageW - 20, 30, { align: "right" });

  y = 55;
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details", 20, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  y += 7;
  doc.text(`Invoice No:`, 20, y);
  doc.setTextColor(17, 17, 17);
  doc.text(`${order.orderNumber}`, 60, y);

  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.text(`Order Date:`, 20, y);
  doc.setTextColor(17, 17, 17);
  doc.text(formatDateShort(order.createdAt), 60, y);

  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.text(`Payment:`, 20, y);
  doc.setTextColor(17, 17, 17);
  doc.text(
    order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment",
    60,
    y
  );

  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.text(`Status:`, 20, y);
  doc.setTextColor(17, 17, 17);
  doc.text(getStatusLabel(order.orderStatus), 60, y);

  const addrX = 120;
  let addrY = 55;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 17, 17);
  doc.text("Ship To", addrX, addrY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  addrY += 7;
  doc.setTextColor(100, 100, 100);
  doc.text("Name:", addrX, addrY);
  doc.setTextColor(17, 17, 17);
  doc.text(order.shippingAddress.fullName, addrX + 20, addrY);
  addrY += 6;
  doc.setTextColor(100, 100, 100);
  doc.text("Phone:", addrX, addrY);
  doc.setTextColor(17, 17, 17);
  doc.text(order.shippingAddress.phone, addrX + 20, addrY);
  addrY += 6;
  doc.setTextColor(100, 100, 100);
  doc.text("Address:", addrX, addrY);
  doc.setTextColor(17, 17, 17);
  const addrLines = doc.splitTextToSize(
    `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`,
    55
  );
  doc.text(addrLines, addrX + 20, addrY);

  y = Math.max(y, addrY + addrLines.length * 5) + 16;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, y - 6, pageW - 30, 10, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(55, 65, 81);
  doc.text("#", 20, y);
  doc.text("Product", 30, y);
  doc.text("Store", 110, y);
  doc.text("Qty", 145, y);
  doc.text("Price", 160, y);
  doc.text("Total", pageW - 20, y, { align: "right" });

  y += 8;
  doc.setDrawColor(229, 231, 235);
  doc.line(15, y - 3, pageW - 15, y - 3);

  order.items.forEach((item, index) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(17, 17, 17);

    const nameLines = doc.splitTextToSize(item.name, 75);
    doc.text(`${index + 1}`, 20, y);
    doc.text(nameLines, 30, y);
    doc.setTextColor(100, 100, 100);
    doc.text(item.storeName || "Vendor", 110, y);
    doc.setTextColor(17, 17, 17);
    doc.text(`${item.quantity}`, 145, y);
    doc.text(rupee(item.price), 160, y);
    doc.setFont("helvetica", "bold");
    doc.text(rupee(item.price * item.quantity), pageW - 20, y, {
      align: "right",
    });

    y += nameLines.length * 5 + 4;
    doc.setDrawColor(243, 244, 246);
    doc.line(15, y - 2, pageW - 15, y - 2);
  });

  y += 8;

  const summaryX = 120;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Subtotal:", summaryX, y);
  doc.setTextColor(17, 17, 17);
  doc.text(rupee(order.subtotal), pageW - 20, y, { align: "right" });

  if (order.discount > 0) {
    y += 7;
    doc.setTextColor(100, 100, 100);
    doc.text("Discount:", summaryX, y);
    doc.setTextColor(22, 163, 74);
    doc.text(`- ${rupee(order.discount)}`, pageW - 20, y, { align: "right" });
  }

  y += 7;
  doc.setTextColor(100, 100, 100);
  doc.text("Shipping:", summaryX, y);
  doc.setTextColor(22, 163, 74);
  doc.text(
    order.shippingCharge === 0 ? "FREE" : rupee(order.shippingCharge),
    pageW - 20,
    y,
    { align: "right" }
  );

  y += 3;
  doc.setDrawColor(17, 17, 17);
  doc.line(summaryX, y + 2, pageW - 15, y + 2);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 17, 17);
  doc.text("Grand Total:", summaryX, y);
  doc.setTextColor(177, 39, 4);
  doc.text(rupee(order.total), pageW - 20, y, { align: "right" });

  y += 20;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y - 6, pageW - 30, 20, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Thank you for shopping with E-Commerce! For support: support@ecommerce.com",
    pageW / 2,
    y + 2,
    { align: "center" }
  );
  doc.text(
    "This is a computer generated invoice and does not require a signature.",
    pageW / 2,
    y + 8,
    { align: "center" }
  );

  doc.save(`Invoice-${order.orderNumber}.pdf`);
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetSingleOrderQuery(id);
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [downloading, setDownloading] = useState(false);

  if (isLoading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #D85A30", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "#6B7280", fontSize: 14 }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
        <div style={{ textAlign: "center", background: "white", padding: 48, borderRadius: 20, border: "1px solid #E5E7EB" }}>
          <p style={{ fontSize: 52, marginBottom: 16 }}>😕</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 8 }}>Order not found</h2>
          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 24 }}>This order doesn't exist or you don't have access.</p>
          <Link
            to="/orders"
            style={{ background: "#111", color: "white", textDecoration: "none", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const order = data.data;
  const statusColor = getStatusColor(order.orderStatus);
  const steps = getStatusSteps(order.orderStatus);
  const currentStepIndex = getStatusIndex(steps, order.orderStatus);
  const canCancel = ["pending", "processing"].includes(order.orderStatus);

  const handleCancel = async () => {
    setCancelError("");
    try {
      await cancelOrder({ id: order._id, reason: cancelReason }).unwrap();
      setShowCancelForm(false);
      setCancelReason("");
    } catch (err) {
      setCancelError(err?.data?.message || "Failed to cancel order");
    }
  };

  const handleDownloadInvoice = () => {
    setDownloading(true);
    try {
      downloadInvoice(order);
    } catch (err) {
      console.log("Invoice error:", err);
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh", padding: "24px 16px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .od-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 16px;
          animation: fadeIn 0.2s ease both;
        }
        .od-card-header {
          padding: 16px 20px;
          border-bottom: 1px solid #F3F4F6;
          background: #F9FAFB;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .od-card-title {
          font-size: 14px;
          font-weight: 700;
          color: #111;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .od-card-body { padding: 20px; }
        .step-connector {
          flex: 1;
          height: 3px;
          border-radius: 99px;
          transition: background 0.3s;
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => navigate("/orders")}
            style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            My Orders
          </button>
          <span style={{ color: "#9CA3AF", fontSize: 13 }}>/</span>
          <span style={{ color: "#6B7280", fontSize: 13, fontWeight: 600 }}>{order.orderNumber}</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", margin: 0 }}>Order Details</h1>
            <p style={{ color: "#6B7280", fontSize: 13, margin: "4px 0 0" }}>
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{
              background: statusColor.bg,
              color: statusColor.text,
              border: `1px solid ${statusColor.border}`,
              padding: "6px 14px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 700,
            }}>
              {getStatusLabel(order.orderStatus)}
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#B12704" }}>
              {formatRupee(order.total)}
            </span>
            <button
              onClick={handleDownloadInvoice}
              disabled={downloading}
              style={{
                background: downloading ? "#F3F4F6" : "linear-gradient(135deg, #1e293b, #334155)",
                color: downloading ? "#9CA3AF" : "white",
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: downloading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
            >
              {downloading ? (
                <>
                  <span style={{ width: 14, height: 14, border: "2px solid #9CA3AF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }}></span>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download Invoice
                </>
              )}
            </button>
          </div>
        </div>

        <div className="od-card">
          <div className="od-card-header">
            <p className="od-card-title">
              <span>📍</span> Order Status
            </p>
            <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>
              #{order.orderNumber}
            </span>
          </div>
          <div className="od-card-body">
            {order.orderStatus === "cancelled" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#DCFCE7", border: "3px solid #22C55E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      📋
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", textAlign: "center" }}>Placed</span>
                  </div>
                  <div style={{ flex: 1, height: 3, borderRadius: 99, background: "#FEE2E2" }}></div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FEE2E2", border: "3px solid #EF4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      ❌
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#EF4444", textAlign: "center" }}>Cancelled</span>
                  </div>
                </div>
                {order.cancelReason && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginTop: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", margin: "0 0 2px" }}>Cancellation Reason</p>
                    <p style={{ fontSize: 13, color: "#DC2626", margin: 0 }}>{order.cancelReason}</p>
                    {order.cancelledAt && (
                      <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>
                        Cancelled on {formatDateShort(order.cancelledAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  {steps.map((step, index) => {
                    const isDone = index <= currentStepIndex;
                    const isActive = index === currentStepIndex;
                    return (
                      <div key={step.key} style={{ display: "flex", alignItems: "center", flex: index < steps.length - 1 ? 1 : "unset" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 56 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: "50%",
                            background: isDone ? (isActive ? statusColor.bg : "#DCFCE7") : "#F3F4F6",
                            border: `3px solid ${isDone ? (isActive ? statusColor.border : "#22C55E") : "#E5E7EB"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18,
                            boxShadow: isActive ? `0 0 0 4px ${statusColor.bg}` : "none",
                            transition: "all 0.3s",
                          }}>
                            {step.icon}
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: isActive ? 800 : 600,
                            color: isDone ? (isActive ? statusColor.text : "#16A34A") : "#9CA3AF",
                            textAlign: "center", lineHeight: 1.3, maxWidth: 60,
                          }}>
                            {step.label}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className="step-connector"
                            style={{ background: index < currentStepIndex ? "#22C55E" : "#E5E7EB" }}
                          ></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {order.orderStatus === "delivered" && order.deliveredAt && (
                  <div style={{ marginTop: 16, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🎉</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#166534", margin: 0 }}>Order Delivered!</p>
                      <p style={{ fontSize: 11, color: "#16A34A", margin: 0 }}>Delivered on {formatDateShort(order.deliveredAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="od-card">
          <div className="od-card-header">
            <p className="od-card-title"><span>🛍️</span> Order Items ({order.items.length})</p>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#B12704" }}>{formatRupee(order.subtotal)}</span>
          </div>
          <div className="od-card-body" style={{ padding: 0 }}>
            {order.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex", gap: 16, padding: "16px 20px",
                  borderBottom: index < order.items.length - 1 ? "1px solid #F3F4F6" : "none",
                  alignItems: "center",
                }}
              >
                <img
                  src={item.image || PLACEHOLDER_MEDIUM}
                  alt={item.name}
                  style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid #E5E7EB", flexShrink: 0 }}
                  onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 4px", lineHeight: 1.4 }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 6px" }}>
                    Sold by: {item.storeName || "Vendor"}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                      Qty: {item.quantity}
                    </span>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>×</span>
                    <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
                      {formatRupee(item.price)}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#B12704", margin: 0 }}>
                    {formatRupee(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}

            <div style={{ padding: "16px 20px", borderTop: "2px solid #F3F4F6", background: "#F9FAFB" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300, marginLeft: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>Subtotal</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{formatRupee(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#16A34A" }}>Discount</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>− {formatRupee(order.discount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>Shipping</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>
                    {order.shippingCharge === 0 ? "FREE" : formatRupee(order.shippingCharge)}
                  </span>
                </div>
                <div style={{ borderTop: "2px solid #E5E7EB", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#B12704" }}>{formatRupee(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div className="od-card" style={{ margin: 0 }}>
            <div className="od-card-header">
              <p className="od-card-title"><span>📦</span> Shipping Address</p>
            </div>
            <div className="od-card-body">
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
                {order.shippingAddress.fullName}
              </p>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 2px" }}>
                {order.shippingAddress.street}
              </p>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 2px" }}>
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 2px" }}>
                {order.shippingAddress.country} — {order.shippingAddress.postalCode}
              </p>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "8px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {order.shippingAddress.phone}
              </p>
            </div>
          </div>

          <div className="od-card" style={{ margin: 0 }}>
            <div className="od-card-header">
              <p className="od-card-title"><span>💳</span> Payment Info</p>
            </div>
            <div className="od-card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>Method</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                    {order.paymentMethod === "cod" ? "💵 Cash on Delivery" : "💳 Online"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>Status</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    padding: "3px 10px", borderRadius: 99,
                    background: order.paymentStatus === "paid" ? "#DCFCE7" : order.paymentStatus === "refunded" ? "#FCE7F3" : "#FEF3C7",
                    color: order.paymentStatus === "paid" ? "#166534" : order.paymentStatus === "refunded" ? "#9D174D" : "#92400E",
                  }}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>Order Date</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
                    {formatDateShort(order.createdAt)}
                  </span>
                </div>
                {order.deliveredAt && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>Delivered</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A" }}>
                      {formatDateShort(order.deliveredAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="od-card">
            <div className="od-card-header">
              <p className="od-card-title"><span>📝</span> Order Notes</p>
            </div>
            <div className="od-card-body">
              <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.6 }}>{order.notes}</p>
            </div>
          </div>
        )}

        {canCancel && (
          <div className="od-card">
            <div className="od-card-header">
              <p className="od-card-title"><span>⚠️</span> Cancel Order</p>
            </div>
            <div className="od-card-body">
              {!showCancelForm ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                      You can cancel this order since it is still in <strong>{getStatusLabel(order.orderStatus)}</strong> stage.
                    </p>
                    <p style={{ fontSize: 12, color: "#9CA3AF", margin: "4px 0 0" }}>
                      Once shipped, orders cannot be cancelled.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCancelForm(true)}
                    style={{
                      background: "#FEF2F2", color: "#DC2626",
                      border: "1px solid #FCA5A5", borderRadius: 10,
                      padding: "10px 20px", fontSize: 13,
                      fontWeight: 700, cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Cancel Order
                  </button>
                </div>
              ) : (
                <div style={{ animation: "fadeIn 0.2s ease both" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 10px" }}>
                    Are you sure you want to cancel this order?
                  </p>
                  <textarea
                    placeholder="Reason for cancellation (optional)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%", border: "1px solid #E5E7EB", borderRadius: 10,
                      padding: "10px 14px", fontSize: 13, color: "#111",
                      outline: "none", resize: "vertical", fontFamily: "inherit",
                      boxSizing: "border-box", marginBottom: 12,
                    }}
                  />
                  {cancelError && (
                    <p style={{ fontSize: 12, color: "#EF4444", margin: "0 0 10px", fontWeight: 600 }}>
                      ⚠️ {cancelError}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      style={{
                        background: "#DC2626", color: "white",
                        border: "none", borderRadius: 10,
                        padding: "10px 24px", fontSize: 13,
                        fontWeight: 700, cursor: cancelling ? "not-allowed" : "pointer",
                        opacity: cancelling ? 0.6 : 1,
                        fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      {cancelling && (
                        <span style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }}></span>
                      )}
                      {cancelling ? "Cancelling..." : "Yes, Cancel Order"}
                    </button>
                    <button
                      onClick={() => { setShowCancelForm(false); setCancelReason(""); setCancelError(""); }}
                      style={{
                        background: "#F3F4F6", color: "#374151",
                        border: "1px solid #E5E7EB", borderRadius: 10,
                        padding: "10px 24px", fontSize: 13,
                        fontWeight: 700, cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Keep Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            to="/orders"
            style={{
              background: "white", color: "#374151",
              border: "1px solid #E5E7EB", borderRadius: 10,
              padding: "12px 24px", fontSize: 13,
              fontWeight: 700, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            ← Back to Orders
          </Link>
          <button
            onClick={handleDownloadInvoice}
            disabled={downloading}
            style={{
              background: downloading ? "#F3F4F6" : "linear-gradient(135deg, #1e293b, #334155)",
              color: downloading ? "#9CA3AF" : "white",
              border: "none", borderRadius: 10,
              padding: "12px 24px", fontSize: 13,
              fontWeight: 700, cursor: downloading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            {downloading ? "Generating..." : "Download Invoice"}
          </button>
          <Link
            to="/products"
            style={{
              background: "linear-gradient(180deg, #FFD814, #F7CA00)",
              color: "#111", border: "1px solid #FCD200",
              borderRadius: 10, padding: "12px 24px",
              fontSize: 13, fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
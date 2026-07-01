import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetSingleOrderQuery,
  useCancelOrderMutation,
} from "../features/order/orderApi";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import { formatPrice } from "../utils/priceHelper";
import jsPDF from "jspdf";

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
  { key: "confirmed", label: "Order Confirmed", icon: "✅" },
  { key: "processing", label: "Processing", icon: "⚙️" },
  { key: "shipped", label: "Shipped", icon: "🚚" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
  { key: "delivered", label: "Delivered", icon: "📦" },
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
    confirmed: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
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
    confirmed: "Order Confirmed",
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

const downloadInvoice = (order, country) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  const fmtPrice = (amt) => {
    const symbol = country?.currency?.symbol || "₹";
    const rate = country?.exchangeRate || 1;
    const converted = amt * rate;
    return `${symbol}${converted.toFixed(2)}`;
  };

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
  doc.text(`Currency: ${country?.currency?.code || "INR"}`, pageW - 20, 30, {
    align: "right",
  });

  y = 55;
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details", 20, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  y += 7;
  doc.text("Invoice No:", 20, y);
  doc.setTextColor(17, 17, 17);
  doc.text(`${order.orderNumber}`, 60, y);

  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.text("Order Date:", 20, y);
  doc.setTextColor(17, 17, 17);
  doc.text(formatDateShort(order.createdAt), 60, y);

  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.text("Payment:", 20, y);
  doc.setTextColor(17, 17, 17);
  doc.text(
    order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment",
    60,
    y
  );

  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.text("Status:", 20, y);
  doc.setTextColor(17, 17, 17);
  doc.text(getStatusLabel(order.orderStatus), 60, y);

  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.text("Country:", 20, y);
  doc.setTextColor(17, 17, 17);
  doc.text(country?.name || "India", 60, y);

  if (order.couponCode) {
    y += 6;
    doc.setTextColor(100, 100, 100);
    doc.text("Coupon:", 20, y);
    doc.setTextColor(22, 163, 74);
    doc.setFont("helvetica", "bold");
    doc.text(order.couponCode, 60, y);
    doc.setFont("helvetica", "normal");
  }

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
    `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`,
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
    doc.text(fmtPrice(item.price), 160, y);
    doc.setFont("helvetica", "bold");
    doc.text(fmtPrice(item.price * item.quantity), pageW - 20, y, {
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
  doc.text(fmtPrice(order.subtotal), pageW - 20, y, { align: "right" });

  if (order.discount > 0) {
    y += 7;
    doc.setTextColor(100, 100, 100);
    if (order.couponCode) {
      doc.text(`Coupon (${order.couponCode}):`, summaryX, y);
    } else {
      doc.text("Discount:", summaryX, y);
    }
    doc.setTextColor(22, 163, 74);
    doc.setFont("helvetica", "bold");
    doc.text(`- ${fmtPrice(order.discount)}`, pageW - 20, y, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
  }

  y += 7;
  doc.setTextColor(100, 100, 100);
  doc.text("Shipping:", summaryX, y);
  doc.setTextColor(22, 163, 74);
  doc.text(
    order.shippingCharge === 0 ? "FREE" : fmtPrice(order.shippingCharge),
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
  doc.text(fmtPrice(order.total), pageW - 20, y, { align: "right" });

  if (order.discount > 0) {
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(22, 163, 74);
    doc.text(`You saved ${fmtPrice(order.discount)}!`, pageW - 20, y, {
      align: "right",
    });
  }

  y += 20;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y - 6, pageW - 30, 20, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("Thank you for shopping with E-Commerce!", pageW / 2, y + 2, {
    align: "center",
  });
  doc.text("This is a computer generated invoice.", pageW / 2, y + 8, {
    align: "center",
  });

  doc.save(`Invoice-${order.orderNumber}.pdf`);
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCountry, isUserCountry } = useSelector((state) => state.country);
  const { data, isLoading, error } = useGetSingleOrderQuery(id);
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [downloading, setDownloading] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-9 h-9 border-[3px] border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-12 rounded-2xl border border-gray-200 max-w-sm w-full">
          <p className="text-6xl mb-4">😕</p>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Order not found</h2>
          <p className="text-gray-500 text-sm mb-6">This order doesn't exist or you don't have access.</p>
          <Link to="/orders" className="bg-gray-900 text-white px-6 py-3 rounded-xl no-underline font-bold text-sm">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const order = data.data;
  const orderCountry = order.country?.currency ? order.country : currentCountry;
  const statusColor = getStatusColor(order.orderStatus);
  const steps = getStatusSteps(order.orderStatus);
  const currentStepIndex = getStatusIndex(steps, order.orderStatus);
  const canCancel = ["confirmed", "processing"].includes(order.orderStatus);
  const hasCoupon = !!order.couponCode;
  const savings = order.discount || 0;

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
      downloadInvoice(order, orderCountry);
    } catch (err) {
      console.log("Invoice error:", err);
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-3 sm:px-4">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/orders")}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-[13px] font-semibold text-gray-700 cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition font-[inherit]"
          >
            ← My Orders
          </button>
          <span className="text-gray-300 text-sm">/</span>
          <span className="text-gray-500 text-[13px] font-semibold">{order.orderNumber}</span>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-extrabold text-gray-900 m-0">Order Details</h1>
              {order.country?.code && order.country.code !== "IN" && (
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-bold">
                  {order.country.flag || "🌍"} {order.country.currency?.code || ""}
                </span>
              )}
              {hasCoupon && (
                <span className="text-[10px] bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-extrabold">
                  🎟️ {order.couponCode}
                </span>
              )}
              {isUserCountry && order.country?.code === currentCountry.code && (
                <span className="inline-flex items-center bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                  YOUR PROFILE
                </span>
              )}
            </div>
            <p className="text-gray-500 text-[13px] m-0">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="px-4 py-1.5 rounded-full text-[13px] font-bold"
              style={{
                background: statusColor.bg,
                color: statusColor.text,
                border: `1px solid ${statusColor.border}`,
              }}
            >
              {getStatusLabel(order.orderStatus)}
            </span>
            <div className="text-right">
              <span className="text-xl font-extrabold text-[#B12704] block">
                {formatPrice(order.total, orderCountry)}
              </span>
              {savings > 0 && (
                <span className="text-[11px] text-green-600 font-extrabold block">
                  💰 Saved {formatPrice(savings, orderCountry)}
                </span>
              )}
              {orderCountry.code !== "IN" && (
                <span className="text-[10px] text-gray-400">
                  ≈ ₹{Math.round(order.total).toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <button
              onClick={handleDownloadInvoice}
              disabled={downloading}
              className="bg-gradient-to-br from-gray-800 to-gray-900 text-white border-none rounded-xl px-4 py-2.5 text-[13px] font-bold cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition font-[inherit]"
            >
              {downloading ? "Generating..." : "📥 Download Invoice"}
            </button>
          </div>
        </div>

        {hasCoupon && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-green-200">
                🎟️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-base font-extrabold text-green-800 m-0">Coupon Applied: {order.couponCode}</p>
                  <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">SAVED</span>
                </div>
                <p className="text-sm text-green-700 m-0 font-semibold">
                  You saved <strong className="text-lg">{formatPrice(savings, orderCountry)}</strong> on this order!
                </p>
                {order.couponType && (
                  <p className="text-xs text-green-600 m-0 mt-0.5">
                    Type: {order.couponType === "percentage" ? "Percentage Discount" : order.couponType === "fixed" ? "Fixed Amount Off" : "Free Shipping"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-extrabold text-gray-900 m-0 flex items-center gap-2">📍 Order Status</p>
            <span className="text-xs text-gray-500 font-semibold">#{order.orderNumber}</span>
          </div>
          <div className="p-5">
            {order.orderStatus === "cancelled" ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-full bg-green-100 border-[3px] border-green-500 flex items-center justify-center text-lg">📋</div>
                    <span className="text-[10px] font-semibold text-green-600">Placed</span>
                  </div>
                  <div className="flex-1 h-[3px] rounded-full bg-red-200" />
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-full bg-red-100 border-[3px] border-red-500 flex items-center justify-center text-lg">❌</div>
                    <span className="text-[10px] font-semibold text-red-600">Cancelled</span>
                  </div>
                </div>
                {order.cancelReason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
                    <p className="text-xs font-bold text-red-800 m-0 mb-1">Cancellation Reason</p>
                    <p className="text-[13px] text-red-700 m-0">{order.cancelReason}</p>
                    {order.cancelledAt && (
                      <p className="text-[11px] text-red-500 mt-1 m-0">Cancelled on {formatDateShort(order.cancelledAt)}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-0">
                  {steps.map((step, index) => {
                    const isDone = index <= currentStepIndex;
                    const isActive = index === currentStepIndex;
                    return (
                      <div
                        key={step.key}
                        className="flex items-center"
                        style={{ flex: index < steps.length - 1 ? 1 : "unset" }}
                      >
                        <div className="flex flex-col items-center gap-1.5 min-w-[56px]">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all"
                            style={{
                              background: isDone ? (isActive ? statusColor.bg : "#DCFCE7") : "#F3F4F6",
                              border: `3px solid ${isDone ? (isActive ? statusColor.border : "#22C55E") : "#E5E7EB"}`,
                              boxShadow: isActive ? `0 0 0 4px ${statusColor.bg}` : "none",
                            }}
                          >
                            {step.icon}
                          </div>
                          <span
                            className="text-[10px] text-center leading-tight max-w-[60px]"
                            style={{
                              fontWeight: isActive ? 800 : 600,
                              color: isDone ? (isActive ? statusColor.text : "#16A34A") : "#9CA3AF",
                            }}
                          >
                            {step.label}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className="flex-1 h-[3px] rounded-full transition-all"
                            style={{ background: index < currentStepIndex ? "#22C55E" : "#E5E7EB" }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                {order.orderStatus === "delivered" && order.deliveredAt && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-xl">🎉</span>
                    <div>
                      <p className="text-[13px] font-bold text-green-800 m-0">Order Delivered!</p>
                      <p className="text-[11px] text-green-600 m-0">Delivered on {formatDateShort(order.deliveredAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-extrabold text-gray-900 m-0 flex items-center gap-2">
              🛍️ Order Items ({order.items.length})
            </p>
            <span className="text-sm font-extrabold text-[#B12704]">
              {formatPrice(order.subtotal, orderCountry)}
            </span>
          </div>
          <div>
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-4 items-center px-5 py-4 border-b border-gray-50 last:border-0">
                <img
                  src={item.image || PLACEHOLDER_MEDIUM}
                  alt={item.name}
                  className="w-[72px] h-[72px] object-cover rounded-xl border border-gray-200 shrink-0"
                  onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 m-0 mb-1 leading-snug">{item.name}</p>
                  <p className="text-xs text-gray-400 m-0 mb-1.5">Sold by: {item.storeName || "Vendor"}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-semibold">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-xs text-gray-500">×</span>
                    <span className="text-[13px] text-gray-700 font-semibold">
                      {formatPrice(item.price, orderCountry)}
                    </span>
                  </div>
                </div>
                <p className="text-base font-extrabold text-[#B12704] m-0 shrink-0">
                  {formatPrice(item.price * item.quantity, orderCountry)}
                </p>
              </div>
            ))}

            <div className="px-5 py-4 border-t-2 border-gray-100 bg-gray-50">
              <div className="flex flex-col gap-2 max-w-[320px] ml-auto">
                <div className="flex justify-between">
                  <span className="text-[13px] text-gray-500">Subtotal</span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    {formatPrice(order.subtotal, orderCountry)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between items-center bg-green-50 -mx-2 px-3 py-2 rounded-lg border border-green-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🎟️</span>
                      <span className="text-[13px] text-green-700 font-extrabold">
                        {order.couponCode ? `${order.couponCode}` : "Discount"}
                      </span>
                    </div>
                    <span className="text-[13px] font-extrabold text-green-600">
                      − {formatPrice(order.discount, orderCountry)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[13px] text-gray-500">Shipping</span>
                  <span className="text-[13px] font-semibold text-green-600">
                    {order.shippingCharge === 0 ? "FREE" : formatPrice(order.shippingCharge, orderCountry)}
                  </span>
                </div>
                <div className="border-t-2 border-gray-200 pt-2 flex justify-between items-center">
                  <span className="text-[15px] font-extrabold text-gray-900">Total</span>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-[#B12704]">
                      {formatPrice(order.total, orderCountry)}
                    </span>
                    {savings > 0 && (
                      <p className="text-[11px] text-green-600 font-extrabold m-0 mt-0.5">
                        💰 You saved {formatPrice(savings, orderCountry)}
                      </p>
                    )}
                    {orderCountry.code !== "IN" && (
                      <p className="text-[10px] text-gray-400 m-0 mt-0.5">
                        ≈ ₹{Math.round(order.total).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-extrabold text-gray-900 m-0 flex items-center gap-2">📦 Shipping Address</p>
            </div>
            <div className="p-5">
              <p className="text-sm font-bold text-gray-900 m-0 mb-1">{order.shippingAddress.fullName}</p>
              <p className="text-[13px] text-gray-500 m-0">{order.shippingAddress.street}</p>
              <p className="text-[13px] text-gray-500 m-0">
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
              <p className="text-[13px] text-gray-500 m-0">
                {order.shippingAddress.country || "India"} — {order.shippingAddress.postalCode}
              </p>
              <p className="text-[13px] text-gray-500 mt-2 m-0">📞 {order.shippingAddress.phone}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-extrabold text-gray-900 m-0 flex items-center gap-2">💳 Payment Info</p>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-[13px] text-gray-500">Method</span>
                <span className="text-[13px] font-bold text-gray-900">
                  {order.paymentMethod === "cod" ? "💵 Cash on Delivery" : "💳 Online"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-gray-500">Status</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    order.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : order.paymentStatus === "refunded"
                      ? "bg-pink-100 text-pink-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-gray-500">Order Date</span>
                <span className="text-[13px] font-semibold text-gray-900">{formatDateShort(order.createdAt)}</span>
              </div>
              {hasCoupon && (
                <div className="flex justify-between">
                  <span className="text-[13px] text-gray-500">Coupon Used</span>
                  <span className="text-[13px] font-bold text-green-600">🎟️ {order.couponCode}</span>
                </div>
              )}
              {savings > 0 && (
                <div className="flex justify-between">
                  <span className="text-[13px] text-gray-500">Total Savings</span>
                  <span className="text-[13px] font-bold text-green-600">
                    {formatPrice(savings, orderCountry)}
                  </span>
                </div>
              )}
              {order.country?.code && (
                <div className="flex justify-between">
                  <span className="text-[13px] text-gray-500">Country</span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    {order.country.flag || "🌍"} {order.country.name || order.country.code}
                  </span>
                </div>
              )}
              {order.country?.currency && (
                <div className="flex justify-between">
                  <span className="text-[13px] text-gray-500">Currency</span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    {order.country.currency.symbol} {order.country.currency.code}
                  </span>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex justify-between">
                  <span className="text-[13px] text-gray-500">Delivered</span>
                  <span className="text-[13px] font-semibold text-green-600">{formatDateShort(order.deliveredAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-extrabold text-gray-900 m-0 flex items-center gap-2">📝 Order Notes</p>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-gray-600 m-0 leading-relaxed">{order.notes}</p>
            </div>
          </div>
        )}

        {canCancel && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-extrabold text-gray-900 m-0 flex items-center gap-2">⚠️ Cancel Order</p>
            </div>
            <div className="p-5">
              {!showCancelForm ? (
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-[13px] text-gray-500 m-0">
                      You can cancel this order since it is still in{" "}
                      <strong>{getStatusLabel(order.orderStatus)}</strong> stage.
                    </p>
                    <p className="text-xs text-gray-400 mt-1 m-0">Once shipped, orders cannot be cancelled.</p>
                  </div>
                  <button
                    onClick={() => setShowCancelForm(true)}
                    className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-5 py-2.5 text-[13px] font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]"
                  >
                    Cancel Order
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-[13px] font-bold text-gray-900 mb-3 m-0">Are you sure you want to cancel?</p>
                  <textarea
                    placeholder="Reason for cancellation (optional)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 outline-none resize-vertical font-[inherit] box-border mb-3"
                  />
                  {cancelError && <p className="text-xs text-red-500 font-semibold mb-3 m-0">⚠️ {cancelError}</p>}
                  <div className="flex gap-2.5">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="bg-red-600 text-white border-none rounded-xl px-5 py-2.5 text-[13px] font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2 font-[inherit]"
                    >
                      {cancelling && (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {cancelling ? "Cancelling..." : "Yes, Cancel Order"}
                    </button>
                    <button
                      onClick={() => { setShowCancelForm(false); setCancelReason(""); setCancelError(""); }}
                      className="bg-gray-100 text-gray-700 border border-gray-200 rounded-xl px-5 py-2.5 text-[13px] font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                    >
                      Keep Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Link
            to="/orders"
            className="bg-white text-gray-700 border border-gray-200 rounded-xl px-5 py-3 text-[13px] font-bold no-underline flex items-center gap-2 hover:bg-gray-50 transition"
          >
            ← Back to Orders
          </Link>
          <button
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="bg-gradient-to-br from-gray-800 to-gray-900 text-white border-none rounded-xl px-5 py-3 text-[13px] font-bold cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition font-[inherit]"
          >
            📥 {downloading ? "Generating..." : "Download Invoice"}
          </button>
          <Link
            to="/products"
            className="bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border border-yellow-400 rounded-xl px-5 py-3 text-[13px] font-bold no-underline hover:brightness-95 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
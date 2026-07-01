import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetMyOrdersQuery,
  useCancelOrderMutation,
} from "../features/order/orderApi";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import { formatPrice } from "../utils/priceHelper";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getStatusStyle = (status) => {
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

const getStatusIcon = (status) => {
  const icons = {
    confirmed: "✅",
    processing: "⚙️",
    shipped: "🚚",
    out_for_delivery: "🛵",
    delivered: "📦",
    cancelled: "❌",
    returned: "↩️",
    refunded: "💰",
  };
  return icons[status] || "📦";
};

const OrdersPage = () => {
  const { currentCountry, isUserCountry } = useSelector((state) => state.country);
  const [page, setPage] = useState(1);
  const [filterCoupons, setFilterCoupons] = useState(false);
  const { data, isLoading } = useGetMyOrdersQuery({ page, limit: 10 });
  const [cancelOrder] = useCancelOrderMutation();
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const allOrders = data?.data || [];
  const orders = filterCoupons
    ? allOrders.filter((o) => o.couponCode)
    : allOrders;
  const pagination = data?.pagination;

  const totalCouponSavings = allOrders.reduce(
    (sum, o) => sum + (o.discount || 0),
    0
  );
  const couponOrdersCount = allOrders.filter((o) => o.couponCode).length;

  const getOrderCountry = (order) => {
    if (order.country?.currency) return order.country;
    return currentCountry;
  };

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
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-9 h-9 border-[3px] border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (allOrders.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-12 sm:p-14 rounded-2xl border border-gray-200 max-w-[440px] w-full">
          <p className="text-6xl mb-4">📦</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
            No orders yet
          </h2>
          <p className="text-gray-500 text-sm mb-7">
            You haven't placed any orders yet. Start shopping!
          </p>
          <Link
            to="/products"
            className="inline-block bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 no-underline px-8 py-3 rounded-xl font-bold text-sm border border-yellow-400 hover:brightness-95 transition"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-5 sm:py-6 px-3 sm:px-4">
      <div className="max-w-[860px] mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">
                My Orders
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#D85A30] border border-orange-200 px-2.5 py-1 rounded-full text-xs font-bold">
                {currentCountry.flag} {currentCountry.currency.code}
              </span>
              {isUserCountry && (
                <span className="inline-flex items-center bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                  YOUR PROFILE
                </span>
              )}
            </div>
            <p className="text-gray-500 text-[13px] mt-1 m-0">
              {pagination?.total || allOrders.length}{" "}
              {(pagination?.total || allOrders.length) === 1 ? "order" : "orders"} placed
            </p>
          </div>
          <Link
            to="/products"
            className="bg-white text-gray-700 no-underline border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-gray-50 transition"
          >
            Continue Shopping
          </Link>
        </div>

        {totalCouponSavings > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl px-5 py-4 mb-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-2xl shrink-0">
                💰
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-green-800 m-0">
                  Total Coupon Savings
                </p>
                <p className="text-xl font-black text-green-700 m-0 mt-0.5">
                  {formatPrice(totalCouponSavings, currentCountry)}
                </p>
                <p className="text-[11px] text-green-600 m-0 mt-0.5">
                  Saved across {couponOrdersCount} order{couponOrdersCount > 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setFilterCoupons(!filterCoupons)}
                className={`text-xs font-bold px-4 py-2 rounded-xl border-2 cursor-pointer transition font-[inherit] ${
                  filterCoupons
                    ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                    : "bg-white text-green-700 border-green-300 hover:bg-green-100"
                }`}
              >
                {filterCoupons ? "✕ Show All Orders" : "🎟️ Show Coupon Orders Only"}
              </button>
            </div>
          </div>
        )}

        {filterCoupons && orders.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-4xl mb-3">🎟️</p>
            <p className="text-sm font-bold text-gray-900 m-0">No coupon orders found</p>
            <p className="text-xs text-gray-500 mt-1 m-0">Try applying coupons at checkout to save money!</p>
          </div>
        )}

        {orders.map((order) => {
          const statusStyle = getStatusStyle(order.orderStatus);
          const isCancelOpen = cancellingId === order._id;
          const orderCountry = getOrderCountry(order);
          const hasCoupon = !!order.couponCode;
          const savings = order.discount || 0;

          return (
            <div
              key={order._id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden mb-4 ${
                hasCoupon ? "border-green-200" : "border-gray-100"
              }`}
            >
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-extrabold text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1"
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`,
                      }}
                    >
                      {getStatusIcon(order.orderStatus)}{" "}
                      {getStatusLabel(order.orderStatus)}
                    </span>
                    {hasCoupon && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-extrabold">
                        🎟️ {order.couponCode}
                      </span>
                    )}
                    {order.country?.code && order.country.code !== "IN" && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                        {order.country.flag || "🌍"}{" "}
                        {order.country.currency?.code || ""}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    Placed on {formatDate(order.createdAt)} ·{" "}
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-extrabold text-[#B12704] block">
                      {formatPrice(order.total, orderCountry)}
                    </span>
                    {savings > 0 && (
                      <p className="text-[10px] text-green-600 font-extrabold m-0">
                        💰 Saved {formatPrice(savings, orderCountry)}
                      </p>
                    )}
                    {orderCountry.code !== "IN" && (
                      <span className="text-[10px] text-gray-400">
                        ≈ ₹{Math.round(order.total).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/orders/${order._id}`}
                    className="bg-[#131921] text-white no-underline rounded-lg px-4 py-2 text-xs font-bold hover:bg-gray-800 transition"
                  >
                    View Details →
                  </Link>
                </div>
              </div>

              {hasCoupon && (
                <div className="px-5 py-2.5 bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-b border-green-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">🎟️</span>
                    <p className="text-[11px] text-green-700 m-0">
                      <strong>Coupon: {order.couponCode}</strong> ·{" "}
                      <span className="text-green-600 font-bold">
                        You saved {formatPrice(savings, orderCountry)}
                        {order.couponType === "percentage" && " (%)"}
                        {order.couponType === "free_shipping" && " (Free Shipping)"}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div>
                {order.items.slice(0, 2).map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-center px-5 py-3 border-b border-gray-50"
                  >
                    <div className="w-[52px] h-[52px] bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={item.image || PLACEHOLDER_MEDIUM}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_MEDIUM;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 m-0 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 m-0">
                        {item.storeName} · Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="text-[13px] font-bold text-gray-700 shrink-0">
                      {formatPrice(item.price * item.quantity, orderCountry)}
                    </span>
                  </div>
                ))}

                {order.items.length > 2 && (
                  <div className="px-5 py-2.5 bg-gray-50">
                    <Link
                      to={`/orders/${order._id}`}
                      className="text-xs text-[#D85A30] no-underline font-semibold hover:underline"
                    >
                      + {order.items.length - 2} more item
                      {order.items.length - 2 > 1 ? "s" : ""} — View all
                    </Link>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  <span>
                    {order.paymentMethod === "cod"
                      ? "💵 Cash on Delivery"
                      : "💳 Online"}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span
                    className={`font-bold ${
                      order.paymentStatus === "paid"
                        ? "text-green-600"
                        : order.paymentStatus === "refunded"
                        ? "text-pink-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {order.paymentStatus.charAt(0).toUpperCase() +
                      order.paymentStatus.slice(1)}
                  </span>
                </div>

                <div className="flex gap-2">
                  {["confirmed", "processing"].includes(order.orderStatus) && (
                    <button
                      onClick={() => {
                        setCancellingId(isCancelOpen ? null : order._id);
                        setCancelReason("");
                        setCancelError("");
                      }}
                      className={`border rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer transition font-[inherit] ${
                        isCancelOpen
                          ? "bg-red-100 text-red-700 border-red-300"
                          : "bg-white text-red-500 border-red-200 hover:bg-red-50"
                      }`}
                    >
                      {isCancelOpen ? "✕ Close" : "Cancel Order"}
                    </button>
                  )}
                </div>
              </div>

              {isCancelOpen && (
                <div className="px-5 py-4 border-t border-red-100 bg-red-50">
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    Confirm cancellation
                  </p>
                  <textarea
                    placeholder="Reason for cancellation (optional)"
                    value={cancelReason}
                    onChange={(e) => {
                      setCancelReason(e.target.value);
                      setCancelError("");
                    }}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 outline-none resize-none bg-white font-[inherit] box-border mb-3"
                  />
                  {cancelError && (
                    <p className="text-xs text-red-500 font-semibold mb-3 m-0">
                      ⚠️ {cancelError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancel(order._id)}
                      disabled={cancelLoading}
                      className="bg-red-600 text-white border-none rounded-lg px-5 py-2 text-xs font-bold cursor-pointer disabled:opacity-60 font-[inherit] flex items-center gap-1.5"
                    >
                      {cancelLoading && (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
                    </button>
                    <button
                      onClick={() => {
                        setCancellingId(null);
                        setCancelReason("");
                        setCancelError("");
                      }}
                      className="bg-white text-gray-700 border border-gray-200 rounded-lg px-5 py-2 text-xs font-bold cursor-pointer font-[inherit]"
                    >
                      Keep Order
                    </button>
                  </div>
                </div>
              )}

              {order.cancelReason && order.orderStatus === "cancelled" && (
                <div className="px-5 py-2.5 border-t border-red-100 bg-red-50">
                  <p className="text-xs text-red-600 font-semibold m-0">
                    ❌ Cancelled: {order.cancelReason}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-1.5 mt-6 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition font-[inherit]"
            >
              ← Prev
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold cursor-pointer border transition-all font-[inherit] ${
                    page === p
                      ? "bg-[#131921] text-white border-[#131921]"
                      : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition font-[inherit]"
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
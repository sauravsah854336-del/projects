import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetMyOrdersQuery,
  useCancelOrderMutation,
} from "../features/order/orderApi";

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

const getStatusColor = (status) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    out_for_delivery: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-gray-100 text-gray-700",
    refunded: "bg-pink-100 text-pink-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
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

const OrdersPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetMyOrdersQuery({ page, limit: 10 });
  const [cancelOrder] = useCancelOrderMutation();
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const orders = data?.data || [];
  const pagination = data?.pagination;

  const handleCancel = async (id) => {
    try {
      await cancelOrder({ id, reason: cancelReason }).unwrap();
      setCancellingId(null);
      setCancelReason("");
    } catch (err) {
      console.log(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📦</p>
          <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">
            You haven't placed any orders yet.
          </p>
          <Link
            to="/products"
            className="bg-black text-white px-6 py-3 rounded-xl no-underline inline-block"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-bold text-gray-900">{order.orderNumber}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    order.orderStatus
                  )}`}
                >
                  {getStatusLabel(order.orderStatus)}
                </span>
                <span className="text-lg font-bold text-[#D85A30]">
                  {formatRupee(order.total)}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <img
                    src={
                      item.image ||
                      "https://placehold.co/60?text=Product"
                    }
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => {
                      e.target.src =
                        "https://placehold.co/60?text=Product";
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity} •{" "}
                      {formatRupee(item.price * item.quantity)}
                    </p>
                    <p className="text-xs text-gray-400">{item.storeName}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                <span>Payment: </span>
                <span className="font-medium text-gray-900 capitalize">
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : "Online"}
                </span>
                <span className="mx-2">•</span>
                <span
                  className={
                    order.paymentStatus === "paid"
                      ? "text-green-600 font-medium"
                      : "text-yellow-600 font-medium"
                  }
                >
                  {order.paymentStatus.charAt(0).toUpperCase() +
                    order.paymentStatus.slice(1)}
                </span>
              </div>

              <div className="flex gap-2">
                {["pending", "processing"].includes(order.orderStatus) && (
                  <button
                    onClick={() =>
                      setCancellingId(
                        cancellingId === order._id ? null : order._id
                      )
                    }
                    className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {cancellingId === order._id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Reason for cancellation (optional)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none"
                />
                <button
                  onClick={() => handleCancel(order._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setCancellingId(null)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
                >
                  Keep
                </button>
              </div>
            )}

            {order.cancelReason && (
              <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-xs text-red-600">
                  Cancel Reason: {order.cancelReason}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  page === p
                    ? "bg-black text-white"
                    : "border border-gray-300"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
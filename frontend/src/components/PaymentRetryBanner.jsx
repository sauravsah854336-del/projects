import { useState, useEffect } from "react";
import { useRetryPaymentMutation } from "../features/payment/paymentApi";
import { openCashfreeCheckout } from "../utils/cashfree";
import { toast } from "./Toast";

const formatTimeLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

const PaymentRetryBanner = ({ order, onSuccess }) => {
  const [retryPayment, { isLoading }] = useRetryPaymentMutation();
  const [timeLeft, setTimeLeft] = useState(formatTimeLeft(order.paymentExpiresAt));

  useEffect(() => {
    if (!order.paymentExpiresAt) return;

    const interval = setInterval(() => {
      setTimeLeft(formatTimeLeft(order.paymentExpiresAt));
    }, 60000);

    return () => clearInterval(interval);
  }, [order.paymentExpiresAt]);

  const needsRetry =
    order.paymentMethod === "online" &&
    order.paymentStatus !== "paid" &&
    order.orderStatus !== "cancelled" &&
    order.orderStatus !== "delivered";

  if (!needsRetry) return null;

  const isExpired = order.paymentStatus === "expired";
  const attemptCount = order.paymentAttempts || 0;
  const maxAttempts = 5;
  const remainingAttempts = maxAttempts - attemptCount;

  const handleRetry = async () => {
    try {
      const res = await retryPayment({ orderId: order._id }).unwrap();

      if (!res.success || !res.data?.paymentSessionId) {
        throw new Error(res.message || "Failed to create payment session");
      }

      toast.success("Redirecting to payment...");

      const returnUrl = `${window.location.origin}/payment/status?order_id=${order._id}`;

      await openCashfreeCheckout({
        paymentSessionId: res.data.paymentSessionId,
        returnUrl,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Failed to retry payment";
      toast.error(msg);
    }
  };

  if (remainingAttempts <= 0) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl shrink-0">
            🚫
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-red-800 m-0">Payment attempts exhausted</p>
            <p className="text-xs text-red-700 mt-1 m-0 leading-relaxed">
              You've reached the maximum of {maxAttempts} payment attempts for this order.
              Please contact support or place a new order.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-4 sm:p-5 border-2 ${
      isExpired
        ? "bg-gradient-to-br from-orange-50 to-red-50 border-orange-300"
        : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300"
    }`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-md ${
          isExpired ? "bg-orange-500" : "bg-blue-500"
        }`}>
          {isExpired ? "⚠️" : "💳"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className={`text-sm sm:text-base font-extrabold m-0 ${
              isExpired ? "text-orange-900" : "text-blue-900"
            }`}>
              {isExpired ? "Payment expired — Retry now" : "Complete your payment"}
            </p>
            {timeLeft && isExpired && (
              <span className="text-[10px] font-bold text-orange-800 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full">
                ⏰ {timeLeft}
              </span>
            )}
            {attemptCount > 0 && (
              <span className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                Attempt {attemptCount + 1}/{maxAttempts}
              </span>
            )}
          </div>

          <p className={`text-xs sm:text-sm m-0 leading-relaxed ${
            isExpired ? "text-orange-700" : "text-blue-700"
          }`}>
            {isExpired
              ? `Your previous payment session expired. Complete payment within 24 hours to secure your order, otherwise it will be auto-cancelled.`
              : `Your order is waiting for payment. Complete it now to confirm your order.`}
          </p>

          <div className="mt-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide m-0">Amount Due</p>
                <p className="text-base font-extrabold text-gray-900 m-0">₹{order.total.toLocaleString("en-IN")}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide m-0">Order</p>
                <p className="text-xs font-bold text-gray-700 m-0 font-mono">{order.orderNumber}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-extrabold text-sm text-white border-none cursor-pointer transition-all shadow-lg font-[inherit] ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] hover:brightness-110 shadow-blue-900/30"
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Setting up payment...
                </>
              ) : (
                <>
                  🔒 Pay Now ₹{order.total.toLocaleString("en-IN")}
                </>
              )}
            </button>

            {remainingAttempts <= 2 && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5">
                ⚠️ {remainingAttempts} attempt{remainingAttempts > 1 ? "s" : ""} remaining
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentRetryBanner;
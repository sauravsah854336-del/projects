import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useVerifyPaymentMutation } from "../features/payment/paymentApi";
import { toast } from "../components/Toast";

const PaymentStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [verifyPayment] = useVerifyPaymentMutation();
  const [status, setStatus] = useState("verifying");
  const [order, setOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      setErrorMsg("No order ID found");
      return;
    }

    const verify = async () => {
      try {
        const res = await verifyPayment({ orderId }).unwrap();
        const paymentStatus = res.data?.paymentStatus;
        setOrder(res.data?.order);

        if (paymentStatus === "paid") {
          setStatus("success");
          toast.success("Payment successful! 🎉");
        } else if (paymentStatus === "failed") {
          setStatus("failed");
          setErrorMsg(res.message || "Payment failed");
        } else if (paymentStatus === "pending" && retryCount < 3) {
          setTimeout(() => setRetryCount((c) => c + 1), 3000);
        } else {
          setStatus("pending");
        }
      } catch (err) {
        setStatus("failed");
        setErrorMsg(err?.data?.message || "Verification failed");
      }
    };

    verify();
  }, [orderId, retryCount, verifyPayment]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200 p-8 sm:p-10 text-center">

        {status === "verifying" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">💳</div>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
              Verifying Payment
            </h1>
            <p className="text-sm text-gray-500 m-0">
              Please wait while we confirm your payment with Cashfree...
            </p>
            <p className="text-xs text-gray-400 mt-4">
              Do not close or refresh this page
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-base shadow-md">
                🎉
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-sm text-gray-500 mb-6 m-0">
              Your order has been confirmed
            </p>

            {order && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-gray-500">Order Number</span>
                  <span className="text-xs font-bold text-gray-900">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-gray-500">Amount Paid</span>
                  <span className="text-xs font-bold text-green-600">₹{order.total?.toFixed(2)}</span>
                </div>
                {order.paymentDetails?.paymentMode && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Payment Mode</span>
                    <span className="text-xs font-bold text-gray-900 uppercase">
                      {order.paymentDetails.paymentMode}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => navigate(`/orders/${orderId}`)}
                className="w-full bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] hover:brightness-110 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all border-none cursor-pointer font-[inherit]"
              >
                View Order Details
              </button>
              <button
                onClick={() => navigate("/products")}
                className="w-full bg-white text-gray-700 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 hover:bg-gray-50 transition-all cursor-pointer font-[inherit]"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
              Payment Failed
            </h1>
            <p className="text-sm text-gray-500 mb-2 m-0">
              {errorMsg || "Your payment could not be processed"}
            </p>
            <p className="text-xs text-gray-400 mb-6 m-0">
              Don't worry — no amount has been deducted. You can try again.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => navigate("/checkout")}
                className="w-full bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] hover:brightness-110 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all border-none cursor-pointer font-[inherit]"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/orders")}
                className="w-full bg-white text-gray-700 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 hover:bg-gray-50 transition-all cursor-pointer font-[inherit]"
              >
                Go to Orders
              </button>
            </div>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-24 h-24 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
              Payment Pending
            </h1>
            <p className="text-sm text-gray-500 mb-6 m-0">
              Your payment is being processed. You'll receive an email once confirmed.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => navigate(`/orders/${orderId}`)}
                className="w-full bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] hover:brightness-110 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all border-none cursor-pointer font-[inherit]"
              >
                Check Order Status
              </button>
              <Link
                to="/products"
                className="w-full block bg-white text-gray-700 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 hover:bg-gray-50 transition-all no-underline text-center font-[inherit]"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default PaymentStatus;
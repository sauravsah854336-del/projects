import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetCartQuery } from "../features/cart/cartApi";
import { usePlaceOrderMutation } from "../features/order/orderApi";
import { useSelector } from "react-redux";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: cartData } = useGetCartQuery();
  const [placeOrder, { isLoading }] = usePlaceOrderMutation();

  const cart = cartData?.data;
  const items = cart?.items || [];

  const [form, setForm] = useState({
    fullName: user?.firstName + " " + (user?.lastName || "") || "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [formError, setFormError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (
      !form.fullName ||
      !form.phone ||
      !form.street ||
      !form.city ||
      !form.state ||
      !form.postalCode
    ) {
      setFormError("All address fields are required");
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(form.phone)) {
      setFormError("Please enter a valid 10-digit phone number");
      return;
    }

    if (items.length === 0) {
      setFormError("Your cart is empty");
      return;
    }

    try {
      const res = await placeOrder({
        shippingAddress: form,
        paymentMethod,
      }).unwrap();

      setOrderSuccess(res.data);
    } catch (err) {
      setFormError(err?.data?.message || "Failed to place order");
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Placed!
          </h2>
          <p className="text-gray-500 mb-2">
            Your order has been placed successfully.
          </p>
          <p className="text-sm font-medium text-gray-700 mb-6">
            Order Number:{" "}
            <span className="text-[#D85A30]">{orderSuccess.orderNumber}</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/orders")}
              className="flex-1 bg-black text-white py-3 rounded-xl font-medium"
            >
              View Orders
            </button>
            <button
              onClick={() => navigate("/products")}
              className="flex-1 border border-gray-300 py-3 rounded-xl font-medium"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate("/products")}
          className="bg-black text-white px-6 py-3 rounded-xl"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-4">Shipping Address</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Full Name *
                  </label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-black"
                    placeholder="John Doe"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Phone Number *
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-black"
                    placeholder="9876543210"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Street Address *
                  </label>
                  <input
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-black"
                    placeholder="123 Main Street, Apartment 4B"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    City *
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-black"
                    placeholder="Mumbai"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    State *
                  </label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-black"
                    placeholder="Maharashtra"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Postal Code *
                  </label>
                  <input
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-black"
                    placeholder="400001"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Country
                  </label>
                  <input
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none focus:border-black bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "cod"
                    ? "border-black bg-black/[0.02]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="accent-black"
                />
                <div>
                  <p className="font-medium text-gray-900">Cash on Delivery</p>
                  <p className="text-sm text-gray-500">
                    Pay when your order arrives
                  </p>
                </div>
                <span className="ml-auto text-2xl">💵</span>
              </label>

              <label
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "online"
                    ? "border-black bg-black/[0.02]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                  className="accent-black"
                />
                <div>
                  <p className="font-medium text-gray-900">Online Payment</p>
                  <p className="text-sm text-gray-500">
                    UPI, Cards, Net Banking
                  </p>
                </div>
                <span className="ml-auto text-2xl">💳</span>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product?._id} className="flex gap-3">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-sm font-bold text-[#D85A30]">
                      {formatRupee(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatRupee(cart?.subtotal || 0)}</span>
              </div>
              {cart?.coupon?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>− {formatRupee(cart.coupon.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-[#D85A30]">
                  {formatRupee(cart?.total || 0)}
                </span>
              </div>
            </div>

            {formError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{formError}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full mt-6 bg-black text-white py-4 rounded-xl font-semibold hover:bg-[#D85A30] transition disabled:opacity-50"
            >
              {isLoading
                ? "Placing Order..."
                : `Place Order • ${formatRupee(cart?.total || 0)}`}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              By placing your order you agree to our terms and conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
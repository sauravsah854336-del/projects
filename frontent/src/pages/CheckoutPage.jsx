import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetCartQuery } from "../features/cart/cartApi";
import { usePlaceOrderMutation } from "../features/order/orderApi";
import { useSelector } from "react-redux";
import { useGetProfileQuery } from "../features/customer/customerApi";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import { toast } from "../components/Toast";

const formatRupee = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const RadioDot = ({ selected }) => (
  <div
    className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selected ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white"}`}
  >
    {selected && <div className="w-[7px] h-[7px] rounded-full bg-white"></div>}
  </div>
);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: cartData } = useGetCartQuery();
  const { data: profileData } = useGetProfileQuery();
  const [placeOrder, { isLoading }] = usePlaceOrderMutation();

  const cart = cartData?.data;
  const items = cart?.items || [];
  const savedAddresses = profileData?.data?.addresses || [];
  const defaultAddress =
    savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressMode, setAddressMode] = useState("saved");

  const [form, setForm] = useState({
    fullName: user?.firstName + " " + (user?.lastName || ""),
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

  const getSelectedAddress = () => {
    if (addressMode === "new") return form;
    const id = selectedAddressId || defaultAddress?._id;
    const addr = savedAddresses.find((a) => a._id === id);
    if (!addr) return form;
    return {
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || "India",
    };
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const shippingAddress = getSelectedAddress();

    if (
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode
    ) {
      setFormError("All address fields are required");
      toast.error("All address fields are required");
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(shippingAddress.phone)) {
      setFormError("Please enter a valid 10-digit phone number");
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (items.length === 0) {
      setFormError("Your cart is empty");
      toast.error("Your cart is empty");
      return;
    }

    try {
      const res = await placeOrder({
        shippingAddress,
        paymentMethod,
      }).unwrap();

      setOrderSuccess(res.data);
      toast.success("Order placed successfully! 🎉");
    } catch (err) {
      const msg = err?.data?.message || "Failed to place order";
      setFormError(msg);
      toast.error(msg);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-100 px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 max-w-md w-full text-center animate-in fade-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
            Order Placed! 🎉
          </h2>
          <p className="text-gray-500 text-sm mb-2">
            Your order has been placed successfully.
          </p>
          <p className="text-sm font-bold text-gray-700 mb-7">
            Order Number:{" "}
            <span className="text-[#D85A30]">{orderSuccess.orderNumber}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/orders/${orderSuccess._id}`)}
              className="flex-1 bg-gray-900 text-white font-bold text-sm py-3.5 rounded-xl border-none cursor-pointer hover:bg-[#D85A30] transition"
            >
              View Order
            </button>
            <button
              onClick={() => navigate("/products")}
              className="flex-1 bg-white text-gray-700 font-bold text-sm py-3.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition"
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
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-100 px-4">
        <div className="text-center bg-white p-12 sm:p-14 rounded-2xl border border-gray-200 max-w-sm w-full">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">
            Your cart is empty
          </h2>
          <button
            onClick={() => navigate("/products")}
            className="bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 font-bold text-sm px-7 py-3 rounded-xl border border-yellow-400 cursor-pointer hover:brightness-95 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const activeAddressId = selectedAddressId || defaultAddress?._id;

  return (
    <div className="bg-gray-100 min-h-screen py-5 sm:py-6 px-3 sm:px-4">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Checkout
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {items.length} {items.length === 1 ? "item" : "items"} in your order
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-4 lg:gap-5 items-start">
          <div className="w-full">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
              <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <span className="text-lg">📦</span>
                <h2 className="text-sm sm:text-[15px] font-bold text-gray-900 m-0">
                  Shipping Address
                </h2>
              </div>
              <div className="p-4 sm:p-5">
                {savedAddresses.length > 0 && (
                  <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setAddressMode("saved")}
                      className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold border-none cursor-pointer transition-all ${
                        addressMode === "saved"
                          ? "bg-gray-900 text-white"
                          : "bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                      }`}
                    >
                      📋 Saved ({savedAddresses.length})
                    </button>
                    <button
                      onClick={() => setAddressMode("new")}
                      className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold border-none cursor-pointer transition-all ${
                        addressMode === "new"
                          ? "bg-gray-900 text-white"
                          : "bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                      }`}
                    >
                      ➕ New Address
                    </button>
                  </div>
                )}

                {addressMode === "saved" && savedAddresses.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    {savedAddresses.map((addr) => {
                      const isSelected = activeAddressId === addr._id;
                      return (
                        <div
                          key={addr._id}
                          onClick={() => setSelectedAddressId(addr._id)}
                          className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-200 hover:border-[#D85A30]"
                          }`}
                        >
                          <div className="mt-0.5">
                            <RadioDot selected={isSelected} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-sm font-bold text-gray-900 m-0">
                                {addr.fullName}
                              </p>
                              {addr.isDefault && (
                                <span className="text-[10px] font-extrabold bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 m-0">
                              {addr.street}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 m-0">
                              {addr.city}, {addr.state} — {addr.postalCode}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 m-0">
                              {addr.country}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1">
                              📞 {addr.phone}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="text-lg shrink-0">✅</span>
                          )}
                        </div>
                      );
                    })}
                    <button
                      onClick={() => navigate("/profile")}
                      className="border border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 font-semibold cursor-pointer bg-transparent hover:bg-gray-50 hover:text-gray-700 transition"
                    >
                      ➕ Manage addresses in Profile
                    </button>
                  </div>
                )}

                {(addressMode === "new" || savedAddresses.length === 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Full Name *
                      </label>
                      <input
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 transition bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="9876543210"
                        maxLength={10}
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 transition bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Street Address *
                      </label>
                      <input
                        name="street"
                        value={form.street}
                        onChange={handleChange}
                        placeholder="123 Main Street, Apartment 4B"
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 transition bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        City *
                      </label>
                      <input
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Mumbai"
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 transition bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        State *
                      </label>
                      <input
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="Maharashtra"
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 transition bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Postal Code *
                      </label>
                      <input
                        name="postalCode"
                        value={form.postalCode}
                        onChange={handleChange}
                        placeholder="400001"
                        maxLength={6}
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 transition bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Country
                      </label>
                      <input
                        name="country"
                        value={form.country}
                        readOnly
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-sm text-gray-400 outline-none bg-gray-50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
              <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <span className="text-lg">💳</span>
                <h2 className="text-sm sm:text-[15px] font-bold text-gray-900 m-0">
                  Payment Method
                </h2>
              </div>
              <div className="p-4 sm:p-5 flex flex-col gap-2.5">
                {[
                  {
                    value: "cod",
                    label: "Cash on Delivery",
                    sub: "Pay when your order arrives",
                    icon: "💵",
                  },
                  {
                    value: "online",
                    label: "Online Payment",
                    sub: "UPI, Cards, Net Banking",
                    icon: "💳",
                  },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === opt.value
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-[#D85A30]"
                    }`}
                  >
                    <RadioDot selected={paymentMethod === opt.value} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 m-0">
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                    </div>
                    <span className="text-2xl">{opt.icon}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:sticky lg:top-20">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <span className="text-lg">🧾</span>
                <h2 className="text-sm sm:text-[15px] font-bold text-gray-900 m-0">
                  Order Summary
                </h2>
              </div>

              <div className="max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.product?._id}
                    className="flex gap-3 px-4 sm:px-5 py-3 border-b border-gray-50"
                  >
                    <img
                      src={item.image || PLACEHOLDER_MEDIUM}
                      alt={item.name}
                      className="w-12 h-12 sm:w-13 sm:h-13 object-cover rounded-lg border border-gray-200 shrink-0"
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_MEDIUM;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 m-0 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-gray-400 m-0">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-[#B12704] mt-0.5">
                        {formatRupee(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 sm:px-5 py-4 border-t-2 border-gray-100">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Subtotal ({items.length} items)
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                      {formatRupee(cart?.subtotal || 0)}
                    </span>
                  </div>
                  {cart?.coupon?.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-green-600">
                        Discount
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-green-600">
                        − {formatRupee(cart.coupon.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Shipping
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-green-600">
                      FREE
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-2.5 flex justify-between items-center">
                    <span className="text-base font-extrabold text-gray-900">
                      Total
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#B12704]">
                      {formatRupee(cart?.total || 0)}
                    </span>
                  </div>
                </div>

                {formError && (
                  <div className="mt-3.5 bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3">
                    <p className="text-xs text-red-600 font-semibold m-0">
                      ⚠️ {formError}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`w-full mt-4 py-3.5 sm:py-4 rounded-xl text-sm sm:text-[15px] font-extrabold border cursor-pointer transition-all ${
                    isLoading
                      ? "bg-gray-400 text-white border-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border-yellow-400 hover:brightness-95"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Placing Order...
                    </span>
                  ) : (
                    `Place Order • ${formatRupee(cart?.total || 0)}`
                  )}
                </button>

                <p className="text-[11px] text-gray-400 text-center mt-3">
                  🔒 Secure checkout — By placing order you agree to our terms
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

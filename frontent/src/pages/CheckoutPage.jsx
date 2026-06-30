import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetCartQuery } from "../features/cart/cartApi";
import { usePlaceOrderMutation } from "../features/order/orderApi";
import { useSelector } from "react-redux";
import { useGetProfileQuery } from "../features/customer/customerApi";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";
import { toast } from "../components/Toast";
import { formatPrice, convertPrice, calculateTax, getShippingInfo } from "../utils/priceHelper";

const PAYMENT_METHODS_CONFIG = {
  cod: { label: "Cash on Delivery", sub: "Pay when your order arrives", icon: "💵" },
  card: { label: "Credit/Debit Card", sub: "Visa, Mastercard, Amex", icon: "💳" },
  upi: { label: "UPI", sub: "Google Pay, PhonePe, Paytm", icon: "📱" },
  netbanking: { label: "Net Banking", sub: "All major banks supported", icon: "🏦" },
  wallet: { label: "Wallet", sub: "Paytm, MobiKwik, Amazon Pay", icon: "👛" },
  paypal: { label: "PayPal", sub: "Pay with your PayPal account", icon: "🅿️" },
  applepay: { label: "Apple Pay", sub: "Quick & secure", icon: "🍎" },
  googlepay: { label: "Google Pay", sub: "Pay with Google", icon: "🔵" },
};

const RadioDot = ({ selected }) => (
  <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selected ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white"}`}>
    {selected && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
  </div>
);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { currentCountry } = useSelector((state) => state.country);
  const { data: cartData } = useGetCartQuery();
  const { data: profileData } = useGetProfileQuery();
  const [placeOrder, { isLoading }] = usePlaceOrderMutation();

  const cart = cartData?.data;
  const items = cart?.items || [];
  const savedAddresses = profileData?.data?.addresses || [];
  const defaultAddress = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  const availablePaymentMethods = currentCountry?.paymentMethods || ["cod", "card"];
  const defaultPaymentMethod = availablePaymentMethods[0] || "cod";

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressMode, setAddressMode] = useState("saved");
  const [form, setForm] = useState({
    fullName: user?.firstName + " " + (user?.lastName || ""),
    phone: "", street: "", city: "", state: "", postalCode: "",
    country: currentCountry?.name || "India",
  });
  const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod);
  const [formError, setFormError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const subtotalINR = cart?.subtotal || 0;
  const couponDiscountINR = cart?.coupon?.discount || 0;
  const subtotalAfterCouponINR = subtotalINR - couponDiscountINR;

  const subtotalLocal = convertPrice(subtotalINR, currentCountry);
  const couponDiscountLocal = convertPrice(couponDiscountINR, currentCountry);
  const taxAmount = currentCountry.tax?.includedInPrice
    ? 0
    : calculateTax(convertPrice(subtotalAfterCouponINR, currentCountry), currentCountry);

  const shippingInfo = getShippingInfo(subtotalAfterCouponINR, currentCountry);
  const shippingCostINR = shippingInfo?.isFree ? 0 : (currentCountry.shipping?.standardCost || 0) / currentCountry.exchangeRate;
  const shippingCostLocal = shippingInfo?.isFree ? 0 : (currentCountry.shipping?.standardCost || 0);

  const totalINR = subtotalAfterCouponINR + shippingCostINR + (taxAmount / currentCountry.exchangeRate);
  const totalLocal = convertPrice(totalINR, currentCountry);

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
      country: addr.country || currentCountry?.name || "India",
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

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode) {
      setFormError("All address fields are required");
      toast.error("Please fill all address fields");
      return;
    }

    if (items.length === 0) {
      setFormError("Your cart is empty");
      return;
    }

    try {
      setConfirming(true);
      const res = await placeOrder({
        shippingAddress,
        paymentMethod,
        country: {
          code: currentCountry.code,
          name: currentCountry.name,
          flag: currentCountry.flag,
          currency: currentCountry.currency,
          exchangeRate: currentCountry.exchangeRate,
          tax: currentCountry.tax,
          shipping: currentCountry.shipping,
        },
      }).unwrap();
      setConfirming(false);
      setOrderSuccess(res.data);
      toast.success("🎉 Order placed successfully!");
    } catch (err) {
      setConfirming(false);
      const msg = err?.data?.message || "Failed to place order";
      setFormError(msg);
      toast.error(msg);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-[bounce_0.6s_ease_1]">
                <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-base shadow-md">
                🎉
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-500 text-sm">Thank you for your order. We've received it!</p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-semibold uppercase tracking-wide">Order Number</p>
                  <p className="text-white font-extrabold text-lg">{orderSuccess.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-xs font-semibold uppercase tracking-wide">Status</p>
                  <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ✓ Confirmed
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
                <span className="text-2xl">{currentCountry.flag}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-indigo-800 m-0">Shipping to {currentCountry.name}</p>
                  <p className="text-[11px] text-indigo-600 m-0 mt-0.5">
                    Payment in {currentCountry.currency.code} ({currentCountry.currency.symbol})
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <h3 className="text-sm font-extrabold text-gray-900 mb-3">What happens next?</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { icon: "✅", title: "Order Confirmed", desc: "Your order has been received", done: true },
                    { icon: "⚙️", title: "Vendor Processing", desc: "Vendor will prepare your items", done: false },
                    { icon: "🚚", title: "Shipped", desc: `Estimated ${currentCountry.shipping?.estimatedDays?.standard || 5} days`, done: false },
                    { icon: "📦", title: "Delivered", desc: "Delivered to your address", done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${step.done ? "bg-green-100" : "bg-gray-100"}`}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold m-0 ${step.done ? "text-green-700" : "text-gray-500"}`}>{step.title}</p>
                        <p className={`text-xs m-0 ${step.done ? "text-green-600" : "text-gray-400"}`}>{step.desc}</p>
                      </div>
                      {step.done && (
                        <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">Payment Method</span>
                  <span className="text-sm font-bold text-gray-900">
                    {PAYMENT_METHODS_CONFIG[orderSuccess.paymentMethod]?.icon || "💳"} {PAYMENT_METHODS_CONFIG[orderSuccess.paymentMethod]?.label || "Online"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Order Total</span>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-[#B12704]">
                      {formatPrice(orderSuccess.total, currentCountry)}
                    </span>
                    {currentCountry.code !== "IN" && (
                      <p className="text-[10px] text-gray-400 m-0">≈ ₹{Math.round(orderSuccess.total).toLocaleString("en-IN")}</p>
                    )}
                  </div>
                </div>
              </div>

              {orderSuccess.items?.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-3">Items Ordered</p>
                  <div className="flex flex-col gap-2">
                    {orderSuccess.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                          <img src={item.image || PLACEHOLDER_MEDIUM} alt={item.name} className="w-full h-full object-contain p-0.5" onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 m-0 truncate">{item.name}</p>
                          <p className="text-[11px] text-gray-400 m-0">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-700 shrink-0">
                          {formatPrice(item.price * item.quantity, currentCountry)}
                        </span>
                      </div>
                    ))}
                    {orderSuccess.items.length > 3 && (
                      <p className="text-xs text-gray-400 text-center">+{orderSuccess.items.length - 3} more items</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-sm font-bold text-blue-800 m-0">Delivering to</p>
                <p className="text-xs text-blue-600 mt-0.5 m-0">
                  {orderSuccess.shippingAddress?.fullName}, {orderSuccess.shippingAddress?.street}, {orderSuccess.shippingAddress?.city}, {orderSuccess.shippingAddress?.state} - {orderSuccess.shippingAddress?.postalCode}
                </p>
                <p className="text-xs text-blue-500 mt-1 m-0 font-medium">📱 {orderSuccess.shippingAddress?.phone}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/orders/${orderSuccess._id}`)}
              className="flex-1 bg-gray-900 text-white font-bold text-sm py-3.5 rounded-xl border-none cursor-pointer hover:bg-gray-800 transition font-[inherit]"
            >
              Track Order
            </button>
            <button
              onClick={() => navigate("/products")}
              className="flex-1 bg-white text-gray-700 font-bold text-sm py-3.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition font-[inherit]"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🛍️</div>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Confirming your order...</h2>
          <p className="text-gray-500 text-sm">Please wait while we process your order</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-12 rounded-3xl border border-gray-100 shadow-sm max-w-sm w-full">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Your cart is empty</h2>
          <button onClick={() => navigate("/products")} className="bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 font-bold text-sm px-7 py-3 rounded-xl border border-yellow-400 cursor-pointer hover:brightness-95 transition font-[inherit]">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const activeAddressId = selectedAddressId || defaultAddress?._id;

  return (
    <div className="bg-gray-50 min-h-screen py-5 sm:py-7 px-3 sm:px-4">
      <div className="max-w-[1100px] mx-auto">

        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 m-0">Checkout</h1>
            <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#D85A30] border border-orange-200 px-2.5 py-1 rounded-full text-xs font-bold">
              {currentCountry.flag} {currentCountry.currency.code}
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm m-0">
            {items.length} {items.length === 1 ? "item" : "items"} · Paying in {currentCountry.currency.name}
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-5 items-start">

          <div className="w-full space-y-4">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <span className="text-lg">📦</span>
                <h2 className="text-sm sm:text-[15px] font-extrabold text-gray-900 m-0">Shipping Address</h2>
              </div>
              <div className="p-5">
                {savedAddresses.length > 0 && (
                  <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setAddressMode("saved")} className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold border-none cursor-pointer transition-all font-[inherit] ${addressMode === "saved" ? "bg-gray-900 text-white" : "bg-transparent text-gray-500 hover:text-gray-700"}`}>
                      📋 Saved ({savedAddresses.length})
                    </button>
                    <button onClick={() => setAddressMode("new")} className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold border-none cursor-pointer transition-all font-[inherit] ${addressMode === "new" ? "bg-gray-900 text-white" : "bg-transparent text-gray-500 hover:text-gray-700"}`}>
                      ➕ New Address
                    </button>
                  </div>
                )}

                {addressMode === "saved" && savedAddresses.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    {savedAddresses.map((addr) => {
                      const isSelected = activeAddressId === addr._id;
                      return (
                        <div key={addr._id} onClick={() => setSelectedAddressId(addr._id)}
                          className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-[#D85A30]"}`}>
                          <RadioDot selected={isSelected} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-sm font-extrabold text-gray-900 m-0">{addr.fullName}</p>
                              {addr.isDefault && <span className="text-[10px] font-extrabold bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">DEFAULT</span>}
                            </div>
                            <p className="text-xs text-gray-500 m-0">{addr.street}</p>
                            <p className="text-xs text-gray-500 m-0">{addr.city}, {addr.state} — {addr.postalCode}</p>
                            <p className="text-xs text-gray-500 mt-1 m-0">📞 {addr.phone}</p>
                          </div>
                          {isSelected && (
                            <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                    <button onClick={() => navigate("/profile")} className="border border-dashed border-gray-300 rounded-2xl py-3 text-sm text-gray-500 font-semibold cursor-pointer bg-transparent hover:bg-gray-50 transition font-[inherit]">
                      ➕ Manage addresses in Profile
                    </button>
                  </div>
                )}

                {(addressMode === "new" || savedAddresses.length === 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[
                      { name: "fullName", label: "Full Name *", ph: "John Doe", col: "sm:col-span-2" },
                      { name: "phone", label: "Phone *", ph: "9876543210", col: "sm:col-span-2", tel: true },
                      { name: "street", label: "Street Address *", ph: "123 Main Street, Apartment 4B", col: "sm:col-span-2" },
                      { name: "city", label: "City *", ph: "Mumbai" },
                      { name: "state", label: "State *", ph: "Maharashtra" },
                      { name: "postalCode", label: "Postal Code *", ph: "400001" },
                    ].map((f) => (
                      <div key={f.name} className={f.col || ""}>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">{f.label}</label>
                        {f.tel ? (
                          <div className="flex">
                            <div className="flex items-center gap-1.5 border border-r-0 border-gray-200 rounded-l-xl px-3 bg-gray-50">
                              <span className="text-xs font-bold text-gray-600">+91</span>
                              <div className="w-px h-4 bg-gray-300" />
                            </div>
                            <input name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.ph} maxLength={10} className="flex-1 border border-gray-200 rounded-r-xl px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 transition bg-white font-[inherit]" />
                          </div>
                        ) : (
                          <input name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.ph} className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 transition bg-white font-[inherit]" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <h2 className="text-sm sm:text-[15px] font-extrabold text-gray-900 m-0">Payment Method</h2>
                </div>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {availablePaymentMethods.length} options for {currentCountry.flag} {currentCountry.code}
                </span>
              </div>
              <div className="p-5 flex flex-col gap-2.5">
                {availablePaymentMethods.map((methodKey) => {
                  const opt = PAYMENT_METHODS_CONFIG[methodKey];
                  if (!opt) return null;

                  return (
                    <div key={methodKey} onClick={() => setPaymentMethod(methodKey)}
                      className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === methodKey ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-[#D85A30]"}`}>
                      <RadioDot selected={paymentMethod === methodKey} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-extrabold text-gray-900 m-0">{opt.label}</p>
                          {methodKey === "cod" && (
                            <span className="text-[9px] bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-bold">RECOMMENDED</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                      </div>
                      <span className="text-2xl">{opt.icon}</span>
                    </div>
                  );
                })}

                {availablePaymentMethods.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-3xl mb-2">⚠️</p>
                    <p className="text-sm text-gray-500 m-0">No payment methods available for {currentCountry.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:sticky lg:top-20">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧾</span>
                    <h2 className="text-sm sm:text-[15px] font-extrabold text-gray-900 m-0">Order Summary</h2>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">
                    {currentCountry.flag} {currentCountry.currency.code}
                  </span>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product?._id} className="flex gap-3 px-5 py-3 border-b border-gray-50">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={item.image || PLACEHOLDER_MEDIUM} alt={item.name} className="w-full h-full object-contain p-0.5" onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 m-0 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400 m-0">Qty: {item.quantity}</p>
                      <p className="text-xs sm:text-sm font-extrabold text-[#B12704] mt-0.5">
                        {formatPrice(item.price * item.quantity, currentCountry)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-t-2 border-gray-100">
                <div className="flex flex-col gap-2">

                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-500">Subtotal ({items.length} items)</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                      {formatPrice(subtotalINR, currentCountry)}
                    </span>
                  </div>

                  {couponDiscountINR > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-green-600">Discount</span>
                      <span className="text-xs sm:text-sm font-semibold text-green-600">
                        − {formatPrice(couponDiscountINR, currentCountry)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-500">Shipping</span>
                    {shippingInfo?.isFree ? (
                      <span className="text-xs sm:text-sm font-bold text-green-600 flex items-center gap-1">🚚 FREE</span>
                    ) : (
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {formatPrice(shippingCostINR, currentCountry)}
                      </span>
                    )}
                  </div>

                  {currentCountry.tax?.rate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-500">
                        {currentCountry.tax.label} ({currentCountry.tax.rate}%)
                        {currentCountry.tax.includedInPrice && (
                          <span className="text-[10px] text-green-600 ml-1">(included)</span>
                        )}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {currentCountry.tax.includedInPrice
                          ? "Included"
                          : `${currentCountry.currency.symbol}${taxAmount.toFixed(2)}`}
                      </span>
                    </div>
                  )}

                  <div className="border-t-2 border-gray-100 pt-2.5 flex justify-between items-center">
                    <span className="text-base font-extrabold text-gray-900">Total</span>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-extrabold text-[#B12704]">
                        {formatPrice(totalINR, currentCountry)}
                      </span>
                      {currentCountry.code !== "IN" && (
                        <p className="text-[10px] text-gray-400 m-0 mt-0.5">
                          ≈ ₹{Math.round(totalINR).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="mt-3.5 bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs text-red-600 font-semibold m-0">⚠️ {formError}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || confirming}
                  className="w-full mt-4 bg-gradient-to-b from-yellow-300 to-yellow-400 text-gray-900 border border-yellow-400 rounded-xl py-4 text-[15px] font-extrabold cursor-pointer hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed font-[inherit] shadow-md shadow-yellow-400/20"
                >
                  {isLoading || confirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
                      Confirming...
                    </span>
                  ) : (
                    `Place Order • ${formatPrice(totalINR, currentCountry)}`
                  )}
                </button>

                <p className="text-[11px] text-gray-400 text-center mt-3 m-0">
                  🔒 Secure checkout — By placing order you agree to our terms
                </p>

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                  {[
                    { icon: "🔒", text: "Secure & encrypted checkout" },
                    { icon: "🔄", text: "Easy 10-day returns" },
                    { icon: "✅", text: "Verified vendors only" },
                    { icon: "🌍", text: `Delivery to ${currentCountry.name} in ${currentCountry.shipping?.estimatedDays?.standard || 5}-${currentCountry.shipping?.estimatedDays?.standard + 3 || 7} days` },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-[11px] text-gray-400">{item.text}</span>
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

export default CheckoutPage;
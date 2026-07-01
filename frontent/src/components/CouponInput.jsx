import { useState } from "react";
import { useSelector } from "react-redux";
import {
  useValidateCouponMutation,
  useGetPublicCouponsQuery,
} from "../features/coupon/couponApi";
import {
  useApplyCartCouponMutation,
  useRemoveCartCouponMutation,
} from "../features/cart/cartApi";
import { toast } from "./Toast";
import { formatPrice } from "../utils/priceHelper";

const CouponInput = ({
  subtotal,
  cartItems = [],
  onApply,
  onRemove,
  appliedCoupon,
}) => {
  const { currentCountry } = useSelector((state) => state.country);
  const { user } = useSelector((state) => state.auth);

  const [code, setCode] = useState("");
  const [showCoupons, setShowCoupons] = useState(false);
  const [error, setError] = useState("");

  const [validateCoupon, { isLoading: validating }] = useValidateCouponMutation();
  const [applyCartCoupon, { isLoading: applying }] = useApplyCartCouponMutation();
  const [removeCartCoupon, { isLoading: removing }] = useRemoveCartCouponMutation();

  const { data: publicCoupons } = useGetPublicCouponsQuery(
    currentCountry?.code || "IN",
    { skip: !user }
  );

  const availableCoupons = publicCoupons?.data || [];
  const isLoading = validating || applying;

  const handleApply = async (couponCode) => {
    setError("");
    const trimmedCode = (couponCode || code).trim().toUpperCase();

    if (!trimmedCode) {
      setError("Please enter a coupon code");
      return;
    }

    if (!user) {
      toast.warning("Please login to apply coupon");
      return;
    }

    try {
      const validationRes = await validateCoupon({
        code: trimmedCode,
        subtotal,
        cartItems: cartItems.map((item) => ({
          productId: item.product?._id || item.productId,
          categoryId: item.product?.category?._id || item.categoryId,
        })),
        countryCode: currentCountry?.code,
      }).unwrap();

      await applyCartCoupon({
        code: validationRes.data.coupon.code,
        discount: validationRes.data.discount,
        discountType: validationRes.data.coupon.discountType,
        freeShipping: validationRes.data.freeShipping,
        description: validationRes.data.coupon.description,
      }).unwrap();

      if (onApply) onApply(validationRes.data);

      toast.success(
        `🎉 Coupon applied! You saved ${formatPrice(validationRes.data.discount, currentCountry)}`
      );
      setCode("");
      setShowCoupons(false);
    } catch (err) {
      const msg = err?.data?.message || "Invalid coupon code";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleRemove = async () => {
    try {
      await removeCartCoupon().unwrap();
      if (onRemove) onRemove();
      setCode("");
      setError("");
      toast.info("Coupon removed");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to remove coupon");
    }
  };

  const copyCode = (couponCode) => {
    navigator.clipboard.writeText(couponCode);
    toast.success(`Code "${couponCode}" copied!`);
  };

  const getCouponBadge = (coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}% OFF`;
    }
    if (coupon.discountType === "fixed") {
      return `${currentCountry?.currency?.symbol || "₹"}${coupon.discountValue} OFF`;
    }
    if (coupon.discountType === "free_shipping") {
      return "FREE SHIPPING";
    }
    return "";
  };

  const daysUntilExpiry = (expiryDate) => {
    const days = Math.ceil(
      (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-white"
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-extrabold text-green-800 text-sm">
                {appliedCoupon.coupon?.code || appliedCoupon.code}
              </span>
              <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                APPLIED
              </span>
            </div>
            <p className="text-xs text-green-700 m-0 mb-1">
              {appliedCoupon.coupon?.description || appliedCoupon.description}
            </p>
            <p className="text-sm font-bold text-green-800 m-0">
              You saved {formatPrice(appliedCoupon.discount, currentCountry)}
            </p>
          </div>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-xs text-red-600 bg-white border border-red-200 rounded-lg px-3 py-1.5 font-bold cursor-pointer hover:bg-red-50 transition font-[inherit] shrink-0 disabled:opacity-50"
          >
            {removing ? "..." : "Remove"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gradient-to-br from-orange-50/50 to-white">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎟️</span>
        <p className="text-sm font-extrabold text-gray-900 m-0">
          Apply Coupon
        </p>
        {availableCoupons.length > 0 && (
          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {availableCoupons.length} available
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 uppercase font-semibold font-[inherit] bg-white"
        />
        <button
          onClick={() => handleApply()}
          disabled={isLoading || !code.trim()}
          className="bg-gray-900 text-white border-none rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition font-[inherit] shrink-0"
        >
          {isLoading ? "..." : "Apply"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-semibold mt-2 m-0">
          ⚠️ {error}
        </p>
      )}

      {availableCoupons.length > 0 && (
        <button
          onClick={() => setShowCoupons(!showCoupons)}
          className="w-full mt-3 text-xs font-bold text-[#D85A30] bg-transparent border-none cursor-pointer flex items-center justify-center gap-1 hover:underline font-[inherit]"
        >
          {showCoupons ? "Hide" : "View"} available coupons
          <svg
            className={`w-3 h-3 transition-transform ${showCoupons ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      {showCoupons && availableCoupons.length > 0 && (
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {availableCoupons.map((coupon) => {
            const days = daysUntilExpiry(coupon.expiryDate);
            const isExpiringSoon = days <= 3;
            const canApply = subtotal >= coupon.minOrderAmount;

            return (
              <div
                key={coupon.code}
                className={`border-2 rounded-xl p-3 transition-all ${
                  canApply
                    ? "border-orange-200 bg-white hover:border-[#D85A30]"
                    : "border-gray-200 bg-gray-50 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md">
                        {getCouponBadge(coupon)}
                      </span>
                      {isExpiringSoon && (
                        <span className="bg-red-100 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          ⏰ {days} DAY{days > 1 ? "S" : ""} LEFT
                        </span>
                      )}
                      {coupon.firstTimeUserOnly && (
                        <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          NEW USER
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-extrabold text-gray-900 m-0 mb-0.5">
                      {coupon.code}
                    </p>
                    <p className="text-xs text-gray-500 m-0 mb-1 leading-snug">
                      {coupon.description}
                    </p>
                    {coupon.minOrderAmount > 0 && (
                      <p className="text-[11px] text-gray-400 m-0">
                        Min. order: {formatPrice(coupon.minOrderAmount, currentCountry)}
                        {coupon.maxDiscountAmount && (
                          <span> • Max. discount: {formatPrice(coupon.maxDiscountAmount, currentCountry)}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyCode(coupon.code)}
                    className="flex-1 bg-gray-100 text-gray-700 border-none rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-gray-200 transition font-[inherit] flex items-center justify-center gap-1"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => handleApply(coupon.code)}
                    disabled={!canApply || isLoading}
                    className="flex-[2] bg-[#D85A30] text-white border-none rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#c14e29] transition font-[inherit]"
                  >
                    {!canApply
                      ? `Add ${formatPrice(coupon.minOrderAmount - subtotal, currentCountry)} more`
                      : isLoading
                      ? "Applying..."
                      : "Apply Now"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CouponInput;
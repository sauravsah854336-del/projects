import { useSelector } from "react-redux";
import { getShippingInfo, formatPrice } from "../utils/priceHelper";

const ShippingBadge = ({ orderAmount }) => {
  const { currentCountry } = useSelector((state) => state.country);
  
  const shipping = getShippingInfo(orderAmount, currentCountry);
  if (!shipping) return null;

  if (shipping.isFree) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-bold">
        🚚 Free Delivery
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-600">
      <p className="m-0">
        🚚 Delivery: <strong>{formatPrice(shipping.standardCost / currentCountry.exchangeRate, currentCountry)}</strong> · {shipping.estimatedDays.standard} days
      </p>
      {shipping.remainingForFree > 0 && (
        <p className="text-[11px] text-orange-600 font-semibold m-0 mt-0.5">
          Add {formatPrice(shipping.remainingForFree / currentCountry.exchangeRate, currentCountry)} more for FREE delivery
        </p>
      )}
    </div>
  );
};

export default ShippingBadge;
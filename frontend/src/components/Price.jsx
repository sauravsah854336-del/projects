import { useSelector } from "react-redux";
import { formatPrice, calculateFinalPrice, calculateTax, convertPrice } from "../utils/priceHelper";

const Price = ({ 
  amount, 
  showTax = false, 
  showOriginal = false, 
  showSavings = false,
  comparePrice = 0,
  className = "",
  size = "md",
}) => {
  const { currentCountry } = useSelector((state) => state.country);

  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-3xl",
  };

  const formattedPrice = formatPrice(amount, currentCountry);
  const formattedCompare = comparePrice > 0 ? formatPrice(comparePrice, currentCountry) : null;
  const taxAmount = calculateTax(convertPrice(amount, currentCountry), currentCountry);
  const savings = comparePrice > 0 ? Math.round(((comparePrice - amount) / comparePrice) * 100) : 0;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`font-extrabold text-gray-900 ${sizes[size]}`}>
          {formattedPrice}
        </span>
        {formattedCompare && (
          <span className="text-sm text-gray-400 line-through">
            {formattedCompare}
          </span>
        )}
        {savings > 0 && showSavings && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
            Save {savings}%
          </span>
        )}
      </div>

      {showTax && taxAmount > 0 && !currentCountry.tax.includedInPrice && (
        <p className="text-[11px] text-gray-500 m-0">
          + {formatPrice(taxAmount / currentCountry.exchangeRate, currentCountry)} {currentCountry.tax.label}
        </p>
      )}

      {showTax && currentCountry.tax.includedInPrice && (
        <p className="text-[11px] text-green-600 m-0 font-semibold">
          ✓ Inclusive of {currentCountry.tax.label}
        </p>
      )}

      {showOriginal && currentCountry.code !== "IN" && (
        <p className="text-[10px] text-gray-400 m-0">
          Original: ₹{amount.toLocaleString("en-IN")}
        </p>
      )}
    </div>
  );
};

export default Price;
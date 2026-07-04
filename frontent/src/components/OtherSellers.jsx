import { Link } from "react-router-dom";
import { PLACEHOLDER_MEDIUM } from "../utils/placeholder";

const OtherSellers = ({ sellers, currency = "₹", currentSellerName }) => {
  if (!sellers || sellers.length === 0) return null;

  const cheapest = sellers.reduce((min, s) => (s.price < min.price ? s : min), sellers[0]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏪</span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 m-0">Other Sellers</h3>
              <p className="text-[11px] text-gray-500 m-0">
                {sellers.length} more seller{sellers.length > 1 ? "s" : ""} offering this product
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
            From {currency}{cheapest.price.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {sellers.map((seller, index) => {
          const isCheapest = seller._id === cheapest._id && sellers.length > 1;
          const savings = sellers.length > 1 ? Math.max(...sellers.map(s => s.price)) - seller.price : 0;

          return (
            <div key={seller._id} className="p-4 hover:bg-blue-50/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={seller.images?.[0]?.url || PLACEHOLDER_MEDIUM}
                    alt={seller.name}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => { e.target.src = PLACEHOLDER_MEDIUM; }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-extrabold text-gray-900 m-0 truncate">
                          {seller.vendorStore?.storeName || "Verified Seller"}
                        </p>
                        {isCheapest && (
                          <span className="text-[9px] font-black text-white bg-gradient-to-r from-green-500 to-emerald-500 px-1.5 py-0.5 rounded-full shadow-sm">
                            ⚡ BEST PRICE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {seller.averageRating > 0 && (
                          <span className="text-[11px] text-gray-600 flex items-center gap-0.5">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-semibold">{seller.averageRating.toFixed(1)}</span>
                            {seller.totalReviews > 0 && (
                              <span className="text-gray-400">({seller.totalReviews})</span>
                            )}
                          </span>
                        )}
                        {seller.shipping?.isFreeShipping && (
                          <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                            🚚 FREE
                          </span>
                        )}
                        {seller.stock > 0 && seller.stock < 5 && (
                          <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">
                            Only {seller.stock} left
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base sm:text-lg font-extrabold text-[#B12704] m-0">
                        {currency}{seller.price.toLocaleString()}
                      </p>
                      {seller.comparePrice > seller.price && (
                        <p className="text-[11px] text-gray-400 line-through m-0">
                          {currency}{seller.comparePrice.toLocaleString()}
                        </p>
                      )}
                      {savings > 0 && isCheapest && (
                        <p className="text-[10px] font-bold text-green-600 m-0">
                          Save {currency}{savings.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/products/${seller.slug}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline no-underline transition"
                  >
                    View Details
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-[11px] text-gray-500 text-center m-0">
          💡 All sellers are verified. Compare prices, ratings & shipping before buying.
        </p>
      </div>
    </div>
  );
};

export default OtherSellers;
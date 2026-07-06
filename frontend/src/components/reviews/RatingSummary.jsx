import StarRating from "./StarRating";

const RatingSummary = ({ product, ratingBreakdown, total }) => {
  const avg = product?.averageRating || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>

      <div className="flex gap-8 items-start">
        <div className="text-center min-w-[120px]">
          <div className="text-6xl font-bold text-gray-900">
            {avg.toFixed(1)}
          </div>
          <StarRating rating={Math.round(avg)} size="md" />
          <p className="text-sm text-gray-500 mt-1">
            {total} {total === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingBreakdown?.[star] || 0;
            const percent = total > 0 ? (count / total) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-6 text-right">
                  {star}
                </span>
                <span className="text-yellow-400 text-sm">★</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-6">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingSummary;
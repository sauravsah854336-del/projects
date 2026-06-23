const StarRating = ({
  rating = 0,
  onRate = null,
  size = "md",
  showLabel = false,
}) => {
  const sizes = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate && onRate(star)}
          className={`
            ${sizes[size]}
            ${onRate ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
            ${star <= rating ? "text-yellow-400" : "text-gray-300"}
          `}
          disabled={!onRate}
        >
          ★
        </button>
      ))}
      {showLabel && rating > 0 && (
        <span className="text-sm text-gray-500 ml-1">
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
        </span>
      )}
    </div>
  );
};

export default StarRating;
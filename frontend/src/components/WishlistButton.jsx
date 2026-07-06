import { useState } from "react";
import { useWishlist } from "../hooks/useWishlist";

const sizeMap = {
  sm: { btn: "w-7 h-7", icon: 14 },
  md: { btn: "w-[34px] h-[34px]", icon: 18 },
  lg: { btn: "w-10 h-10", icon: 22 },
};

const WishlistButton = ({ product, size = "md", style: customStyle = {} }) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const wishlisted = isWishlisted(product._id);
  const s = sizeMap[size];

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setAnimating(true);
    try {
      await toggleWishlist(product);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimating(false), 300);
    }
  };

  return (
    <>
      <style>{`
        @keyframes heartPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .heart-pop { animation: heartPop 0.3s ease; }
      `}</style>
      <button
        onClick={handleClick}
        disabled={loading}
        title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className={`
          ${s.btn}
          rounded-full flex items-center justify-center
          border transition-all duration-200
          shadow-[0_2px_8px_rgba(0,0,0,0.1)]
          ${wishlisted
            ? "bg-red-100 border-red-300"
            : "bg-white/90 border-gray-200"
          }
          ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-110"}
          ${animating ? "heart-pop" : ""}
        `}
        style={customStyle}
      >
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill={wishlisted ? "#EF4444" : "none"}
          stroke={wishlisted ? "#EF4444" : "#6B7280"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </button>
    </>
  );
};

export default WishlistButton;
import { useState } from "react";
import { useWishlist } from "../hooks/useWishlist";

const WishlistButton = ({ product, size = "md", style: customStyle = {} }) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const wishlisted = isWishlisted(product._id);

  const sizes = {
    sm: { btn: 28, icon: 14 },
    md: { btn: 34, icon: 18 },
    lg: { btn: 40, icon: 22 },
  };

  const s = sizes[size];

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
      `}</style>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          width: s.btn,
          height: s.btn,
          borderRadius: "50%",
          background: wishlisted ? "#FEE2E2" : "rgba(255,255,255,0.9)",
          border: wishlisted ? "1px solid #FCA5A5" : "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          animation: animating ? "heartPop 0.3s ease" : "none",
          opacity: loading ? 0.6 : 1,
          ...customStyle,
        }}
        title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
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
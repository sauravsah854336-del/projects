import { useState } from "react";
import { useSelector } from "react-redux";
import StarRating from "./StarRating";
import {
  useToggleHelpfulMutation,
  useDeleteReviewMutation,
} from "../../features/review/reviewApi";

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];
  for (const i of intervals) {
    const count = Math.floor(seconds / i.seconds);
    if (count >= 1) return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
  }
  return "Just now";
};

const ReviewCard = ({ review, productId, onEdit }) => {
  const { user } = useSelector((state) => state.auth);
  const [toggleHelpful] = useToggleHelpfulMutation();
  const [deleteReview, { isLoading: deleting }] = useDeleteReviewMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user?._id === review.user?._id;
  const isAdmin = user?.role === "admin";

  const hasVoted = review.helpfulVotes?.includes(user?._id);
  const helpfulCount = review.helpfulVotes?.length || 0;

  const handleHelpful = async () => {
    if (!user) return;
    try {
      await toggleHelpful(review._id).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReview({ reviewId: review._id, productId }).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {review.user?.avatar ? (
              <img
                src={review.user.avatar}
                alt={review.user.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-semibold text-sm">
                {review.user?.firstName?.[0]?.toUpperCase() || "U"}
              </span>
            )}
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {review.user?.firstName} {review.user?.lastName}
            </p>
            <p className="text-xs text-gray-400">{timeAgo(review.createdAt)}</p>
          </div>
        </div>

        {(isOwner || isAdmin) && (
          <div className="flex gap-2">
            {isOwner && (
              <button
                onClick={() => onEdit(review)}
                className="text-xs text-gray-500 hover:text-black border border-gray-200 px-3 py-1 rounded-lg transition"
              >
                Edit
              </button>
            )}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg transition"
              >
                Delete
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
                >
                  {deleting ? "..." : "Confirm"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs border border-gray-200 px-3 py-1 rounded-lg transition"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <StarRating rating={review.rating} size="sm" />
        {review.isVerifiedPurchase && (
          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
            ✓ Verified Purchase
          </span>
        )}
      </div>

      {review.title && (
        <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
      )}

      {review.body && (
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {review.body}
        </p>
      )}

      {review.images?.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {review.images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.alt || `Review image ${i + 1}`}
              className="w-20 h-20 rounded-xl object-cover border border-gray-100 cursor-pointer hover:opacity-90 transition"
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
        <span className="text-xs text-gray-400">Helpful?</span>
        <button
          onClick={handleHelpful}
          disabled={!user || isOwner}
          className={`
            flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition
            ${hasVoted
              ? "bg-black text-white border-black"
              : "border-gray-200 text-gray-600 hover:border-gray-400"
            }
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          👍 Yes {helpfulCount > 0 && `(${helpfulCount})`}
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;
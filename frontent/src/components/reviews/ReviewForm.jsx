import { useState } from "react";
import StarRating from "./StarRating";
import {
  useCreateReviewMutation,
  useUpdateReviewMutation,
} from "../../features/review/reviewApi";

const ReviewForm = ({ productId, orderId, existingReview, onClose }) => {
  const isEditing = !!existingReview;

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [body, setBody] = useState(existingReview?.body || "");
  const [error, setError] = useState("");

  const [createReview, { isLoading: creating }] = useCreateReviewMutation();
  const [updateReview, { isLoading: updating }] = useUpdateReviewMutation();

  const isLoading = creating || updating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!body.trim()) {
      setError("Please write your review");
      return;
    }

    try {
      if (isEditing) {
        await updateReview({
          reviewId: existingReview._id,
          productId,
          rating,
          title,
          body,
        }).unwrap();
      } else {
        await createReview({
          productId,
          orderId,
          rating,
          title,
          body,
          images: [],
        }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">
          {isEditing ? "Edit Your Review" : "Write a Review"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating <span className="text-red-500">*</span>
          </label>
          <StarRating
            rating={rating}
            onRate={setRating}
            size="lg"
            showLabel={true}
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength={150}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {title.length}/150
          </p>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tell others what you think about this product. What did you like or dislike?"
            rows={5}
            maxLength={5000}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {body.length}/5000
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-[#D85A30] transition disabled:opacity-50"
          >
            {isLoading
              ? "Submitting..."
              : isEditing
              ? "Update Review"
              : "Submit Review"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
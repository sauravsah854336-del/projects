import { useState } from "react";
import { useSelector } from "react-redux";
import {
  useGetProductReviewsQuery,
  useCanReviewQuery,
} from "../../features/review/reviewApi";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import RatingSummary from "./RatingSummary";
import StarRating from "./StarRating";

const ReviewList = ({ product }) => {
  const { user } = useSelector((state) => state.auth);
  const isCustomer = user?.role === "customer";

  const [sort, setSort] = useState("newest");
  const [filterRating, setFilterRating] = useState(null);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const { data: reviewsData, isLoading: reviewsLoading } =
    useGetProductReviewsQuery({
      productId: product._id,
      sort,
      rating: filterRating,
      page,
      limit: 5,
    });

  const { data: canReviewData } = useCanReviewQuery(product._id, {
    skip: !isCustomer,
  });

  const reviews = reviewsData?.data?.reviews || [];
  const ratingBreakdown = reviewsData?.data?.ratingBreakdown || {};
  const pagination = reviewsData?.data?.pagination || {};
  const canReview = canReviewData?.data?.canReview;
  const orderId = canReviewData?.data?.orderId;

  const handleEdit = (review) => {
    setEditingReview(review);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingReview(null);
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <RatingSummary
        product={product}
        ratingBreakdown={ratingBreakdown}
        total={product.totalReviews || 0}
      />

      {/* Write Review Button */}
      {isCustomer && (
        <div>
          {canReview && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#D85A30] transition"
            >
              ✍️ Write a Review
            </button>
          )}

          {canReviewData && !canReview && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
              {canReviewData.data?.reason === "already_reviewed"
                ? "✅ You have already reviewed this product"
                : "🛒 Purchase this product to write a review"}
            </div>
          )}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          productId={product._id}
          orderId={editingReview ? undefined : orderId}
          existingReview={editingReview}
          onClose={handleCloseForm}
        />
      )}

      {/* Filters + Sort */}
      {reviews.length > 0 || filterRating ? (
        <div className="flex flex-wrap gap-3 items-center">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="newest">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>

          {/* Filter by star */}
          <div className="flex gap-2 flex-wrap">
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => {
                  setFilterRating(filterRating === star ? null : star);
                  setPage(1);
                }}
                className={`
                  flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition
                  ${filterRating === star
                    ? "bg-black text-white border-black"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }
                `}
              >
                {star} ★
              </button>
            ))}
            {filterRating && (
              <button
                onClick={() => {
                  setFilterRating(null);
                  setPage(1);
                }}
                className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Reviews List */}
      {reviewsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-2xl h-40 animate-pulse"
            />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              productId={product._id}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-gray-500 font-medium">No reviews yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Be the first to review this product
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ← Prev
          </button>

          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`
                  w-9 h-9 rounded-xl text-sm font-medium transition
                  ${page === p
                    ? "bg-black text-white"
                    : "border border-gray-200 hover:bg-gray-50"
                  }
                `}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
import { authApi } from "../auth/authApi";

export const reviewApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getProductReviews: builder.query({
      query: ({ productId, sort = "newest", rating, page = 1, limit = 10 }) => {
        const params = new URLSearchParams();
        params.append("sort", sort);
        params.append("page", page);
        params.append("limit", limit);
        if (rating) params.append("rating", rating);
        return `/reviews/product/${productId}?${params.toString()}`;
      },
      providesTags: (result, error, { productId }) => [
        { type: "Reviews", id: productId },
      ],
    }),

    canReview: builder.query({
      query: (productId) => `/reviews/can-review/${productId}`,
      providesTags: (result, error, productId) => [
        { type: "CanReview", id: productId },
      ],
    }),

    getMyReviews: builder.query({
      query: () => "/reviews/my-reviews",
      providesTags: ["MyReviews"],
    }),

    adminGetAllReviews: builder.query({
      query: ({ rating, page = 1, limit = 10, sort = "newest" } = {}) => {
        const params = new URLSearchParams();
        params.append("sort", sort);
        params.append("page", page);
        params.append("limit", limit);
        if (rating) params.append("rating", rating);
        return `/reviews/admin/all?${params.toString()}`;
      },
      providesTags: ["AdminReviews"],
    }),

    vendorGetProductReviews: builder.query({
      query: ({ rating, page = 1, limit = 10, sort = "newest" } = {}) => {
        const params = new URLSearchParams();
        params.append("sort", sort);
        params.append("page", page);
        params.append("limit", limit);
        if (rating) params.append("rating", rating);
        return `/reviews/vendor/my-products?${params.toString()}`;
      },
      providesTags: ["VendorReviews"],
    }),

    createReview: builder.mutation({
      query: (data) => ({
        url: "/reviews",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Reviews", id: productId },
        { type: "CanReview", id: productId },
        { type: "Products" },
        "MyReviews",
        "AdminReviews",
        "VendorReviews",
      ],
    }),

    updateReview: builder.mutation({
      query: ({ reviewId, ...data }) => ({
        url: `/reviews/${reviewId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Reviews", id: productId },
        { type: "Products" },
        "MyReviews",
        "AdminReviews",
        "VendorReviews",
      ],
    }),

    deleteReview: builder.mutation({
      query: ({ reviewId }) => ({
        url: `/reviews/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Reviews", id: productId },
        { type: "Products" },
        "MyReviews",
        "AdminReviews",
        "VendorReviews",
      ],
    }),

    toggleHelpful: builder.mutation({
      query: (reviewId) => ({
        url: `/reviews/${reviewId}/helpful`,
        method: "POST",
      }),
      invalidatesTags: ["Reviews"],
    }),
  }),
});

export const {
  useGetProductReviewsQuery,
  useCanReviewQuery,
  useGetMyReviewsQuery,
  useAdminGetAllReviewsQuery,
  useVendorGetProductReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useToggleHelpfulMutation,
} = reviewApi;
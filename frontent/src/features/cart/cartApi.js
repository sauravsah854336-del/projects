import { authApi } from "../auth/authApi";

const cartApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => "/cart",
      providesTags: ["Cart"],
    }),
    addToCart: builder.mutation({
      query: (data) => ({
        url: "/cart/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cart"],
    }),
    mergeGuestCart: builder.mutation({
      query: (data) => ({
        url: "/cart/merge",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cart"],
    }),
    updateCartItem: builder.mutation({
      query: (data) => ({
        url: "/cart/update",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Cart"],
    }),
    removeCartItem: builder.mutation({
      query: (productId) => ({
        url: `/cart/remove/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
    clearCart: builder.mutation({
      query: () => ({
        url: "/cart/clear",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
    applyCartCoupon: builder.mutation({
      query: (data) => ({
        url: "/cart/apply-coupon",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cart"],
    }),
    removeCartCoupon: builder.mutation({
      query: () => ({
        url: "/cart/remove-coupon",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useMergeGuestCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useApplyCartCouponMutation,
  useRemoveCartCouponMutation,
} = cartApi;
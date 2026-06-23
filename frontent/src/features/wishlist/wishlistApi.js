import { authApi } from "../auth/authApi";

export const wishlistApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getWishlist: builder.query({
      query: () => "/customer/wishlist",
      providesTags: ["Wishlist"],
    }),
    addToWishlist: builder.mutation({
      query: (productId) => ({
        url: "/customer/wishlist",
        method: "POST",
        body: { productId },
      }),
      invalidatesTags: ["Wishlist", "Profile"],
    }),
    removeFromWishlist: builder.mutation({
      query: (productId) => ({
        url: `/customer/wishlist/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Wishlist", "Profile"],
    }),
    mergeWishlist: builder.mutation({
      query: (data) => ({
        url: "/customer/wishlist/merge",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Wishlist", "Profile"],
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useMergeWishlistMutation,
} = wishlistApi;
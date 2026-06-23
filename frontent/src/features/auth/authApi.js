import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { updateAccessToken, logout } from "./authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:5005/api",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    const refreshToken = api.getState().auth.refreshToken;

    if (!refreshToken) {
      api.dispatch(logout());
      return result;
    }

    const refreshResult = await baseQuery(
      {
        url: "/auth/refresh",
        method: "POST",
        body: { refreshToken },
      },
      api,
      extraOptions,
    );

    if (refreshResult?.data?.success) {
      api.dispatch(
        updateAccessToken({
          token: refreshResult.data.token,
          refreshToken: refreshResult.data.refreshToken,
        }),
      );

      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
tagTypes: [
  "Vendors",
  "Categories",
  "Products",
  "VendorProducts",
  "AdminProducts",
  "Cart",
  "Orders",
  "AdminOrders",
  "VendorOrders",
  "Reviews",
  "CanReview",
  "MyReviews",
  "AdminReviews",
  "VendorReviews",
  "Profile", 
  "Wishlist",
],
  endpoints: (builder) => ({
    signup: builder.mutation({
      query: (data) => ({
        url: "/auth/signup",
        method: "POST",
        body: data,
      }),
    }),
    login: builder.mutation({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
    }),
    vendorSignup: builder.mutation({
      query: (data) => ({
        url: "/vendor/signup",
        method: "POST",
        body: data,
      }),
    }),
    vendorLogin: builder.mutation({
      query: (data) => ({
        url: "/vendor/login",
        method: "POST",
        body: data,
      }),
    }),
    refresh: builder.mutation({
      query: (data) => ({
        url: "/auth/refresh",
        method: "POST",
        body: data,
      }),
    }),
    logout: builder.mutation({
      query: (data) => ({
        url: "/auth/logout",
        method: "POST",
        body: data,
      }),
    }),
    verifyAuth: builder.query({
      query: () => ({
        url: "/auth/verify",
        method: "GET",
      }),
      keepUnusedDataFor: 0,
    }),
    getPendingVendors: builder.query({
      query: () => ({
        url: "/admin/vendors/pending",
        method: "GET",
      }),
      providesTags: ["Vendors"],
    }),
    getAllVendors: builder.query({
      query: () => ({
        url: "/admin/vendors/all",
        method: "GET",
      }),
      providesTags: ["Vendors"],
    }),
    approveVendor: builder.mutation({
      query: (vendorId) => ({
        url: `/admin/vendors/${vendorId}/approve`,
        method: "PUT",
      }),
      invalidatesTags: ["Vendors"],
    }),
    rejectVendor: builder.mutation({
      query: ({ vendorId, reason }) => ({
        url: `/admin/vendors/${vendorId}/reject`,
        method: "PUT",
        body: { reason },
      }),
      invalidatesTags: ["Vendors"],
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useVendorSignupMutation,
  useVendorLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useVerifyAuthQuery,
  useGetPendingVendorsQuery,
  useGetAllVendorsQuery,
  useApproveVendorMutation,
  useRejectVendorMutation,
} = authApi;

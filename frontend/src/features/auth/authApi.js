import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { updateAccessToken, logout } from "./authSlice";
import { API_URL } from "../../utils/apiConfig";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = getState().auth.token;
    const publicEndpoints = ["vendorSignup", "vendorLogin", "login", "signup", "refresh", "forgotPassword", "verifyOTP", "resetPassword", "resendOTP"];
    if (token && !publicEndpoints.includes(endpoint)) {
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
      { url: "/auth/refresh", method: "POST", body: { refreshToken } },
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
    "AdminStats",
    "Admins",
    "Customers",
    "VendorStats",
    "Search",
    "VendorProfile",
    "AdminProfile",
    "Countries",
    "Coupons",
    "Payment",
  ],
  endpoints: (builder) => ({
    signup: builder.mutation({
      query: (data) => ({ url: "/auth/signup", method: "POST", body: data }),
    }),
    login: builder.mutation({
      query: (data) => ({ url: "/auth/login", method: "POST", body: data }),
    }),
    vendorSignup: builder.mutation({
      query: (data) => ({ url: "/vendor/signup", method: "POST", body: data }),
    }),
    vendorLogin: builder.mutation({
      query: (data) => ({ url: "/vendor/login", method: "POST", body: data }),
    }),
    refresh: builder.mutation({
      query: (data) => ({ url: "/auth/refresh", method: "POST", body: data }),
    }),
    logout: builder.mutation({
      query: (data) => ({ url: "/auth/logout", method: "POST", body: data }),
    }),
    verifyAuth: builder.query({
      query: () => ({ url: "/auth/verify", method: "GET" }),
      keepUnusedDataFor: 0,
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),
    verifyOTP: builder.mutation({
      query: (data) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),
    resendOTP: builder.mutation({
      query: (data) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body: data,
      }),
    }),
    getAdminStats: builder.query({
      query: () => "/admin/stats",
      providesTags: ["AdminStats"],
    }),
    adminGetSalesReport: builder.query({
  query: (params) => {
    const q = new URLSearchParams();
    if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
    if (params?.dateTo) q.set("dateTo", params.dateTo);
    if (params?.groupBy) q.set("groupBy", params.groupBy);
    return `/admin/sales-report?${q.toString()}`;
  },
  providesTags: ["AdminStats"],
}),
    getAllAdmins: builder.query({
      query: () => "/admin/admins",
      providesTags: ["Admins"],
    }),
    createAdmin: builder.mutation({
      query: (data) => ({
        url: "/admin/createAdmin",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Admins", "AdminStats"],
    }),
    getAdminProfile: builder.query({
      query: () => "/admin/profile",
      providesTags: ["AdminProfile"],
    }),
    updateAdminProfile: builder.mutation({
      query: (data) => ({
        url: "/admin/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["AdminProfile"],
    }),
    changeAdminPassword: builder.mutation({
      query: (data) => ({
        url: "/admin/change-password",
        method: "PUT",
        body: data,
      }),
    }),
    getVendorProfile: builder.query({
      query: () => "/vendor/profile",
      providesTags: ["VendorProfile"],
    }),
    updateVendorProfile: builder.mutation({
      query: (data) => ({
        url: "/vendor/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["VendorProfile"],
    }),
    updateVendorStore: builder.mutation({
      query: (data) => ({
        url: "/vendor/store",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["VendorProfile", "VendorStats"],
    }),
    changeVendorPassword: builder.mutation({
      query: (data) => ({
        url: "/vendor/change-password",
        method: "PUT",
        body: data,
      }),
    }),
    getVendorStats: builder.query({
      query: () => "/vendor/stats",
      providesTags: ["VendorStats"],
    }),
    getSalesReport: builder.query({
  query: (params) => {
    const q = new URLSearchParams();
    if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
    if (params?.dateTo) q.set("dateTo", params.dateTo);
    if (params?.status) q.set("status", params.status);
    if (params?.groupBy) q.set("groupBy", params.groupBy);
    if (params?._t) q.set("_t", params._t);
    return `/vendor/sales-report?${q.toString()}`;
  },
  providesTags: ["VendorStats"],
  keepUnusedDataFor: 0,
}),
    getPendingVendors: builder.query({
      query: () => "/admin/vendors/pending",
      providesTags: ["Vendors"],
    }),
    getAllVendors: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.status) q.set("status", params.status);
        if (params?.page) q.set("page", params.page);
        if (params?.limit) q.set("limit", params.limit);
        return `/admin/vendors/all?${q.toString()}`;
      },
      providesTags: ["Vendors"],
    }),
    approveVendor: builder.mutation({
      query: (vendorId) => ({
        url: `/admin/vendors/${vendorId}/approve`,
        method: "PUT",
      }),
      invalidatesTags: ["Vendors", "AdminStats"],
    }),
    rejectVendor: builder.mutation({
      query: ({ vendorId, reason }) => ({
        url: `/admin/vendors/${vendorId}/reject`,
        method: "PUT",
        body: { reason },
      }),
      invalidatesTags: ["Vendors", "AdminStats"],
    }),
    suspendVendor: builder.mutation({
      query: ({ vendorId, reason }) => ({
        url: `/admin/vendors/${vendorId}/suspend`,
        method: "PUT",
        body: { reason },
      }),
      invalidatesTags: ["Vendors", "AdminStats"],
    }),
    unsuspendVendor: builder.mutation({
      query: (vendorId) => ({
        url: `/admin/vendors/${vendorId}/unsuspend`,
        method: "PUT",
      }),
      invalidatesTags: ["Vendors", "AdminStats"],
    }),
    updateVendorCommission: builder.mutation({
      query: ({ vendorId, commission }) => ({
        url: `/admin/vendors/${vendorId}/commission`,
        method: "PUT",
        body: { commission },
      }),
      invalidatesTags: ["Vendors"],
    }),
    getAllCustomers: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.page) q.set("page", params.page);
        if (params?.limit) q.set("limit", params.limit);
        if (params?.status) q.set("status", params.status);
        if (params?.search) q.set("search", params.search);
        return `/admin/customers?${q.toString()}`;
      },
      providesTags: ["Customers"],
    }),
    getSingleCustomer: builder.query({
      query: (userId) => `/admin/customers/${userId}`,
      providesTags: ["Customers"],
    }),
    blockCustomer: builder.mutation({
      query: (userId) => ({
        url: `/admin/customers/${userId}/block`,
        method: "PUT",
      }),
      invalidatesTags: ["Customers", "AdminStats"],
    }),
    unblockCustomer: builder.mutation({
      query: (userId) => ({
        url: `/admin/customers/${userId}/unblock`,
        method: "PUT",
      }),
      invalidatesTags: ["Customers", "AdminStats"],
    }),
    deleteCustomer: builder.mutation({
      query: (userId) => ({
        url: `/admin/customers/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customers", "AdminStats"],
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
  useForgotPasswordMutation,
  useVerifyOTPMutation,
  useResetPasswordMutation,
  useResendOTPMutation,
  useGetAdminStatsQuery,
  useAdminGetSalesReportQuery,
  useGetAllAdminsQuery,
  useCreateAdminMutation,
  useGetAdminProfileQuery,
  useUpdateAdminProfileMutation,
  useChangeAdminPasswordMutation,
  useGetVendorProfileQuery,
  useUpdateVendorProfileMutation,
  useUpdateVendorStoreMutation,
  useChangeVendorPasswordMutation,
  useGetVendorStatsQuery,
  useGetSalesReportQuery,
  useGetPendingVendorsQuery,
  useGetAllVendorsQuery,
  useApproveVendorMutation,
  useRejectVendorMutation,
  useSuspendVendorMutation,
  useUnsuspendVendorMutation,
  useUpdateVendorCommissionMutation,
  useGetAllCustomersQuery,
  useGetSingleCustomerQuery,
  useBlockCustomerMutation,
  useUnblockCustomerMutation,
  useDeleteCustomerMutation,
} = authApi;
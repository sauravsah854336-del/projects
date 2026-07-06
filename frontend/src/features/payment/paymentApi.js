import { authApi } from "../auth/authApi";

const paymentApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    initiatePayment: builder.mutation({
      query: (data) => ({
        url: "/payment/initiate",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Payment"],
    }),
    retryPayment: builder.mutation({
      query: (data) => ({
        url: "/payment/retry",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Payment", "Orders"],
    }),
    verifyPayment: builder.mutation({
      query: (data) => ({
        url: "/payment/verify",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Orders", "Payment"],
    }),
    getPaymentStatus: builder.query({
      query: (orderId) => `/payment/status/${orderId}`,
      providesTags: ["Payment"],
    }),
    getMyPayments: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.page) q.set("page", params.page);
        if (params?.limit) q.set("limit", params.limit);
        return `/payment/my?${q.toString()}`;
      },
      providesTags: ["Payment"],
    }),
    adminGetAllPayments: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.page) q.set("page", params.page);
        if (params?.status) q.set("status", params.status);
        if (params?.gateway) q.set("gateway", params.gateway);
        if (params?.search) q.set("search", params.search);
        return `/payment/admin/all?${q.toString()}`;
      },
      providesTags: ["Payment"],
    }),
  }),
});

export const {
  useInitiatePaymentMutation,
  useRetryPaymentMutation,
  useVerifyPaymentMutation,
  useGetPaymentStatusQuery,
  useGetMyPaymentsQuery,
  useAdminGetAllPaymentsQuery,
} = paymentApi;
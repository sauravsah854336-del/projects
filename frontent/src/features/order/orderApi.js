import { authApi } from "../auth/authApi";

const orderApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    placeOrder: builder.mutation({
      query: (data) => ({ url: "/orders", method: "POST", body: data }),
      invalidatesTags: ["Cart", "Orders"],
    }),
    getMyOrders: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.page) q.set("page", params.page);
        if (params?.limit) q.set("limit", params.limit);
        return `/orders/my?${q.toString()}`;
      },
      providesTags: ["Orders"],
    }),
    getSingleOrder: builder.query({
      query: (id) => `/orders/my/${id}`,
      providesTags: ["Orders"],
    }),
    cancelOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/my/${id}/cancel`,
        method: "PUT",
        body: { reason },
      }),
      invalidatesTags: ["Orders"],
    }),
    adminGetAllOrders: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.page) q.set("page", params.page);
        if (params?.status) q.set("status", params.status);
        if (params?.search) q.set("search", params.search);
        return `/orders/admin?${q.toString()}`;
      },
      providesTags: ["AdminOrders"],
    }),
    adminCancelOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/admin/${id}/cancel`,
        method: "PUT",
        body: { reason },
      }),
      invalidatesTags: ["AdminOrders"],
    }),
    vendorGetOrders: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.page) q.set("page", params.page);
        if (params?.status) q.set("status", params.status);
        return `/orders/vendor?${q.toString()}`;
      },
      providesTags: ["VendorOrders"],
    }),
    vendorUpdateOrderStatus: builder.mutation({
      query: ({ id, status, reason }) => ({
        url: `/orders/vendor/${id}/status`,
        method: "PUT",
        body: { status, reason },
      }),
      invalidatesTags: ["VendorOrders"],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useGetMyOrdersQuery,
  useGetSingleOrderQuery,
  useCancelOrderMutation,
  useAdminGetAllOrdersQuery,
  useAdminCancelOrderMutation,
  useVendorGetOrdersQuery,
  useVendorUpdateOrderStatusMutation,
} = orderApi;
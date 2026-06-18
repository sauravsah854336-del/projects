import { authApi } from "../auth/authApi";

const orderApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    placeOrder: builder.mutation({
      query: (data) => ({
        url: "/orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cart", "Orders"],
    }),
    getMyOrders: builder.query({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", params.page);
        if (params?.limit) searchParams.set("limit", params.limit);
        return `/orders/my?${searchParams.toString()}`;
      },
      providesTags: ["Orders"],
    }),
    getSingleOrder: builder.query({
      query: (id) => `/orders/my/${id}`,
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
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", params.page);
        if (params?.status) searchParams.set("status", params.status);
        return `/orders/admin?${searchParams.toString()}`;
      },
      providesTags: ["AdminOrders"],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/orders/admin/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["AdminOrders"],
    }),
    vendorGetOrders: builder.query({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", params.page);
        if (params?.status) searchParams.set("status", params.status);
        return `/orders/vendor?${searchParams.toString()}`;
      },
      providesTags: ["VendorOrders"],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useGetMyOrdersQuery,
  useGetSingleOrderQuery,
  useCancelOrderMutation,
  useAdminGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useVendorGetOrdersQuery,
} = orderApi;
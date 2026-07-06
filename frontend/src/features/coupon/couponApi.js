import { authApi } from "../auth/authApi";

const couponApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicCoupons: builder.query({
      query: (countryCode) => `/coupons/public?countryCode=${countryCode || ""}`,
      providesTags: ["Coupons"],
    }),

    validateCoupon: builder.mutation({
      query: (data) => ({
        url: "/coupons/validate",
        method: "POST",
        body: data,
      }),
    }),

    adminGetAllCoupons: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.page) q.set("page", params.page);
        if (params?.status) q.set("status", params.status);
        if (params?.search) q.set("search", params.search);
        if (params?.type) q.set("type", params.type);
        return `/coupons/admin?${q.toString()}`;
      },
      providesTags: ["Coupons"],
    }),

    adminGetCoupon: builder.query({
      query: (id) => `/coupons/admin/${id}`,
      providesTags: ["Coupons"],
    }),

    adminCreateCoupon: builder.mutation({
      query: (data) => ({
        url: "/coupons/admin",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Coupons"],
    }),

    adminUpdateCoupon: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/coupons/admin/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Coupons"],
    }),

    adminDeleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/coupons/admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Coupons"],
    }),

    adminToggleCoupon: builder.mutation({
      query: (id) => ({
        url: `/coupons/admin/${id}/toggle`,
        method: "PUT",
      }),
      invalidatesTags: ["Coupons"],
    }),
  }),
});

export const {
  useGetPublicCouponsQuery,
  useValidateCouponMutation,
  useAdminGetAllCouponsQuery,
  useAdminGetCouponQuery,
  useAdminCreateCouponMutation,
  useAdminUpdateCouponMutation,
  useAdminDeleteCouponMutation,
  useAdminToggleCouponMutation,
} = couponApi;
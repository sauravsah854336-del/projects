import { authApi } from "../auth/authApi";

const productApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", params.page);
        if (params?.limit) searchParams.set("limit", params.limit);
        if (params?.category) searchParams.set("category", params.category);
        if (params?.brand) searchParams.set("brand", params.brand);
        if (params?.minPrice) searchParams.set("minPrice", params.minPrice);
        if (params?.maxPrice) searchParams.set("maxPrice", params.maxPrice);
        if (params?.sort) searchParams.set("sort", params.sort);
        if (params?.search) searchParams.set("search", params.search);
        return `/products?${searchParams.toString()}`;
      },
      providesTags: ["Products"],
    }),
    getSingleProduct: builder.query({
      query: (slug) => `/products/single/${slug}`,
    }),
    getVendorProducts: builder.query({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", params.page);
        if (params?.status) searchParams.set("status", params.status);
        return `/products/vendor?${searchParams.toString()}`;
      },
      providesTags: ["VendorProducts"],
    }),
    createProduct: builder.mutation({
      query: (data) => ({
        url: "/products",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["VendorProducts", "Products"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["VendorProducts", "Products"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["VendorProducts", "Products"],
    }),
    adminGetAllProducts: builder.query({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", params.page);
        if (params?.status) searchParams.set("status", params.status);
        return `/products/admin/all?${searchParams.toString()}`;
      },
      providesTags: ["AdminProducts"],
    }),
    approveProduct: builder.mutation({
      query: (id) => ({
        url: `/products/admin/${id}/approve`,
        method: "PUT",
      }),
      invalidatesTags: ["AdminProducts", "Products"],
    }),
    rejectProduct: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/products/admin/${id}/reject`,
        method: "PUT",
        body: { reason },
      }),
      invalidatesTags: ["AdminProducts", "Products"],
    }),
    featureProduct: builder.mutation({
      query: (id) => ({
        url: `/products/admin/${id}/feature`,
        method: "PUT",
      }),
      invalidatesTags: ["AdminProducts", "Products"],
    }),
  }),
});

export const {
  useGetAllProductsQuery,
  useGetSingleProductQuery,
  useGetVendorProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAdminGetAllProductsQuery,
  useApproveProductMutation,
  useRejectProductMutation,
  useFeatureProductMutation,
} = productApi;
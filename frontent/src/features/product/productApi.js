import { authApi } from "../auth/authApi";

export const productApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        Object.entries(params || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") q.set(k, v);
        });
        return `/products?${q.toString()}`;
      },
      providesTags: ["Products"],
    }),
    getProductFilters: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        Object.entries(params || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") q.set(k, v);
        });
        return `/products/filters?${q.toString()}`;
      },
      providesTags: ["Products"],
    }),
    getSingleProduct: builder.query({
      query: (slug) => `/products/single/${slug}`,
      providesTags: ["Products"],
    }),
    getRelatedProducts: builder.query({
      query: (id) => `/products/related/${id}`,
      providesTags: ["Products"],
    }),
    getVendorProducts: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.status) q.set("status", params.status);
        if (params?.page) q.set("page", params.page);
        return `/products/vendor?${q.toString()}`;
      },
      providesTags: ["VendorProducts"],
    }),
    createProduct: builder.mutation({
      query: (data) => ({ url: "/products", method: "POST", body: data }),
      invalidatesTags: ["VendorProducts", "Products", "AdminProducts", "VendorStats"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/products/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["VendorProducts", "Products", "AdminProducts", "VendorStats"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["VendorProducts", "Products", "AdminProducts", "VendorStats"],
    }),
    adminGetAllProducts: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.status) q.set("status", params.status);
        if (params?.search) q.set("search", params.search);
        if (params?.page) q.set("page", params.page);
        return `/products/admin/all?${q.toString()}`;
      },
      providesTags: ["AdminProducts"],
    }),
    featureProduct: builder.mutation({
      query: (id) => ({ url: `/products/admin/${id}/feature`, method: "PUT" }),
      invalidatesTags: ["AdminProducts", "Products"],
    }),
    delistProduct: builder.mutation({
      query: ({ id, reason }) => ({ url: `/products/admin/${id}/delist`, method: "PUT", body: { reason } }),
      invalidatesTags: ["AdminProducts", "Products", "VendorStats"],
    }),
    relistProduct: builder.mutation({
      query: (id) => ({ url: `/products/admin/${id}/relist`, method: "PUT" }),
      invalidatesTags: ["AdminProducts", "Products", "VendorStats"],
    }),
    getVendorStats: builder.query({
      query: () => "/products/vendor/stats",
      providesTags: ["VendorStats"],
    }),
  }),
});

export const {
  useGetAllProductsQuery,
  useGetProductFiltersQuery,
  useGetSingleProductQuery,
  useGetRelatedProductsQuery,
  useGetVendorProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAdminGetAllProductsQuery,
  useFeatureProductMutation,
  useDelistProductMutation,
  useRelistProductMutation,
  useGetVendorStatsQuery,
} = productApi;
import { authApi } from "../auth/authApi";

const categoryApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.includeInactive) q.set("includeInactive", "true");
        return `/categories?${q.toString()}`;
      },
      providesTags: ["Categories"],
    }),
    getCategoryTree: builder.query({
      query: () => "/categories/tree",
      providesTags: ["Categories"],
    }),
    getCategoryStats: builder.query({
      query: () => "/categories/stats",
      providesTags: ["Categories"],
    }),
    getSingleCategory: builder.query({
      query: (slug) => `/categories/${slug}`,
    }),
    createCategory: builder.mutation({
      query: (data) => ({
        url: "/categories",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Categories"],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Categories"],
    }),
    restoreCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}/restore`,
        method: "PUT",
      }),
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryTreeQuery,
  useGetCategoryStatsQuery,
  useGetSingleCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useRestoreCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
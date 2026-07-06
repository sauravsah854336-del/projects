import { authApi } from "../auth/authApi";

const searchApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    searchSuggestions: builder.query({
      query: ({ q, category }) => {
        const params = new URLSearchParams();
        params.set("q", q);
        params.set("type", "suggestions");
        if (category && category !== "all") params.set("category", category);
        return `/search?${params.toString()}`;
      },
      keepUnusedDataFor: 30,
    }),
    searchProducts: builder.query({
      query: (params) => {
        const q = new URLSearchParams();
        if (params?.q) q.set("q", params.q);
        if (params?.category && params.category !== "all") q.set("category", params.category);
        if (params?.page) q.set("page", params.page);
        if (params?.limit) q.set("limit", params.limit);
        if (params?.sort) q.set("sort", params.sort);
        return `/search?${q.toString()}`;
      },
      keepUnusedDataFor: 30,
    }),
  }),
});

export const { useSearchSuggestionsQuery, useSearchProductsQuery } = searchApi;
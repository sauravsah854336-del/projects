import { authApi } from "../auth/authApi";

const searchApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    searchSuggestions: builder.query({
      query: (q) => `/search?q=${encodeURIComponent(q)}&type=suggestions`,
      keepUnusedDataFor: 30,
    }),
    searchProducts: builder.query({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.q) searchParams.set("q", params.q);
        if (params?.page) searchParams.set("page", params.page);
        if (params?.limit) searchParams.set("limit", params.limit);
        if (params?.sort) searchParams.set("sort", params.sort);
        return `/search?${searchParams.toString()}`;
      },
    }),
  }),
});

export const { useSearchSuggestionsQuery, useSearchProductsQuery } = searchApi;
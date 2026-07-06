import { authApi } from "../auth/authApi";

export const countryApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCountries: builder.query({
      query: () => "/countries",
      providesTags: ["Countries"],
      keepUnusedDataFor: 3600,
    }),
    detectUserCountry: builder.query({
      query: () => "/countries/detect",
      keepUnusedDataFor: 86400,
    }),
    getCountryByCode: builder.query({
      query: (code) => `/countries/${code}`,
    }),
    calculatePrice: builder.query({
      query: ({ amount, countryCode }) =>
        `/countries/price?amount=${amount}&countryCode=${countryCode}`,
    }),
    calculateShipping: builder.query({
      query: ({ countryCode, orderAmount, method = "standard" }) =>
        `/countries/shipping?countryCode=${countryCode}&orderAmount=${orderAmount}&method=${method}`,
    }),
    updateExchangeRates: builder.mutation({
      query: () => ({ url: "/countries/update-rates", method: "POST" }),
      invalidatesTags: ["Countries"],
    }),
    adminUpdateCountry: builder.mutation({
      query: ({ code, ...data }) => ({
        url: `/countries/${code}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Countries"],
    }),
    toggleCountryStatus: builder.mutation({
      query: (code) => ({
        url: `/countries/${code}/toggle`,
        method: "PUT",
      }),
      invalidatesTags: ["Countries"],
    }),
  }),
});

export const {
  useGetAllCountriesQuery,
  useDetectUserCountryQuery,
  useGetCountryByCodeQuery,
  useCalculatePriceQuery,
  useCalculateShippingQuery,
  useUpdateExchangeRatesMutation,
  useAdminUpdateCountryMutation,
  useToggleCountryStatusMutation,
} = countryApi;
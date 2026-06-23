import { authApi } from "../auth/authApi";

export const customerApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => "/customer/me",
      providesTags: ["Profile"],
    }),

    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/customer/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Profile"],
    }),

    changePassword: builder.mutation({
      query: (data) => ({
        url: "/customer/change-password",
        method: "PUT",
        body: data,
      }),
    }),

    addAddress: builder.mutation({
      query: (data) => ({
        url: "/customer/addresses",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Profile"],
    }),

    updateAddress: builder.mutation({
      query: ({ addressId, ...data }) => ({
        url: `/customer/addresses/${addressId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Profile"],
    }),

    deleteAddress: builder.mutation({
      query: (addressId) => ({
        url: `/customer/addresses/${addressId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Profile"],
    }),

    setDefaultAddress: builder.mutation({
      query: (addressId) => ({
        url: `/customer/addresses/${addressId}/default`,
        method: "PUT",
      }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} = customerApi;
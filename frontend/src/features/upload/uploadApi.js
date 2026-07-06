import { authApi } from "../auth/authApi";

const uploadApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadSingleImage: builder.mutation({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: "/upload/single",
          method: "POST",
          body: formData,
        };
      },
    }),

    uploadMultipleImages: builder.mutation({
      query: ({ files }) => {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("images", file);
        });
        return {
          url: "/upload/multiple",
          method: "POST",
          body: formData,
        };
      },
    }),

    deleteImage: builder.mutation({
      query: (filename) => ({
        url: "/upload/delete",
        method: "DELETE",
        body: { filename },
      }),
    }),
  }),
});

export const {
  useUploadSingleImageMutation,
  useUploadMultipleImagesMutation,
  useDeleteImageMutation,
} = uploadApi;
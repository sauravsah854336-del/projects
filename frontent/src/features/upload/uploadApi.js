import { authApi } from "../auth/authApi";

const uploadApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadSingleImage: builder.mutation({
      query: ({ file, folder }) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: `/upload/single?folder=${folder}`,
          method: "POST",
          body: formData,
        };
      },
    }),
    uploadMultipleImages: builder.mutation({
      query: ({ files, folder }) => {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("images", file);
        });
        return {
          url: `/upload/multiple?folder=${folder}`,
          method: "POST",
          body: formData,
        };
      },
    }),
    deleteImage: builder.mutation({
      query: (key) => ({
        url: "/upload/delete",
        method: "DELETE",
        body: { key },
      }),
    }),
  }),
});

export const {
  useUploadSingleImageMutation,
  useUploadMultipleImagesMutation,
  useDeleteImageMutation,
} = uploadApi;
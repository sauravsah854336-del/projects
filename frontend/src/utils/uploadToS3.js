import { API_URL } from "./apiConfig";

const BASE_URL = `${API_URL}/upload`;

export const uploadToS3 = async (files = []) => {
  const token = localStorage.getItem("token");
  const uploadedUrls = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${BASE_URL}/single`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        uploadedUrls.push({
          url: data.data.url,
          filename: data.data.filename,
        });
      } else {
        console.error("Upload failed for", file.name, data.message);
      }
    } catch (error) {
      console.error("Upload error for", file.name, error);
    }
  }

  return uploadedUrls;
};

export const uploadDocumentPublic = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${BASE_URL}/document`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Upload failed");
  }

  return {
    url: data.data.url,
    filename: data.data.filename,
  };
};
const BASE_URL = "http://localhost:5005/api/upload";

export const uploadToLocal = async (files = []) => {
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
import { useState, useRef } from "react";
import { uploadToLocal } from "../utils/uploadToLocal";

const ImageUploader = ({ images, setImages, maxImages = 10 }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFiles = async (files) => {
    setUploadError("");
    const fileArray = Array.from(files);

    if (images.length + fileArray.length > maxImages) {
      setUploadError(
        `Maximum ${maxImages} images allowed. You can add ${
          maxImages - images.length
        } more.`
      );
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds 5MB limit`);
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`"${file.name}" is not a supported format`);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploaded = [];

      for (let i = 0; i < fileArray.length; i++) {
        const results = await uploadToLocal([fileArray[i]]);

        if (results.length > 0) {
          uploaded.push({
            url: results[0].url,
            filename: results[0].filename,
            isDefault: images.length === 0 && uploaded.length === 0,
          });
        } else {
          setUploadError(`Failed to upload "${fileArray[i].name}"`);
        }

        setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
      }

      if (uploaded.length > 0) {
        setImages((prev) => [...prev, ...uploaded]);
      }
    } catch (err) {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.isDefault)) {
        updated[0].isDefault = true;
      }
      return updated;
    });
  };

  const setAsDefault = (index) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isDefault: i === index,
      }))
    );
  };

  const moveImage = (from, to) => {
    setImages((prev) => {
      const updated = [...prev];
      const item = updated.splice(from, 1)[0];
      updated.splice(to, 0, item);
      return updated;
    });
  };

  const remaining = maxImages - images.length;

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (!uploading && remaining > 0) {
            fileInputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
          uploading
            ? "border-[#D85A30] bg-[#D85A30]/5 cursor-wait"
            : dragActive
            ? "border-[#D85A30] bg-[#D85A30]/5 scale-[1.01]"
            : remaining > 0
            ? "border-gray-300 hover:border-[#D85A30] hover:bg-gray-50 cursor-pointer"
            : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || remaining <= 0}
        />

        {uploading ? (
          <div>
            <div className="w-10 h-10 border-4 border-[#D85A30] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-medium text-gray-700">
              Uploading... {uploadProgress}%
            </p>
            <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto mt-3 overflow-hidden">
              <div
                className="h-full bg-[#D85A30] rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-7 h-7 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            {remaining > 0 ? (
              <>
                <p className="text-sm font-medium text-gray-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Select multiple images at once
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPEG, PNG, WebP • Max 5MB each
                </p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <span className="text-xs font-medium text-[#D85A30] bg-[#D85A30]/10 px-3 py-1 rounded-full">
                    {images.length} / {maxImages} uploaded
                  </span>
                  <span className="text-xs text-gray-400">
                    {remaining} remaining
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Maximum {maxImages} images reached
              </p>
            )}
          </div>
        )}
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-red-500 text-lg leading-none mt-0.5">⚠</span>
          <p className="text-red-600 text-sm">{uploadError}</p>
        </div>
      )}

      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Uploaded Images ({images.length})
            </p>
            <p className="text-xs text-gray-400">
              ⭐ Set main • ← → Reorder • × Remove
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((img, index) => (
              <div
                key={index}
                className={`relative rounded-xl overflow-hidden border-2 group transition-all duration-200 hover:shadow-lg ${
                  img.isDefault
                    ? "border-[#D85A30] shadow-md shadow-[#D85A30]/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <img
                  src={img.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/150?text=Error";
                  }}
                />

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {index > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveImage(index, index - 1);
                        }}
                        className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-xs cursor-pointer border-none hover:bg-white"
                        title="Move left"
                      >
                        ←
                      </button>
                    )}

                    {!img.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsDefault(index);
                        }}
                        className="w-7 h-7 bg-yellow-400 rounded-lg flex items-center justify-center text-xs cursor-pointer border-none hover:bg-yellow-300"
                        title="Set as main image"
                      >
                        ⭐
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center text-xs cursor-pointer border-none hover:bg-red-600"
                      title="Remove image"
                    >
                      ×
                    </button>

                    {index < images.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveImage(index, index + 1);
                        }}
                        className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-xs cursor-pointer border-none hover:bg-white"
                        title="Move right"
                      >
                        →
                      </button>
                    )}
                  </div>
                </div>

                {img.isDefault && (
                  <div className="absolute top-1.5 left-1.5">
                    <span className="bg-[#D85A30] text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      MAIN
                    </span>
                  </div>
                )}

                <div className="absolute bottom-1.5 right-1.5">
                  <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
              </div>
            ))}

            {remaining > 0 && !uploading && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:border-[#D85A30] hover:bg-[#D85A30]/5 transition-colors"
              >
                <span className="text-2xl text-gray-400">+</span>
                <span className="text-xs text-gray-400 mt-1">Add More</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
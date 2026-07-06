import { useRef, useState } from "react";
import { uploadDocumentPublic } from "../utils/uploadToS3";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const MAX_SIZE_MB = 5;

const DocumentUploader = ({ label, required = false, hint, value, onChange, docKey }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const isPdf = value?.url?.endsWith(".pdf") || value?.filename?.endsWith(".pdf");

  const handleFile = async (file) => {
    setError("");
    if (!ACCEPTED_TYPES.includes(file.type)) { setError("Only JPG, PNG, or PDF files allowed"); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`File must be under ${MAX_SIZE_MB}MB`); return; }
    setUploading(true);
    try {
      const result = await uploadDocumentPublic(file);
      onChange(docKey, { url: result.url, filename: result.filename });
    } catch (err) {
      setError(err?.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => { onChange(docKey, { url: "", filename: "" }); setError(""); };

  const isUploaded = !!value?.url;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[13px] font-bold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {isUploaded && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-green-600">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" />
            </svg>
            Uploaded
          </span>
        )}
      </div>

      {!isUploaded ? (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl px-4 py-6 text-center transition-all duration-200 ${
            uploading
              ? "cursor-not-allowed border-purple-300 bg-purple-50"
              : dragOver
              ? "border-purple-600 bg-purple-50 scale-[1.01]"
              : error
              ? "border-red-300 bg-red-50 cursor-pointer"
              : "border-gray-200 bg-gray-50 cursor-pointer hover:border-purple-400 hover:bg-purple-50/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleInputChange}
            className="hidden"
          />

          {uploading ? (
            <div>
              <div className="w-10 h-10 border-[3px] border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[13px] font-bold text-purple-700 m-0 animate-pulse">Uploading...</p>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" fill="none" stroke="#7C3AED" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M4 16l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 12V3" strokeLinecap="round" />
                  <path d="M20 16v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[13px] font-bold text-gray-700 m-0 mb-1">
                {dragOver ? "Drop file here" : "Click to upload or drag & drop"}
              </p>
              <p className="text-[11px] text-gray-500 m-0">JPG, PNG or PDF • Max {MAX_SIZE_MB}MB</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3.5 border-[1.5px] border-green-200 rounded-2xl px-4 py-3.5 bg-green-50">
          {isPdf ? (
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <svg width="22" height="22" fill="none" stroke="#EF4444" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" />
                <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" />
              </svg>
            </div>
          ) : (
            <img
              src={value.url}
              alt={label}
              className="w-11 h-11 rounded-xl object-cover border border-green-100 shrink-0"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-green-900 m-0 truncate">{value.filename || "Document uploaded"}</p>
            <a
              href={value.url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-green-700 no-underline font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              View document →
            </a>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center cursor-pointer hover:bg-red-100 transition shrink-0 text-red-500 font-[inherit]"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {hint && !error && <p className="text-[11px] text-gray-500 mt-1.5 m-0">{hint}</p>}
      {error && <p className="text-[11px] text-red-500 font-semibold mt-1.5 m-0">⚠️ {error}</p>}
    </div>
  );
};

export default DocumentUploader;
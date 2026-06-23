import { useRef, useState } from "react";
import { uploadDocumentPublic } from "../utils/uploadToLocal";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const MAX_SIZE_MB = 5;

const DocumentUploader = ({
  label,
  required = false,
  hint,
  value,
  onChange,
  docKey,
}) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const isPdf = value?.url?.endsWith(".pdf") || value?.filename?.endsWith(".pdf");

  const handleFile = async (file) => {
    setError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, or PDF files allowed");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB}MB`);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadDocumentPublic(file);
      onChange(docKey, {
        url: result.url,
        filename: result.filename,
      });
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

  const handleRemove = () => {
    onChange(docKey, { url: "", filename: "" });
    setError("");
  };

  const isUploaded = !!value?.url;

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
          {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
        </label>
        {isUploaded && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", display: "flex", alignItems: "center", gap: 4 }}>
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
          style={{
            border: `2px dashed ${dragOver ? "#7C3AED" : error ? "#EF4444" : "#E5E7EB"}`,
            borderRadius: 14,
            padding: "24px 16px",
            textAlign: "center",
            cursor: uploading ? "not-allowed" : "pointer",
            background: dragOver ? "#F5F3FF" : "#FAFAFA",
            transition: "all 0.2s",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleInputChange}
            style={{ display: "none" }}
          />

          {uploading ? (
            <div>
              <div style={{ width: 40, height: 40, border: "3px solid #7C3AED", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }}></div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED", margin: 0, animation: "pulse 1s ease infinite" }}>
                Uploading...
              </p>
            </div>
          ) : (
            <div>
              <div style={{ width: 48, height: 48, background: "#F5F3FF", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <svg width="22" height="22" fill="none" stroke="#7C3AED" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M4 16l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 12V3" strokeLinecap="round" />
                  <path d="M20 16v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3" strokeLinecap="round" />
                </svg>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>
                {dragOver ? "Drop file here" : "Click to upload or drag & drop"}
              </p>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                JPG, PNG or PDF • Max {MAX_SIZE_MB}MB
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          border: "1.5px solid #A7F3D0",
          borderRadius: 14,
          padding: "14px 16px",
          background: "#F0FDF4",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          {isPdf ? (
            <div style={{ width: 44, height: 44, background: "#FEF2F2", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" fill="none" stroke="#EF4444" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" />
                <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" />
              </svg>
            </div>
          ) : (
            <img
              src={value.url}
              alt={label}
              style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "1px solid #D1FAE5", flexShrink: 0 }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#065F46", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {value.filename || "Document uploaded"}
            </p>
            <a
              href={value.url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11, color: "#059669", textDecoration: "none", fontWeight: 600 }}
              onClick={(e) => e.stopPropagation()}
            >
              View document →
            </a>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            style={{
              width: 32, height: 32,
              borderRadius: 8,
              border: "1px solid #FCA5A5",
              background: "#FEF2F2",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              color: "#EF4444",
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {hint && !error && (
        <p style={{ fontSize: 11, color: "#6B7280", marginTop: 5 }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: 11, color: "#EF4444", marginTop: 5, fontWeight: 600 }}>⚠️ {error}</p>
      )}
    </div>
  );
};

export default DocumentUploader;
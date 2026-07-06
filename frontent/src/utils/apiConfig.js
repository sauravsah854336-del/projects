export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005/api";

export const API_BASE = API_URL.replace(/\/api$/, "");

export const CASHFREE_MODE = import.meta.env.VITE_CASHFREE_MODE || "sandbox";

export const IS_PRODUCTION = import.meta.env.PROD;

export const APP_NAME = import.meta.env.VITE_APP_NAME || "E-Commerce";

export const getApiUrl = (path = "") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

export const getUploadUrl = (path = "") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

if (typeof window !== "undefined") {
  console.log("═══════════════════════════════════════");
  console.log("🔧 Frontend Configuration:");
  console.log(`   API URL:      ${API_URL}`);
  console.log(`   Cashfree:     ${CASHFREE_MODE}`);
  console.log(`   Environment:  ${IS_PRODUCTION ? "🔴 PRODUCTION" : "🟢 DEVELOPMENT"}`);
  console.log("═══════════════════════════════════════");
}
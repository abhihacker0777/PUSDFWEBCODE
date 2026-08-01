const configuredBackendUrl = (import.meta.env.VITE_API_URL || "").trim();

if (import.meta.env.PROD && !configuredBackendUrl) {
  throw new Error("VITE_API_URL is required in production.");
}

export const BACKEND_URL = configuredBackendUrl || "http://localhost:3000";
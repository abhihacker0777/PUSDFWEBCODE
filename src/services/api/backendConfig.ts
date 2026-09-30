const configuredBackendUrl = (
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : ""
).trim();

// In Next.js, relative URL "" will call the internal Next.js API endpoints on the same domain
export const BACKEND_URL: string = configuredBackendUrl || "";

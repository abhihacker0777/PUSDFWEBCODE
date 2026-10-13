const configuredBackendUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();

export const BACKEND_URL: string = configuredBackendUrl || "";

import { normalizeRelativePath, toSafeUrl } from "@/lib/urlSecurity";

const configuredBackendUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const allowInsecureLocalNetwork = process.env.NODE_ENV !== "production";
const allowedProtocols = allowInsecureLocalNetwork ? ["https:", "http:"] : ["https:"];

function resolveBackendOrigin(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    return toSafeUrl(rawUrl, {
      allowedProtocols,
      allowLocalNetwork: allowInsecureLocalNetwork,
    }).origin;
  } catch (error) {
    console.error("Ignoring unsafe NEXT_PUBLIC_API_URL:", error);
    return "";
  }
}

export const BACKEND_URL: string = resolveBackendOrigin(configuredBackendUrl);

export const buildBackendUrl = (path: string): string => {
  const safePath = normalizeRelativePath(path);
  return BACKEND_URL ? new URL(safePath, BACKEND_URL).toString() : safePath;
};

export const ensureTrustedApiUrl = (url: string): string => {
  const value = String(url || "").trim();
  if (value.startsWith("/")) {
    return buildBackendUrl(value);
  }

  const parsed = toSafeUrl(value, {
    allowedProtocols,
    allowLocalNetwork: allowInsecureLocalNetwork,
  });
  if (BACKEND_URL && parsed.origin !== BACKEND_URL) {
    throw new Error("Cross-origin API URL is not allowed");
  }
  if (!BACKEND_URL) {
    if (typeof window === "undefined") {
      throw new Error("Absolute API URL is not allowed without NEXT_PUBLIC_API_URL");
    }
    if (parsed.origin !== window.location.origin) {
      throw new Error("Cross-origin API URL is not allowed");
    }
  }
  return parsed.toString();
};

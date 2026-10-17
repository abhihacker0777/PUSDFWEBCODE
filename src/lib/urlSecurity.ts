const IPV4_RE = /^(\d{1,3})(?:\.(\d{1,3})){3}$/;

function isValidIpv4Octet(value: string): boolean {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n >= 0 && n <= 255;
}

function isPrivateOrReservedIpv4(hostname: string): boolean {
  if (!IPV4_RE.test(hostname)) return false;
  const parts = hostname.split(".");
  if (parts.length !== 4 || parts.some((part) => !isValidIpv4Octet(part))) return true;
  const [a, b] = parts.map((part) => Number.parseInt(part, 10));
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateOrReservedIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (!normalized.includes(":")) return false;
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("2001:db8:")
  );
}

function isDisallowedHost(hostname: string, allowLocalNetwork: boolean): boolean {
  const lower = hostname.toLowerCase();
  if (allowLocalNetwork) return false;
  if (lower === "localhost" || lower.endsWith(".localhost")) return true;
  if (isPrivateOrReservedIpv4(lower)) return true;
  if (isPrivateOrReservedIpv6(lower)) return true;
  return false;
}

export function normalizeRelativePath(path: string): string {
  const cleanPath = String(path || "").trim();
  if (!cleanPath.startsWith("/") || cleanPath.startsWith("//")) {
    throw new Error("Path must be a safe relative path");
  }
  if (/[\r\n]/.test(cleanPath)) {
    throw new Error("Path contains invalid control characters");
  }
  return cleanPath;
}

export function isSafeRelativeRedirectPath(path: string): boolean {
  try {
    normalizeRelativePath(path);
    return true;
  } catch {
    return false;
  }
}

type SafeUrlOptions = {
  allowedProtocols: string[];
  allowedHosts?: Set<string>;
  allowedOrigins?: Set<string>;
  allowLocalNetwork?: boolean;
  baseUrl?: string;
};

export function toSafeUrl(input: string, options: SafeUrlOptions): URL {
  const value = String(input || "").trim();
  if (!value) throw new Error("URL is required");
  const url = options.baseUrl ? new URL(value, options.baseUrl) : new URL(value);
  const protocol = url.protocol.toLowerCase();
  if (!options.allowedProtocols.includes(protocol)) {
    throw new Error("URL protocol is not allowed");
  }
  if (url.username || url.password) {
    throw new Error("URL credentials are not allowed");
  }
  const host = url.hostname.toLowerCase();
  if (isDisallowedHost(host, Boolean(options.allowLocalNetwork))) {
    throw new Error("URL host is not allowed");
  }
  if (options.allowedHosts && !options.allowedHosts.has(host)) {
    throw new Error("URL host is not in allowlist");
  }
  if (options.allowedOrigins && !options.allowedOrigins.has(url.origin.toLowerCase())) {
    throw new Error("URL origin is not in allowlist");
  }
  return url;
}


const AUTH_STORAGE_KEY = "puAssistantGoogleAuth";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const DEFAULT_DOMAIN = "poornima.edu.in";

let googleScriptPromise = null;

export const getSafeUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
    const isAllowedHost = ["drive.google.com", "docs.google.com"].includes(parsed.hostname.toLowerCase());
    return isHttp && isAllowedHost ? parsed.href : null;
  } catch {
    return null;
  }
};

const readJwtPayload = (credential) => {
  try {
    if (typeof window === "undefined") return null;
    const payload = String(credential || "").split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

export const getStoredAuth = () => {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const saved = JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY) || "null");
    const payload = readJwtPayload(saved?.credential);
    if (!payload?.exp || payload.exp * 1000 <= Date.now() + 60 * 1000) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return saved;
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const saveStoredAuth = (auth) => {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
};

export const clearStoredAuth = () => {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
};

export const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

export const buildInitialMessages = (user) => ([
  {
    role: "bot",
    text: user?.email
      ? "Welcome back. Which paper do you need?"
      : "Sign in with your Poornima Google account to ask for papers.",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
]);

export const isAuthError = (code) => [
  "SIGN_IN_REQUIRED",
  "INVALID_GOOGLE_ACCOUNT",
  "INVALID_EMAIL_DOMAIN",
  "INVALID_GOOGLE_TOKEN",
  "BLOCKED_USER"
].includes(code);

export {
  AUTH_STORAGE_KEY,
  DEFAULT_DOMAIN
};

const AUTH_STORAGE_KEY = "puAssistantGoogleAuth";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const DEFAULT_DOMAIN = "poornima.edu.in";

let googleScriptPromise: Promise<void> | null = null;

export const getSafeUrl = (url?: string | null): string | null => {
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

export const readJwtPayload = (credential?: string | null): any => {
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

export const getStoredAuth = (): any => {
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

export const saveStoredAuth = (auth: any) => {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }
};

export const clearStoredAuth = () => {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const loadGoogleScript = (): Promise<void> => {
  if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
    return Promise.resolve();
  }
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

export const getTimeGreeting = (name?: string): string => {
  const hour = new Date().getHours();
  const student = name ? `, ${name}` : "";
  if (hour >= 5 && hour < 12) return `Good morning${student}! ☀️`;
  if (hour >= 12 && hour < 17) return `Good afternoon${student}! 🌤️`;
  if (hour >= 17 && hour < 21) return `Good evening${student}! 🌇`;
  return `Hello${student}, studying late? 🌙`;
};

export const buildInitialMessages = (user?: any) => {
  const studentName = user?.name || (user?.email ? user.email.split("@")[0].replace(/[0-9]+/g, " ").trim() : "");
  const formattedName = studentName
    ? studentName.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
    : "";
  const greeting = getTimeGreeting(formattedName);

  return [
    {
      role: "bot" as const,
      text: user?.email
        ? `${greeting}\n\nHello! Welcome to Poornima University Academic Portal. How can I help you today? 😊`
        : "Sign in with your Poornima Google account to ask for papers.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isWelcome: true,
    }
  ];
};

export const isAuthError = (code?: string) => [
  "SIGN_IN_REQUIRED",
  "INVALID_GOOGLE_ACCOUNT",
  "INVALID_EMAIL_DOMAIN",
  "INVALID_GOOGLE_TOKEN",
  "BLOCKED_USER"
].includes(code || "");

export {
  AUTH_STORAGE_KEY,
  DEFAULT_DOMAIN
};

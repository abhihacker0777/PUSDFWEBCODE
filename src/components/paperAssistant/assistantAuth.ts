import { csrfFetch } from "@/services/api";

const AUTH_STORAGE_KEY = "puAssistantGoogleAuth";
const PUSH_SUBSCRIBED_EMAIL_KEY = "pu_pwa_push_subscribed_email";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const DEFAULT_DOMAIN = (process.env.NEXT_PUBLIC_ASSISTANT_EMAIL_DOMAIN || "").trim().replace(/^@/, "");

let googleScriptPromise: Promise<void> | null = null;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function registerCoursePushOnce(credential: string, userEmail: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey || !userEmail) return;

  const cleanEmail = userEmail.toLowerCase().trim();

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    // Skip if already subscribed with this exact email
    if (subscription && localStorage.getItem(PUSH_SUBSCRIBED_EMAIL_KEY) === cleanEmail) {
      return;
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const res = await csrfFetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential,
        subscription: subscription.toJSON(),
      }),
    });

    if (res.ok) {
      localStorage.setItem(PUSH_SUBSCRIBED_EMAIL_KEY, cleanEmail);
    }
  } catch (err) {
    console.warn("Push notification registration skipped:", err);
  }
}

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
  if (hour >= 5 && hour < 12) return `Good Morning${student}! ☀️`;
  if (hour >= 12 && hour < 17) return `Good Afternoon${student}! 🌤️`;
  if (hour >= 17 && hour < 21) return `Good Evening${student}! 🌇`;
  return `Hello${student}, Studying Late? 🌙`;
};

export const buildInitialMessages = (user?: any, time?: string) => {
  const studentName = user?.name || (user?.email ? user.email.split("@")[0].replace(/\d+/g, " ").trim() : "");
  const formattedName = studentName
    ? studentName.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
    : "";
  const greeting = getTimeGreeting(formattedName);

  let welcomeText: string;
  if (user?.email) {
    welcomeText = `${greeting}\n\nHello! Welcome To The Academic Portal. How Can I Help You Today? 😊`;
  } else {
    const domainPrefix = DEFAULT_DOMAIN ? `@${DEFAULT_DOMAIN} ` : "";
    welcomeText = `Sign In With Your ${domainPrefix}Google Account To Ask For Papers.`;
  }

  return [
    {
      role: "bot" as const,
      text: welcomeText,
      time: time || "",
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

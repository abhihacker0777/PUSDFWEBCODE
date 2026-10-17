import { toSafeUrl } from "@/lib/urlSecurity";

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET;
const CAPTCHA_VERIFY_URL = process.env.CAPTCHA_VERIFY_URL || "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const CAPTCHA_ALLOWED_HOSTS = new Set(
  (process.env.CAPTCHA_VERIFY_ALLOWED_HOSTS || "challenges.cloudflare.com")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
);

function getSafeCaptchaVerifyUrl(): string | null {
  try {
    const url = toSafeUrl(CAPTCHA_VERIFY_URL, {
      allowedProtocols: ["https:"],
      allowedHosts: CAPTCHA_ALLOWED_HOSTS,
      allowLocalNetwork: false
    });
    if (!url.pathname.startsWith("/turnstile/")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  if (!CAPTCHA_SECRET) {
    console.error("CAPTCHA_SECRET Is Not Configured In Environment Variables.");
    return false;
  }
  if (!token) return false;
  const verifyUrl = getSafeCaptchaVerifyUrl();
  if (!verifyUrl) return false;

  try {
    const formData = new URLSearchParams();
    formData.append("secret", CAPTCHA_SECRET);
    formData.append("response", token);
    if (remoteIp) formData.append("remoteip", remoteIp);

    const res = await fetch(verifyUrl, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      redirect: "error"
    });

    const data = await res.json();
    return Boolean(data.success);
  } catch (error) {
    console.error("Turnstile Verification Error:", error);
    return false;
  }
}

export async function equalizeLoginTiming(startedAt: number, targetMinMs = 400) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < targetMinMs) {
    await new Promise((resolve) => setTimeout(resolve, targetMinMs - elapsed));
  }
}

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET;
const CAPTCHA_VERIFY_URL = process.env.CAPTCHA_VERIFY_URL || "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  if (!CAPTCHA_SECRET) {
    console.error("CAPTCHA_SECRET is not configured in environment variables.");
    return false;
  }
  if (!token) return false;

  try {
    const formData = new URLSearchParams();
    formData.append("secret", CAPTCHA_SECRET);
    formData.append("response", token);
    if (remoteIp) formData.append("remoteip", remoteIp);

    const res = await fetch(CAPTCHA_VERIFY_URL, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const data = await res.json();
    return Boolean(data.success);
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}

export async function equalizeLoginTiming(startedAt: number, targetMinMs = 400) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < targetMinMs) {
    await new Promise((resolve) => setTimeout(resolve, targetMinMs - elapsed));
  }
}

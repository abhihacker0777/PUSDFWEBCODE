"use server";

import { createClient, createAdminClient, getServiceRoleClient } from "@/lib/supabase/server";
import { verifyTurnstileToken, equalizeLoginTiming } from "@/lib/security";
import { sendPasswordResetEmail, sendAdminLoginAlertEmail } from "@/lib/email";
import {
  getLoginAttempts,
  getLockoutRemainingSeconds,
  recordFailedLogin,
  resetLoginAttempts
} from "@/lib/redis";
import { allow } from "@/lib/ratelimit";
import crypto from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const PASSWORD_RESET_URL = process.env.PASSWORD_RESET_URL || (process.env.BASE_URL ? `${process.env.BASE_URL}/reset-password` : "");

function extractCredentials(param1: FormData | string, param2?: string, param3?: string) {
  if (typeof param1 === "string") {
    return {
      identifier: (param1 || "").trim(),
      password: param2 || "",
      captchaToken: param3 || ""
    };
  }
  if (param1 && typeof (param1 as any).get === "function") {
    const fd = param1 as FormData;
    return {
      identifier: ((fd.get("identifier") || fd.get("email") || fd.get("username")) as string || "").trim(),
      password: (fd.get("password") as string || ""),
      captchaToken: (fd.get("captchaToken") as string || "")
    };
  }
  return { identifier: "", password: "", captchaToken: "" };
}

async function handleFailedLogin(
  cleanIdentifier: string,
  startedAt: number
): Promise<{
  success: false;
  message: string;
  code?: string;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
}> {
  const result = await recordFailedLogin(cleanIdentifier);
  await equalizeLoginTiming(startedAt);

  if (result.locked) {
    return {
      success: false,
      message: "Too many failed login attempts. Account temporarily locked.",
      code: "RATE_LIMITED",
      retryAfterSeconds: 900
    };
  }

  const remaining = result.remaining;
  return {
    success: false,
    message: remaining <= 2
      ? `Invalid credentials. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining before lockout.`
      : "Invalid login credentials.",
    code: "INVALID_CREDENTIALS",
    remainingAttempts: remaining
  };
}

async function resolveAuthEmail(
  adminSupabase: any,
  cleanIdentifier: string,
  rawIdentifier: string
): Promise<{ emailToAuth?: string; deactivated?: boolean; notFound?: boolean; emailNotAllowed?: boolean }> {
  const id = cleanIdentifier.trim().toLowerCase().slice(0, 254);

  // If user entered an email address (contains '@')
  if (id.includes("@")) {
    // Only Super Admin is permitted to log in with an email address
    if (ADMIN_EMAIL && id === ADMIN_EMAIL.toLowerCase().trim()) {
      return { emailToAuth: ADMIN_EMAIL };
    }
    // Normal admins must log in with username only!
    return { emailNotAllowed: true };
  }

  // Exact lowercase login_identifier (username) match
  const { data: byLogin } = await adminSupabase
    .from("admin_users")
    .select("email, auth_email, is_active")
    .eq("login_identifier", id)
    .maybeSingle();

  if (byLogin) {
    if (!byLogin.is_active) {
      return { deactivated: true };
    }
    return { emailToAuth: byLogin.auth_email || byLogin.email || rawIdentifier.trim() };
  }

  return { notFound: true };
}

async function verifyActiveAdminStatus(
  adminSupabase: any,
  _supabase: any,
  emailToAuth: string
): Promise<boolean> {
  const isSuperAdmin = Boolean(ADMIN_EMAIL && emailToAuth.toLowerCase() === ADMIN_EMAIL);
  if (isSuperAdmin) return true;

  const { data: adminRecord } = await adminSupabase
    .from("admin_users")
    .select("is_active, role")
    .eq("email", emailToAuth.toLowerCase().trim())
    .maybeSingle();

  if (!adminRecord?.is_active) {
    return false;
  }
  return true;
}

export async function loginAction(
  param1: FormData | string,
  param2?: string,
  param3?: string,
  meta?: { ip?: string; userAgent?: string }
) {
  const startedAt = Date.now();
  const { identifier, password, captchaToken } = extractCredentials(param1, param2, param3);

  // 1. Verify Turnstile Captcha
  const captchaOk = await verifyTurnstileToken(captchaToken);
  if (!captchaOk && process.env.CAPTCHA_SECRET && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    await equalizeLoginTiming(startedAt);
    return { success: false, message: "CAPTCHA verification failed. Please try again.", code: "CAPTCHA_REQUIRED" };
  }

  if (!identifier || !password) {
    await equalizeLoginTiming(startedAt);
    return { success: false, message: "Please provide both identifier and password." };
  }

  const cleanIdentifier = identifier.trim().toLowerCase().slice(0, 254);

  // 2. Check if identifier is currently locked out
  const currentAttempts = await getLoginAttempts(cleanIdentifier);
  if (currentAttempts >= 5) {
    const remainingSeconds = await getLockoutRemainingSeconds(cleanIdentifier);
    await equalizeLoginTiming(startedAt);
    return {
      success: false,
      message: "Too many failed login attempts. Account temporarily locked.",
      code: "RATE_LIMITED",
      retryAfterSeconds: remainingSeconds > 0 ? remainingSeconds : 900,
    };
  }

  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 3. Resolve login identifier (email or username)
    const resolution = await resolveAuthEmail(adminSupabase, cleanIdentifier, identifier);
    if (resolution.emailNotAllowed) {
      await equalizeLoginTiming(startedAt);
      return {
        success: false,
        message: "Normal library admins must log in using their username only.",
        code: "USERNAME_LOGIN_ONLY",
      };
    }
    if (resolution.deactivated) {
      // Record failed attempt and return generic message to avoid enumeration
      return await handleFailedLogin(cleanIdentifier, startedAt);
    }
    if (resolution.notFound || !resolution.emailToAuth) {
      return await handleFailedLogin(cleanIdentifier, startedAt);
    }

    const emailToAuth = resolution.emailToAuth;

    // 4. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToAuth,
      password,
    });

    if (authError || !authData?.user) {
      return await handleFailedLogin(cleanIdentifier, startedAt);
    }

    // 5. Successful authentication - reset lockout counter
    await resetLoginAttempts(cleanIdentifier);

    // 6. Verify account active state
    const isActive = await verifyActiveAdminStatus(adminSupabase, supabase, emailToAuth);
    if (!isActive) {
      await supabase.auth.signOut();
      return await handleFailedLogin(cleanIdentifier, startedAt);
    }

    // 7. Enforce real identity / institutional domain
    const ownerId = process.env.ADMIN_AUTH_USER_ID;
    const isOwner = Boolean(
      (ADMIN_EMAIL && emailToAuth.toLowerCase() === ADMIN_EMAIL) ||
      (ownerId && authData.user.id === ownerId)
    );
    const domainSuffix = process.env.ASSISTANT_EMAIL_DOMAIN ? `@${process.env.ASSISTANT_EMAIL_DOMAIN.toLowerCase().trim()}` : "";
    if (!isOwner && domainSuffix && !emailToAuth.toLowerCase().endsWith(domainSuffix)) {
      await supabase.auth.signOut();
      await equalizeLoginTiming(startedAt);
      return {
        success: false,
        message: `Access restricted: Only official ${domainSuffix} university accounts are permitted.`,
        code: "UNAUTHORIZED_DOMAIN",
      };
    }

    // 8. Security Alert & Active Session Tracking (Module 1)
    try {
      const clientIpAddr = meta?.ip || "Unknown IP";
      const clientUserAgent = meta?.userAgent || "Unknown Device";

      // Query prior session for IST comparison before logging current
      const { data: priorSession } = await adminSupabase
        .from("admin_sessions")
        .select("created_at")
        .eq("email", emailToAuth.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const revocationToken = crypto.randomBytes(32).toString("hex");
      const currentIst = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const priorIst = priorSession?.created_at
        ? new Date(priorSession.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        : undefined;

      // Resolve admin display name
      const { data: adminRecord } = await adminSupabase
        .from("admin_users")
        .select("display_name")
        .eq("email", emailToAuth.toLowerCase())
        .maybeSingle();

      const displayName = isOwner ? (process.env.ADMIN_DISPLAY_NAME || "") : (adminRecord?.display_name || emailToAuth.split("@")[0]);

      // Record active session
      await adminSupabase.from("admin_sessions").insert({
        auth_user_id: authData.user.id,
        email: emailToAuth.toLowerCase(),
        display_name: displayName,
        ip_address: clientIpAddr,
        user_agent: clientUserAgent,
        revocation_token: revocationToken,
        is_revoked: false,
        last_active: new Date().toISOString(),
      });

      try {
        const cookieStore = await cookies();
        cookieStore.set("admin_session_token", revocationToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      } catch (cookieErr) {
        console.warn("Could not set admin_session_token cookie:", cookieErr);
      }

      // Construct 1-click revocation link
      const origin = (process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || "").replace(/\/+$/, "");
      const revokeUrl = `${origin}/api/auth/revoke-session?token=${revocationToken}`;

      // Check if alert email should be sent:
      // Super Admin (isOwner): ALWAYS sent.
      // Normal Admin: OFF by default, only sent if 'admin_login_notify' is enabled by Super Admin.
      let shouldSendAlert = isOwner;
      if (!isOwner) {
        const { data: settingRow } = await adminSupabase
          .from("system_settings")
          .select("value")
          .eq("key", "admin_login_notify")
          .maybeSingle();
        shouldSendAlert = Boolean(settingRow?.value?.enabled);
      }

      if (shouldSendAlert) {
        void sendAdminLoginAlertEmail({
          to: emailToAuth,
          adminName: displayName,
          loginTimeIST: currentIst,
          priorLoginTimeIST: priorIst,
          ip: clientIpAddr,
          userAgent: clientUserAgent,
          revokeUrl,
        });
      }
    } catch (sessionErr) {
      console.error("Session recording or alert email failed:", sessionErr);
    }

    await equalizeLoginTiming(startedAt);
    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    };
  } catch (error: any) {
    await equalizeLoginTiming(startedAt);
    return { success: false, message: error.message || "An error occurred during authentication.", code: "AUTH_ERROR" };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session_token");
  } catch {}
  return { success: true };
}

const pad = async (t0: number, ms = 800) => {
  const d = ms - (Date.now() - t0);
  if (d > 0) await new Promise((r) => setTimeout(r, d));
};

const GENERIC_RESET_MSG = {
  success: true,
  message: "If that email belongs to an administrator, a reset link has been dispatched.",
};

export async function requestPasswordResetAction(email: string) {
  const t0 = Date.now();
  const cleanEmail = String(email ?? "").toLowerCase().trim();

  if (!cleanEmail || cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    await pad(t0);
    return GENERIC_RESET_MSG;
  }

  // Rate limit password reset requests
  const allowed = await allow("reset", `e:${cleanEmail}`, 3, 3600000);
  if (!allowed) {
    await pad(t0);
    return GENERIC_RESET_MSG;
  }

  try {
    const adminSupabase = createAdminClient();
    const isSuperAdmin = Boolean(ADMIN_EMAIL && cleanEmail === ADMIN_EMAIL);

    let recipientName = "Administrator";
    if (!isSuperAdmin) {
      const { data: adminRecord } = await adminSupabase
        .from("admin_users")
        .select("display_name, is_active")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (!adminRecord?.is_active) {
        await pad(t0);
        return GENERIC_RESET_MSG;
      }
      recipientName = adminRecord.display_name || recipientName;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    const { error: insertError } = await adminSupabase.from("admin_password_resets").insert({
      email: cleanEmail,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("admin_password_resets insert error:", insertError);
      await pad(t0);
      return GENERIC_RESET_MSG;
    }

    const resetLink = `${PASSWORD_RESET_URL}?token=${token}&email=${encodeURIComponent(cleanEmail)}`;
    await sendPasswordResetEmail({
      to: cleanEmail,
      resetUrl: resetLink,
      recipientName,
    }).catch((mailErr) => console.error("Send reset email error:", mailErr));

    await pad(t0);
    return GENERIC_RESET_MSG;
  } catch (err: any) {
    console.error("Password reset error:", err);
    await pad(t0);
    return GENERIC_RESET_MSG;
  }
}

export async function confirmPasswordResetAction(token: string, newPassword: string) {
  try {
    if (!token || typeof token !== "string" || token.length < 20 || token.length > 128) {
      return { success: false, message: "Reset link is invalid or has already been used." };
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 10 || newPassword.length > 128) {
      return { success: false, message: "Password must be at least 10 characters." };
    }

    const adminSupabase = getServiceRoleClient();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Atomic single-use delete
    const { data: resetEntry, error: deleteError } = await adminSupabase
      .from("admin_password_resets")
      .delete()
      .eq("token_hash", tokenHash)
      .gt("expires_at", new Date().toISOString())
      .select("email")
      .maybeSingle();

    if (deleteError || !resetEntry) {
      return { success: false, message: "Reset link is invalid, expired, or has already been used." };
    }

    // Locate target user across pages
    let targetUserId: string | null = null;
    for (let page = 1; page <= 20; page++) {
      const { data: res } = await adminSupabase.auth.admin.listUsers({ page, perPage: 200 });
      const u = res?.users.find((x: any) => x.email?.toLowerCase() === resetEntry.email.toLowerCase());
      if (u) {
        targetUserId = u.id;
        break;
      }
      if (!res || res.users.length < 200) break;
    }

    if (!targetUserId) {
      return { success: false, message: "Could not complete password reset. User not found." };
    }

    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Supabase password update error:", updateError);
      return { success: false, message: "Could not update the password." };
    }

    // Clean up any other remaining reset tokens for this email
    await adminSupabase.from("admin_password_resets").delete().eq("email", resetEntry.email);

    return {
      success: true,
      message: "Password updated successfully. You can now log in.",
    };
  } catch (err: any) {
    console.error("Confirm reset error:", err);
    return { success: false, message: "Unable to update password at this time." };
  }
}

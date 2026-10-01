"use server";

import { createClient, createAdminClient, getServiceRoleClient } from "@/lib/supabase/server";
import { verifyTurnstileToken, equalizeLoginTiming } from "@/lib/security";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  getLoginAttempts,
  getLockoutRemainingSeconds,
  recordFailedLogin,
  resetLoginAttempts
} from "@/lib/redis";
import crypto from "node:crypto";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hackcanabhi@gmail.com";
const PASSWORD_RESET_URL = process.env.PASSWORD_RESET_URL || "http://localhost:3000/reset-password";

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

async function handleFailedLogin(cleanIdentifier: string, startedAt: number) {
  const lockout = await recordFailedLogin(cleanIdentifier, 5, 900);
  await equalizeLoginTiming(startedAt);
  if (lockout.locked) {
    return {
      success: false,
      message: "Too many failed login attempts. Account temporarily locked for 15 minutes.",
      code: "RATE_LIMITED",
      retryAfterSeconds: 900,
    };
  }
  return {
    success: false,
    message: `Invalid credentials. (${lockout.remaining} attempt${lockout.remaining === 1 ? "" : "s"} remaining before temporary lockout.)`,
  };
}

async function resolveAuthEmail(
  adminSupabase: any,
  cleanIdentifier: string,
  rawIdentifier: string
): Promise<{ emailToAuth?: string; deactivated?: boolean; notFound?: boolean }> {
  const { data: userRecord } = await adminSupabase
    .from("admin_users")
    .select("email, display_name, is_active")
    .or(`login_identifier.ilike.${cleanIdentifier},email.ilike.${cleanIdentifier}`)
    .maybeSingle();

  if (userRecord) {
    if (!userRecord.is_active) {
      return { deactivated: true };
    }
    return { emailToAuth: userRecord.email || rawIdentifier.trim() };
  }

  if (!cleanIdentifier.includes("@")) {
    return { notFound: true };
  }

  return { emailToAuth: rawIdentifier.trim() };
}

async function verifyActiveAdminStatus(
  adminSupabase: any,
  supabase: any,
  emailToAuth: string
): Promise<boolean> {
  const isSuperAdmin = emailToAuth.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (isSuperAdmin) return true;

  const { data: adminRecord } = await adminSupabase
    .from("admin_users")
    .select("is_active, role")
    .eq("email", emailToAuth)
    .single();

  if (!adminRecord?.is_active) {
    await supabase.auth.signOut();
    return false;
  }
  return true;
}

export async function loginAction(
  param1: FormData | string,
  param2?: string,
  param3?: string
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

  const cleanIdentifier = identifier.trim().toLowerCase();

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

    // 3. Resolve login identifier (could be email or username)
    const resolution = await resolveAuthEmail(adminSupabase, cleanIdentifier, identifier);
    if (resolution.deactivated) {
      await equalizeLoginTiming(startedAt);
      return { success: false, message: "This administrative account has been deactivated." };
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
      await equalizeLoginTiming(startedAt);
      return { success: false, message: "This administrative account has been deactivated." };
    }

    await equalizeLoginTiming(startedAt);
    return { success: true, user: authData.user };
  } catch (error: any) {
    await equalizeLoginTiming(startedAt);
    return { success: false, message: error.message || "An error occurred during authentication.", code: "AUTH_ERROR" };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}

export async function requestPasswordResetAction(email: string) {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) {
    return { success: false, message: "Please provide a valid email address." };
  }

  try {
    const adminSupabase = createAdminClient();
    const isSuperAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

    // Verify email belongs to an admin
    let recipientName = "Administrator";
    if (!isSuperAdmin) {
      const { data: adminRecord } = await adminSupabase
        .from("admin_users")
        .select("display_name, is_active")
        .eq("email", cleanEmail)
        .single();

      if (!adminRecord || !adminRecord.is_active) {
        // Return generic success to avoid account enumeration (OWASP)
        return { success: true, message: "If that email belongs to an administrator, a reset link has been dispatched." };
      }
      recipientName = adminRecord.display_name || recipientName;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    // Save token hash to Supabase admin_resets table or metadata
    await adminSupabase.from("admin_password_resets").insert({
      email: cleanEmail,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const resetLink = `${PASSWORD_RESET_URL}?token=${token}&email=${encodeURIComponent(cleanEmail)}`;
    await sendPasswordResetEmail({
      to: cleanEmail,
      resetUrl: resetLink,
      recipientName,
    });

    return {
      success: true,
      message: "If that email belongs to an administrator, a reset link has been dispatched.",
    };
  } catch (err: any) {
    console.error("Password reset error:", err);
    return { success: false, message: "Unable to process password reset at this time." };
  }
}

export async function confirmPasswordResetAction(token: string, newPassword: string) {
  try {
    if (!token || !newPassword || newPassword.length < 10) {
      return { success: false, message: "Password must be at least 10 characters." };
    }

    const adminSupabase = getServiceRoleClient();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const { data: resetEntry, error } = await adminSupabase
      .from("admin_password_resets")
      .select("id, email, expires_at")
      .eq("token_hash", tokenHash)
      .single();

    if (error || !resetEntry) {
      return { success: false, message: "Reset link is invalid or has already been used." };
    }

    if (new Date(resetEntry.expires_at) < new Date()) {
      return { success: false, message: "Reset link has expired. Please request a new one." };
    }

    // Update password in Supabase Auth
    const { data: userList } = await adminSupabase.auth.admin.listUsers();
    const targetUser = userList?.users.find((u) => u.email === resetEntry.email);

    if (targetUser) {
      await adminSupabase.auth.admin.updateUserById(targetUser.id, {
        password: newPassword,
      });
    }

    // Delete used reset token
    await adminSupabase.from("admin_password_resets").delete().eq("id", resetEntry.id);

    return {
      success: true,
      message: "Password updated successfully. You can now log in.",
    };
  } catch (err: any) {
    console.error("Confirm reset error:", err);
    return { success: false, message: "Unable to update password at this time." };
  }
}


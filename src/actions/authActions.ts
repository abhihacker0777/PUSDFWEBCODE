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
      message: "Too Many Failed Login Attempts. Account Temporarily Locked.",
      code: "RATE_LIMITED",
      retryAfterSeconds: 900
    };
  }

  const remaining = result.remaining;
  const attemptText = remaining === 1 ? "1 Attempt" : `${remaining} Attempts`;
  const message = remaining <= 2
    ? `Invalid Credentials. ${attemptText} Remaining Before Lockout.`
    : "Invalid Login Credentials.";

  return {
    success: false,
    message,
    code: "INVALID_CREDENTIALS",
    remainingAttempts: remaining
  };
}

type AuthEmailResolution = {
  emailToAuth?: string;
  deactivated?: boolean;
  notFound?: boolean;
  emailNotAllowed?: boolean;
};

function resolveAdminRecordEmail(
  record: { email?: string | null; auth_email?: string | null; is_active?: boolean } | null
): AuthEmailResolution {
  if (!record) return { notFound: true };
  if (!record.is_active) return { deactivated: true };
  const resolvedEmail = String(record.auth_email || record.email || "").toLowerCase().trim();
  return resolvedEmail ? { emailToAuth: resolvedEmail } : { notFound: true };
}

async function resolveAuthEmail(
  adminSupabase: any,
  cleanIdentifier: string
): Promise<AuthEmailResolution> {
  const id = cleanIdentifier.trim().toLowerCase().slice(0, 254);

  if (id.includes("@")) {
    if (id === ADMIN_EMAIL?.toLowerCase().trim()) {
      return { emailToAuth: id };
    }

    const { data: byEmail } = await adminSupabase
      .from("admin_users")
      .select("email, auth_email, is_active")
      .or(`email.eq.${id},auth_email.eq.${id}`)
      .maybeSingle();

    return resolveAdminRecordEmail(byEmail);
  }

  const { data: byLogin } = await adminSupabase
    .from("admin_users")
    .select("email, auth_email, is_active")
    .eq("login_identifier", id)
    .maybeSingle();

  return resolveAdminRecordEmail(byLogin);
}

async function verifyActiveAdminStatus(
  adminSupabase: any,
  authEmail: string,
  isOwner: boolean
): Promise<boolean> {
  if (isOwner) return true;

  const { data: adminRecord } = await adminSupabase
    .from("admin_users")
    .select("is_active, role")
    .eq("email", authEmail.toLowerCase().trim())
    .maybeSingle();

  return Boolean(adminRecord?.is_active);
}

async function recordSessionAndSendAlert(
  adminSupabase: any,
  authUserId: string,
  emailToAuth: string,
  isOwner: boolean,
  meta?: { ip?: string; userAgent?: string }
): Promise<void> {
  const clientIpAddr = meta?.ip || "Unknown IP";
  const clientUserAgent = meta?.userAgent || "Unknown Device";

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

  const { data: adminRecord } = await adminSupabase
    .from("admin_users")
    .select("display_name")
    .eq("email", emailToAuth.toLowerCase())
    .maybeSingle();

  const displayName = isOwner ? (process.env.ADMIN_DISPLAY_NAME || "") : (adminRecord?.display_name || emailToAuth.split("@")[0]);

  await adminSupabase.from("admin_sessions").insert({
    auth_user_id: authUserId,
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
    console.warn("Could Not Set Admin Session Token Cookie:", cookieErr);
  }

  const rawOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || "";
  const origin = rawOrigin.endsWith("/") ? rawOrigin.slice(0, -1) : rawOrigin;
  const revokeUrl = `${origin}/api/auth/revoke-session?token=${revocationToken}`;

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
}

type PreLoginResult =
  | { ok: true; cleanIdentifier: string }
  | {
      ok: false;
      response: {
        success: false;
        message: string;
        code?: string;
        retryAfterSeconds?: number;
      };
    };

async function validatePreLoginCredentials(
  identifier: string,
  password: string,
  captchaToken: string,
  startedAt: number
): Promise<PreLoginResult> {
  if (process.env.CAPTCHA_SECRET) {
    const captchaOk = await verifyTurnstileToken(captchaToken);
    if (!captchaOk) {
      await equalizeLoginTiming(startedAt);
      return {
        ok: false,
        response: { success: false, message: "CAPTCHA Verification Failed. Please Try Again.", code: "CAPTCHA_REQUIRED" },
      };
    }
  }

  if (!identifier || !password) {
    await equalizeLoginTiming(startedAt);
    return {
      ok: false,
      response: { success: false, message: "Please Provide Both Identifier And Password." },
    };
  }

  const cleanIdentifier = identifier.trim().toLowerCase().slice(0, 254);
  const currentAttempts = await getLoginAttempts(cleanIdentifier);
  if (currentAttempts >= 5) {
    const remainingSeconds = await getLockoutRemainingSeconds(cleanIdentifier);
    await equalizeLoginTiming(startedAt);
    return {
      ok: false,
      response: {
        success: false,
        message: "Too Many Failed Login Attempts. Account Temporarily Locked.",
        code: "RATE_LIMITED",
        retryAfterSeconds: remainingSeconds > 0 ? remainingSeconds : 900,
      },
    };
  }

  return { ok: true, cleanIdentifier };
}

function checkDomainAuthorization(emailToAuth: string, isOwner: boolean) {
  const domainSuffix = process.env.ASSISTANT_EMAIL_DOMAIN
    ? `@${process.env.ASSISTANT_EMAIL_DOMAIN.toLowerCase().trim()}`
    : "";
  if (!isOwner && domainSuffix && !emailToAuth.toLowerCase().endsWith(domainSuffix)) {
    return {
      authorized: false,
      message: `Access Restricted: Only Official ${domainSuffix} University Accounts Are Permitted.`,
      code: "UNAUTHORIZED_DOMAIN",
    };
  }
  return { authorized: true };
}

export async function loginAction(
  param1: FormData | string,
  param2?: string,
  param3?: string,
  meta?: { ip?: string; userAgent?: string }
) {
  const startedAt = Date.now();
  const { identifier, password, captchaToken } = extractCredentials(param1, param2, param3);

  const preCheck = await validatePreLoginCredentials(identifier, password, captchaToken || "", startedAt);
  if (!preCheck.ok) {
    return preCheck.response;
  }
  const cleanIdentifier = preCheck.cleanIdentifier;

  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const resolution = await resolveAuthEmail(adminSupabase, cleanIdentifier);
    if (resolution.emailNotAllowed) {
      await equalizeLoginTiming(startedAt);
      return {
        success: false,
        message: "Normal Library Admins Must Log In Using Their Username Only.",
        code: "USERNAME_LOGIN_ONLY",
      };
    }
    if (resolution.deactivated || resolution.notFound || !resolution.emailToAuth) {
      return await handleFailedLogin(cleanIdentifier, startedAt);
    }

    const emailToAuth = resolution.emailToAuth;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToAuth,
      password,
    });

    if (authError || !authData?.user) {
      return await handleFailedLogin(cleanIdentifier, startedAt);
    }

    const authenticatedEmail = String(authData.user.email || "").toLowerCase().trim();
    if (!authenticatedEmail || authenticatedEmail !== emailToAuth.toLowerCase()) {
      await supabase.auth.signOut();
      return await handleFailedLogin(cleanIdentifier, startedAt);
    }

    await resetLoginAttempts(cleanIdentifier);

    const ownerId = process.env.ADMIN_AUTH_USER_ID;
    const isOwner = Boolean(
      authenticatedEmail === ADMIN_EMAIL?.toLowerCase().trim() ||
      (ownerId && authData.user.id === ownerId)
    );

    const isActive = await verifyActiveAdminStatus(adminSupabase, authenticatedEmail, isOwner);
    if (!isActive) {
      await supabase.auth.signOut();
      return await handleFailedLogin(cleanIdentifier, startedAt);
    }

    const domainCheck = checkDomainAuthorization(authenticatedEmail, isOwner);
    if (!domainCheck.authorized) {
      await supabase.auth.signOut();
      await equalizeLoginTiming(startedAt);
      return {
        success: false,
        message: domainCheck.message,
        code: domainCheck.code,
      };
    }

    try {
      await recordSessionAndSendAlert(adminSupabase, authData.user.id, authenticatedEmail, isOwner, meta);
    } catch (sessionErr) {
      console.error("Session Recording Or Alert Email Failed:", sessionErr);
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
    return { success: false, message: error.message || "An Error Occurred During Authentication.", code: "AUTH_ERROR" };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session_token")?.value;
    if (token) {
      const adminSupabase = createAdminClient();
      await adminSupabase
        .from("admin_sessions")
        .update({ is_revoked: true })
        .eq("revocation_token", token);
    }
    cookieStore.delete("admin_session_token");
  } catch { }
  await supabase.auth.signOut();
  return { success: true };
}

const pad = async (t0: number, ms = 800) => {
  const d = ms - (Date.now() - t0);
  if (d > 0) await new Promise((r) => setTimeout(r, d));
};

const GENERIC_RESET_MSG = {
  success: true,
  message: "If That Email Belongs To An Administrator, A Reset Link Has Been Dispatched.",
};

function isValidEmailFormat(email: string): boolean {
  if (!email || email.length > 254) return false;
  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return false;
  const dotIndex = email.lastIndexOf(".");
  return dotIndex > atIndex + 1 && dotIndex < email.length - 1 && !/\s/.test(email);
}

export async function requestPasswordResetAction(email: string) {
  const t0 = Date.now();
  const cleanEmail = String(email ?? "").toLowerCase().trim();

  if (!isValidEmailFormat(cleanEmail)) {
    await pad(t0);
    return GENERIC_RESET_MSG;
  }

  const allowed = await allow("reset", `e:${cleanEmail}`, 3, 3600000);
  if (!allowed) {
    await pad(t0);
    return GENERIC_RESET_MSG;
  }

  try {
    const adminSupabase = createAdminClient();
    const isSuperAdmin = Boolean(cleanEmail === ADMIN_EMAIL?.toLowerCase().trim());

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

    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertError } = await adminSupabase.from("admin_password_resets").insert({
      email: cleanEmail,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Admin Password Resets Insert Error:", insertError);
      await pad(t0);
      return GENERIC_RESET_MSG;
    }

    const resetLink = `${PASSWORD_RESET_URL}?token=${token}&email=${encodeURIComponent(cleanEmail)}`;
    await sendPasswordResetEmail({
      to: cleanEmail,
      resetUrl: resetLink,
      recipientName,
    }).catch((mailErr) => console.error("Send Reset Email Error:", mailErr));

    await pad(t0);
    return GENERIC_RESET_MSG;
  } catch (err: any) {
    console.error("Password Reset Error:", err);
    await pad(t0);
    return GENERIC_RESET_MSG;
  }
}

export async function confirmPasswordResetAction(token: string, newPassword: string) {
  try {
    if (!token || typeof token !== "string" || token.length < 20 || token.length > 128) {
      return { success: false, message: "Reset Link Is Invalid Or Has Already Been Used." };
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 10 || newPassword.length > 128) {
      return { success: false, message: "Password Must Be At Least 10 Characters." };
    }

    const adminSupabase = getServiceRoleClient();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const { data: resetEntry, error: deleteError } = await adminSupabase
      .from("admin_password_resets")
      .delete()
      .eq("token_hash", tokenHash)
      .gt("expires_at", new Date().toISOString())
      .select("email")
      .maybeSingle();

    if (deleteError || !resetEntry) {
      return { success: false, message: "Reset Link Is Invalid, Expired, Or Has Already Been Used." };
    }

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
      return { success: false, message: "Could Not Complete Password Reset. User Not Found." };
    }

    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Supabase Password Update Error:", updateError);
      return { success: false, message: "Could Not Update The Password." };
    }

    await adminSupabase.from("admin_password_resets").delete().eq("email", resetEntry.email);
    await adminSupabase.from("admin_sessions").update({ is_revoked: true }).eq("email", resetEntry.email.toLowerCase());

    return {
      success: true,
      message: "Password Updated Successfully. You Can Now Log In.",
    };
  } catch (err: any) {
    console.error("Confirm Reset Error:", err);
    return { success: false, message: "Unable To Update Password At This Time." };
  }
}

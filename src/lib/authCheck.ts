import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type AdminRole = "full" | "editor" | "view";

export interface AuthenticatedAdmin {
  user: any;
  isOwner: boolean;
  role: AdminRole;
  permissions: string[];
  displayName?: string;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export function handleApiError(error: any) {
  if (error instanceof AuthError) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
  }
  if (typeof error?.message === "string") {
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ success: false, message: error.message }, { status: 401 });
    }
    if (error.message.startsWith("Forbidden")) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
  }
  return NextResponse.json({ success: false, message: error?.message || "Internal Server Error" }, { status: 500 });
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  full: [
    "papers:read",
    "papers:create",
    "papers:update",
    "papers:file",
    "papers:delete",
    "papers:sync",
    "assistant:read",
    "assistant:block",
    "assistant:reply:create",
    "assistant:reply:update",
    "assistant:reply:delete",
    "monitor:read",
    "logs:read",
    "logs:write",
    "queries:read"
  ],
  editor: [
    "papers:read",
    "papers:create",
    "papers:update",
    "papers:file",
    "assistant:read",
    "assistant:reply:update",
    "monitor:read",
    "logs:read",
    "queries:read"
  ],
  view: [
    "papers:read",
    "assistant:read",
    "monitor:read",
    "logs:read",
    "queries:read"
  ]
};

async function validateAdminSessionRecord(adminClient: any, sessionToken: string, userId: string) {
  const { data: sessionRecord, error: sessionErr } = await adminClient
    .from("admin_sessions")
    .select("id, auth_user_id, is_revoked")
    .eq("revocation_token", sessionToken)
    .maybeSingle();

  if (sessionErr || !sessionRecord) {
    throw new AuthError("Unauthorized: Session Not Found Or Invalid.", 401);
  }
  if (sessionRecord.is_revoked) {
    throw new AuthError("Forbidden: Session Has Been Revoked.", 403);
  }
  if (sessionRecord.auth_user_id !== userId) {
    throw new AuthError("Forbidden: Session Mismatch.", 403);
  }

  // Update last_active timestamp asynchronously
  adminClient
    .from("admin_sessions")
    .update({ last_active: new Date().toISOString() })
    .eq("id", sessionRecord.id)
    .then(() => {});
}

async function fetchAdminUserRecord(adminClient: any, userId: string, callerEmail: string) {
  const { data: byAuthId } = await adminClient
    .from("admin_users")
    .select("id, role, is_active, display_name, login_identifier")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (byAuthId) return byAuthId;

  const { data: byEmail } = await adminClient
    .from("admin_users")
    .select("id, role, is_active, display_name, login_identifier")
    .eq("email", callerEmail)
    .maybeSingle();

  return byEmail;
}

export async function requireAdminSession(requiredPermission?: string): Promise<AuthenticatedAdmin> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Unauthorized: Authentication Required.", 401);
  }
  if (!user.email_confirmed_at) {
    throw new AuthError("Forbidden: Email Not Confirmed.", 403);
  }

  // Enforce revocable database session token
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session_token")?.value;

  if (!sessionToken) {
    throw new AuthError("Unauthorized: Active Admin Session Required.", 401);
  }

  const adminClient = createAdminClient();
  await validateAdminSessionRecord(adminClient, sessionToken, user.id);

  const ownerId = process.env.ADMIN_AUTH_USER_ID;
  const ownerEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  const callerEmail = (user.email ?? "").toLowerCase().trim();
  const isOwner = Boolean(
    (ownerEmail && callerEmail === ownerEmail) ||
    (ownerId && user.id === ownerId)
  );

  if (isOwner) {
    const ownerName = process.env.ADMIN_DISPLAY_NAME || user.user_metadata?.display_name || user.user_metadata?.name || (user.email ? user.email.split("@")[0] : "");
    return {
      user,
      isOwner: true,
      role: "full",
      permissions: [...ROLE_PERMISSIONS.full, "admins:manage"],
      displayName: ownerName
    };
  }

  const adminRecord = await fetchAdminUserRecord(adminClient, user.id, callerEmail);

  if (!adminRecord || adminRecord.is_active === false) {
    throw new AuthError("Forbidden: Account Is Inactive Or Unauthorized.", 403);
  }

  const role = (String(adminRecord.role || "view").toLowerCase()) as AdminRole;
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.view;

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    throw new AuthError(`Forbidden: Missing Required Permission '${requiredPermission}'.`, 403);
  }

  const resolvedName = adminRecord.display_name || adminRecord.login_identifier || user.user_metadata?.display_name || user.user_metadata?.name || user.email?.split("@")[0] || "Admin";

  return {
    user,
    isOwner: false,
    role,
    permissions,
    displayName: resolvedName
  };
}


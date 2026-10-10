import { NextResponse } from "next/server";
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
  return NextResponse.json({ success: false, message: error?.message || "Internal server error" }, { status: 500 });
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

export async function requireAdminSession(requiredPermission?: string): Promise<AuthenticatedAdmin> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Unauthorized: Authentication required.", 401);
  }
  if (!user.email_confirmed_at) {
    throw new AuthError("Forbidden: Email not confirmed.", 403);
  }

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

  const adminClient = createAdminClient();
  let adminRecord: any = null;

  // First try matching on auth_user_id
  const { data: byAuthId } = await adminClient
    .from("admin_users")
    .select("id, role, is_active, display_name, login_identifier")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (byAuthId) {
    adminRecord = byAuthId;
  } else {
    // Exact lowercase email lookup
    const { data: byEmail } = await adminClient
      .from("admin_users")
      .select("id, role, is_active, display_name, login_identifier")
      .eq("email", callerEmail)
      .maybeSingle();
    adminRecord = byEmail;
  }

  if (!adminRecord || adminRecord.is_active === false) {
    throw new AuthError("Forbidden: Account is inactive or unauthorized.", 403);
  }

  const role = (String(adminRecord.role || "view").toLowerCase()) as AdminRole;
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.view;

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    throw new AuthError(`Forbidden: Missing required permission '${requiredPermission}'.`, 403);
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


import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type AdminRole = "full" | "editor" | "view";

export interface AuthenticatedAdmin {
  user: any;
  isOwner: boolean;
  role: AdminRole;
  permissions: string[];
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

  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const callerEmail = (user.email || "").toLowerCase().trim();
  const isOwner = Boolean(adminEmail && callerEmail === adminEmail);

  if (isOwner) {
    return {
      user,
      isOwner: true,
      role: "full",
      permissions: [...ROLE_PERMISSIONS.full, "admins:manage"]
    };
  }

  const adminClient = createAdminClient();
  const { data: admin } = await adminClient
    .from("admin_users")
    .select("role, is_active")
    .or(`email.ilike.${callerEmail},login_identifier.ilike.${callerEmail}`)
    .maybeSingle();

  if (!admin || admin.is_active === false) {
    throw new AuthError("Forbidden: Account is inactive or unauthorized.", 403);
  }

  const role = (String(admin.role || "view").toLowerCase()) as AdminRole;
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.view;

  if (requiredPermission) {
    if (!permissions.includes(requiredPermission)) {
      throw new AuthError(`Forbidden: Missing required permission '${requiredPermission}'.`, 403);
    }
  }

  return {
    user,
    isOwner: false,
    role,
    permissions
  };
}


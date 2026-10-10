import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const ROLE_PERMISSIONS: Record<string, string[]> = {
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
    "logs:write"
  ],
  editor: [
    "papers:read",
    "papers:create",
    "papers:update",
    "papers:file",
    "assistant:read",
    "assistant:reply:update",
    "monitor:read"
  ],
  view: [
    "papers:read",
    "assistant:read",
    "monitor:read"
  ]
};

function getRolePermissions(role: string, isOwner = false): string[] {
  if (isOwner) {
    return [...ROLE_PERMISSIONS.full, "admins:manage"];
  }
  const cleanRole = String(role || "").toLowerCase();
  return ROLE_PERMISSIONS[cleanRole] || ROLE_PERMISSIONS.view;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    // Fetch admin details using admin client to bypass any RLS restriction
    const ownerId = process.env.ADMIN_AUTH_USER_ID;
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const userEmail = (user.email || "").toLowerCase().trim();
    const isOwner = Boolean(
      (adminEmail && userEmail === adminEmail) ||
      (ownerId && user.id === ownerId)
    );
    const adminClient = createAdminClient();

    // Verify session has not been revoked
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session_token")?.value;
    if (sessionToken) {
      const { data: sessionRow } = await adminClient
        .from("admin_sessions")
        .select("is_revoked")
        .eq("revocation_token", sessionToken)
        .maybeSingle();

      if (sessionRow?.is_revoked) {
        await supabase.auth.signOut();
        cookieStore.delete("admin_session_token");
        return NextResponse.json({ message: "Session revoked", code: "SESSION_REVOKED" }, { status: 401 });
      }
    } else {
      const { data: latestSession } = await adminClient
        .from("admin_sessions")
        .select("is_revoked")
        .eq("email", userEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestSession?.is_revoked) {
        await supabase.auth.signOut();
        return NextResponse.json({ message: "Session revoked", code: "SESSION_REVOKED" }, { status: 401 });
      }
    }

    const { data: admin } = await adminClient
      .from("admin_users")
      .select("id, email, login_identifier, display_name, role")
      .or(`email.ilike.${userEmail},login_identifier.ilike.${userEmail}`)
      .maybeSingle();

    const isOwnerResolved = Boolean(
      isOwner ||
      admin?.login_identifier?.toLowerCase() === "superadmin"
    );

    const roleClean = String(admin?.role || "").toLowerCase().trim();
    let role = "View";
    if (isOwnerResolved) {
      role = "Super Admin";
    } else if (roleClean === "full") {
      role = "Full";
    } else if (roleClean === "editor") {
      role = "Editor";
    }

    // Name Of Person From .env File for Super Admin, or from Database for other admins
    const resolvedDisplayName = isOwnerResolved
      ? (process.env.ADMIN_DISPLAY_NAME || "")
      : (admin?.display_name || user.email?.split("@")[0] || "");

    const permissions = getRolePermissions(role, isOwnerResolved);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: admin?.login_identifier || user.email?.split("@")[0],
        loginIdentifier: admin?.login_identifier || user.email?.split("@")[0],
        role,
        isOwner: isOwnerResolved,
        displayName: resolvedDisplayName,
        full_name: resolvedDisplayName,
        permissions
      }
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Failed to fetch session" }, { status: 500 });
  }
}

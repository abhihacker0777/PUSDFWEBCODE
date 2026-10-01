import { NextResponse } from "next/server";
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
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const isOwner = Boolean(adminEmail && user.email?.toLowerCase().trim() === adminEmail);

    const userEmail = (user.email || "").toLowerCase().trim();
    const adminClient = createAdminClient();
    const { data: admin } = await adminClient
      .from("admin_users")
      .select("id, email, login_identifier, display_name, role")
      .or(`email.ilike.${userEmail},login_identifier.ilike.${userEmail}`)
      .maybeSingle();

    const roleClean = String(admin?.role || "").toLowerCase().trim();
    let role = "View";
    if (isOwner || roleClean === "full") {
      role = "Full";
    } else if (roleClean === "editor") {
      role = "Editor";
    }

    let defaultName = user.email?.split("@")[0] || "Admin";
    if (isOwner) {
      defaultName = process.env.ADMIN_DISPLAY_NAME || "PU Central-Library";
    }
    const resolvedDisplayName = admin?.display_name || defaultName;

    const permissions = getRolePermissions(role, isOwner);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: admin?.login_identifier || user.email?.split("@")[0],
        loginIdentifier: admin?.login_identifier || user.email?.split("@")[0],
        role,
        isOwner,
        displayName: resolvedDisplayName,
        full_name: resolvedDisplayName,
        permissions
      }
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Failed to fetch session" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function verifyCanManageAdmins() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { authorized: false, status: 401, message: "Unauthorized" };
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const callerEmail = (user.email || "").toLowerCase().trim();
  const ownerId = process.env.ADMIN_AUTH_USER_ID;

  let isOwner = Boolean(
    (adminEmail && callerEmail === adminEmail) ||
    (ownerId && user.id === ownerId)
  );

  if (!isOwner) {
    const adminClient = createAdminClient();
    const { data: adminRow } = await adminClient
      .from("admin_users")
      .select("login_identifier")
      .or(`email.ilike.${callerEmail},login_identifier.ilike.${callerEmail}`)
      .maybeSingle();

    if (adminRow?.login_identifier?.toLowerCase() === "superadmin") {
      isOwner = true;
    }
  }

  if (!isOwner) {
    return { authorized: false, status: 403, message: "Forbidden: Only Primary Admin can manage admin accounts" };
  }

  return { authorized: true, user };
}

function formatRole(role?: string, isOwner = false): "Full" | "Editor" | "View" {
  if (isOwner) return "Full";
  const r = String(role || "").toLowerCase();
  if (r === "full") return "Full";
  if (r === "editor") return "Editor";
  return "View";
}

function normalizeRoleDb(role?: string): "full" | "editor" | "view" {
  const r = String(role || "").toLowerCase();
  if (r === "full") return "full";
  if (r === "editor") return "editor";
  return "view";
}

function getAdminPermissionsList(role: string, isOwner = false): string[] {
  if (isOwner || role === "Full") {
    return [
      "papers:create", "papers:update", "papers:delete", "papers:file", "papers:sync",
      "assistant:read", "assistant:block", "assistant:reply:create", "assistant:reply:update", "assistant:reply:delete",
      "monitor:read", "logs:write", "admins:manage"
    ];
  }
  if (role === "Editor") {
    return ["papers:create", "papers:update", "papers:file", "assistant:read"];
  }
  return [];
}

function resolveAdminDisplayName(u: any, isOwner: boolean): string {
  if (u.display_name) return u.display_name;
  if (isOwner) return process.env.ADMIN_DISPLAY_NAME || "";
  return u.email || "";
}

export async function GET() {
  try {
    const authCheck = await verifyCanManageAdmins();
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, message: authCheck.message }, { status: authCheck.status });
    }

    const adminClient = createAdminClient();
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

    const { data, error } = await adminClient
      .from("admin_users")
      .select("id, email, login_identifier, display_name, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("admin_users fetch warning:", error.message);
    }

    const rows = data || [];

    // Map rows to public admin user shape
    const users = rows.map((u: any) => {
      const email = (u.email || u.login_identifier || "").toLowerCase().trim();
      const isOwner = Boolean(
        (adminEmail && email === adminEmail) ||
        (process.env.ADMIN_AUTH_USER_ID && u.auth_user_id === process.env.ADMIN_AUTH_USER_ID) ||
        u.login_identifier?.toLowerCase() === "superadmin"
      );
      const role = formatRole(u.role, isOwner);

      return {
        id: u.id,
        email: u.email || u.login_identifier,
        loginIdentifier: u.login_identifier || u.email,
        username: u.login_identifier || u.email?.split("@")[0],
        displayName: resolveAdminDisplayName(u, isOwner),
        role,
        isOwner,
        isActive: u.is_active !== false,
        permissions: getAdminPermissionsList(role, isOwner),
        createdAt: u.created_at
      };
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyCanManageAdmins();
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, message: authCheck.message }, { status: authCheck.status });
    }

    const body = await req.json();
    const { username, displayName, role, password } = body;
    const loginIdentifier = (username || body.email || "").trim().toLowerCase();
    let email = (body.email || loginIdentifier || "").trim().toLowerCase();

    // Enforce real identity & institutional domain
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, message: "A valid email address is required." }, { status: 400 });
    }
    const allowedDomain = (process.env.ASSISTANT_EMAIL_DOMAIN || "").trim().replace(/^@/, "");
    if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
      return NextResponse.json({
        success: false,
        message: `Only official @${allowedDomain} institutional email addresses are permitted.`,
      }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const roleDb = normalizeRoleDb(role);

    let authUserId: string | null = null;
    if (password) {
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName || loginIdentifier,
          login_identifier: loginIdentifier,
          role: roleDb
        }
      });
      if (authError) throw authError;
      authUserId = authUser.user.id;
    }

    const { data: newUser, error: dbError } = await adminClient
      .from("admin_users")
      .insert({
        email,
        login_identifier: loginIdentifier,
        display_name: displayName || loginIdentifier,
        role: roleDb,
        is_active: true,
        auth_user_id: authUserId,
      })
      .select("id, email, login_identifier, display_name, role, is_active, created_at")
      .single();

    if (dbError) throw dbError;

    const roleFormatted = formatRole(roleDb);

    // Module 1: Check library_admin_invite_notify setting (default: false)
    let inviteSent = false;
    try {
      const { data: settingRow } = await adminClient
        .from("system_settings")
        .select("value")
        .eq("key", "library_admin_invite_notify")
        .maybeSingle();

      if (settingRow?.value?.enabled === true) {
        const { sendLibraryAdminInviteEmail } = await import("@/lib/email");
        const origin = (process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || "").replace(/\/+$/, "");
        void sendLibraryAdminInviteEmail({
          to: email,
          adminName: displayName || loginIdentifier,
          role: roleFormatted,
          loginUrl: `${origin}/login`,
        });
        inviteSent = true;
      }
    } catch (inviteErr) {
      console.warn("Could not dispatch admin invite email:", inviteErr);
    }

    const message = inviteSent
      ? `Admin user added. Onboarding invite email has been sent to ${email}.`
      : "Admin user added successfully.";

    return NextResponse.json({
      success: true,
      message,
      inviteSent,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.login_identifier,
        loginIdentifier: newUser.login_identifier,
        displayName: newUser.display_name,
        role: roleFormatted,
        isActive: newUser.is_active,
        permissions: []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authCheck = await verifyCanManageAdmins();
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, message: authCheck.message }, { status: authCheck.status });
    }

    const body = await req.json();
    const { id, displayName, role, isActive, password } = body;
    if (!id) return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });

    const adminClient = createAdminClient();
    const updates: any = {};
    if (displayName !== undefined) updates.display_name = displayName;
    if (role !== undefined) {
      updates.role = normalizeRoleDb(role);
    }
    if (isActive !== undefined) updates.is_active = isActive;

    const { data: updated, error } = await adminClient
      .from("admin_users")
      .update(updates)
      .eq("id", id)
      .select("id, email, login_identifier, display_name, role, is_active, created_at, auth_user_id")
      .single();

    if (error) throw error;

    if (password && updated.auth_user_id) {
      await adminClient.auth.admin.updateUserById(updated.auth_user_id, {
        password,
      });
    }

    if (isActive === false && updated.email) {
      await adminClient
        .from("admin_sessions")
        .update({ is_revoked: true })
        .eq("email", updated.email.toLowerCase());
    }

    const roleFormatted = formatRole(updated.role);

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.login_identifier,
        loginIdentifier: updated.login_identifier,
        displayName: updated.display_name,
        role: roleFormatted,
        isActive: updated.is_active,
        permissions: []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await verifyCanManageAdmins();
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, message: authCheck.message }, { status: authCheck.status });
    }

    const body = await req.json();
    const id = body.id;
    if (!id) return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });

    const adminClient = createAdminClient();
    const { data: existing } = await adminClient
      .from("admin_users")
      .select("auth_user_id")
      .eq("id", id)
      .single();

    if (existing?.auth_user_id) {
      await adminClient.auth.admin.deleteUser(existing.auth_user_id).catch(() => {});
    }

    const { error } = await adminClient.from("admin_users").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

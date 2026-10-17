import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/authCheck";

async function verifyCanManageAdmins() {
  try {
    const admin = await requireAdminSession("admins:manage");
    return { authorized: true, user: admin.user, isOwner: admin.isOwner };
  } catch (err: any) {
    return {
      authorized: false,
      status: err.statusCode || 403,
      message: err.message || "Forbidden: Only Primary Admin can manage admin accounts",
    };
  }
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
      .select("id, auth_user_id, email, login_identifier, display_name, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Admin Users Fetch Warning:", error.message);
    }

    const rows = data || [];

    const users = rows.map((u: any) => {
      const email = (u.email || u.login_identifier || "").toLowerCase().trim();
      const isOwner = Boolean(
        (adminEmail && email === adminEmail) ||
        (process.env.ADMIN_AUTH_USER_ID && u.auth_user_id === process.env.ADMIN_AUTH_USER_ID)
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

    const body = (await req.json()) || {};
    const { username, displayName, role, password, email: rawEmail } = body;
    const loginIdentifier = (username || rawEmail || "").trim().toLowerCase();
    let email = (rawEmail || loginIdentifier || "").trim().toLowerCase();

    if (!email.includes("@")) {
      return NextResponse.json({ success: false, message: "A Valid Email Address Is Required." }, { status: 400 });
    }
    const allowedDomain = (process.env.ASSISTANT_EMAIL_DOMAIN || "").trim().replace(/^@/, "");
    if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
      return NextResponse.json({
        success: false,
        message: `Only Official @${allowedDomain} Institutional Email Addresses Are Permitted.`,
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

    let inviteSent = false;
    try {
      const { data: settingRow } = await adminClient
        .from("system_settings")
        .select("value")
        .eq("key", "library_admin_invite_notify")
        .maybeSingle();

      if (settingRow?.value?.enabled === true) {
        const { sendLibraryAdminInviteEmail } = await import("@/lib/email");
        const rawOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || "";
        const origin = rawOrigin.endsWith("/") ? rawOrigin.slice(0, -1) : rawOrigin;
        void sendLibraryAdminInviteEmail({
          to: email,
          adminName: displayName || loginIdentifier,
          role: roleFormatted,
          loginUrl: `${origin}/login`,
        });
        inviteSent = true;
      }
    } catch (inviteErr) {
      console.warn("Could Not Dispatch Admin Invite Email:", inviteErr);
    }

    const message = inviteSent
      ? `Admin User Added. Onboarding Invite Email Has Been Sent To ${email}.`
      : "Admin User Added Successfully.";

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
    if (!id) return NextResponse.json({ success: false, message: "ID Is Required" }, { status: 400 });

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
    if (!id) return NextResponse.json({ success: false, message: "ID Is Required" }, { status: 400 });

    const adminClient = createAdminClient();
    const { data: existing } = await adminClient
      .from("admin_users")
      .select("auth_user_id")
      .eq("id", id)
      .single();

    if (existing?.auth_user_id) {
      await adminClient.auth.admin.deleteUser(existing.auth_user_id).catch(() => { });
    }

    const { error } = await adminClient.from("admin_users").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

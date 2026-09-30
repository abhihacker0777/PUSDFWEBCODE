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
  const isOwner = Boolean(adminEmail && callerEmail === adminEmail);

  if (!isOwner) {
    return { authorized: false, status: 403, message: "Forbidden: Only Primary Admin can manage admin accounts" };
  }

  return { authorized: true, user };
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
      const isOwner = Boolean(adminEmail && email === adminEmail);
      const roleStr = String(u.role || "").toLowerCase();
      const role = isOwner ? "Full" : (roleStr === "full" ? "Full" : roleStr === "editor" ? "Editor" : "View");

      return {
        id: u.id,
        email: u.email || u.login_identifier,
        loginIdentifier: u.login_identifier || u.email,
        username: u.login_identifier || u.email?.split("@")[0],
        displayName: u.display_name || (isOwner ? (process.env.ADMIN_DISPLAY_NAME || "PU Central-Library") : (u.email || "Admin")),
        role,
        isOwner,
        isActive: u.is_active !== false,
        permissions: isOwner || role === "Full" ? [
          "papers:create", "papers:update", "papers:delete", "papers:file", "papers:sync",
          "assistant:read", "assistant:block", "assistant:reply:create", "assistant:reply:update", "assistant:reply:delete",
          "monitor:read", "logs:write", "admins:manage"
        ] : role === "Editor" ? [
          "papers:create", "papers:update", "papers:file", "assistant:read"
        ] : [],
        createdAt: u.created_at
      };
    });

    // Ensure the Owner Admin is always present even if not yet in database
    if (adminEmail && !users.some((u) => u.email?.toLowerCase().trim() === adminEmail)) {
      users.unshift({
        id: "owner-root",
        email: adminEmail,
        loginIdentifier: adminEmail,
        username: adminEmail.split("@")[0],
        displayName: process.env.ADMIN_DISPLAY_NAME || "PU Central-Library",
        role: "Full",
        isOwner: true,
        isActive: true,
        permissions: [
          "papers:create", "papers:update", "papers:delete", "papers:file", "papers:sync",
          "assistant:read", "assistant:block", "assistant:reply:create", "assistant:reply:update", "assistant:reply:delete",
          "monitor:read", "logs:write", "admins:manage"
        ],
        createdAt: new Date().toISOString()
      });
    }

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
    let email = (body.email || "").trim().toLowerCase();

    if (!email) {
      email = loginIdentifier.includes("@")
        ? loginIdentifier
        : `${loginIdentifier}@pyqp.local`;
    }

    const adminClient = createAdminClient();
    const roleLower = String(role || "view").toLowerCase();
    const roleDb = roleLower === "full" ? "full" : roleLower === "editor" ? "editor" : "view";

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

    const roleFormatted = roleDb === "full" ? "Full" : roleDb === "editor" ? "Editor" : "View";

    return NextResponse.json({
      success: true,
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
      const rLower = String(role).toLowerCase();
      updates.role = rLower === "full" ? "full" : rLower === "editor" ? "editor" : "view";
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

    const roleLower = String(updated.role || "").toLowerCase();
    const roleFormatted = roleLower === "full" ? "Full" : roleLower === "editor" ? "Editor" : "View";

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

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireAdminSession();
    const adminSupabase = createAdminClient();

    const { data: rows } = await adminSupabase
      .from("system_settings")
      .select("key, value");

    const settingsMap: Record<string, any> = {
      library_admin_invite_notify: false,
      admin_login_notify: false,
      maintenance_mode: false,
      maintenance_message: "Papers under semester review",
    };

    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (row.key === "library_admin_invite_notify") {
          settingsMap.library_admin_invite_notify = Boolean(row.value?.enabled);
        } else if (row.key === "admin_login_notify") {
          settingsMap.admin_login_notify = Boolean(row.value?.enabled);
        } else if (row.key === "maintenance_mode") {
          settingsMap.maintenance_mode = Boolean(row.value?.enabled);
          if (row.value?.message) {
            settingsMap.maintenance_message = row.value.message;
          }
        }
      }
    }

    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdminSession("admins:manage");
    if (!admin.isOwner) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Only University IT / Super Admin can update system settings." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const adminSupabase = createAdminClient();

    if (typeof body.library_admin_invite_notify === "boolean") {
      await adminSupabase.from("system_settings").upsert({
        key: "library_admin_invite_notify",
        value: { enabled: body.library_admin_invite_notify },
        updated_at: new Date().toISOString(),
      });
    }

    if (typeof body.admin_login_notify === "boolean") {
      await adminSupabase.from("system_settings").upsert({
        key: "admin_login_notify",
        value: { enabled: body.admin_login_notify },
        updated_at: new Date().toISOString(),
      });
    }

    if (typeof body.maintenance_mode === "boolean") {
      await adminSupabase.from("system_settings").upsert({
        key: "maintenance_mode",
        value: {
          enabled: body.maintenance_mode,
          message: body.maintenance_message || "Papers under semester review",
        },
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully." });
  } catch (err: any) {
    return handleApiError(err);
  }
}

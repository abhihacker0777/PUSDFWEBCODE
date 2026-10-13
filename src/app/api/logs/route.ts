import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function GET() {
  try {
    await requireAdminSession("logs:read");
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("admin_logs")
      .select("*")
      .neq("status", "login")
      .not("name", "ilike", "%login%")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.warn("Admin Logs Fetch Warning:", error.message);
      return NextResponse.json([]);
    }

    const { data: adminUsers } = await adminClient
      .from("admin_users")
      .select("email, login_identifier, display_name");

    const emailToName = new Map<string, string>();
    (adminUsers || []).forEach((u: any) => {
      const name = u.display_name || u.login_identifier;
      if (u.email && name) emailToName.set(u.email.toLowerCase(), name);
      if (u.login_identifier && name) emailToName.set(u.login_identifier.toLowerCase(), name);
    });

    const ownerEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const ownerName = process.env.ADMIN_DISPLAY_NAME || "";
    if (ownerEmail) {
      emailToName.set(ownerEmail, ownerName);
    }

    const logs = (data || []).map((row: any) => {
      const rawAdmin = String(row.admin_name || row.adminName || "").trim();
      let adminName = "PU Central-Library";
      if (rawAdmin) {
        const lower = rawAdmin.toLowerCase();
        if (emailToName.has(lower)) {
          adminName = emailToName.get(lower)!;
        } else if (rawAdmin.includes("@")) {
          adminName = rawAdmin.split("@")[0];
        } else {
          adminName = rawAdmin;
        }
      }

      let displayDate = row.date || "-";
      if (row.date && (row.date.includes("T") || row.date.endsWith("Z"))) {
        const parsed = new Date(row.date);
        if (!Number.isNaN(parsed.getTime())) {
          displayDate = parsed.toLocaleString("En-IN", { timeZone: "Asia/Kolkata" });
        }
      } else if (!row.date && row.created_at) {
        displayDate = new Date(row.created_at).toLocaleString("En-IN", { timeZone: "Asia/Kolkata" });
      }

      return {
        id: row.id,
        createdAt: row.created_at || row.date || "",
        date: displayDate,
        status: row.status || "-",
        course: row.course || "-",
        year: row.year || "-",
        spec: row.spec || row.specialization || "-",
        semester: row.semester || row.sem || "-",
        exam: row.exam || "-",
        name: row.name || row.title || "-",
        adminName,
      };
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    await requireAdminSession("logs:write");
    const adminClient = createAdminClient();
    await adminClient.from("admin_logs").delete().neq("id", 0);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleApiError(error);
  }
}


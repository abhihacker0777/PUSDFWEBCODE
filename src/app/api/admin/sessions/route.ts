import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    const adminSupabase = createAdminClient();

    // Fetch the 20 most recent admin sessions
    const { data: rows, error } = await adminSupabase
      .from("admin_sessions")
      .select("id, email, display_name, ip_address, user_agent, last_active, is_revoked, created_at")
      .order("last_active", { ascending: false })
      .limit(20);

    if (error) {
      console.warn("admin_sessions fetch error:", error.message);
    }

    const now = Date.now();
    const sessions = (rows || []).map((s: any) => {
      const lastActiveMs = s.last_active ? new Date(s.last_active).getTime() : 0;
      // Active within the last 60 seconds and not revoked means "Online Now"
      const isOnline = !s.is_revoked && (now - lastActiveMs <= 60_000);
      const lastActiveIst = s.last_active
        ? new Date(s.last_active).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        : "";

      return {
        id: s.id,
        email: s.email,
        displayName: s.display_name || s.email,
        ipAddress: s.ip_address || "—",
        userAgent: s.user_agent || "—",
        lastActive: s.last_active,
        lastActiveIst,
        isOnline,
        isRevoked: s.is_revoked,
      };
    });

    return NextResponse.json({ success: true, sessions });
  } catch (err: any) {
    return handleApiError(err);
  }
}

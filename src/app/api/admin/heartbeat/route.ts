import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    const adminSupabase = createAdminClient();
    const email = (admin.user.email || "").toLowerCase().trim();

    const sessionToken = req.cookies.get("admin_session_token")?.value;
    if (sessionToken) {
      const { data: sessionData } = await adminSupabase
        .from("admin_sessions")
        .select("id, is_revoked")
        .eq("revocation_token", sessionToken)
        .maybeSingle();

      if (sessionData?.is_revoked) {
        const supabase = await createClient();
        await supabase.auth.signOut();
        const res = NextResponse.json({ success: false, message: "Session revoked", code: "SESSION_REVOKED" }, { status: 401 });
        res.cookies.delete("admin_session_token");
        return res;
      }

      if (sessionData) {
        await adminSupabase
          .from("admin_sessions")
          .update({ last_active: new Date().toISOString() })
          .eq("id", sessionData.id);
        return NextResponse.json({ success: true, timestamp: Date.now() });
      }
    }

    return NextResponse.json(
      { success: false, message: "Invalid or expired session token", code: "INVALID_SESSION" },
      { status: 401 }
    );
  } catch (err: any) {
    return handleApiError(err);
  }
}

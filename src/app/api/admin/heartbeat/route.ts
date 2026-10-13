import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();
    const adminSupabase = createAdminClient();

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
        const res = NextResponse.json({ success: false, message: "Session Revoked", code: "SESSION_REVOKED" }, { status: 401 });
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
      { success: false, message: "Invalid Or Expired Session Token", code: "INVALID_SESSION" },
      { status: 401 }
    );
  } catch (err: any) {
    return handleApiError(err);
  }
}

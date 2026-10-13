import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession("logs:write");

    const body = await req.json();
    const ids = body.ids || [];
    if (!ids.length) return NextResponse.json({ success: true, count: 0 });

    const adminClient = createAdminClient();
    await adminClient.from("admin_logs").delete().in("id", ids);

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    return handleApiError(error);
  }
}



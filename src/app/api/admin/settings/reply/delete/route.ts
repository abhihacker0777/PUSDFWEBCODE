import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession("assistant:reply:delete");

    const body = await req.json();
    const keyword = (body.keyword || "").trim().toLowerCase();
    if (!keyword) return NextResponse.json({ success: false, message: "Keyword required" }, { status: 400 });

    const adminClient = createAdminClient();
    await adminClient.from("custom_replies").delete().eq("keyword", keyword);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleApiError(error);
  }
}

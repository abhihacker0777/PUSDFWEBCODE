import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession("assistant:reply:update");
    const body = await req.json();
    const keyword = (body.keyword || "").trim().toLowerCase();
    const reply = (body.reply || "").trim();

    if (!keyword || !reply) {
      return NextResponse.json({ success: false, message: "Keyword and reply required" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    await adminClient.from("custom_replies").upsert({
      keyword,
      reply,
      updated_at: new Date().toISOString()
    }, { onConflict: "keyword" });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleApiError(error);
  }
}


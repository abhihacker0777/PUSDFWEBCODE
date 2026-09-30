import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession("assistant:block");

    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ success: false, message: "Email required" }, { status: 400 });

    const adminClient = createAdminClient();
    await adminClient.from("blocked_users").upsert({ email }, { onConflict: "email" });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleApiError(error);
  }
}



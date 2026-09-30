import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function GET() {
  try {
    await requireAdminSession("assistant:block");
    const adminClient = createAdminClient();
    const { data } = await adminClient.from("blocked_users").select("email").order("created_at", { ascending: false });
    return NextResponse.json((data || []).map((r: any) => r.email).filter(Boolean));
  } catch (error: any) {
    return handleApiError(error);
  }
}


import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function GET() {
  try {
    await requireAdminSession("assistant:read");
    const adminClient = createAdminClient();
    const { data } = await adminClient.from("custom_replies").select("*").order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  } catch (error: any) {
    return handleApiError(error);
  }
}


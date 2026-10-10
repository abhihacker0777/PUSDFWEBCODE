import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminSupabase = createAdminClient();
    const { data: row } = await adminSupabase
      .from("system_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();

    const isEnabled = Boolean(row?.value?.enabled);
    const message = row?.value?.message || "Papers under semester review";

    return NextResponse.json({
      success: true,
      maintenanceMode: isEnabled,
      message,
    });
  } catch (err) {
    return NextResponse.json({
      success: true,
      maintenanceMode: false,
      message: "Papers under semester review",
    });
  }
}

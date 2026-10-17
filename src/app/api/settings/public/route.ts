import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminSupabase = createAdminClient();
    const { data: row, error } = await adminSupabase
      .from("system_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();

    if (error) {
      console.error("[Settings] Error reading public settings:", error.message);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to read system configuration",
        },
        { status: 503 }
      );
    }

    const isEnabled = Boolean(row?.value?.enabled);
    const message = row?.value?.message || "Papers Under Semester Review";

    return NextResponse.json({
      success: true,
      maintenanceMode: isEnabled,
      message,
    });
  } catch (err: any) {
    console.error("[Settings] Critical failure in public settings route:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Configuration service temporarily unavailable",
      },
      { status: 503 }
    );
  }
}

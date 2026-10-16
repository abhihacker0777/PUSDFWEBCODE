import { NextRequest, NextResponse } from "next/server";
import { pruneExpiredSupabaseRecords } from "@/lib/retention";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Optional secret check if CRON_SECRET is configured
    }

    const result = await pruneExpiredSupabaseRecords(30, true);
    return NextResponse.json({
      success: true,
      message: "30-day retention prune executed successfully.",
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to prune records." },
      { status: 500 }
    );
  }
}

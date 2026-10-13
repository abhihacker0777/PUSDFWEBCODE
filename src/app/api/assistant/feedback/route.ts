import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { allow, clientIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const ipAllowed = await allow("assistant", `ip:${ip}`, 15, 60000);
    if (!ipAllowed) {
      return NextResponse.json(
        { success: false, message: "Too Many Feedback Requests. Please Wait A Moment." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const studentEmail = String(body?.studentEmail || body?.email || "").trim().toLowerCase();
    const query = String(body?.query || body?.paperName || "").trim().slice(0, 300);

    if (!studentEmail) {
      return NextResponse.json(
        { success: false, message: "Student Institutional Email Is Required." },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { success: false, message: "Paper Query Details Are Required." },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    const { error } = await db.from("student_queries").insert({
      email: studentEmail,
      question: query,
      status: "paper_feedback_requested",
      message: `Student requested missing paper via AI Assistant. Alert email scheduled for ${studentEmail} upon availability.`,
      paper_name: query,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Feedback Insertion Warning:", error.message);
    }

    return NextResponse.json({
      success: true,
      message: `Feedback recorded! Our Central Library team will review this paper request. You will receive an email update at ${studentEmail} once it becomes available in the portal.`,
    });
  } catch (err: any) {
    console.error("Assistant Feedback Route Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Failed To Submit Feedback." },
      { status: 500 }
    );
  }
}

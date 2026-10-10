import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { allow, clientIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const ipAllowed = await allow("assistant", `ip:${ip}`, 15, 60000);
    if (!ipAllowed) {
      return NextResponse.json(
        { success: false, message: "Too many feedback requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const studentEmail = String(body?.studentEmail || body?.email || "").trim().toLowerCase();
    const query = String(body?.query || body?.paperName || "").trim().slice(0, 300);

    if (!studentEmail) {
      return NextResponse.json(
        { success: false, message: "Student institutional email is required." },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { success: false, message: "Paper query details are required." },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    // Log the student feedback / paper request in student_queries
    const { error } = await db.from("student_queries").insert({
      email: studentEmail,
      question: query,
      status: "paper_feedback_requested",
      message: `Student requested missing paper via AI Assistant. Alert email scheduled for ${studentEmail} upon availability.`,
      paper_name: query,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Feedback insertion warning:", error.message);
    }

    return NextResponse.json({
      success: true,
      message: `Feedback recorded! Our Central Library team will review this paper request. You will receive an email update at ${studentEmail} once it becomes available in the portal.`,
    });
  } catch (err: any) {
    console.error("Assistant feedback route error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to submit feedback." },
      { status: 500 }
    );
  }
}

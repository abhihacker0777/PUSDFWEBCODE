import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { allow, clientIp } from "@/lib/ratelimit";
import { verifyGoogleInstitutionalToken, isAllowedAssistantEmail } from "@/lib/googleAuth";

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
    const credential = String(body?.credential ?? "").trim();
    let studentEmail = "";

    if (credential) {
      try {
        const student = await verifyGoogleInstitutionalToken(credential);
        studentEmail = student.email.toLowerCase().trim();
      } catch {
        return NextResponse.json(
          { success: false, message: "Invalid Or Expired Google Session. Please Sign In Again." },
          { status: 401 }
        );
      }
    } else {
      const rawEmail = String(body?.studentEmail || body?.email || "").trim().toLowerCase();
      if (!rawEmail || !isAllowedAssistantEmail(rawEmail)) {
        return NextResponse.json(
          { success: false, message: "Valid University Google Account Authentication Required." },
          { status: 401 }
        );
      }
      studentEmail = rawEmail;
    }

    const query = String(body?.query || body?.paperName || "").trim().slice(0, 300);
    if (!query) {
      return NextResponse.json(
        { success: false, message: "Paper Query Details Are Required." },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    const { data: blocked } = await db
      .from("blocked_users")
      .select("email")
      .eq("email", studentEmail)
      .maybeSingle();

    if (blocked) {
      return NextResponse.json(
        { success: false, message: "Your Access Has Been Disabled By The Administrator." },
        { status: 403 }
      );
    }

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

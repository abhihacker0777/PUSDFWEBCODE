import { NextRequest, NextResponse } from "next/server";
import { askAssistantAction } from "@/actions/assistantActions";
import { verifyGoogleInstitutionalToken } from "@/lib/googleAuth";
import { createAdminClient } from "@/lib/supabase/server";
import { allow, clientIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const ipAllowed = await allow("assistant", `ip:${ip}`, 30, 60000);
    if (!ipAllowed) {
      return NextResponse.json(
        { success: false, message: "Too Many Requests. Please Slow Down." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawQuestion = body?.question || body?.query || "";
    const question = String(rawQuestion).trim().slice(0, 300);

    if (!question) {
      return NextResponse.json(
        { success: false, message: "Please Ask A Question." },
        { status: 400 }
      );
    }

    const credential = String(body?.credential ?? "").trim();
    if (!credential) {
      const domain = (process.env.ASSISTANT_EMAIL_DOMAIN || "").trim().replace(/^@/, "");
      return NextResponse.json(
        {
          success: false,
          code: "SIGN_IN_REQUIRED",
          message: domain ? `Please sign in with your @${domain} Google account to continue.` : "Please sign in with your Google account to continue.",
        },
        { status: 401 }
      );
    }

    let studentEmail = "";
    try {
      const student = await verifyGoogleInstitutionalToken(credential);
      studentEmail = student.email.toLowerCase().trim();
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          code: err.code || "SIGN_IN_REQUIRED",
          message: err.message || "Invalid Or Expired Google Session. Please Sign In Again.",
        },
        { status: 401 }
      );
    }

    const userAllowed = await allow("assistant", `user:${studentEmail}`, 20, 60000);
    if (!userAllowed) {
      return NextResponse.json(
        { success: false, message: "You Have Sent Too Many Queries. Please Wait A Minute." },
        { status: 429 }
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
        {
          success: false,
          code: "BLOCKED_USER",
          message: "Your Access To The AI Assistant Has Been Disabled By The Administrator.",
        },
        { status: 403 }
      );
    }

    const result = await askAssistantAction(question, studentEmail);

    return NextResponse.json({
      success: true,
      message: result.message,
      results: result.papers || [],
      papers: result.papers || [],
      canFeedback: Boolean(result.canFeedback),
      queryText: result.queryText || question,
      status: "success",
    });
  } catch (error: any) {
    console.error("Assistant Route Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed To Process Query", results: [], papers: [] },
      { status: 500 }
    );
  }
}

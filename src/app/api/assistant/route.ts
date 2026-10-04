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
        { success: false, message: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawQuestion = body?.question || body?.query || "";
    const question = String(rawQuestion).trim().slice(0, 300);

    if (!question) {
      return NextResponse.json(
        { success: false, message: "Please ask a question." },
        { status: 400 }
      );
    }

    // Require verified Google institutional credential
    const credential = String(body?.credential ?? "").trim();
    if (!credential) {
      return NextResponse.json(
        {
          success: false,
          code: "SIGN_IN_REQUIRED",
          message: "Please sign in with your Poornima University Google account to continue.",
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
          message: err.message || "Invalid or expired Google session. Please sign in again.",
        },
        { status: 401 }
      );
    }

    const userAllowed = await allow("assistant", `user:${studentEmail}`, 20, 60000);
    if (!userAllowed) {
      return NextResponse.json(
        { success: false, message: "You have sent too many queries. Please wait a minute." },
        { status: 429 }
      );
    }

    const db = createAdminClient();

    // Check blocked_users
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
          message: "Your access to the AI Assistant has been disabled by the administrator.",
        },
        { status: 403 }
      );
    }

    // Check custom_replies
    const { data: replies } = await db
      .from("custom_replies")
      .select("keyword, reply");

    const qLower = question.toLowerCase();
    const matchedCustom = (replies || []).find(
      (r: any) => r.keyword && qLower.includes(String(r.keyword).trim().toLowerCase())
    );

    if (matchedCustom) {
      return NextResponse.json({
        success: true,
        message: matchedCustom.reply,
        results: [],
        papers: [],
        status: "success",
      });
    }

    const result = await askAssistantAction(question, studentEmail);

    return NextResponse.json({
      success: true,
      message: result.message,
      results: result.papers || [],
      papers: result.papers || [],
      status: "success",
    });
  } catch (error: any) {
    console.error("Assistant route error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process query", results: [], papers: [] },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { askAssistantAction } from "@/actions/assistantActions";
import { verifyGoogleInstitutionalToken } from "@/lib/googleAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = body?.question || body?.query || "";
    let email = body?.email;

    if (!email && body?.credential) {
      try {
        const student = await verifyGoogleInstitutionalToken(body.credential);
        email = student.email;
      } catch {
        // Continue with query even if credential verification is pending
      }
    }

    const result = await askAssistantAction(question, email);
    
    return NextResponse.json({
      success: true,
      message: result.message,
      results: result.papers || [],
      papers: result.papers || [],
      status: "success",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process query", results: [], papers: [] },
      { status: 500 }
    );
  }
}

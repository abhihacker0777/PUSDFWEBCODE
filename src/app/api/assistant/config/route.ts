import { NextResponse } from "next/server";

export function GET() {
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_SIGNIN_CLIENT_ID ||
    process.env.CLIENT_ID ||
    "";

  return NextResponse.json({
    googleClientId,
    emailDomain: process.env.ASSISTANT_EMAIL_DOMAIN || "poornima.edu.in",
    aiProvider: "gemini",
    geminiEnabled: true,
    sarvamEnabled: false
  });
}

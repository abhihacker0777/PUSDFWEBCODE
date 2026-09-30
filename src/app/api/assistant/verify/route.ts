import { NextRequest, NextResponse } from "next/server";
import { verifyGoogleInstitutionalToken } from "@/lib/googleAuth";

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json().catch(() => ({}));
    if (!credential) {
      return NextResponse.json({ message: "Google credential missing" }, { status: 400 });
    }

    const student = await verifyGoogleInstitutionalToken(credential);
    return NextResponse.json({
      success: true,
      user: {
        email: student.email,
        name: student.name,
        picture: student.picture,
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Google verification failed", code: "INVALID_GOOGLE_TOKEN" },
      { status: 403 }
    );
  }
}

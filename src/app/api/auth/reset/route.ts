import { NextRequest, NextResponse } from "next/server";
import { requestPasswordResetAction } from "@/actions/authActions";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json().catch(() => ({}));
    const result = await requestPasswordResetAction(email);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed" }, { status: 500 });
  }
}

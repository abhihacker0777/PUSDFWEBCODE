import { NextRequest, NextResponse } from "next/server";
import { confirmPasswordResetAction } from "@/actions/authActions";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json().catch(() => ({}));
    const result = await confirmPasswordResetAction(token, password);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { loginAction } from "@/actions/authActions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const identifier = body.identifier || body.username || body.email;
    const result = await loginAction(identifier, body.password, body.captchaToken);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message,
        code: result.code,
      }, { status: result.code === "CAPTCHA_REQUIRED" ? 403 : 401 });
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Login failed" },
      { status: 500 }
    );
  }
}

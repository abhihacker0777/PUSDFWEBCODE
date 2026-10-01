import { NextRequest, NextResponse } from "next/server";
import { loginAction } from "@/actions/authActions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const identifier = body.identifier || body.username || body.email;
    const result = await loginAction(identifier, body.password, body.captchaToken);

    if (!result.success) {
      const headers = new Headers();
      const retryAfter = (result as any).retryAfterSeconds;
      if (result.code === "RATE_LIMITED" && retryAfter) {
        headers.set("Retry-After", String(retryAfter));
      }
      let status = 401;
      if (result.code === "CAPTCHA_REQUIRED") {
        status = 403;
      } else if (result.code === "RATE_LIMITED") {
        status = 429;
      }

      return NextResponse.json({
        success: false,
        message: result.message,
        code: result.code,
        retryAfterSeconds: retryAfter,
      }, {
        status,
        headers,
      });
    }

    return NextResponse.json({
      success: true,
      user: "user" in result ? result.user : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Login failed" },
      { status: 500 }
    );
  }
}

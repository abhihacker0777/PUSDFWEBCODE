import { NextRequest, NextResponse } from "next/server";
import { loginAction } from "@/actions/authActions";
import { allow, clientIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const ipAllowed = await allow("login", `ip:${ip}`, 10, 900000);
    if (!ipAllowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many login attempts from this IP. Please try again in 15 minutes.",
          code: "RATE_LIMITED",
        },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

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

      return NextResponse.json(
        {
          success: false,
          message: result.message,
          code: result.code,
          retryAfterSeconds: retryAfter,
        },
        {
          status,
          headers,
        }
      );
    }

    const sanitizedUser =
      "user" in result && result.user
        ? { id: result.user.id, email: result.user.email }
        : null;

    return NextResponse.json({
      success: true,
      user: sanitizedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Login failed" },
      { status: 500 }
    );
  }
}

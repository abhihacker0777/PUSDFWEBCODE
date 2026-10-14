import { NextResponse, type NextRequest } from "next/server";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Webhook has dedicated secret authentication and timingSafeEqual verification
  if (UNSAFE_METHODS.has(req.method) && !pathname.startsWith("/api/webhook")) {
    const site = req.headers.get("sec-fetch-site");
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    let isSameOrigin = false;

    // Check Sec-Fetch-Site header (standard in modern browsers)
    if (site) {
      isSameOrigin = site === "same-origin" || site === "none";
    } else if (origin && host) {
      try {
        isSameOrigin = new URL(origin).host === host;
      } catch {
        isSameOrigin = false;
      }
    }

    // Double-submit CSRF token validation fallback
    const csrfCookie = req.cookies.get("csrf_token")?.value;
    const csrfHeader = req.headers.get("x-csrf-token");
    const hasValidCsrfToken = Boolean(csrfCookie && csrfHeader && csrfCookie === csrfHeader);

    if (!isSameOrigin && !hasValidCsrfToken) {
      return NextResponse.json(
        { success: false, message: "Cross-site request blocked." },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const middleware = proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*[.].*).*)"],
};

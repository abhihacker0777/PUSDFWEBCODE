import { NextResponse, type NextRequest } from "next/server";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function middleware(req: NextRequest) {
  if (UNSAFE_METHODS.has(req.method) && !req.nextUrl.pathname.startsWith("/api/webhook")) {
    const site = req.headers.get("sec-fetch-site");
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    // Allow same-origin requests; block cross-origin CSRF attempts
    const isSameOrigin = site
      ? site === "same-origin" || site === "none"
      : origin
      ? new URL(origin).host === host
      : true; // Non-browser / CLI client fallback

    if (!isSameOrigin) {
      return NextResponse.json(
        { success: false, message: "Cross-site request blocked." },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

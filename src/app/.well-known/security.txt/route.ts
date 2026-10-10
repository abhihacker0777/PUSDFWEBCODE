import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const domain = (process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || `${requestUrl.protocol}//${requestUrl.host}`).replace(/\/+$/, "");
  const contact = process.env.SECURITY_CONTACT_EMAIL || process.env.ADMIN_EMAIL || "";
  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const content = [
    contact ? `Contact: mailto:${contact}` : "",
    `Expires: ${oneYearFromNow}`,
    `Preferred-Languages: en, hi`,
    `Canonical: ${domain}/.well-known/security.txt`,
    `Policy: ${domain}/privacy`,
    `Acknowledgments: ${domain}/about`,
  ].filter(Boolean).join("\n");

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

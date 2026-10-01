import { NextResponse } from "next/server";
import crypto from "node:crypto";

export function GET() {
  const token = crypto.randomBytes(24).toString("hex");
  const response = NextResponse.json({ csrfToken: token });
  response.cookies.set("csrf_token", token, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}

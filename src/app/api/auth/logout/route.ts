import { NextResponse } from "next/server";
import { logoutAction } from "@/actions/authActions";

export async function POST() {
  await logoutAction();
  return NextResponse.json({ success: true, message: "Logged out" });
}

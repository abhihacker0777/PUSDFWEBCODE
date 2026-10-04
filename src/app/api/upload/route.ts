import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, AuthError } from "@/lib/authCheck";
import { uploadPaperAction } from "@/actions/paperActions";

export const runtime = "nodejs";
const MAX_BODY = 4_400_000; // Vercel serverless request-body cap is ~4.5 MB

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession("papers:create");
    if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) {
      return NextResponse.json({ success: false, message: "File too large (max 4 MB)." }, { status: 413 });
    }
    const formData = await req.formData();
    const result = await uploadPaperAction(formData);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }
    console.error("upload failed", error);
    return NextResponse.json({ success: false, message: error.message || "Upload failed." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { uploadPaperAction } from "@/actions/paperActions";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await uploadPaperAction(formData);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Upload failed" }, { status: 500 });
  }
}

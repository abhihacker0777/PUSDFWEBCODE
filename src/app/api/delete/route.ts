import { NextRequest, NextResponse } from "next/server";
import { deletePaperAction } from "@/actions/paperActions";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminSession("papers:delete");

    const body = await req.json();
    const id = body.index || body.id;
    if (!id) {
      return NextResponse.json({ success: false, message: "Paper ID is required" }, { status: 400 });
    }
    const result = await deletePaperAction(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleApiError(error);
  }
}



import { NextRequest, NextResponse } from "next/server";
import { bulkEditPapersAction } from "@/actions/paperActions";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession("papers:update");

    const body = await req.json();
    const items = body.items || [];
    const updates = body.updates || {};
    const ids = items.map((item: any) => item.id || item.index || item);
    const result = await bulkEditPapersAction(ids, updates);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Bulk Edit Failed." },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      message: `Successfully Updated ${result.count || 0} Papers.`,
      updatedCount: result.count || 0,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}



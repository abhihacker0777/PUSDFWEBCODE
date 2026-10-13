import { NextRequest, NextResponse } from "next/server";
import { bulkDeletePapersAction } from "@/actions/paperActions";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession("papers:delete");

    const body = await req.json();
    const items = body.items || [];
    const ids = items.map((item: any) => item.id || item.index || item);
    const result = await bulkDeletePapersAction(ids);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Bulk Delete Failed." },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      message: `Successfully Deleted ${result.count || 0} Papers.`,
      deletedCount: result.count || 0,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}



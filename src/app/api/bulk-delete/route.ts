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
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count || 0} papers.`,
      deletedCount: result.count || 0,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}



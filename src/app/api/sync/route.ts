import { NextResponse } from "next/server";
import { fetchPapersAction } from "@/actions/paperActions";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function POST() {
  try {
    await requireAdminSession("papers:sync");

    const result = await fetchPapersAction();
    return NextResponse.json({
      success: true,
      message: `Database synchronized successfully. (${result.data?.length || 0} papers ready).`,
      count: result.data?.length || 0
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}



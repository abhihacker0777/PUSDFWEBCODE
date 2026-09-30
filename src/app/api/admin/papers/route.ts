import { NextResponse } from "next/server";
import { fetchPapersAction } from "@/actions/paperActions";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function GET() {
  try {
    await requireAdminSession("papers:read");
    const result = await fetchPapersAction();
    return NextResponse.json(result.data || [], {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}


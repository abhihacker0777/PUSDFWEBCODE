import { NextRequest, NextResponse } from "next/server";
import { fetchPapersAction } from "@/actions/paperActions";

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.has("force") || req.nextUrl.searchParams.has("t");
  const result = await fetchPapersAction({ force });
  return NextResponse.json(result.data || [], {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}

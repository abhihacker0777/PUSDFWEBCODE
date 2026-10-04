import { NextResponse } from "next/server";
import { fetchPapersAction } from "@/actions/paperActions";

export async function GET() {
  const result = await fetchPapersAction();
  return NextResponse.json(result.data || [], {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

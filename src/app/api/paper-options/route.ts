import { NextResponse } from "next/server";
import { fetchPapersAction } from "@/actions/paperActions";

export async function GET() {
  try {
    const result = await fetchPapersAction();
    const papers = result.data || [];

    const options = papers.map((p) => ({
      course: p.course || "",
      year: p.year || "",
      specialization: p.specialization || p.spec || "",
      spec: p.specialization || p.spec || "",
      sem: p.semester || p.sem || "",
      semester: p.semester || p.sem || "",
      exam: p.exam || "",
    }));

    return NextResponse.json(options, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    return NextResponse.json([], { status: 500 });
  }
}

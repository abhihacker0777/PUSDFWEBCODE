import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession("queries:read");
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("student_queries")
      .select("id,email,question,status,paper_name,created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const rows = data || [];
    const statusCounts: Record<string, number> = {};
    const notFoundCounts = new Map<string, number>();
    const foundPaperCounts = new Map<string, number>();

    for (const row of rows) {
      const status = row.status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (status === "not_found" && row.question) {
        const q = String(row.question).toLowerCase().trim();
        notFoundCounts.set(q, (notFoundCounts.get(q) || 0) + 1);
      }
      if (status === "found" && row.paper_name) {
        const p = String(row.paper_name).trim();
        foundPaperCounts.set(p, (foundPaperCounts.get(p) || 0) + 1);
      }
    }

    const totalQueries = rows.length;
    const notFoundTotal = statusCounts["not_found"] || 0;
    const notFoundRate = totalQueries > 0 ? Math.round((notFoundTotal / totalQueries) * 100) : 0;

    const topNotFoundQuestions = Array.from(notFoundCounts.entries())
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topFoundPapers = Array.from(foundPaperCounts.entries())
      .map(([paperName, count]) => ({ paperName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      totalQueries,
      statusCounts,
      notFoundRate,
      topNotFoundQuestions,
      topFoundPapers
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}


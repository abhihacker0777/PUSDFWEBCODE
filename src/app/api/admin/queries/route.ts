import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminSession, handleApiError } from "@/lib/authCheck";

export async function GET() {
  try {
    await requireAdminSession("queries:read");
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("student_queries")
      .select("id,email,question,status,message,paper_name,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("student_queries fetch warning:", error.message);
      return NextResponse.json([]);
    }

    const queries = (data || []).map((row: any) => ({
      id: row.id,
      createdAt: row.created_at || "",
      date: row.created_at ? new Date(row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-",
      email: row.email || "-",
      question: row.question || "-",
      status: row.status || "-",
      paperName: row.paper_name || "-"
    }));

    return NextResponse.json(queries);
  } catch (error: any) {
    return handleApiError(error);
  }
}


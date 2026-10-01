import { NextRequest, NextResponse } from "next/server";
import { mirrorPaperToSheet, mirrorDeletePaperFromSheet } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("x-webhook-secret") || "";
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET || "";
    
    if (!expectedSecret || !authHeader?.includes(expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const body = await req.json().catch(() => ({}));
    const { type, table, record, old_record: oldRecord } = body || {};

    if (table !== "papers") {
      return NextResponse.json({ status: "ignored", reason: "not papers table" });
    }

    if (type === "INSERT" || type === "UPDATE") {
      if (!record) return NextResponse.json({ error: "Missing record" }, { status: 400 });
      const paper = {
        course: record.course,
        year: record.year,
        spec: record.specialization || record.spec,
        specialization: record.specialization || record.spec,
        sem: record.semester || record.sem,
        semester: record.semester || record.sem,
        exam: record.exam,
        name: record.title || record.name,
        title: record.title || record.name,
        link: record.drive_url || record.link,
      };
      const expectedPaper = type === "UPDATE" && oldRecord ? {
        course: oldRecord.course,
        year: oldRecord.year,
        sem: oldRecord.semester || oldRecord.sem,
        exam: oldRecord.exam,
        name: oldRecord.title || oldRecord.name,
      } : null;
      await mirrorPaperToSheet(paper as any, expectedPaper as any);
    } else if (type === "DELETE") {
      if (!oldRecord) return NextResponse.json({ error: "Missing old_record" }, { status: 400 });
      await mirrorDeletePaperFromSheet({
        course: oldRecord.course,
        year: oldRecord.year,
        sem: oldRecord.semester || oldRecord.sem,
        exam: oldRecord.exam,
        name: oldRecord.title || oldRecord.name,
      } as any);
    }

    return NextResponse.json({ success: true, message: "Mirrored to Google Sheets" });
  } catch (error: any) {
    console.error("Supabase webhook error:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}

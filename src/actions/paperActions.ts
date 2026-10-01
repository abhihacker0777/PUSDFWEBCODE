"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { uploadBufferToGoogleDrive } from "@/lib/drive";
import { Paper, PaperTargetMapping } from "@/types/paper";
import { fetchPublicPapersFromSheet, mirrorPaperToSheet } from "@/lib/sheets";
import { requireAdminSession } from "@/lib/authCheck";

const PAPERS_TABLE = process.env.SUPABASE_PAPERS_TABLE || "papers";

function normalizeSupabasePaper(row: any): Paper {
  const spec = row.specialization || row.spec || "";
  const sem = row.semester || row.sem || "";
  const name = row.title || row.name || row.subject || "";
  const link = row.drive_url || row.link || "";
  const id = row.id ?? row.index ?? "";

  return {
    ...row,
    id,
    index: id,
    course: row.course || "",
    year: row.year || "",
    spec,
    specialization: spec,
    sem,
    semester: sem,
    exam: row.exam || "",
    name,
    title: name,
    subject: name,
    link,
    drive_url: link,
    driveFileId: row.drive_file_id || row.driveFileId || "",
    drive_file_id: row.drive_file_id || row.driveFileId || "",
    created_at: row.created_at || "",
    updated_at: row.updated_at || row.created_at || "",
  } as Paper;
}

async function fetchAllSupabasePapers(client: any): Promise<any[]> {
  const allRows: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await client
      .from(PAPERS_TABLE)
      .select("*")
      .range(from, from + pageSize - 1)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

let serverPapersCache: { data: Paper[]; expiresAt: number } | null = null;

function invalidateServerPapersCache() {
  serverPapersCache = null;
}

export async function fetchPapersAction(options?: { force?: boolean }): Promise<{ success: boolean; data: Paper[]; error?: string }> {
  const now = Date.now();
  if (!options?.force && serverPapersCache && serverPapersCache.expiresAt > now) {
    return { success: true, data: serverPapersCache.data };
  }

  try {
    const adminClient = createAdminClient();
    const adminData = await fetchAllSupabasePapers(adminClient);
    if (adminData && adminData.length > 0) {
      const normalized = adminData.map(normalizeSupabasePaper);
      serverPapersCache = { data: normalized, expiresAt: now + 120_000 };
      return { success: true, data: normalized };
    }

    // Secondary fallback: Google Sheets
    const sheetRows = await fetchPublicPapersFromSheet();
    if (sheetRows && sheetRows.length > 0) {
      serverPapersCache = { data: sheetRows, expiresAt: now + 60_000 };
      return { success: true, data: sheetRows };
    }

    return { success: true, data: [] };
  } catch (error: any) {
    console.error("fetchPapersAction error:", error?.message || error);
    try {
      const sheetRows = await fetchPublicPapersFromSheet();
      if (sheetRows && sheetRows.length > 0) {
        serverPapersCache = { data: sheetRows, expiresAt: now + 60_000 };
        return { success: true, data: sheetRows };
      }
    } catch (sheetErr: any) {
      console.error("Google Sheets fallback error:", sheetErr?.message || sheetErr);
    }
    return { success: false, data: [], error: error.message };
  }
}

export async function uploadPaperAction(formData: FormData) {
  try {
    await requireAdminSession("papers:create");
    const adminClient = createAdminClient();
    const file = formData.get("file") as File | null;
    const directLink = (formData.get("directLink") as string || "").trim();
    const paperName = (formData.get("paperName") as string || "").trim();
    const course = (formData.get("course") as string || "").trim();
    const year = (formData.get("year") as string || "").trim();
    const spec = (formData.get("spec") as string || "").trim();
    const semester = (formData.get("semester") as string || "").trim();
    const exam = (formData.get("exam") as string || "").trim();

    if (!paperName) {
      return { success: false, message: "Paper name is required." };
    }

    let finalLink = directLink;
    let driveFileId: string | undefined = undefined;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadResult = await uploadBufferToGoogleDrive({
        buffer,
        fileName: file.name,
        mimeType: file.type || "application/pdf",
      });
      finalLink = uploadResult.webViewLink;
      driveFileId = uploadResult.fileId;
    }

    if (!finalLink) {
      return { success: false, message: "Either a document file or direct link is required." };
    }

    if (!file && directLink) {
      let isValidDoc = false;
      try {
        const parsed = new URL(directLink);
        const host = parsed.hostname.toLowerCase();
        const pathname = parsed.pathname.toLowerCase();
        const isDriveDoc =
          (host.includes("drive.google.com") || host.includes("docs.google.com")) &&
          (pathname.includes("/file/d/") ||
            pathname.includes("/document/d/") ||
            pathname.includes("/open") ||
            pathname.includes("/uc") ||
            parsed.searchParams.has("id"));
        const isDirectDoc =
          pathname.endsWith(".pdf") ||
          pathname.endsWith(".docx") ||
          pathname.endsWith(".doc") ||
          parsed.pathname.includes(".pdf") ||
          parsed.pathname.includes(".docx");
        isValidDoc = isDriveDoc || isDirectDoc;
      } catch {
        isValidDoc = false;
      }

      if (!isValidDoc) {
        return { success: false, message: "Invalid document link. Only direct .pdf, .docx or Google Drive document links are accepted." };
      }
    }

    const now = new Date().toISOString();
    const { data, error } = await adminClient.from(PAPERS_TABLE).insert({
      name: paperName,
      title: paperName,
      course,
      year,
      spec,
      specialization: spec,
      sem: semester,
      semester,
      exam,
      link: finalLink,
      drive_url: finalLink,
      drive_file_id: driveFileId,
      created_at: now,
      updated_at: now,
    }).select().single();

    if (error) throw error;

    // Mirror to Google Sheets in background
    mirrorPaperToSheet({
      course,
      year,
      spec,
      specialization: spec,
      sem: semester,
      semester,
      exam,
      name: paperName,
      title: paperName,
      subject: paperName,
      link: finalLink,
      drive_url: finalLink,
    }).catch((err) => console.error("Sheets mirror background error:", err));

    invalidateServerPapersCache();
    return { success: true, data };
  } catch (error: any) {
    console.error("uploadPaperAction error:", error);
    return { success: false, message: error.message || "Failed to upload paper." };
  }
}

export async function bulkDeletePapersAction(ids: (string | number)[]) {
  try {
    await requireAdminSession("papers:delete");
    if (!ids || ids.length === 0) return { success: true, count: 0 };
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from(PAPERS_TABLE)
      .delete()
      .in("id", ids);

    if (error) throw error;
    invalidateServerPapersCache();
    return { success: true, count: ids.length };
  } catch (error: any) {
    console.error("bulkDeletePapersAction error:", error);
    return { success: false, message: error.message };
  }
}

export async function bulkEditPapersAction(
  ids: (string | number)[],
  updates: Partial<PaperTargetMapping>
) {
  try {
    await requireAdminSession("papers:update");
    if (!ids || ids.length === 0) return { success: true, count: 0 };
    const adminClient = createAdminClient();

    const payload: any = {
      updated_at: new Date().toISOString()
    };
    if (updates.course) payload.course = updates.course;
    if (updates.year) payload.year = updates.year;
    if (updates.spec !== undefined && updates.spec !== null) {
      payload.spec = updates.spec;
      payload.specialization = updates.spec;
    }
    if (updates.semester) {
      payload.sem = updates.semester;
      payload.semester = updates.semester;
    }
    if (updates.exam) payload.exam = updates.exam;

    const { error } = await adminClient
      .from(PAPERS_TABLE)
      .update(payload)
      .in("id", ids);

    if (error) throw error;
    invalidateServerPapersCache();
    return { success: true, count: ids.length };
  } catch (error: any) {
    console.error("bulkEditPapersAction error:", error);
    return { success: false, message: error.message };
  }
}

export async function deletePaperAction(id: string | number) {
  try {
    await requireAdminSession("papers:delete");
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from(PAPERS_TABLE)
      .delete()
      .eq("id", id);

    if (error) throw error;
    invalidateServerPapersCache();
    return { success: true };
  } catch (error: any) {
    console.error("deletePaperAction error:", error);
    return { success: false, message: error.message };
  }
}

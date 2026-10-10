"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadBufferToGoogleDrive, deleteDriveFile } from "@/lib/drive";
import { Paper, PaperTargetMapping } from "@/types/paper";
import { mirrorPaperToSheet } from "@/lib/sheets";
import { requireAdminSession } from "@/lib/authCheck";

const PAPERS_TABLE = process.env.SUPABASE_PAPERS_TABLE || "papers";

const MetaSchema = z.object({
  course: z.string().trim().min(1, "Course is required").max(60),
  year: z.string().trim().min(1, "Year is required").max(30),
  specialization: z.string().trim().min(1, "Specialization is required").max(100),
  semester: z.string().trim().min(1, "Semester is required").max(30),
  exam: z.enum(["MSE", "ESE"], { message: "Exam must be MSE or ESE" }),
  title: z.string().trim().min(1, "Paper name is required").max(160),
});

const pick = (fd: FormData, ...keys: string[]): string => {
  for (const k of keys) {
    const v = fd.get(k);
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
};

const isDriveUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "https:" && (u.hostname === "drive.google.com" || u.hostname === "docs.google.com");
  } catch {
    return false;
  }
};

function sniffBuffer(b: Buffer): "pdf" | "docx" | null {
  if (b.subarray(0, 4).toString("latin1") === "%PDF") return "pdf";
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) return "docx";
  return null;
}

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB Vercel limit

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
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

async function logAdminActivity(
  adminClient: any,
  status: string,
  name: string,
  spec: string,
  adminName: string,
  meta?: { course?: string; year?: string; semester?: string; exam?: string }
) {
  try {
    const formattedDate = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    await adminClient.from("admin_logs").insert({
      date: formattedDate,
      status,
      name,
      spec: spec || "",
      course: meta?.course || "",
      year: meta?.year || "",
      semester: meta?.semester || "",
      exam: meta?.exam || "",
      admin_name: adminName,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to write admin log:", err);
  }
}

let serverPapersCache: { data: Paper[]; expiresAt: number } | null = null;

export async function invalidateServerPapersCache() {
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
    if (Array.isArray(adminData)) {
      const normalized = adminData.map(normalizeSupabasePaper);
      serverPapersCache = { data: normalized, expiresAt: now + 120_000 };
      return { success: true, data: normalized };
    }

    return { success: true, data: [] };
  } catch (error: any) {
    console.error("fetchPapersAction error:", error?.message || error);
    return { success: false, data: [], error: error.message };
  }
}

export async function uploadPaperAction(formData: FormData) {
  try {
    const admin = await requireAdminSession("papers:create");
    const adminClient = createAdminClient();

    const rawExam = pick(formData, "exam").toUpperCase();
    const parsed = MetaSchema.safeParse({
      course: pick(formData, "course"),
      year: pick(formData, "year"),
      specialization: pick(formData, "specialization", "spec"),
      semester: pick(formData, "semester", "sem"),
      exam: rawExam,
      title: pick(formData, "title", "paperName", "name"),
    });

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const m = parsed.data;

    const file = formData.get("file");
    const directLink = pick(formData, "directLink", "link");
    let driveUrl = "";
    let driveFileId = "";
    let uploadedHere = false;

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_BYTES) {
        return { success: false, message: "File too large (max 4 MB)." };
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const kind = sniffBuffer(buf);
      if (!kind || (kind === "docx" && !file.name.toLowerCase().endsWith(".docx"))) {
        return { success: false, message: "Only PDF or DOCX files are accepted." };
      }

      const mime = kind === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const up = await uploadBufferToGoogleDrive({
        buffer: buf,
        fileName: `${m.title}.${kind}`,
        mimeType: mime,
      });
      driveUrl = up.webViewLink;
      driveFileId = up.fileId;
      uploadedHere = true;
    } else if (directLink) {
      if (!isDriveUrl(directLink)) {
        return { success: false, message: "Link must be a Google Drive or Docs URL." };
      }
      driveUrl = directLink;
      driveFileId = pick(formData, "driveFileId", "drive_file_id");
    } else {
      const existingId = pick(formData, "id", "index");
      if (!existingId) {
        return { success: false, message: "Attach a file or paste a Google Drive link." };
      }
    }

    const now = new Date().toISOString();
    const paperId = pick(formData, "id", "index");
    let resultData: any;

    if (paperId) {
      // Update existing paper
      const updatePayload: any = {
        course: m.course,
        year: m.year,
        specialization: m.specialization,
        semester: m.semester,
        exam: m.exam,
        title: m.title,
        updated_at: now,
      };
      if (driveUrl) {
        updatePayload.drive_url = driveUrl;
      }
      if (driveFileId) {
        updatePayload.drive_file_id = driveFileId;
      }

      const { data, error } = await adminClient
        .from(PAPERS_TABLE)
        .update(updatePayload)
        .eq("id", paperId)
        .select()
        .single();

      if (error) {
        console.error("Paper update failed:", error);
        if (uploadedHere && driveFileId) {
          await deleteDriveFile(driveFileId).catch(() => {});
        }
        return { success: false, message: error.message || "Could not update the paper." };
      }
      resultData = data;

      await logAdminActivity(
        adminClient,
        "Updated",
        m.title,
        m.specialization,
        admin.displayName || admin.user?.email?.split("@")[0] || "PU Central-Library",
        { course: m.course, year: m.year, semester: m.semester, exam: m.exam }
      );
    } else {
      // Insert new paper
      const insertPayload: any = {
        course: m.course,
        year: m.year,
        specialization: m.specialization,
        semester: m.semester,
        exam: m.exam,
        title: m.title,
        drive_url: driveUrl,
        drive_file_id: driveFileId,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await adminClient
        .from(PAPERS_TABLE)
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error("Paper insert failed:", error);
        if (uploadedHere && driveFileId) {
          await deleteDriveFile(driveFileId).catch(() => {});
        }
        return { success: false, message: error.message || "Could not save the paper." };
      }
      resultData = data;

      await logAdminActivity(
        adminClient,
        "Added",
        m.title,
        m.specialization,
        admin.displayName || admin.user?.email?.split("@")[0] || "PU Central-Library",
        { course: m.course, year: m.year, semester: m.semester, exam: m.exam }
      );
    }

    // Mirror to Google Sheets in background
    mirrorPaperToSheet({
      course: m.course,
      year: m.year,
      spec: m.specialization,
      specialization: m.specialization,
      sem: m.semester,
      semester: m.semester,
      exam: m.exam,
      name: m.title,
      title: m.title,
      subject: m.title,
      link: driveUrl || resultData.drive_url,
      drive_url: driveUrl || resultData.drive_url,
    }).catch((err) => console.error("Sheets mirror background error:", err));

    invalidateServerPapersCache();
    const paper = normalizeSupabasePaper(resultData);
    return { success: true, paper, data: paper };
  } catch (error: any) {
    console.error("uploadPaperAction error:", error);
    return { success: false, message: error.message || "Failed to upload paper." };
  }
}

export async function bulkDeletePapersAction(ids: (string | number)[]) {
  try {
    const admin = await requireAdminSession("papers:delete");
    if (!ids || ids.length === 0) return { success: true, count: 0 };
    const adminClient = createAdminClient();

    const CHUNK_SIZE = 100;
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      const { error } = await adminClient
        .from(PAPERS_TABLE)
        .delete()
        .in("id", chunk);

      if (error) throw error;
    }

    await logAdminActivity(
      adminClient,
      "Bulk Deleted",
      `${ids.length} papers removed`,
      "",
      admin.displayName || admin.user?.email?.split("@")[0] || "PU Central-Library"
    );

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
    const admin = await requireAdminSession("papers:update");
    if (!ids || ids.length === 0) return { success: true, count: 0 };
    const adminClient = createAdminClient();

    const payload: any = {
      updated_at: new Date().toISOString()
    };
    if (updates.course) payload.course = updates.course;
    if (updates.year) payload.year = updates.year;
    if (updates.spec !== undefined && updates.spec !== null) {
      payload.specialization = updates.spec;
    }
    if (updates.semester) {
      payload.semester = updates.semester;
    }
    if (updates.exam) payload.exam = updates.exam;

    const CHUNK_SIZE = 100;
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      const { error } = await adminClient
        .from(PAPERS_TABLE)
        .update(payload)
        .in("id", chunk);

      if (error) throw error;
    }

    await logAdminActivity(
      adminClient,
      "Bulk Edited",
      `${ids.length} papers modified`,
      updates.spec || "",
      admin.displayName || admin.user?.email?.split("@")[0] || "PU Central-Library",
      { course: updates.course, year: updates.year, semester: updates.semester, exam: updates.exam }
    );

    invalidateServerPapersCache();
    return { success: true, count: ids.length };
  } catch (error: any) {
    console.error("bulkEditPapersAction error:", error);
    return { success: false, message: error.message };
  }
}

export async function deletePaperAction(id: string | number) {
  try {
    const admin = await requireAdminSession("papers:delete");
    const adminClient = createAdminClient();

    const { data: paperToDelete } = await adminClient
      .from(PAPERS_TABLE)
      .select("title, specialization, drive_url, drive_file_id, course, year, semester, exam")
      .eq("id", id)
      .maybeSingle();

    const { error } = await adminClient
      .from(PAPERS_TABLE)
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (paperToDelete) {
      await logAdminActivity(
        adminClient,
        "Deleted",
        paperToDelete.title || `Paper ID ${id}`,
        paperToDelete.specialization || "",
        admin.displayName || admin.user?.email?.split("@")[0] || "PU Central-Library",
        {
          course: paperToDelete.course,
          year: paperToDelete.year,
          semester: paperToDelete.semester,
          exam: paperToDelete.exam,
        }
      );

      if (paperToDelete.drive_file_id) {
        const { count } = await adminClient
          .from(PAPERS_TABLE)
          .select("id", { count: "exact", head: true })
          .eq("drive_file_id", paperToDelete.drive_file_id);
        if (count === 0) {
          await deleteDriveFile(paperToDelete.drive_file_id).catch(() => {});
        }
      }
    }

    invalidateServerPapersCache();
    return { success: true };
  } catch (error: any) {
    console.error("deletePaperAction error:", error);
    return { success: false, message: error.message };
  }
}

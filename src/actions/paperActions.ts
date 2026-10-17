"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadBufferToGoogleDrive, deleteDriveFile } from "@/lib/drive";
import { Paper, PaperTargetMapping } from "@/types/paper";
import { mirrorPaperToSheet, mirrorDeletePaperFromSheet, mirrorBulkDeletePapersFromSheet, mirrorAdminLogToSheet } from "@/lib/sheets";
import { requireAdminSession } from "@/lib/authCheck";
import { getSafeRedisClient } from "@/lib/redis";
import { notifyCourseSubscribersForNewPaper } from "@/lib/pushNotifications";
import { pruneExpiredSupabaseRecords } from "@/lib/retention";

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

const MAX_BYTES = 4 * 1024 * 1024;

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
    const { data: inserted } = await adminClient.from("admin_logs").insert({
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
    }).select("id").maybeSingle();

    // Mirror to Google Sheets secondary database
    void mirrorAdminLogToSheet({
      id: inserted?.id,
      course: meta?.course,
      year: meta?.year,
      spec: spec || "",
      semester: meta?.semester,
      exam: meta?.exam,
      status,
      date: formattedDate,
      name,
    });

    // Run 30-day retention pruning asynchronously
    void pruneExpiredSupabaseRecords(30);
  } catch (err) {
    console.error("Failed To Write Admin Log:", err);
  }
}

const REDIS_PAPERS_CACHE_KEY = "cache:papers:all";
const PAPERS_CACHE_TTL_SEC = 120;

let serverPapersCache: { data: Paper[]; expiresAt: number } | null = null;

async function invalidateServerPapersCache(): Promise<void> {
  serverPapersCache = null;
  try {
    const redis = getSafeRedisClient();
    if (redis) {
      await redis.del(REDIS_PAPERS_CACHE_KEY);
    }
  } catch (err) {
    console.warn("Failed to invalidate distributed Redis papers cache:", err);
  }
}

async function getDistributedPapersCache(): Promise<Paper[] | null> {
  try {
    const redis = getSafeRedisClient();
    if (!redis) return null;
    const cached = await redis.get<Paper[]>(REDIS_PAPERS_CACHE_KEY);
    return Array.isArray(cached) && cached.length > 0 ? cached : null;
  } catch (cacheErr) {
    console.warn("Redis paper cache read error (falling back to database):", cacheErr);
    return null;
  }
}

async function setDistributedPapersCache(papers: Paper[]): Promise<void> {
  if (papers.length === 0) return;
  try {
    const redis = getSafeRedisClient();
    if (redis) {
      await redis.set(REDIS_PAPERS_CACHE_KEY, papers, { ex: PAPERS_CACHE_TTL_SEC });
    }
  } catch (cacheSetErr) {
    console.warn("Redis paper cache write error:", cacheSetErr);
  }
}

export async function fetchPapersAction(options?: { force?: boolean }): Promise<{ success: boolean; data: Paper[]; error?: string }> {
  const now = Date.now();
  const bypassCache = Boolean(options?.force);

  if (!bypassCache) {
    if (serverPapersCache && serverPapersCache.expiresAt > now) {
      return { success: true, data: serverPapersCache.data };
    }
    const distributedCache = await getDistributedPapersCache();
    if (distributedCache) {
      serverPapersCache = { data: distributedCache, expiresAt: now + (PAPERS_CACHE_TTL_SEC * 1000) };
      return { success: true, data: distributedCache };
    }
  }

  try {
    const adminClient = createAdminClient();
    const adminData = await fetchAllSupabasePapers(adminClient);
    if (!Array.isArray(adminData)) {
      return { success: true, data: [] };
    }

    const normalized = adminData.map(normalizeSupabasePaper);
    serverPapersCache = { data: normalized, expiresAt: now + (PAPERS_CACHE_TTL_SEC * 1000) };
    await setDistributedPapersCache(normalized);

    return { success: true, data: normalized };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error ?? "An Unexpected Error Occurred.");
    console.error("Fetch Papers Action Error:", errorMessage);
    return { success: false, data: [], error: errorMessage };
  }
}

interface ResolveDriveResult {
  driveUrl: string;
  driveFileId: string;
  uploadedHere: boolean;
  error?: string;
}

async function resolvePaperDriveAssets(
  formData: FormData,
  title: string,
  existingId?: string
): Promise<ResolveDriveResult> {
  const file = formData.get("file");
  const directLink = pick(formData, "directLink", "link");

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) {
      return { driveUrl: "", driveFileId: "", uploadedHere: false, error: "File Too Large (Max 4 MB)." };
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const kind = sniffBuffer(buf);
    if (!kind || (kind === "docx" && !file.name.toLowerCase().endsWith(".docx"))) {
      return { driveUrl: "", driveFileId: "", uploadedHere: false, error: "Only PDF Or DOCX Files Are Accepted." };
    }

    const mime = kind === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const up = await uploadBufferToGoogleDrive({
      buffer: buf,
      fileName: `${title}.${kind}`,
      mimeType: mime,
    });
    return { driveUrl: up.webViewLink, driveFileId: up.fileId, uploadedHere: true };
  }

  if (directLink) {
    if (!isDriveUrl(directLink)) {
      return { driveUrl: "", driveFileId: "", uploadedHere: false, error: "Link Must Be A Google Drive Or Docs URL." };
    }
    return { driveUrl: directLink, driveFileId: pick(formData, "driveFileId", "drive_file_id"), uploadedHere: false };
  }

  if (!existingId) {
    return { driveUrl: "", driveFileId: "", uploadedHere: false, error: "Attach A File Or Paste A Google Drive Link." };
  }

  return { driveUrl: "", driveFileId: "", uploadedHere: false };
}

async function saveOrUpdatePaper(
  adminClient: any,
  admin: any,
  paperId: string | undefined,
  m: any,
  driveUrl: string,
  driveFileId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const now = new Date().toISOString();
  const adminName = admin.displayName || admin.user?.email?.split("@")[0] || "PU Central-Library";

  if (paperId) {
    const updatePayload: any = {
      course: m.course,
      year: m.year,
      specialization: m.specialization,
      semester: m.semester,
      exam: m.exam,
      title: m.title,
      updated_at: now,
    };
    if (driveUrl) updatePayload.drive_url = driveUrl;
    if (driveFileId) updatePayload.drive_file_id = driveFileId;

    const { data, error } = await adminClient
      .from(PAPERS_TABLE)
      .update(updatePayload)
      .eq("id", paperId)
      .select()
      .single();

    if (error) {
      console.error("Paper Update Failed:", error);
      return { success: false, error: error.message || "Could Not Update The Paper." };
    }

    await logAdminActivity(adminClient, "Updated", m.title, m.specialization, adminName, {
      course: m.course,
      year: m.year,
      semester: m.semester,
      exam: m.exam,
    });
    return { success: true, data };
  }

  const insertPayload = {
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
    console.error("Paper Insert Failed:", error);
    return { success: false, error: error.message || "Could Not Save The Paper." };
  }

  await logAdminActivity(adminClient, "Added", m.title, m.specialization, adminName, {
    course: m.course,
    year: m.year,
    semester: m.semester,
    exam: m.exam,
  });
  return { success: true, data };
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
      return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid Input" };
    }
    const m = parsed.data;
    const paperId = pick(formData, "id", "index");

    const assetResult = await resolvePaperDriveAssets(formData, m.title, paperId);
    if (assetResult.error) {
      return { success: false, message: assetResult.error };
    }

    const { driveUrl, driveFileId, uploadedHere } = assetResult;
    const persistResult = await saveOrUpdatePaper(adminClient, admin, paperId, m, driveUrl, driveFileId);

    if (!persistResult.success || !persistResult.data) {
      if (uploadedHere && driveFileId) {
        await deleteDriveFile(driveFileId).catch(() => {});
      }
      return { success: false, message: persistResult.error || "Failed To Save Paper." };
    }

    if (!paperId) {
      void notifyCourseSubscribersForNewPaper({
        course: m.course,
        semester: m.semester,
        exam: m.exam,
        title: m.title,
        year: m.year,
        specialization: m.specialization,
      });
    }

    const resultData = persistResult.data;
    void mirrorPaperToSheet({
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
    }).catch((err) => console.error("Sheets Mirror Background Error:", err));

    await invalidateServerPapersCache();
    const paper = normalizeSupabasePaper(resultData);
    return { success: true, paper, data: paper };
  } catch (error: any) {
    console.error("Upload Paper Action Error:", error);
    return { success: false, message: error.message || "Failed To Upload Paper." };
  }
}

export async function bulkDeletePapersAction(ids: (string | number)[]) {
  try {
    const admin = await requireAdminSession("papers:delete");
    if (!ids || ids.length === 0) return { success: true, count: 0 };
    const adminClient = createAdminClient();

    // Fetch paper metadata before deletion for Sheets mirroring and detailed logging
    const { data: papersToDelete } = await adminClient
      .from(PAPERS_TABLE)
      .select("id, title, course, year, semester, exam, specialization, drive_file_id, drive_url")
      .in("id", ids);

    const CHUNK_SIZE = 100;
    const deleteChunks: (string | number)[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      deleteChunks.push(ids.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(
      deleteChunks.map(async (chunk) => {
        const { error } = await adminClient
          .from(PAPERS_TABLE)
          .delete()
          .in("id", chunk);
        if (error) throw error;
      })
    );

    // Delete matching rows from Google Sheets secondary database
    if (papersToDelete?.length) {
      void mirrorBulkDeletePapersFromSheet(papersToDelete);
    }

    // Clean up orphan drive files
    if (papersToDelete?.length) {
      const fileIds = [...new Set(papersToDelete.map((p) => p.drive_file_id).filter(Boolean))];
      await Promise.all(
        fileIds.map(async (fid) => {
          const { count } = await adminClient
            .from(PAPERS_TABLE)
            .select("id", { count: "exact", head: true })
            .eq("drive_file_id", fid);
          if (count === 0) {
            await deleteDriveFile(fid).catch(() => {});
          }
        })
      );
    }

    // Detailed activity log with affected papers JSON stored in spec for expandable UI
    await logAdminActivity(
      adminClient,
      "Bulk Deleted",
      `${ids.length} papers removed`,
      JSON.stringify(papersToDelete || []),
      admin.displayName || admin.user?.email?.split("@")[0] || "PU Central-Library"
    );

    await invalidateServerPapersCache();
    return { success: true, count: ids.length };
  } catch (error: any) {
    console.error("Bulk Delete Papers Action Error:", error);
    return { success: false, message: error.message };
  }
}

function buildBulkEditPayload(updates: Partial<PaperTargetMapping> & {
  title?: string;
  paperName?: string;
  name?: string;
}) {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString()
  };
  if (updates.course) payload.course = updates.course;
  if (updates.year) payload.year = updates.year;
  if (updates.spec !== undefined && updates.spec !== null && updates.spec !== "") {
    payload.specialization = updates.spec;
  }
  if (updates.semester) {
    payload.semester = updates.semester;
  }
  if (updates.exam) payload.exam = updates.exam;
  const rawTitle = updates.title || updates.paperName || updates.name;
  if (rawTitle?.trim()) {
    payload.title = rawTitle.trim();
  }
  return payload;
}

export async function bulkEditPapersAction(
  ids: (string | number)[],
  updates: Partial<PaperTargetMapping> & {
    title?: string;
    paperName?: string;
    name?: string;
    titlesById?: Record<string, string>;
  }
) {
  try {
    const admin = await requireAdminSession("papers:update");
    if (!ids || ids.length === 0) return { success: true, count: 0 };
    const adminClient = createAdminClient();

    // Fetch previous papers for Sheets update and detailed audit logging
    const { data: previousPapers } = await adminClient
      .from(PAPERS_TABLE)
      .select("id, title, course, year, semester, exam, specialization, drive_url")
      .in("id", ids);

    const payload = buildBulkEditPayload(updates);
    const hasIndividualTitles = Boolean(updates.titlesById && Object.keys(updates.titlesById).length > 0);

    if (hasIndividualTitles) {
      await Promise.all(
        ids.map(async (id) => {
          const itemPayload = { ...payload };
          const specificTitle = updates.titlesById?.[id] ?? updates.titlesById?.[String(id)];
          if (specificTitle?.trim()) {
            itemPayload.title = specificTitle.trim();
          }
          const { error } = await adminClient
            .from(PAPERS_TABLE)
            .update(itemPayload)
            .eq("id", id);
          if (error) throw error;
        })
      );
    } else {
      const CHUNK_SIZE = 100;
      const updateChunks: (string | number)[][] = [];
      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        updateChunks.push(ids.slice(i, i + CHUNK_SIZE));
      }
      await Promise.all(
        updateChunks.map(async (chunk) => {
          const { error } = await adminClient
            .from(PAPERS_TABLE)
            .update(payload)
            .in("id", chunk);
          if (error) throw error;
        })
      );
    }

    // Mirror updates to Google Sheets secondary database
    if (previousPapers?.length) {
      for (const p of previousPapers) {
        const specificTitle = (updates.titlesById?.[p.id] ?? updates.titlesById?.[String(p.id)] ?? payload.title ?? p.title)?.trim();
        void mirrorPaperToSheet(
          {
            ...p,
            ...payload,
            name: specificTitle,
            title: specificTitle,
            subject: specificTitle,
            spec: payload.specialization || p.specialization,
            specialization: payload.specialization || p.specialization,
            sem: payload.semester || p.semester,
            semester: payload.semester || p.semester,
          },
          p
        );
      }
    }

    // Detailed activity log with affected papers JSON stored in spec for expandable UI
    await logAdminActivity(
      adminClient,
      "Bulk Edited",
      `${ids.length} papers modified`,
      JSON.stringify(previousPapers || []),
      admin.displayName || admin.user?.email?.split("@")[0] || "PU Central-Library",
      { course: updates.course, year: updates.year, semester: updates.semester, exam: updates.exam }
    );

    await invalidateServerPapersCache();
    return { success: true, count: ids.length };
  } catch (error: any) {
    console.error("Bulk Edit Papers Action Error:", error);
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
      // Delete from Google Sheets secondary database
      void mirrorDeletePaperFromSheet({
        course: paperToDelete.course,
        year: paperToDelete.year,
        sem: paperToDelete.semester,
        semester: paperToDelete.semester,
        exam: paperToDelete.exam,
        name: paperToDelete.title,
        title: paperToDelete.title,
      });

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

    await invalidateServerPapersCache();
    return { success: true };
  } catch (error: any) {
    console.error("Delete Paper Action Error:", error);
    return { success: false, message: error.message };
  }
}

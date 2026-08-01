const { SUPABASE_PAPERS_TABLE } = require("../../config/env");
const {
  supabaseRequest,
  supabaseSelectAll,
  postgrestUuidEqFilter
} = require("../supabaseService");
const { extractDriveFileId } = require("../driveService");
const {
  isPublicPaper,
  isAdminSheetRow,
  sortPublicPapers,
  toSupabasePaperRow,
  paperFromSupabaseRow,
  paperOptionFromSupabaseRow,
  buildPaperOptions
} = require("../../models/paperModel");
const { dedupePapers } = require("../assistantService");

async function fetchPaperOptionsFromSupabase() {
  const params = new URLSearchParams({
    select: "course,year,specialization,semester,exam"
  });
  params.set("title", "neq.");
  params.set("drive_url", "neq.");

  const rows = await supabaseSelectAll(SUPABASE_PAPERS_TABLE, {
    query: params.toString()
  });
  return buildPaperOptions((Array.isArray(rows) ? rows : []).map(paperOptionFromSupabaseRow));
}

async function fetchPublicPapersByFilterFromSupabase(cleanFilters) {
  const params = new URLSearchParams({
    select: "id,course,year,specialization,semester,exam,title,drive_url,drive_file_id"
  });
  params.set("title", "neq.");
  params.set("drive_url", "neq.");

  if (cleanFilters.course) params.set("course", `eq.${cleanFilters.course}`);
  if (cleanFilters.year) params.set("year", `eq.${cleanFilters.year}`);
  if (cleanFilters.specialization) params.set("specialization", `eq.${cleanFilters.specialization}`);
  if (cleanFilters.sem) params.set("semester", `eq.${cleanFilters.sem}`);
  if (cleanFilters.exam) params.set("exam", `eq.${cleanFilters.exam}`);

  const rows = await supabaseSelectAll(SUPABASE_PAPERS_TABLE, {
    query: params.toString(),
    order: "title.asc"
  });

  return sortPublicPapers(dedupePapers((Array.isArray(rows) ? rows : [])
    .map(paperFromSupabaseRow)
    .filter(isPublicPaper)));
}

async function fetchSupabasePapers({ publicOnly = false } = {}) {
  const params = new URLSearchParams({
    select: "id,course,year,specialization,semester,exam,title,drive_url,drive_file_id"
  });
  if (publicOnly) {
    params.set("title", "neq.");
    params.set("drive_url", "neq.");
  }

  const rows = await supabaseSelectAll(SUPABASE_PAPERS_TABLE, {
    query: params.toString(),
    order: "course.asc,year.asc,specialization.asc,semester.asc,exam.asc,title.asc"
  });
  const papers = (Array.isArray(rows) ? rows : [])
    .map(paperFromSupabaseRow)
    .filter(publicOnly ? isPublicPaper : isAdminSheetRow);

  return sortPublicPapers(dedupePapers(papers));
}

async function getSupabasePaperById(id) {
  const idFilter = postgrestUuidEqFilter("id", id);
  if (!idFilter) return null;

  const rows = await supabaseRequest(SUPABASE_PAPERS_TABLE, {
    query: `select=*&${idFilter}&limit=1`
  });
  return Array.isArray(rows) && rows[0] ? paperFromSupabaseRow(rows[0]) : null;
}

async function insertSupabasePaper(paper, extras = {}) {
  const rows = await supabaseRequest(SUPABASE_PAPERS_TABLE, {
    method: "POST",
    prefer: "return=representation",
    body: [toSupabasePaperRow(paper, extras)]
  });
  return Array.isArray(rows) && rows[0] ? paperFromSupabaseRow(rows[0]) : null;
}

async function updateSupabasePaper(id, paper, extras = {}) {
  const idFilter = postgrestUuidEqFilter("id", id);
  if (!idFilter) return null;

  const body = toSupabasePaperRow(paper, extras);
  const rows = await supabaseRequest(SUPABASE_PAPERS_TABLE, {
    method: "PATCH",
    query: idFilter,
    prefer: "return=representation",
    body
  });
  return Array.isArray(rows) && rows[0] ? paperFromSupabaseRow(rows[0]) : null;
}

async function deleteSupabasePaper(id) {
  const idFilter = postgrestUuidEqFilter("id", id);
  if (!idFilter) return;

  await supabaseRequest(SUPABASE_PAPERS_TABLE, {
    method: "DELETE",
    query: idFilter
  });
}

async function replaceSupabasePapers(papers) {
  await supabaseRequest(SUPABASE_PAPERS_TABLE, {
    method: "DELETE",
    query: "id=not.is.null"
  });

  const rows = (papers || [])
    .filter(isAdminSheetRow)
    .map((paper) => toSupabasePaperRow(paper, {
      link: paper.link || null,
      driveFileId: extractDriveFileId(paper.link)
    }));

  for (let i = 0; i < rows.length; i += 500) {
    await supabaseRequest(SUPABASE_PAPERS_TABLE, {
      method: "POST",
      prefer: "return=minimal",
      body: rows.slice(i, i + 500)
    });
  }

  return rows.length;
}

module.exports = {
  deleteSupabasePaper,
  fetchPaperOptionsFromSupabase,
  fetchPublicPapersByFilterFromSupabase,
  fetchSupabasePapers,
  getSupabasePaperById,
  insertSupabasePaper,
  replaceSupabasePapers,
  updateSupabasePaper
};

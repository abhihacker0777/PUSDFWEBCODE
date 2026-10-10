"use server";

import { parseQueryWithGemini } from "@/lib/gemini";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchPapersAction } from "@/actions/paperActions";
import { searchLocalPapers } from "@/utils/localPaperSearch";
import { Paper } from "@/types/paper";

async function logStudentQueryTelemetry(
  adminClient: any,
  data: { email?: string; question: string; status: string; message: string; paperName: string }
) {
  try {
    await adminClient.from("student_queries").insert({
      email: data.email || "anonymous",
      question: data.question,
      status: data.status,
      message: data.message,
      paper_name: data.paperName,
      created_at: new Date().toISOString(),
    });
  } catch (logErr) {
    console.error("Failed to log query telemetry:", logErr);
  }
}

function findCandidatePapers(allPapers: Paper[], query: string) {
  const candidatePapers = searchLocalPapers(allPapers as any[], query);
  return { topPapers: ((candidatePapers || []).slice(0, 8) as unknown) as Paper[] };
}

function buildAssistantResponse(query: string, topPapers: Paper[], intent: any, studentEmail?: string): string {
  if (topPapers.length === 0) {
    const emailNotice = studentEmail ? ` You will receive an email update at ${studentEmail} once this paper is made available.` : "";
    return `I couldn't find any papers matching "${query}".\n\nIf this paper is not currently available in the central library archive, you can submit feedback below to request it.${emailNotice}`;
  }

  const subjectMention = intent?.subjectKeywords?.length ? ` for "${intent.subjectKeywords.join(" ")}"` : "";
  const courseMention = intent?.course ? ` in ${intent.course}` : "";
  const semMention = intent?.semester ? ` (${intent.semester})` : "";
  return `I found ${topPapers.length} paper${topPapers.length > 1 ? "s" : ""}${subjectMention}${courseMention}${semMention}. You can view or download them directly below:`;
}

export async function askAssistantAction(query: string, studentEmail?: string) {
  if (!query?.trim()) {
    return {
      message: "Please ask a question about question papers, subjects, or semesters!",
      papers: [],
    };
  }

  try {
    const adminClient = createAdminClient();

    // Direct Gemini AI intent parsing (no custom replies override, no rule-based fallback)
    const intent = await parseQueryWithGemini(query);

    const isPaperSearch =
      intent.intentType === "PAPER_SEARCH" ||
      Boolean(intent.course || intent.semester || intent.exam || (intent.subjectKeywords && intent.subjectKeywords.length > 0));

    if (!isPaperSearch) {
      const reply = intent.conversationalReply || 
        "Hello! Welcome to the Academic Portal. How can I help you find question papers or explore course materials today? 😊";

      await logStudentQueryTelemetry(adminClient, {
        email: studentEmail,
        question: query.trim(),
        status: "info",
        message: reply,
        paperName: "",
      });

      return {
        message: reply,
        papers: [],
        intent,
      };
    }

    const papersResult = await fetchPapersAction();
    const allPapers = (papersResult.data || []) as Paper[];
    const { topPapers } = findCandidatePapers(allPapers, query);
    const responseText = buildAssistantResponse(query, topPapers, intent, studentEmail);

    await logStudentQueryTelemetry(adminClient, {
      email: studentEmail,
      question: query.trim(),
      status: topPapers.length > 0 ? "found" : "not_found",
      message: responseText,
      paperName: topPapers.length > 0 ? (topPapers[0].name || (topPapers[0] as any).title || "") : "",
    });

    return {
      message: responseText,
      papers: topPapers,
      canFeedback: topPapers.length === 0,
      queryText: query.trim(),
      intent,
    };
  } catch (error: any) {
    console.error("askAssistantAction error:", error);
    return {
      message: "An error occurred while searching. Please try again or use the filters above.",
      papers: [],
    };
  }
}

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

function findCandidatePapers(allPapers: Paper[], query: string, intent: any) {
  let candidatePapers = searchLocalPapers(allPapers as any[], query);
  let relaxedSemester = false;

  if (candidatePapers.length === 0 && (intent.semester || /\b(?:sem(?:ester)?|[1-9](?:st|nd|rd|th)?\s+sem)\b/i.test(query))) {
    const relaxed = searchLocalPapers(allPapers as any[], query, { relaxSemester: true });
    if (relaxed.length > 0) {
      candidatePapers = relaxed;
      relaxedSemester = true;
    }
  }

  if (candidatePapers.length === 0 && (intent.exam || /\b(mid|end|mse|ese|mte|ete)\b/i.test(query))) {
    const relaxedExam = searchLocalPapers(allPapers as any[], query, { relaxSemester: true, relaxExam: true });
    if (relaxedExam.length > 0) {
      candidatePapers = relaxedExam;
      relaxedSemester = true;
    }
  }

  return { topPapers: ((candidatePapers || []).slice(0, 8) as unknown) as Paper[], relaxedSemester };
}

function buildAssistantResponse(query: string, topPapers: Paper[], intent: any, relaxedSemester: boolean): string {
  if (topPapers.length === 0) {
    return `I couldn't find any papers matching "${query}". Please check the course or subject name, or browse through the course list above!`;
  }

  if (relaxedSemester) {
    const first = topPapers[0];
    const semName = first.sem || (first as any).semester || "";
    const courseName = first.course || "";
    const specName = first.spec || (first as any).specialization || "";
    const branchInfo = specName ? ` (${specName})` : "";
    return `I couldn't find matches for "${query}" in the requested semester, but I found ${topPapers.length} paper${topPapers.length > 1 ? "s" : ""} in ${courseName} ${semName}${branchInfo}. You can view or download them directly below:`;
  }

  const subjectMention = intent.subjectKeywords?.length ? ` for "${intent.subjectKeywords.join(" ")}"` : "";
  const courseMention = intent.course ? ` in ${intent.course}` : "";
  const semMention = intent.semester ? ` (${intent.semester})` : "";
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
    const intent = await parseQueryWithGemini(query);

    if (intent.intentType && intent.intentType !== "PAPER_SEARCH") {
      const reply = intent.conversationalReply || 
        "Hello! Welcome to Poornima University Academic Portal. How can I help you find question papers or explore course materials today? 😊";

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
    const { topPapers, relaxedSemester } = findCandidatePapers(allPapers, query, intent);
    const responseText = buildAssistantResponse(query, topPapers, intent, relaxedSemester);

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

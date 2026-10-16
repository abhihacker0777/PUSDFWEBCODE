"use server";

import { parseQueryWithGemini } from "@/lib/gemini";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchPapersAction } from "@/actions/paperActions";
import { searchLocalPapers } from "@/utils/localPaperSearch";
import { Paper } from "@/types/paper";
import { mirrorStudentQueryToSheet } from "@/lib/sheets";

async function logStudentQueryTelemetry(
  adminClient: any,
  data: {
    email?: string;
    question: string;
    status: string;
    message: string;
    paperName: string;
    course?: string;
    year?: string;
    semester?: string;
    link?: string;
  }
) {
  try {
    const formattedDate = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    await adminClient.from("student_queries").insert({
      email: data.email || "anonymous",
      question: data.question,
      status: data.status,
      message: data.message,
      paper_name: data.paperName,
      created_at: new Date().toISOString(),
    });

    // Mirror to Google Sheets AI Requests tab
    void mirrorStudentQueryToSheet({
      date: formattedDate,
      email: data.email || "anonymous",
      question: data.question,
      status: data.status,
      message: data.message,
      paperName: data.paperName,
      course: data.course || "",
      year: data.year || "",
      semester: data.semester || "",
      link: data.link || "",
    });
  } catch (logErr) {
    console.error("Failed To Log Query Telemetry:", logErr);
  }
}

function findCandidatePapers(allPapers: Paper[], query: string) {
  const candidatePapers = searchLocalPapers(allPapers as any[], query);
  return { topPapers: ((candidatePapers || []).slice(0, 8) as unknown) as Paper[] };
}

function buildAssistantResponse(query: string, topPapers: Paper[], intent: any, studentEmail?: string): string {
  if (topPapers.length === 0) {
    const emailNotice = studentEmail ? ` You Will Receive An Email Update At ${studentEmail} Once This Paper Is Made Available.` : "";
    return `No Papers Found Matching "${query}".\n\nIf This Paper Is Not Currently Available In The Central Library Archive, You Can Submit Feedback Below To Request It.${emailNotice}`;
  }

  const subjectMention = intent?.subjectKeywords?.length ? ` For "${intent.subjectKeywords.join(" ")}"` : "";
  const courseMention = intent?.course ? ` In ${intent.course}` : "";
  const semMention = intent?.semester ? ` (${intent.semester})` : "";
  return `Found ${topPapers.length} Paper${topPapers.length > 1 ? "s" : ""}${subjectMention}${courseMention}${semMention}. You Can View Or Download Below:`;
}

export async function askAssistantAction(query: string, studentEmail?: string) {
  if (!query?.trim()) {
    return {
      message: "Please Ask A Question About Question Papers, Subjects, Or Semesters!",
      papers: [],
    };
  }

  try {
    const adminClient = createAdminClient();

    const intent = await parseQueryWithGemini(query);

    const isPaperSearch =
      intent.intentType === "PAPER_SEARCH" ||
      Boolean(intent.course || intent.semester || intent.exam || (intent.subjectKeywords && intent.subjectKeywords.length > 0));

    if (!isPaperSearch) {
      const reply = intent.conversationalReply || 
        "Hello! Welcome To The Academic Portal. How Can I Help You Find Question Papers Or Explore Course Materials Today? 😊";

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
    console.error("Ask Assistant Action Error:", error);
    return {
      message: "An error occurred while searching. Please try again or use the filters above.",
      papers: [],
    };
  }
}

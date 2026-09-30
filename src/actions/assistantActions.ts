"use server";

import { parseQueryWithGemini } from "@/lib/gemini";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchPapersAction } from "@/actions/paperActions";
import { searchLocalPapers } from "@/utils/localPaperSearch";
import { Paper } from "@/types/paper";

export async function askAssistantAction(query: string, studentEmail?: string) {
  if (!query || !query.trim()) {
    return {
      message: "Please ask a question about question papers, subjects, or semesters!",
      papers: [],
    };
  }

  try {
    const adminClient = createAdminClient();

    // 1. AI Intent Extraction via Google Gemini (@google/genai)
    const intent = await parseQueryWithGemini(query);

    // 2. Handle Non-Paper Queries (Greetings, About, General Info)
    if (intent.intentType && intent.intentType !== "PAPER_SEARCH") {
      const reply = intent.conversationalReply || 
        "Hello! Welcome to Poornima University Academic Portal. How can I help you find question papers or explore course materials today? 😊";

      // Log conversation to student_queries table
      try {
        await adminClient.from("student_queries").insert({
          email: studentEmail || "anonymous",
          question: query.trim(),
          status: "info",
          message: reply,
          paper_name: "",
          created_at: new Date().toISOString(),
        });
      } catch (logErr) {
        console.error("Failed to log query telemetry:", logErr);
      }

      return {
        message: reply,
        papers: [],
        intent,
      };
    }

    // 3. Fetch all normalized papers from repository
    const papersResult = await fetchPapersAction();
    const allPapers = (papersResult.data || []) as Paper[];

    // 4. Primary search using full local search engine with 200+ subject synonyms
    let candidatePapers = searchLocalPapers(allPapers as any[], query);
    let relaxedSemester = false;

    // 5. If 0 papers found and user specified a semester (e.g. "bca 2 sem ethical hacking paper"):
    // Check if the subject exists in another semester for that course!
    if (candidatePapers.length === 0) {
      if (intent.semester || /\b(sem|semester|[1-9]\s*(?:st|nd|rd|th)?\s*sem)\b/i.test(query)) {
        const relaxed = searchLocalPapers(allPapers as any[], query, { relaxSemester: true });
        if (relaxed.length > 0) {
          candidatePapers = relaxed;
          relaxedSemester = true;
        }
      }
    }

    // 6. If still 0 papers and user specified exam (MSE / ESE):
    if (candidatePapers.length === 0) {
      if (intent.exam || /\b(mid|end|mse|ese|mte|ete)\b/i.test(query)) {
        const relaxedExam = searchLocalPapers(allPapers as any[], query, { relaxSemester: true, relaxExam: true });
        if (relaxedExam.length > 0) {
          candidatePapers = relaxedExam;
          relaxedSemester = true;
        }
      }
    }

    // Slice to top 8 most relevant papers
    const topPapers = (candidatePapers || []).slice(0, 8);

    // 7. Generate conversational response message
    let responseText = "";
    if (topPapers.length > 0) {
      if (relaxedSemester) {
        const first = topPapers[0];
        const semName = first.sem || (first as any).semester || "";
        const courseName = first.course || "";
        const specName = first.spec || (first as any).specialization || "";
        const branchInfo = specName ? ` (${specName})` : "";
        responseText = `I couldn't find matches for "${query}" in the requested semester, but I found ${topPapers.length} paper${topPapers.length > 1 ? "s" : ""} in ${courseName} ${semName}${branchInfo}. You can view or download them directly below:`;
      } else {
        const subjectMention = intent.subjectKeywords?.length ? ` for "${intent.subjectKeywords.join(" ")}"` : "";
        const courseMention = intent.course ? ` in ${intent.course}` : "";
        const semMention = intent.semester ? ` (${intent.semester})` : "";
        responseText = `I found ${topPapers.length} paper${topPapers.length > 1 ? "s" : ""}${subjectMention}${courseMention}${semMention}. You can view or download them directly below:`;
      }
    } else {
      responseText = `I couldn't find any papers matching "${query}". Please check the course or subject name, or browse through the course list above!`;
    }

    // 8. Log query into Supabase student_queries with exact column names
    try {
      await adminClient.from("student_queries").insert({
        email: studentEmail || "anonymous",
        question: query.trim(),
        status: topPapers.length > 0 ? "found" : "not_found",
        message: responseText,
        paper_name: topPapers.length > 0 ? (topPapers[0].name || (topPapers[0] as any).title || "") : "",
        created_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error("Failed to log query telemetry:", logErr);
    }

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

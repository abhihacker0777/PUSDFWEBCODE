const { normalizeText } = require("../../utils/helpers");
const {
  SARVAM_API_KEY,
  SARVAM_MODEL,
  SARVAM_TIMEOUT_MS
} = require("../../config/env");
const { getUniquePaperValues } = require("./assistantSearchText");

function parseJsonObjectFromText(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function buildSarvamParserPrompt(question, papers) {
  const courses = getUniquePaperValues(papers, "course").slice(0, 80);
  const specs = getUniquePaperValues(papers, "spec").slice(0, 80);
  const years = getUniquePaperValues(papers, "year").slice(0, 20);
  const semesters = getUniquePaperValues(papers, "sem").slice(0, 30);
  const exams = getUniquePaperValues(papers, "exam").slice(0, 10);

  return {
    systemPrompt: [
      "You extract search fields for a Poornima University previous-year question paper finder.",
      "Return only JSON with these keys: course, year, spec, sem, exam, paper, tokens.",
      "CRITICAL: If the user does not explicitly write the semester, year, or exam (MSE/ESE), you MUST leave them empty strings. DO NOT GUESS.",
      "Use empty string for unknown fields. tokens must contain important subject/title words only."
    ].join(" "),
    userPrompt: [
      `Allowed courses: ${courses.join(", ")}`,
      `Allowed specializations: ${specs.join(", ")}`,
      `Allowed years: ${years.join(", ")}`,
      `Allowed semesters: ${semesters.join(", ")}`,
      `Allowed exams: ${exams.join(", ")}`,
      `Student query: ${question}`
    ].join("\n")
  };
}

async function parseAssistantQueryWithSarvam(question, papers) {
  if (!SARVAM_API_KEY) return null;

  const { systemPrompt, userPrompt } = buildSarvamParserPrompt(question, papers);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SARVAM_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY
      },
      body: JSON.stringify({
        model: SARVAM_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 256,
        response_format: { type: "json_object" },
        reasoning_effort: null
      })
    });

    if (!response.ok) throw new Error(`Sarvam returned ${response.status}`);

    const data = await response.json();
    const text = normalizeText(data.choices?.[0]?.message?.content || "", 1200);
    const parsed = parseJsonObjectFromText(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (err) {
    console.error("Sarvam assistant parser skipped:", err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { parseAssistantQueryWithSarvam };

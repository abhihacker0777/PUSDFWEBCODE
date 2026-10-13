import { clearPaperCaches as clearClientPaperCaches } from "../../../services/api";
import { semesterSequence } from "./adminConstants";

export const clearPapersCache = (): void => {
  clearClientPaperCaches();
  sessionStorage.removeItem("papersCache");
  sessionStorage.removeItem("papersCacheTime");
  sessionStorage.removeItem("papersCacheVersion");
};

export const isErrorStatus = (message = ""): boolean =>
  /error|failed|invalid|required|select|too many|exceed|not connected|rejected|only pdf|permitted/i.test(message);

export const cleanStatusMessage = (message = ""): string =>
  String(message)
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/^(Error|Success):\s*/i, "")
    .trim();

export const readApiResponse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }
  return { message: await response.text() };
};

export const isAdminSessionExpired = (response: Response): boolean => response.status === 401;
export const goToLogin = (): void => {
  window.location.href = "/login";
};

export const normalizeQueryEmail = (email = ""): string => String(email || "").trim().toLowerCase();

const COURSE_PREFIXES = ["btech", "diploma", "barch", "bdes", "mca", "mba", "bba", "bsc", "bph", "bca"];
const DEPT_PREFIXES = ["cactd", "civil", "cloud", "cyber", "aiml", "aids", "actd", "ctis", "mech", "csb", "cse", "ctd", "ece", "cs", "it", "ee"];

function stripSurroundingDigits(str: string): string {
  let start = 0;
  while (start < str.length) {
    const code = str.codePointAt(start);
    if (code === undefined || code < 48 || code > 57) break;
    start++;
  }
  let end = str.length;
  while (end > start) {
    const code = str.codePointAt(end - 1);
    if (code === undefined || code < 48 || code > 57) break;
    end--;
  }
  return str.slice(start, end);
}

function stripAcademicPrefixes(str: string): string {
  let result = str;
  for (const pfx of COURSE_PREFIXES) {
    if (result.toLowerCase().startsWith(pfx)) {
      result = result.slice(pfx.length);
      break;
    }
  }
  for (const pfx of DEPT_PREFIXES) {
    if (result.toLowerCase().startsWith(pfx)) {
      result = result.slice(pfx.length);
      break;
    }
  }
  while (result.length > 0 && "bcsBCS".includes(result[0])) {
    result = result.slice(1);
  }
  return result.trim();
}

export const formatStudentDisplayName = (email = "", rawName?: string): string => {
  const trimmedRaw = rawName?.trim();
  if (trimmedRaw && !trimmedRaw.includes("@") && trimmedRaw.toLowerCase() !== "anonymous") {
    return trimmedRaw;
  }
  const cleanEmail = String(email || "").toLowerCase().trim();
  if (!cleanEmail || cleanEmail === "anonymous" || cleanEmail === "-") {
    return "Anonymous Student";
  }

  const prefix = cleanEmail.split("@")[0];
  const lettersOnly = stripSurroundingDigits(prefix);
  const cleanedName = stripAcademicPrefixes(lettersOnly);

  const nameCandidate = cleanedName.length >= 2 ? cleanedName : lettersOnly;
  if (!nameCandidate) return prefix;

  return nameCandidate
    .split(/[ ._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export const getLatestStudentQueryIdsByEmail = (queries: any[] = []): Record<string, string> => {
  if (!Array.isArray(queries) || queries.length === 0) return {};
  return queries.reduce((latestByEmail: Record<string, string>, query: any) => {
    const email = normalizeQueryEmail(query?.email);
    if (!email || query?.id === undefined || query?.id === null || latestByEmail[email]) return latestByEmail;
    return { ...latestByEmail, [email]: String(query.id) };
  }, {});
};

export const readStudentQuerySeenMap = (storageKey: string): Record<string, string> => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
};

export const uniqueList = <T>(values: T[]): T[] => [...new Set(values.filter(Boolean))];

export const orderBySequence = <T extends string>(values: T[], sequence: T[]): T[] => {
  const known = sequence.filter((item) => values.includes(item));
  const unknown = values.filter((item) => !sequence.includes(item)).sort((a, b) => a.localeCompare(b));
  return [...known, ...unknown];
};

export const appendAddOption = <T>(values: T[], addOption: T): T[] => values.includes(addOption) ? values : [...values, addOption];

export const defaultSemestersForYear = (selectedYear: string): string[] => {
  const yearNumber = Number.parseInt(selectedYear, 10);
  if (!Number.isFinite(yearNumber) || yearNumber < 1) return [];
  const firstSemester = (yearNumber - 1) * 2 + 1;
  return [`${firstSemester} Sem`, `${firstSemester + 1} Sem`]
    .filter((item) => semesterSequence.includes(item));
};

export const scopedKey = (...parts: (string | number | undefined | null)[]): string =>
  parts.map((part) => String(part || "").trim().toLowerCase()).join("||");

export const notifyPapersUpdated = (): void => {
  const payload = String(Date.now());
  try { localStorage.setItem("papers.updated", payload); } catch {  }
  try { window.dispatchEvent(new Event("papers-updated")); } catch {  }
  try {
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel("papers-updated");
      channel.postMessage(payload);
      channel.close();
    }
  } catch {  }
};

export interface DocumentLinkParseResult {
  isValid: boolean;
  derivedName: string;
}

export const parseDocumentLink = (cleanUrl: string): DocumentLinkParseResult => {
  try {
    const parsed = new URL(cleanUrl);
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
    if (isDriveDoc || isDirectDoc) {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      const lastPart = pathParts.at(-1) || "Paper Document";
      return { isValid: true, derivedName: decodeURIComponent(lastPart) };
    }
  } catch {
    // Return default invalid below
  }
  return { isValid: false, derivedName: "Paper Document" };
};

export const isValidDocumentLink = (cleanUrl: string): boolean => parseDocumentLink(cleanUrl).isValid;

export const buildExpectedPaperPayload = (paper: any): Record<string, string> => {
  if (!paper) return {};
  return {
    expectedCourse: paper.course || "",
    expectedYear: paper.year || "",
    expectedSpec: paper.spec || paper.specialization || "",
    expectedSem: paper.sem || paper.semester || "",
    expectedExam: paper.exam || "",
    expectedName: paper.name || paper.title || ""
  };
};

export const matchValue = (value: unknown, term: string): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    return value.toLowerCase().includes(term);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).toLowerCase().includes(term);
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value).toLowerCase().includes(term);
    } catch {
      return false;
    }
  }
  return false;
};

export const parseLogTimestamp = (dateStr: any): number => {
  if (!dateStr) return 0;
  const str = String(dateStr).trim();
  const direct = Date.parse(str);
  if (!Number.isNaN(direct)) return direct;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/i.exec(str);
  if (match) {
    const day = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10) - 1;
    const year = Number.parseInt(match[3], 10);
    let hour = Number.parseInt(match[4], 10);
    const minute = Number.parseInt(match[5], 10);
    const second = match[6] ? Number.parseInt(match[6], 10) : 0;
    const meridiem = (match[7] || "").toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    return new Date(year, month, day, hour, minute, second).getTime();
  }
  return 0;
};


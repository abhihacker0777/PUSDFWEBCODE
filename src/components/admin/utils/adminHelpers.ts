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

export { isAdminSessionExpired } from "./adminResponseHelpers";
export const goToLogin = (): void => {
  window.location.href = "/login";
};

export const normalizeQueryEmail = (email = ""): string => String(email || "").trim().toLowerCase();

export const formatStudentDisplayName = (email = "", rawName?: string): string => {
  if (rawName && rawName.trim() && !rawName.includes("@") && rawName.toLowerCase() !== "anonymous") {
    return rawName.trim();
  }
  const cleanEmail = String(email || "").toLowerCase().trim();
  if (!cleanEmail || cleanEmail === "anonymous" || cleanEmail === "-") {
    return "Anonymous Student";
  }

  const prefix = cleanEmail.split("@")[0];
  const lettersOnly = prefix.replace(/^\d+/, "").replace(/\d+$/, "");

  const cleanedName = lettersOnly
    .replace(/^(btech|bca|mca|mba|bba|bsc|bdes|barch|bph|diploma)/i, "")
    .replace(/^(aids|aiml|cactd|actd|csb|cse|ctd|cs|it|ece|ee|civil|mech|ctis|cloud|cyber)/i, "")
    .replace(/^[bcs]+\b/i, "")
    .trim();

  const nameCandidate = cleanedName && cleanedName.length >= 2 ? cleanedName : lettersOnly;
  if (!nameCandidate) return prefix;

  return nameCandidate
    .split(/[\s._-]+/)
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
  try { localStorage.setItem("papers.updated", payload); } catch { /* storage can be unavailable */ }
  try { window.dispatchEvent(new Event("papers-updated")); } catch { /* event dispatch can be unavailable */ }
  try {
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel("papers-updated");
      channel.postMessage(payload);
      channel.close();
    }
  } catch { /* broadcast can be unavailable */ }
};


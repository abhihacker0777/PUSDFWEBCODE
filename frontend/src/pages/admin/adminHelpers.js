import { clearPaperCaches as clearClientPaperCaches } from "../../services/api";
import { semesterSequence } from "./adminConstants";

export const clearPapersCache = () => {
  clearClientPaperCaches();
  sessionStorage.removeItem("papersCache");
  sessionStorage.removeItem("papersCacheTime");
  sessionStorage.removeItem("papersCacheVersion");
};

export const isErrorStatus = (message = "") =>
  /error|failed|invalid|required|select|too many|exceed|not connected|rejected|only pdf|permitted/i.test(message);

export const cleanStatusMessage = (message = "") =>
  String(message)
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/^(Error|Success):\s*/i, "")
    .trim();

export const readApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }
  return { message: await response.text() };
};

export { isAdminSessionExpired } from "./adminResponseHelpers.js";
export const goToLogin = () => {
  window.location.href = "/login";
};

export const normalizeQueryEmail = (email = "") => String(email || "").trim().toLowerCase();

export const getLatestStudentQueryIdsByEmail = (queries = []) => {
  if (!Array.isArray(queries) || queries.length === 0) return {};
  return queries.reduce((latestByEmail, query) => {
    const email = normalizeQueryEmail(query?.email);
    if (!email || query?.id === undefined || query?.id === null || latestByEmail[email]) return latestByEmail;
    return { ...latestByEmail, [email]: String(query.id) };
  }, {});
};

export const readStudentQuerySeenMap = (storageKey) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
};

export const uniqueList = (values) => [...new Set(values.filter(Boolean))];

export const orderBySequence = (values, sequence) => {
  const known = sequence.filter((item) => values.includes(item));
  const unknown = values.filter((item) => !sequence.includes(item)).sort((a, b) => a.localeCompare(b));
  return [...known, ...unknown];
};

export const appendAddOption = (values, addOption) => values.includes(addOption) ? values : [...values, addOption];

export const defaultSemestersForYear = (selectedYear) => {
  const yearNumber = Number.parseInt(selectedYear, 10);
  if (!Number.isFinite(yearNumber) || yearNumber < 1) return [];
  const firstSemester = (yearNumber - 1) * 2 + 1;
  return [`${firstSemester} Sem`, `${firstSemester + 1} Sem`]
    .filter((item) => semesterSequence.includes(item));
};

export const scopedKey = (...parts) => parts.map((part) => String(part || "").trim().toLowerCase()).join("||");

export const notifyPapersUpdated = () => {
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

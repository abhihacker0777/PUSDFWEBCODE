import { BACKEND_URL, csrfFetch } from "../../services/api";

const jsonHeaders = { "Content-Type": "application/json" };

export const getCurrentAdmin = () =>
  fetch(`${BACKEND_URL}/me`, { credentials: "include", cache: "no-store" });

export const logoutAdmin = () =>
  csrfFetch(`${BACKEND_URL}/logout`, { method: "POST", credentials: "include" });

export const getPapers = () =>
  fetch(`${BACKEND_URL}/admin/papers`, { credentials: "include", cache: "no-store" });

export const uploadPaper = (formData) =>
  csrfFetch(`${BACKEND_URL}/upload`, { method: "POST", body: formData });

export const deletePaper = (index) =>
  csrfFetch(`${BACKEND_URL}/delete`, {
    method: "DELETE",
    headers: jsonHeaders,
    body: JSON.stringify({ index })
  });

export const syncPapersToWebsite = () =>
  csrfFetch(`${BACKEND_URL}/sync`, { method: "POST" });

export const getLogs = () =>
  fetch(`${BACKEND_URL}/logs`, { credentials: "include", cache: "no-store" });

export const clearLogs = () =>
  csrfFetch(`${BACKEND_URL}/logs/clear`, { method: "DELETE" });

export const clearSelectedLogs = (ids) =>
  csrfFetch(`${BACKEND_URL}/logs/delete`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ ids })
  });

export const getBlockedEmails = () =>
  fetch(`${BACKEND_URL}/admin/settings/blocked`, { credentials: "include", cache: "no-store" });

export const getCustomReplies = () =>
  fetch(`${BACKEND_URL}/admin/settings/replies`, { credentials: "include", cache: "no-store" });

export const blockAssistantUser = (email) =>
  csrfFetch(`${BACKEND_URL}/admin/settings/block`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email })
  });

export const unblockAssistantUser = (email) =>
  csrfFetch(`${BACKEND_URL}/admin/settings/unblock`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email })
  });

export const saveCustomReply = (reply) =>
  csrfFetch(`${BACKEND_URL}/admin/settings/reply`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(reply)
  });

export const deleteCustomReply = (keyword) =>
  csrfFetch(`${BACKEND_URL}/admin/settings/reply/delete`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ keyword })
  });

export const getStudentQueries = () =>
  fetch(`${BACKEND_URL}/admin/queries`, { credentials: "include", cache: "no-store" });

export const getAdminUsers = () =>
  fetch(`${BACKEND_URL}/admin/users`, { credentials: "include", cache: "no-store" });

export const createAdminUser = (user) =>
  csrfFetch(`${BACKEND_URL}/admin/users`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(user)
  });

export const updateAdminUser = (user) =>
  csrfFetch(`${BACKEND_URL}/admin/users`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(user)
  });

export const deleteAdminUser = (id) =>
  csrfFetch(`${BACKEND_URL}/admin/users`, {
    method: "DELETE",
    headers: jsonHeaders,
    body: JSON.stringify({ id })
  });

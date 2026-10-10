import { BACKEND_URL, csrfFetch } from "../../../services/api";

const jsonHeaders = { "Content-Type": "application/json" };

export const getCurrentAdmin = (): Promise<Response> =>
  fetch(`${BACKEND_URL}/api/auth/me`, { credentials: "include", cache: "no-store" });

export const logoutAdmin = (): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/api/auth/logout`, { method: "POST", credentials: "include" });

export const getPapers = (): Promise<Response> =>
  fetch(`${BACKEND_URL}/admin/papers`, { credentials: "include", cache: "no-store" });

export const uploadPaper = (formData: FormData): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/upload`, { method: "POST", body: formData });

export const deletePaper = (index: string | number, expected: Record<string, any> = {}): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/delete`, {
    method: "DELETE",
    headers: jsonHeaders,
    body: JSON.stringify({ index, ...expected })
  });

export const bulkDeletePapersApi = (items: any[]): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/bulk-delete`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ items })
  });

export const bulkEditPapersApi = (items: any[], updates: Record<string, any>): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/bulk-edit`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ items, updates })
  });

export const syncPapersToWebsite = (): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/sync`, { method: "POST" });

export const getLogs = (): Promise<Response> =>
  fetch(`${BACKEND_URL}/logs`, { credentials: "include", cache: "no-store" });

export const clearLogs = (): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/logs/clear`, { method: "DELETE" });

export const clearSelectedLogs = (ids: (string | number)[]): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/logs/delete`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ ids })
  });

export const getBlockedEmails = (): Promise<Response> =>
  fetch(`${BACKEND_URL}/admin/settings/blocked`, { credentials: "include", cache: "no-store" });

export const blockAssistantUser = (email: string): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/admin/settings/block`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email })
  });

export const unblockAssistantUser = (email: string): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/admin/settings/unblock`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email })
  });

export const getStudentQueries = (): Promise<Response> =>
  fetch(`${BACKEND_URL}/admin/queries`, { credentials: "include", cache: "no-store" });

export const getQueryInsights = (days = 30): Promise<Response> =>
  fetch(`${BACKEND_URL}/admin/queries/insights?days=${days}`, { credentials: "include", cache: "no-store" });

export const getAdminUsers = (): Promise<Response> =>
  fetch(`${BACKEND_URL}/admin/users`, { credentials: "include", cache: "no-store" });

export const createAdminUser = (user: any): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/admin/users`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(user)
  });

export const updateAdminUser = (user: any): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/admin/users`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(user)
  });

export const deleteAdminUser = (id: string | number): Promise<Response> =>
  csrfFetch(`${BACKEND_URL}/admin/users`, {
    method: "DELETE",
    headers: jsonHeaders,
    body: JSON.stringify({ id })
  });


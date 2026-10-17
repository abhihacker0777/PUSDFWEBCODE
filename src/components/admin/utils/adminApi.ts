import { buildBackendUrl, csrfFetch } from "../../../services/api";

const jsonHeaders = { "Content-Type": "application/json" };

export const getCurrentAdmin = (): Promise<Response> =>
  fetch(buildBackendUrl("/api/auth/me"), { credentials: "include", cache: "no-store", redirect: "error" });

export const logoutAdmin = (): Promise<Response> =>
  csrfFetch("/api/auth/logout", { method: "POST", credentials: "include" });

export const getPapers = (): Promise<Response> =>
  fetch(buildBackendUrl("/admin/papers"), { credentials: "include", cache: "no-store", redirect: "error" });

export const uploadPaper = (formData: FormData): Promise<Response> =>
  csrfFetch("/upload", { method: "POST", body: formData });

export const deletePaper = (index: string | number, expected: Record<string, any> = {}): Promise<Response> =>
  csrfFetch("/delete", {
    method: "DELETE",
    headers: jsonHeaders,
    body: JSON.stringify({ index, ...expected })
  });

export const bulkDeletePapersApi = (items: any[]): Promise<Response> =>
  csrfFetch("/bulk-delete", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ items })
  });

export const bulkEditPapersApi = (items: any[], updates: Record<string, any>): Promise<Response> =>
  csrfFetch("/bulk-edit", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ items, updates })
  });

export const syncPapersToWebsite = (): Promise<Response> =>
  csrfFetch("/sync", { method: "POST" });

export const getLogs = (): Promise<Response> =>
  fetch(buildBackendUrl("/logs"), { credentials: "include", cache: "no-store", redirect: "error" });

export const clearLogs = (): Promise<Response> =>
  csrfFetch("/logs/clear", { method: "DELETE" });

export const clearSelectedLogs = (ids: (string | number)[]): Promise<Response> =>
  csrfFetch("/logs/delete", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ ids })
  });

export const getBlockedEmails = (): Promise<Response> =>
  fetch(buildBackendUrl("/admin/settings/blocked"), { credentials: "include", cache: "no-store", redirect: "error" });

export const blockAssistantUser = (email: string): Promise<Response> =>
  csrfFetch("/admin/settings/block", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email })
  });

export const unblockAssistantUser = (email: string): Promise<Response> =>
  csrfFetch("/admin/settings/unblock", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email })
  });

export const getStudentQueries = (): Promise<Response> =>
  fetch(buildBackendUrl("/admin/queries"), { credentials: "include", cache: "no-store", redirect: "error" });

export const getQueryInsights = (days = 30): Promise<Response> => {
  const safeDays = Number.isFinite(days) ? Math.max(1, Math.min(365, Math.trunc(days))) : 30;
  return fetch(buildBackendUrl(`/admin/queries/insights?days=${safeDays}`), {
    credentials: "include",
    cache: "no-store",
    redirect: "error"
  });
};

export const getAdminUsers = (): Promise<Response> =>
  fetch(buildBackendUrl("/admin/users"), { credentials: "include", cache: "no-store", redirect: "error" });

export const createAdminUser = (user: any): Promise<Response> =>
  csrfFetch("/admin/users", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(user)
  });

export const updateAdminUser = (user: any): Promise<Response> =>
  csrfFetch("/admin/users", {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(user)
  });

export const deleteAdminUser = (id: string | number): Promise<Response> =>
  csrfFetch("/admin/users", {
    method: "DELETE",
    headers: jsonHeaders,
    body: JSON.stringify({ id })
  });

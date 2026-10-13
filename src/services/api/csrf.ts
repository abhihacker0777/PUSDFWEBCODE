import { BACKEND_URL } from "./backendConfig";

let csrfToken = "";
let csrfTokenPromise: Promise<string> | null = null;

export const getCsrfToken = async ({ force = false }: { force?: boolean } = {}): Promise<string> => {
  if (!force && csrfToken) return csrfToken;
  if (!force && csrfTokenPromise) return csrfTokenPromise;

  const fetchToken = async (): Promise<string> => {
    try {
      const response = await fetch(`${BACKEND_URL}/csrf-token`, {
        method: "GET",
        cache: "no-store",
        credentials: "include"
      });
      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      if (!response.ok || !data.csrfToken) {
        throw new Error(data.message || "CSRF token request failed");
      }
      csrfToken = data.csrfToken;
      return csrfToken;
    } finally {
      csrfTokenPromise = null;
    }
  };

  csrfTokenPromise = fetchToken();
  return csrfTokenPromise;
};

export const csrfFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const send = async (token: string) => {
    const headers = new Headers(options.headers || {});
    headers.set("X-CSRF-Token", token);

    return fetch(url, {
      ...options,
      credentials: options.credentials || "include",
      headers
    });
  };

  let response = await send(await getCsrfToken());

  if (response.status === 403) {
    const cloned = response.clone();
    const data = await cloned.json().catch(() => ({}));
    if (data.code === "CSRF_REQUIRED") {
      csrfToken = "";
      response = await send(await getCsrfToken({ force: true }));
    }
  }

  return response;
};

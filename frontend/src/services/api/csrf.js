import { BACKEND_URL } from "./backendConfig";

let csrfToken = "";
let csrfTokenPromise = null;

export const getCsrfToken = async ({ force = false } = {}) => {
  if (!force && csrfToken) return csrfToken;
  if (!force && csrfTokenPromise) return csrfTokenPromise;

  csrfTokenPromise = fetch(`${BACKEND_URL}/csrf-token`, {
    method: "GET",
    cache: "no-store",
    credentials: "include"
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.csrfToken) {
        throw new Error(data.message || "CSRF token request failed");
      }
      csrfToken = data.csrfToken;
      return csrfToken;
    })
    .finally(() => {
      csrfTokenPromise = null;
    });

  return csrfTokenPromise;
};

export const csrfFetch = async (url, options = {}) => {
  const send = async (token) => {
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

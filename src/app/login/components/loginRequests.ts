"use client";

import { BACKEND_URL, csrfFetch } from "@/services/api";

export async function requestLogin({ captchaToken, password, username }: { captchaToken?: string; password: string; username: string }) {
  const loginEndpoint = BACKEND_URL ? `${BACKEND_URL}/login` : "/api/auth/login";
  const response = await csrfFetch(loginEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email: username, password, captchaToken })
  });

  return {
    data: await response.json().catch(() => ({})),
    response
  };
}

export async function requestPasswordReset(email: string) {
  const response = await csrfFetch(`${BACKEND_URL}/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email })
  });

  return response.json().catch(() => ({}));
}

"use client";

import { buildBackendUrl, csrfFetch } from "@/services/api";

export async function requestLogin({ captchaToken, password, username }: { captchaToken?: string; password: string; username: string }) {
  const response = await csrfFetch(buildBackendUrl("/api/auth/login"), {
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
  const response = await csrfFetch(buildBackendUrl("/api/auth/reset"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email })
  });

  return response.json().catch(() => ({}));
}

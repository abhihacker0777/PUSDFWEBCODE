import { BACKEND_URL, csrfFetch } from "../../services/api";

export async function requestLogin({ captchaToken, password, username }) {
  const response = await csrfFetch(`${BACKEND_URL}/login`, {
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

export async function requestPasswordReset(email) {
  const response = await csrfFetch(`${BACKEND_URL}/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email })
  });

  return response.json().catch(() => ({}));
}

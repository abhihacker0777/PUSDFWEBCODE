import { BACKEND_URL } from "./backendConfig";

export const fetchAssistantConfig = async () => {
  const response = await fetch(`${BACKEND_URL}/assistant/config`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Assistant configuration failed");
  }

  return data;
};

export const verifyAssistantGoogleCredential = async (credential) => {
  const response = await fetch(`${BACKEND_URL}/assistant/google/verify`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Google sign-in failed");
    error.code = data.code;
    throw error;
  }

  return data;
};

export const askPaperAssistant = async ({ credential, question }) => {
  const response = await fetch(`${BACKEND_URL}/assistant/search`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential, question }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Assistant request failed");
    error.code = data.code;
    throw error;
  }

  return data;
};

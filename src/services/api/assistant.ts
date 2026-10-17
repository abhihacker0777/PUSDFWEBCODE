import { buildBackendUrl } from "./backendConfig";

export const fetchAssistantConfig = async (): Promise<any> => {
  const response = await fetch(buildBackendUrl("/assistant/config"), {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "error",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Assistant Configuration Failed");
  }

  return data;
};

export const verifyAssistantGoogleCredential = async (credential: string): Promise<any> => {
  const response = await fetch(buildBackendUrl("/assistant/google/verify"), {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
    redirect: "error",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(data.message || "Google Sign-In Failed");
    error.code = data.code;
    throw error;
  }

  return data;
};

export const askPaperAssistant = async ({ credential, question }: { credential: string; question: string }): Promise<any> => {
  const response = await fetch(buildBackendUrl("/assistant/search"), {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential, question }),
    redirect: "error",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(data.message || "Assistant Request Failed");
    error.code = data.code;
    throw error;
  }

  return data;
};

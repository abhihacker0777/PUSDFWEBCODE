"use client";

import { useEffect, useState } from "react";
import { fetchAssistantConfig } from "@/services/api";
import { DEFAULT_DOMAIN } from "./assistantAuth";

export interface AssistantConfig {
  googleClientId: string;
  emailDomain: string;
  aiProvider: string;
  geminiEnabled: boolean;
  sarvamEnabled: boolean;
}

const DEFAULT_CONFIG: AssistantConfig = {
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_SIGNIN_CLIENT_ID || "",
  emailDomain: DEFAULT_DOMAIN,
  aiProvider: "gemini",
  geminiEnabled: true,
  sarvamEnabled: false
};

export default function useAssistantConfig(setSignInError: (err: string) => void): AssistantConfig {
  const [config, setConfig] = useState<AssistantConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    let active = true;
    fetchAssistantConfig()
      .then((data: any) => {
        if (!active) return;
        setConfig({
          googleClientId: data?.googleClientId || process.env.NEXT_PUBLIC_GOOGLE_SIGNIN_CLIENT_ID || "",
          emailDomain: data?.emailDomain || DEFAULT_DOMAIN,
          aiProvider: data?.aiProvider || "gemini",
          geminiEnabled: Boolean(data?.geminiEnabled ?? true),
          sarvamEnabled: false
        });
      })
      .catch(() => {
        if (active) {
          // Fall back gracefully to public client ID if endpoint errors
          if (process.env.NEXT_PUBLIC_GOOGLE_SIGNIN_CLIENT_ID) {
            setConfig(prev => ({
              ...prev,
              googleClientId: process.env.NEXT_PUBLIC_GOOGLE_SIGNIN_CLIENT_ID!
            }));
          } else {
            setSignInError("Assistant sign-in is not configured yet.");
          }
        }
      });

    return () => {
      active = false;
    };
  }, [setSignInError]);

  return config;
}

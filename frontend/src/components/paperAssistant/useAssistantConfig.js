import { useEffect, useState } from "react";
import { fetchAssistantConfig } from "../../services/api";
import { DEFAULT_DOMAIN } from "./assistantAuth";

const DEFAULT_CONFIG = {
  googleClientId: "",
  emailDomain: DEFAULT_DOMAIN,
  aiProvider: "sarvam",
  sarvamEnabled: false
};

export default function useAssistantConfig(setSignInError) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    let active = true;
    fetchAssistantConfig()
      .then((data) => {
        if (!active) return;
        setConfig({
          googleClientId: data.googleClientId || "",
          emailDomain: data.emailDomain || DEFAULT_DOMAIN,
          aiProvider: data.aiProvider || "sarvam",
          sarvamEnabled: Boolean(data.sarvamEnabled)
        });
      })
      .catch(() => {
        if (active) setSignInError("Assistant sign-in is not configured yet.");
      });

    return () => {
      active = false;
    };
  }, [setSignInError]);

  return config;
}

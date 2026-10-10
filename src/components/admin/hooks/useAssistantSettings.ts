import { useCallback, useState } from "react";
import {
  blockAssistantUser,
  getBlockedEmails,
  unblockAssistantUser
} from "../utils/adminApi";
import { cleanStatusMessage, readApiResponse } from "../utils/adminHelpers";

export interface UseAssistantSettingsParams {
  canBlockAssistant: boolean;
}

export default function useAssistantSettings({
  canBlockAssistant
}: UseAssistantSettingsParams) {
  const [blockedEmails, setBlockedEmails] = useState<any[]>([]);
  const [blockLoadingEmail, setBlockLoadingEmail] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const blockResponse = await getBlockedEmails();
      if (blockResponse.ok) setBlockedEmails(await blockResponse.json());
    } catch (error) {
      console.error("Blocked users fetch failed", error);
    }
  }, []);

  const handleBlockUser = async (email: string) => {
    if (!canBlockAssistant) return;
    setBlockLoadingEmail(email);
    try {
      const response = await blockAssistantUser(email);
      if (response.ok) await fetchSettings();
      else console.error(cleanStatusMessage((await readApiResponse(response)).message || "Failed to block user"));
    } catch (error) {
      console.error(error);
    } finally {
      setBlockLoadingEmail("");
    }
  };

  const handleUnblockUser = async (email: string) => {
    if (!canBlockAssistant) return;
    setBlockLoadingEmail(email);
    try {
      const response = await unblockAssistantUser(email);
      if (response.ok) await fetchSettings();
      else console.error(cleanStatusMessage((await readApiResponse(response)).message || "Failed to unblock user"));
    } catch (error) {
      console.error(error);
    } finally {
      setBlockLoadingEmail("");
    }
  };

  return {
    blockedEmails,
    blockLoadingEmail,
    fetchSettings,
    handleBlockUser,
    handleUnblockUser
  };
}

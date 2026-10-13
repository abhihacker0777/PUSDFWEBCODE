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
      console.error("Blocked Users Fetch Failed:", error);
    }
  }, []);

  const handleBlockUser = async (email: string) => {
    if (!canBlockAssistant) return;
    setBlockLoadingEmail(email);
    try {
      const response = await blockAssistantUser(email);
      if (response.ok) await fetchSettings();
      else console.error(cleanStatusMessage((await readApiResponse(response)).message || "Failed To Block User"));
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
      else console.error(cleanStatusMessage((await readApiResponse(response)).message || "Failed To Unblock User"));
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

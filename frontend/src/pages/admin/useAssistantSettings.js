import { useCallback, useEffect, useState } from "react";
import {
  blockAssistantUser,
  deleteCustomReply,
  getBlockedEmails,
  getCustomReplies,
  saveCustomReply,
  unblockAssistantUser
} from "./adminApi";
import { cleanStatusMessage, readApiResponse } from "./adminHelpers";

export default function useAssistantSettings({
  canReadAssistant,
  canBlockAssistant,
  canCreateReplies,
  canEditAssistant,
  canDeleteReplies
}) {
  const [blockedEmails, setBlockedEmails] = useState([]);
  const [customReplies, setCustomReplies] = useState([]);
  const [draftReplies, setDraftReplies] = useState([{ keyword: "", reply: "" }]);
  const [editingReplyKeyword, setEditingReplyKeyword] = useState("");
  const [replyCurrentPage, setReplyCurrentPage] = useState(1);
  const [replyDisplayCount, setReplyDisplayCount] = useState(10);
  const [blockLoadingEmail, setBlockLoadingEmail] = useState("");
  const [isSavingReplies, setIsSavingReplies] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!canReadAssistant) return;
    try {
      const [blockResponse, repliesResponse] = await Promise.all([getBlockedEmails(), getCustomReplies()]);
      if (blockResponse.ok) setBlockedEmails(await blockResponse.json());
      if (repliesResponse.ok) setCustomReplies(await repliesResponse.json());
    } catch (error) {
      console.error("Settings fetch failed", error);
    }
  }, [canReadAssistant]);

  useEffect(() => setReplyCurrentPage(1), [replyDisplayCount]);

  const handleBlockUser = async (email) => {
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

  const handleUnblockUser = async (email) => {
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

  const handleAddReplies = async () => {
    if (!canCreateReplies && !canEditAssistant && !editingReplyKeyword) return;
    const validReplies = draftReplies
      .map((item) => ({ keyword: item.keyword.trim(), reply: item.reply.trim() }))
      .filter((item) => item.keyword && item.reply);
    if (validReplies.length === 0) return;

    setIsSavingReplies(true);
    try {
      for (const reply of validReplies) {
        const response = await saveCustomReply(reply);
        if (!response.ok) throw new Error((await readApiResponse(response)).message || "Failed to save reply");
      }
      setDraftReplies([{ keyword: "", reply: "" }]);
      setEditingReplyKeyword("");
      await fetchSettings();
    } catch (error) {
      console.error(cleanStatusMessage(error.message || "Failed to save replies"));
    } finally {
      setIsSavingReplies(false);
    }
  };

  const handleDeleteReply = async (keyword) => {
    if (!canDeleteReplies) return;
    setIsLoading(true);
    try {
      const response = await deleteCustomReply(keyword);
      if (response.ok) await fetchSettings();
      else console.error(cleanStatusMessage((await readApiResponse(response)).message || "Failed to delete reply"));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    blockedEmails,
    blockLoadingEmail,
    fetchSettings,
    handleBlockUser,
    handleUnblockUser,
    assistantSettingsProps: {
      canCreateReplies,
      editingReplyKeyword,
      draftReplies,
      setDraftReplies,
      isSavingReplies,
      handleAddReplies,
      customReplies,
      replyCurrentPage,
      replyDisplayCount,
      isLoading,
      setEditingReplyKeyword,
      canDeleteReplies,
      handleDeleteReply,
      setReplyCurrentPage,
      setReplyDisplayCount
    }
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { buildInitialMessages } from "./assistantAuth";

export default function useAssistantMessages(savedUser, isLoading) {
  const [messages, setMessages] = useState(() => buildInitialMessages(savedUser));
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const pushMessage = useCallback((message) => {
    setMessages((current) => [
      ...current,
      {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ...message
      }
    ]);
  }, []);

  const resetMessages = useCallback((user) => {
    setMessages(buildInitialMessages(user));
  }, []);

  return {
    messages,
    messagesRef,
    pushMessage,
    resetMessages
  };
}

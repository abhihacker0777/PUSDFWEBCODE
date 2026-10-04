"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildInitialMessages } from "./assistantAuth";

export interface AssistantMessageItem {
  role: "user" | "bot";
  text: string;
  time?: string;
  results?: any[];
  status?: string;
  isWelcome?: boolean;
}

export default function useAssistantMessages(savedUser: any, isLoading: boolean) {
  const [messages, setMessages] = useState<AssistantMessageItem[]>(() => buildInitialMessages(savedUser, ""));
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Stamp the client-side time after hydration to avoid hydration mismatch
    setMessages((prev) =>
      prev.map((msg) =>
        msg.time ? msg : { ...msg, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
      )
    );
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const pushMessage = useCallback((message: AssistantMessageItem) => {
    setMessages((current) => [
      ...current,
      {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ...message
      }
    ]);
  }, []);

  const resetMessages = useCallback((user: any) => {
    setMessages(buildInitialMessages(user));
  }, []);

  return {
    messages,
    messagesRef,
    pushMessage,
    resetMessages
  };
}

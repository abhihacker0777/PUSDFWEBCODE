"use client";

import React, { useEffect } from "react";
import PaperAssistantLauncher from "./paperAssistant/PaperAssistantLauncher";
import PaperAssistantPanel from "./paperAssistant/PaperAssistantPanel";
import usePaperAssistantController from "./paperAssistant/usePaperAssistantController";
import { loadGoogleScript } from "./paperAssistant/assistantAuth";

export default function PaperAssistant() {
  const assistant = usePaperAssistantController();

  // Pre-warm Google script & background pattern on page mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      loadGoogleScript().catch(() => {});
      const pattern = new window.Image();
      pattern.src = "/pupatternlogo.png";
      const avatar = new window.Image();
      avatar.src = "/logo.png";
    }
  }, []);

  return (
    <>
      <PaperAssistantLauncher
        isOpen={assistant.isOpen}
        onOpen={assistant.openAssistant}
      />

      <PaperAssistantPanel {...assistant} />
    </>
  );
}

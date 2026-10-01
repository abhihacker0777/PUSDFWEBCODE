"use client";

import React, { RefObject } from "react";
import Image from "next/image";
import { FiRefreshCw, FiX } from "react-icons/fi";
import PaperAssistantChat from "./PaperAssistantChat";
import PaperAssistantSignin from "./PaperAssistantSignin";
import { AssistantConfig } from "./useAssistantConfig";
import { AssistantMessageItem } from "./useAssistantMessages";

function PoweredFooter() {
  return (
    <div className="pu-assistant-powered flex items-center justify-center gap-1.5 py-1">
      <span className="text-[#1a1a1a] font-bold text-xs">Powered By</span>
      <a
        href="https://deepmind.google/technologies/gemini/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center"
      >
        <Image 
          src="/pugeminifullogo.svg" 
          alt="Google Gemini" 
          width={80}
          height={16}
          className="h-4 w-auto inline-block opacity-90 hover:opacity-100 transition-opacity cursor-pointer" 
        />
      </a>
    </div>
  );
}


interface PaperAssistantPanelProps {
  auth: any;
  clearAuth: () => void;
  closeAssistant: () => void;
  config: AssistantConfig;
  googleButtonRef: RefObject<HTMLDivElement | null>;
  handleSubmit: (e?: React.FormEvent, directQuery?: string) => void;
  input: string;
  isLoading: boolean;
  isSigningIn: boolean;
  messages: AssistantMessageItem[];
  messagesRef: RefObject<HTMLDivElement | null>;
  setInput: (val: string) => void;
  signInError: string;
  view: "signin" | "chat";
}

export default function PaperAssistantPanel({
  auth,
  clearAuth,
  closeAssistant,
  config,
  googleButtonRef,
  handleSubmit,
  input,
  isLoading,
  isSigningIn,
  messages,
  messagesRef,
  setInput,
  signInError,
  view
}: Readonly<PaperAssistantPanelProps>) {
  return (
    <section className="pu-assistant-panel">
      <header className="pu-assistant-header">
        <div className="pu-assistant-header-left">
          <Image src="/logo.png" alt="" className="pu-assistant-header-avatar" width={34} height={34} />

          <div className="min-w-0">
            <div className="pu-assistant-title">
              <span className="pu-assistant-title-text">PU-Exam Cell</span>
              <span className={auth ? "is-connected" : "is-disconnected"} aria-hidden="true" />
            </div>
            <p className="pu-assistant-subtitle">
              {auth?.user?.email || "Disconnected"}
            </p>
          </div>
        </div>

        <div className="pu-assistant-header-actions">
          {auth && (
            <button
              type="button"
              onClick={clearAuth}
              className="pu-assistant-action-refresh"
              aria-label="Change Google account"
              title="Change Google account"
            >
              <FiRefreshCw aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={closeAssistant}
            className="pu-assistant-action-close"
            aria-label="Close assistant"
            title="Close"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
      </header>

      {view === "signin" && (
        <PaperAssistantSignin
          config={config}
          googleButtonRef={googleButtonRef}
          isSigningIn={isSigningIn}
          signInError={signInError}
        />
      )}
      {view === "chat" && (
        <PaperAssistantChat
          input={input}
          isLoading={isLoading}
          messages={messages}
          messagesRef={messagesRef}
          onInputChange={setInput}
          onSubmit={handleSubmit}
        />
      )}
      {view === "chat" && <PoweredFooter />}
    </section>
  );
}

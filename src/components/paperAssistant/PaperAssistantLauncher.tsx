"use client";

import React from "react";
import Image from "next/image";

interface PaperAssistantLauncherProps {
  isOpen: boolean;
  onOpen: () => void;
}

export default function PaperAssistantLauncher({ isOpen, onOpen }: Readonly<PaperAssistantLauncherProps>) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`pu-assistant-launcher fixed bottom-5 right-5 z-40 flex flex-col items-center gap-2 ${isOpen ? "hidden" : ""}`}
      aria-label="Open PU Assistant"
    >
      <span className="pu-assistant-float relative flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-slate-900/10 p-2.5">
        <Image 
          src="/pugeminilogo.svg" 
          alt="Gemini AI" 
          width={36}
          height={36}
          className="w-9 h-9 object-contain drop-shadow-sm transition-transform duration-300 hover:scale-110" 
        />
      </span>


      <span className="pu-assistant-launcher-label rounded-full bg-[#f0f0f0d9] px-4 py-1.5 text-[15px] font-bold text-[#000000] shadow-lg">
        Talk To Us
      </span>
    </button>
  );
}

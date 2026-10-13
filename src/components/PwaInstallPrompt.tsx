"use client";

import React, { useEffect, useState } from "react";
import { Download, Check, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const INSTALL_BUTTON_STYLE = {
  bottom: "138px",
  right: "13px",
  width: "auto",
  height: "auto",
  paddingLeft: "16px",
  paddingRight: "16px",
  paddingTop: "10px",
  paddingBottom: "10px",
};

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      window.location.search.includes("source=pwa");

    const storedInstalled = localStorage.getItem("pwa_installed") === "true";

    if (isStandalone || storedInstalled) {
      setIsInstalled(true);
    }

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIosDevice(isIos);

    if ("getInstalledRelatedApps" in navigator) {
      (navigator as any)
        .getInstalledRelatedApps()
        .then((relatedApps: any[]) => {
          if (relatedApps && relatedApps.length > 0) {
            setIsInstalled(true);
            localStorage.setItem("pwa_installed", "true");
          }
        })
        .catch(() => {});
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstalled(false);
      localStorage.removeItem("pwa_installed");
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem("pwa_installed", "true");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 8000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        localStorage.setItem("pwa_installed", "true");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 8000);
      }
      setDeferredPrompt(null);
    } else if (isIosDevice) {
      setShowIosTip(true);
      setTimeout(() => setShowIosTip(false), 7000);
    }
  };

  const canShowInstallButton = !isInstalled && (deferredPrompt !== null || isIosDevice);

  return (
    <>
      {}
      {showSuccessToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-white rounded-2xl p-4 shadow-2xl border border-emerald-100 flex items-start gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              🎉 App Installed Successfully!
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              You Can Now Access Previous Year Question Papers Directly From Your Home Screen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessToast(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close Notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {}
      {showIosTip && (
        <div className="fixed bottom-28 right-6 z-50 max-w-xs bg-white text-gray-800 text-xs p-3.5 rounded-xl shadow-2xl border border-gray-200 animate-fade-in">
          <p className="font-bold mb-1 text-sm text-[#05488B]">Install On iPhone / iPad:</p>
          <p>Tap The <b>Share</b> Button At The Bottom Of Safari, Then Choose <b>Add To Home Screen</b>.</p>
        </div>
      )}

      {}
      {canShowInstallButton && (
        <button
          type="button"
          onClick={handleInstallClick}
          style={INSTALL_BUTTON_STYLE}
          className="fixed z-40 flex items-center justify-center gap-2 bg-[#CBE0FE] hover:bg-[#ffc107] text-white font-medium text-xs sm:text-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 border border-white/10"
          title="Install App On Device"
          aria-label="Install App"
        >
          <Download className="w-4 h-4 text-[#05488B] shrink-0" />
          <span className="font-semibold tracking-wide whitespace-nowrap">Install App</span>
        </button>
      )}
    </>
  );
}

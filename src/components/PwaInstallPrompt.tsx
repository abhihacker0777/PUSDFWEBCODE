"use client";

import React, { useEffect, useState } from "react";
import { Download, Check, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * --------------------------------------------------------------------------
 * 🛠️ MANUAL POSITION & SIZE CONTROLS (EDIT THESE VALUES ANYTIME):
 * --------------------------------------------------------------------------
 * • bottom:  Controls UP/DOWN position.
 *            Increase (e.g. "150px") to move HIGHER UP.
 *            Decrease (e.g. "110px") to move LOWER DOWN.
 * • right:   Controls LEFT/RIGHT position.
 *            Distance from right screen edge (e.g. "24px").
 * • width:   "auto" or a fixed width like "140px".
 * • height:  "auto" or a fixed height like "44px".
 * • paddingX: Horizontal inner spacing (left & right).
 * • paddingY: Vertical inner spacing (top & bottom).
 * --------------------------------------------------------------------------
 */
const INSTALL_BUTTON_STYLE = {
  bottom: "138px", // ⬆️ UP / DOWN: Increase to move up, decrease to move down
  right: "13px",   // ⬅️ LEFT / RIGHT: Increase to move further away from right edge
  width: "auto",   // ↔️ WIDTH: e.g. "auto" or "140px"
  height: "auto",  // ↕️ HEIGHT: e.g. "auto" or "42px"
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

    // 1. Detect if running in standalone PWA window or installed query param
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      window.location.search.includes("source=pwa");

    // 2. Check localStorage cache
    const storedInstalled = localStorage.getItem("pwa_installed") === "true";

    if (isStandalone || storedInstalled) {
      setIsInstalled(true);
    }

    // 3. Detect iOS devices
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIosDevice(isIos);

    // 4. Check getInstalledRelatedApps API (Chrome 80+ on Desktop/Android)
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

    // 5. Handle beforeinstallprompt (Fired ONLY if app is NOT yet installed)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // If browser fires this, the app is NOT installed
      setIsInstalled(false);
      localStorage.removeItem("pwa_installed");
    };

    // 6. Handle appinstalled event
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

  // The button should ONLY show if:
  // - The app is NOT installed
  // - AND (we have an active install prompt from Chrome OR user is on iOS Safari where prompt isn't supported)
  const canShowInstallButton = !isInstalled && (deferredPrompt !== null || isIosDevice);

  return (
    <>
      {/* 1. App Installed Successfully Toast (Matches Poornima Group style) */}
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
              You can now access Previous Year Question Papers directly from your home screen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessToast(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. iOS Install Tip Popup */}
      {showIosTip && (
        <div className="fixed bottom-28 right-6 z-50 max-w-xs bg-white text-gray-800 text-xs p-3.5 rounded-xl shadow-2xl border border-gray-200 animate-fade-in">
          <p className="font-bold mb-1 text-sm text-[#05488B]">Install on iPhone / iPad:</p>
          <p>Tap the <b>Share</b> button (square with arrow) at the bottom of Safari, then choose <b>Add to Home Screen</b>.</p>
        </div>
      )}

      {/* 3. Floating Install Button (Only visible if the app is NOT installed and can be installed) */}
      {canShowInstallButton && (
        <button
          type="button"
          onClick={handleInstallClick}
          style={INSTALL_BUTTON_STYLE}
          className="fixed z-40 flex items-center justify-center gap-2 bg-[#CBE0FE] hover:bg-[#ffc107] text-white font-medium text-xs sm:text-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 border border-white/10"
          title="Install App on Device"
          aria-label="Install App"
        >
          <Download className="w-4 h-4 text-[#05488B] shrink-0" />
          <span className="font-semibold tracking-wide whitespace-nowrap">Install App</span>
        </button>
      )}
    </>
  );
}

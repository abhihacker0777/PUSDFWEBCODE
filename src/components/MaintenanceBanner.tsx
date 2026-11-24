"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function MaintenanceBanner() {
  const [maintenance, setMaintenance] = useState<{ active: boolean; message: string }>({
    active: false,
    message: "Portal Under Maintenance Mode",
  });
  const [checking, setChecking] = useState(false);

  const checkStatus = () => {
    setChecking(true);
    fetch("/api/settings/public", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((d) => {
        if (d?.success) {
          const isEnabled = Boolean(d.maintenanceMode);
          setMaintenance({
            active: isEnabled,
            message: d.message || "Portal Under Maintenance Mode",
          });
        }
      })
      .catch(() => { })
      .finally(() => setChecking(false));
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  if (!maintenance.active) return null;

  return (
    <div className="fixed inset-0 z-[99999] min-h-screen w-full bg-[#f3f8fc] flex flex-col justify-between overflow-y-auto animate-fade-in">
      <div />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
        {/* Branding placed centered right above the card */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <Image
            src="/pufulllogo.png"
            alt="Poornima University Logo"
            width={2048}
            height={540}
            priority
            quality={100}
            sizes="(max-width: 640px) 240px, 300px"
            className="w-[240px] sm:w-[300px] h-auto object-contain"
          />
          <div className="hidden sm:block h-10 w-[1px] bg-gray-300" />
          <div className="flex flex-col text-center sm:text-left leading-tight">
            <span className="text-[#ffc107] font-bold text-xs sm:text-sm">
              Central Examination &amp;
            </span>
            <span className="text-[#ffc107] font-semibold text-[11px] sm:text-xs">
              Academic Paper Archive
            </span>
          </div>
        </div>

        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10 text-center relative overflow-hidden">
          { }
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{ background: "linear-gradient(90deg, rgb(185, 28, 28), rgb(239, 68, 68), rgb(185, 28, 28))" }}
          />

          { }
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-6 shadow-xs animate-pulse">
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-3">
            System Notice
          </span>

          <div className="my-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-900 font-semibold text-sm sm:text-base">
            "{maintenance.message}"
          </div>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto mb-6">
            The Central Examination Library Is Currently Undergoing Scheduled Paper Reviews And
            System Updates. Public Access To Question Papers Is Temporarily Paused.
          </p>

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={checkStatus}
              disabled={checking}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#05488B] hover:bg-[#04376c] text-[#ffc107] text-xs sm:text-sm font-bold shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
              <span>{checking ? "Checking..." : "Check Status Now"}</span>
            </button>

          </div>

          <p className="mt-6 text-[11px] text-gray-400">
            This Page Will Automatically Refresh As Soon As Maintenance Done.
          </p>
        </div>
      </main>

      { }
      <footer className="w-full py-4 text-center text-xs text-gray-500">
        Poornima University, IS-2027-2031, Ramchandrapura, P.O. Vidhani Vatika, Sitapura Extension, Jaipur, Rajasthan 303905
      </footer>
    </div>
  );
}

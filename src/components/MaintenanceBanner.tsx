"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Clock, RefreshCw, ShieldCheck } from "lucide-react";

export default function MaintenanceBanner() {
  const [maintenance, setMaintenance] = useState<{ active: boolean; message: string }>({
    active: false,
    message: "Papers under semester review",
  });
  const [checking, setChecking] = useState(false);

  const checkStatus = () => {
    setChecking(true);
    fetch("/api/settings/public", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const isEnabled = Boolean(d?.maintenanceMode);
        setMaintenance({
          active: isEnabled,
          message: d?.message || "Papers under semester review",
        });
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  };

  useEffect(() => {
    checkStatus();
    // Poll every 6 seconds to automatically dismiss when Super Admin turns maintenance off
    const interval = setInterval(checkStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  if (!maintenance.active) return null;

  return (
    <div className="fixed inset-0 z-[99999] min-h-screen w-full bg-[#f3f8fc] flex flex-col justify-between overflow-y-auto animate-fade-in">
      {/* Top University Branding Header */}
      <header className="w-full bg-[#05488B] py-3.5 px-6 sm:px-12 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Poornima University Logo"
            width={44}
            height={44}
            className="rounded bg-white p-0.5 shadow-xs"
          />
          <div>
            <h1 className="text-white font-bold text-sm sm:text-base tracking-wide leading-tight uppercase font-serif">
              Poornima University
            </h1>
            <p className="text-[#ffc107] text-[11px] sm:text-xs tracking-wider">
              Central Examination & Academic Paper Archive
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/20"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#ffc107]" />
          <span>Admin Login</span>
        </Link>
      </header>

      {/* Main Full-Screen Maintenance Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10 text-center relative overflow-hidden">
          {/* Decorative accent top bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-[#ffc107] to-amber-600" />

          {/* Icon Badge */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-6 shadow-xs animate-pulse">
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-3">
            System Notice
          </span>

          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
            Portal Under Maintenance
          </h2>

          <div className="my-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-900 font-semibold text-sm sm:text-base">
            "{maintenance.message}"
          </div>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto mb-6">
            The Central Examination Library is currently undergoing scheduled semester paper reviews and system updates.
            Public access to question papers is temporarily paused.
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

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold transition-colors"
            >
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Staff / Library Login</span>
            </Link>
          </div>

          <p className="mt-6 text-[11px] text-gray-400">
            This page will automatically refresh as soon as maintenance mode is concluded.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-gray-500">
        Poornima University, IS-2027-2031, Ramchandrapura, P.O. Vidhani Vatika, Sitapura Extension, Jaipur, Rajasthan 303905
      </footer>
    </div>
  );
}

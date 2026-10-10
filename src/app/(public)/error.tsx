"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Public Portal Error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-8 max-w-md w-full shadow-sm">
        <div className="flex justify-center mb-3">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1.5">Unable to load examination resources</h2>
        <p className="text-xs text-gray-600 mb-5 leading-relaxed">
          An unexpected error occurred while retrieving question papers. Please try refreshing the portal.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-[#05488B] hover:bg-[#043a70] text-[#ffc107] px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md w-full p-6 bg-white rounded-2xl shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Something Went Wrong</h1>
        <p className="mt-2 text-sm text-gray-600">
          We Encountered An Unexpected Error While Loading This Page.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-gray-400">Reference: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-5 min-h-11 px-6 py-2.5 rounded-lg bg-[#05488b] text-white font-medium hover:bg-[#043a70] transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}

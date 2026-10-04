"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-6 bg-gray-50 text-gray-900 font-sans">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
          <h1 className="text-2xl font-bold text-red-600">Fatal Application Error</h1>
          <p className="mt-3 text-sm text-gray-600">
            A critical error occurred. Please refresh or click below to retry.
          </p>
          {error.digest && (
            <p className="mt-1 text-xs text-gray-400 font-mono">ID: {error.digest}</p>
          )}
          <button
            onClick={() => reset()}
            className="mt-6 min-h-11 px-6 py-2.5 rounded-lg bg-[#05488b] text-white font-medium hover:bg-[#043a70] transition-colors cursor-pointer"
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}

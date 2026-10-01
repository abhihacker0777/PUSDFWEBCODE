import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-slate-800/80 border border-slate-700/60 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-400">
          <FileQuestion className="w-8 h-8" />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-200 mb-3">Page or Paper Not Found</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The requested page or question paper does not exist or may have been moved or removed from the archive.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition shadow-lg shadow-red-600/25 active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="relative z-10 mt-8 text-xs text-slate-500">
        Poornima University Examination Archive Portal &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}

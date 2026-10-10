"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { BACKEND_URL, csrfFetch, getCsrfToken } from "@/services/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      getCsrfToken().catch(() => {});
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("");
    setError("");

    if (!token) {
      setError("Reset link is missing or invalid.");
      return;
    }

    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = BACKEND_URL ? `${BACKEND_URL}/password-reset/confirm` : "/api/auth/reset/confirm";
      const response = await csrfFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        setError(data.message || "Reset link is invalid or expired.");
        return;
      }

      setStatus(data.message || "Password updated successfully. Redirecting to login...");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setError("Password reset is temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Brand Left Sidebar */}
      <div className="w-full md:w-80 flex flex-col justify-between py-10 px-6 md:px-10 bg-[#264796]">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold leading-snug text-center md:text-left">
            <span className="text-white">Reset<br />Admin<br /></span>
            <span className="text-[#ffc107]">Password</span>
          </h1>
          <p className="mt-3 text-xs md:text-sm text-blue-100/90 text-center md:text-left">
            Poornima University Examination Archive
          </p>
        </div>

        <div className="flex flex-col items-center my-6 md:my-0">
          <Image
            src="/pulogo.png"
            alt="Poornima University Logo"
            width={208}
            height={120}
            className="w-52 h-auto object-contain"
            priority
          />
        </div>

        <div className="text-xs text-blue-200/80 text-center md:text-left">
          Central Library Security Verification
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-gray-50/50 md:rounded-l-[1.75rem] shadow-[-4px_0_24px_rgba(0,0,0,0.04)]">
        {!token ? (
          /* Missing / Invalid Token Security Guard */
          <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center space-y-5">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Security Verification Required</h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Direct access to this page is restricted. Password resets require a verified, single-use cryptographic security link sent to your registered institutional email.
              </p>
            </div>
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs text-amber-800 text-left">
              <strong>Need to reset your password?</strong> Go to the admin login page and click <em>Forgot Password</em> to receive a secure reset link.
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[#05488b] text-white hover:bg-[#043a70] transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Admin Login
              </Link>
            </div>
          </div>
        ) : (
          /* Valid Token: Password Reset Form */
          <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-[#05488b] rounded-full flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create New Password</h2>
              <p className="text-xs text-gray-500">
                Choose a strong password with at least 10 characters.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 text-center">
                {error}
              </div>
            )}

            {status && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs font-medium text-green-700 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                {status}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 10 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-800 text-sm focus:border-[#05488b] focus:ring-2 focus:ring-[#05488b]/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-800 text-sm focus:border-[#05488b] focus:ring-2 focus:ring-[#05488b]/20 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 hover:opacity-95 shadow-md bg-[#05488b] text-white disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#05488b] hover:underline">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-500 font-medium">Verifying reset token...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

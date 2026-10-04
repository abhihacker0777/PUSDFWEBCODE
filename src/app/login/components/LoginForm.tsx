"use client";

import React, { RefObject } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  formatRetryTime,
  loginButtonText,
  TURNSTILE_SITE_KEY
} from "./loginConstants";

interface LoginFormProps {
  captchaRequired: boolean;
  captchaToken: string;
  error: string;
  focusedField: string | null;
  handleLogin: () => void;
  handlePasswordReset: () => void;
  isLoading: boolean;
  isResetSending: boolean;
  loginLocked: boolean;
  password: string;
  resetStatus: string;
  retrySeconds: number;
  setFocusedField: (field: string | null) => void;
  setShowPassword: (show: boolean) => void;
  showPassword: boolean;
  turnstileRef: RefObject<HTMLDivElement | null>;
  updatePassword: (val: string) => void;
  updateUsername: (val: string) => void;
  username: string;
}

export default function LoginForm({
  captchaRequired,
  captchaToken,
  error,
  focusedField,
  handleLogin,
  handlePasswordReset,
  isLoading,
  isResetSending,
  loginLocked,
  password,
  resetStatus,
  retrySeconds,
  setFocusedField,
  setShowPassword,
  showPassword,
  turnstileRef,
  updatePassword,
  updateUsername,
  username
}: Readonly<LoginFormProps>) {
  const loginDisabled = Boolean(isLoading || loginLocked || (captchaRequired && TURNSTILE_SITE_KEY && !captchaToken));

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-0" style={{ borderTopLeftRadius: "1.75rem", borderBottomLeftRadius: "1.75rem", backgroundColor: "#ffffff", boxShadow: "-4px 0 24px rgba(0,0,0,0.04)" }}>
      <div className="w-full max-w-sm px-4 md:px-6 space-y-8">
        <h2 className="text-center text-4xl font-bold text-gray-900">{"🔐 Login"}</h2>

        {(error || resetStatus || loginLocked) && (
          <p
            role="alert"
            className={`${resetStatus && !error && !loginLocked ? "text-green-700" : "text-red-700"} text-sm text-center font-medium`}
          >
            {loginLocked ? `Too many login attempts. Try again in ${formatRetryTime(retrySeconds)}.` : error || resetStatus}
          </p>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-7">
          <div>
            <label htmlFor="login-username" className="sr-only">Username or email</label>
            <input
              id="login-username"
              type="text"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => updateUsername(e.target.value)}
              onFocus={() => setFocusedField("user")}
              onBlur={() => setFocusedField(null)}
              placeholder="Username or email"
              className={`w-full border-0 border-b pb-2 text-gray-700 placeholder-gray-500 text-base sm:text-sm bg-transparent outline-none focus:outline-none focus:ring-0 focus-visible:outline-none transition-colors duration-300 ${focusedField === "user" ? "border-[#ffc107]" : "border-[#05488b]"}`}
            />
          </div>

          <div className="relative">
            <label htmlFor="login-password" className="sr-only">Password</label>
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => updatePassword(e.target.value)}
              onFocus={() => setFocusedField("pass")}
              onBlur={() => setFocusedField(null)}
              placeholder="Password"
              className={`w-full border-0 border-b pb-2 text-gray-700 placeholder-gray-500 text-base sm:text-sm bg-transparent outline-none focus:outline-none focus:ring-0 focus-visible:outline-none transition-colors duration-300 ${focusedField === "pass" ? "border-[#ffc107]" : "border-[#05488b]"}`}
            />
            {password && (
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-600 hover:text-black focus:outline-none cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>

          {captchaRequired && (
            <div className="min-h-[65px]">
              {TURNSTILE_SITE_KEY ? (
                <div ref={turnstileRef} className="flex justify-center" />
              ) : (
                <p className="text-xs text-center text-red-700 font-medium">
                  CAPTCHA is required but not configured.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loginDisabled}
            className="w-full py-3.5 rounded-lg font-bold text-base tracking-wide transition-all duration-300 hover:opacity-90 shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#05488b]"
            style={{
              backgroundColor: focusedField ? "#ffc107" : "#05488b",
              color: focusedField ? "#05488b" : "#ffffff",
              opacity: loginDisabled ? 0.7 : 1,
              cursor: loginDisabled ? "not-allowed" : "pointer"
            }}
          >
            {loginButtonText({ isLoading, loginLocked, retrySeconds })}
          </button>

          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={isResetSending}
            className="w-full text-center text-sm font-semibold text-[#05488b] hover:underline disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isResetSending ? "Sending reset link..." : "Forgot password?"}
          </button>
        </form>
      </div>
    </div>
  );
}

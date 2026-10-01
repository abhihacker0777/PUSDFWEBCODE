"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GENERIC_LOGIN_ERROR,
  TURNSTILE_SITE_KEY
} from "./loginConstants";
import { requestLogin, requestPasswordReset } from "./loginRequests";
import useLoginSessionCheck from "./useLoginSessionCheck";
import useTurnstileCaptcha from "./useTurnstileCaptcha";

function isValidEmail(val: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
}

function handleLoginErrorStatus(
  response: Response,
  data: any,
  handlers: {
    setRetrySeconds: (sec: number) => void;
    setCaptchaRequired: (req: boolean) => void;
    setError: (msg: string) => void;
    setUserInitiatedLogin: (init: boolean) => void;
    resetCaptcha: () => void;
  }
): boolean {
  if (response.status === 429) {
    const raw = data?.retryAfterSeconds ?? response.headers.get("Retry-After");
    const parsed = Number(raw);
    const seconds = Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 15 * 60;
    handlers.setRetrySeconds(seconds);
    handlers.setError("");
    handlers.setUserInitiatedLogin(false);
    handlers.resetCaptcha();
    return true;
  }

  if (response.status === 403 && data?.code === "CAPTCHA_REQUIRED") {
    handlers.setCaptchaRequired(true);
    handlers.setError("Complete CAPTCHA to continue.");
    handlers.resetCaptcha();
    return true;
  }

  if (response.status === 403 && data?.code === "CSRF_REQUIRED") {
    handlers.setError("Your session security token couldn't be verified. Refresh the page and try again.");
    handlers.setUserInitiatedLogin(false);
    handlers.resetCaptcha();
    return true;
  }

  return false;
}

export default function useLoginController() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [resetStatus, setResetStatus] = useState("");
  const [isResetSending, setIsResetSending] = useState(false);
  const [hasFailedAttempt, setHasFailedAttempt] = useState(false);
  const [userInitiatedLogin, setUserInitiatedLogin] = useState(false);
  const router = useRouter();
  const loginLocked = retrySeconds > 0;
  const {
    captchaRequired,
    captchaToken,
    resetCaptcha,
    setCaptchaRequired,
    turnstileRef
  } = useTurnstileCaptcha();

  useLoginSessionCheck(() => router.push("/admin"));

  // Auto-login only if admin clicked Login and waiting on captcha, and never on wrong credentials
  useEffect(() => {
    const trimmedUser = username.trim();
    const hasValidEmail = trimmedUser.includes("@")
      ? isValidEmail(trimmedUser)
      : trimmedUser.length >= 3;

    if (captchaToken && hasValidEmail && password.trim() && !isLoading && !loginLocked && userInitiatedLogin && !hasFailedAttempt) {
      void handleLogin(captchaToken, true);
    }
  }, [captchaToken, userInitiatedLogin, hasFailedAttempt]);

  useEffect(() => {
    if (!loginLocked) return undefined;

    const timer = setInterval(() => {
      setRetrySeconds((seconds) => {
        const next = Math.max(0, seconds - 1);
        if (next === 0) {
          setError("");
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loginLocked]);

  const handleLogin = async (overrideToken?: string, isAutoTrigger = false) => {
    if (!isAutoTrigger) {
      setUserInitiatedLogin(true);
    }

    if (loginLocked) {
      return;
    }

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError("To login, enter username or email and password");
      return;
    }

    if (trimmedUser.includes("@") && !isValidEmail(trimmedUser)) {
      setError("Please enter a valid email address (e.g. name@domain.com)");
      return;
    }

    const token = overrideToken ?? captchaToken;
    if (captchaRequired && TURNSTILE_SITE_KEY && !token) {
      setError("Complete CAPTCHA to continue.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, response } = await requestLogin({ username, password, captchaToken: token });
      if (data?.captchaRequired) setCaptchaRequired(true);

      if (handleLoginErrorStatus(response, data, {
        setRetrySeconds,
        setCaptchaRequired,
        setError,
        setUserInitiatedLogin,
        resetCaptcha
      })) {
        return;
      }

      if (data?.success) {
        setRetrySeconds(0);
        setCaptchaRequired(false);
        setHasFailedAttempt(false);
        setUserInitiatedLogin(false);
        resetCaptcha();
        router.push("/admin");
      } else {
        setHasFailedAttempt(true);
        setUserInitiatedLogin(false);
        setError(data?.message || GENERIC_LOGIN_ERROR);
        resetCaptcha();
      }
    } catch (err) {
      console.error(err);
      setHasFailedAttempt(true);
      setUserInitiatedLogin(false);
      setError("Maintenance Mode. Try Again Later");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = username.trim();
    setError("");
    setResetStatus("");

    if (!email || !isValidEmail(email)) {
      setError("Enter your admin email first, then request the reset link.");
      return;
    }

    setIsResetSending(true);
    try {
      const data = await requestPasswordReset(email);
      setResetStatus(data.message || "If that email is registered, you'll receive a password reset link.");
    } catch (err) {
      console.error(err);
      setError("Password reset is temporarily unavailable.");
    } finally {
      setIsResetSending(false);
    }
  };

  const updateUsername = (value: string) => {
    setUsername(value);
    setHasFailedAttempt(false);
    setUserInitiatedLogin(false);
    if (!loginLocked) setError("");
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    setHasFailedAttempt(false);
    setUserInitiatedLogin(false);
    if (!loginLocked) setError("");
  };

  return {
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
  };
}

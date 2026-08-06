import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  formatRetryTime,
  GENERIC_LOGIN_ERROR,
  TURNSTILE_SITE_KEY
} from "./loginConstants";
import { requestLogin, requestPasswordReset } from "./loginRequests";
import useLoginSessionCheck from "./useLoginSessionCheck";
import useTurnstileCaptcha from "./useTurnstileCaptcha";

export default function useLoginController() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [resetStatus, setResetStatus] = useState("");
  const [isResetSending, setIsResetSending] = useState(false);
  const navigate = useNavigate();
  const loginLocked = retrySeconds > 0;
  const {
    captchaRequired,
    captchaToken,
    resetCaptcha,
    setCaptchaRequired,
    turnstileRef
  } = useTurnstileCaptcha();

  useLoginSessionCheck(navigate);

  useEffect(() => {
    if (!loginLocked) return undefined;

    const timer = setInterval(() => {
      setRetrySeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [loginLocked]);

  const handleLogin = async () => {
    if (loginLocked) {
      setError(`Too many login attempts. Try again in ${formatRetryTime(retrySeconds)}.`);
      return;
    }

    if (!username || !password) {
      setError("To login, enter username or email and password");
      return;
    }

    if (captchaRequired && TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Complete CAPTCHA to continue.");
      return;
    }

    if (captchaRequired && !TURNSTILE_SITE_KEY) {
      setError("CAPTCHA is required but VITE_TURNSTILE_SITE_KEY is not configured.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, response } = await requestLogin({ username, password, captchaToken });
      if (data.captchaRequired) setCaptchaRequired(true);

      if (response.status === 429) {
        const retryAfter = Number(data.retryAfterSeconds || response.headers.get("Retry-After"));
        const seconds = Number.isFinite(retryAfter) ? Math.max(1, Math.ceil(retryAfter)) : 15 * 60;
        setRetrySeconds(seconds);
        setError(`Too many login attempts. Try again in ${formatRetryTime(seconds)}.`);
        resetCaptcha();
        return;
      }

      if (response.status === 403 && data.code === "CAPTCHA_REQUIRED") {
        setCaptchaRequired(true);
        setError("Complete CAPTCHA to continue.");
        resetCaptcha();
        return;
      }

      if (response.status === 403 && data.code === "ADMIN_IP_RESTRICTED") {
        setError("Main admin access is restricted to specific networks, and this connection isn't one of them. Try again from an approved network, or contact whoever manages the allow-list.");
        resetCaptcha();
        return;
      }

      if (data.success) {
        setRetrySeconds(0);
        setCaptchaRequired(false);
        resetCaptcha();
        navigate("/admin");
      } else {
        setError(GENERIC_LOGIN_ERROR);
        resetCaptcha();
      }
    } catch (err) {
      console.error(err);
      setError("Maintenance Mode. Try Again Later");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = username.trim();
    setError("");
    setResetStatus("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

  const updateUsername = (value) => {
    setUsername(value);
    if (!loginLocked) setError("");
  };

  const updatePassword = (value) => {
    setPassword(value);
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

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/pulogo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { BACKEND_URL, csrfFetch, getCsrfToken } from "../services/api";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
const GENERIC_LOGIN_ERROR = "Incorrect email or password.";

const formatRetryTime = (totalSeconds) => {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const [isResetSending, setIsResetSending] = useState(false);
  const turnstileRef = useRef(null);
  const turnstileWidgetRef = useRef(null);
  const loginLocked = retrySeconds > 0;

  const resetCaptcha = () => {
    setCaptchaToken("");
    if (window.turnstile && turnstileWidgetRef.current !== null) {
      window.turnstile.reset(turnstileWidgetRef.current);
    }
  };
  
  useEffect(() => {
    // 🛡️ SECURITY: Verify existing session via the backend /me endpoint
    // This replaces the old sessionStorage check
    getCsrfToken().catch(() => {});
    fetch(`${BACKEND_URL}/me`, { 
      method: "GET",
      credentials: "include" 
    })
    .then(res => {
      if (res.ok) navigate("/admin");
    })
    .catch(() => { /* Not logged in, stay on page */ });
  }, [navigate]);

  useEffect(() => {
    if (!loginLocked) return undefined;

    const timer = setInterval(() => {
      setRetrySeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [loginLocked]);

  useEffect(() => {
    if (!captchaRequired || !TURNSTILE_SITE_KEY) return undefined;

    let disposed = false;
    const renderCaptcha = () => {
      if (disposed || !turnstileRef.current || !window.turnstile || turnstileWidgetRef.current !== null) return;
      turnstileWidgetRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => setCaptchaToken("")
      });
    };

    if (window.turnstile) {
      renderCaptcha();
      return () => { disposed = true; };
    }

    let script = document.getElementById("turnstile-script");
    if (!script) {
      script = document.createElement("script");
      script.id = "turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    script.addEventListener("load", renderCaptcha);
    return () => {
      disposed = true;
      script.removeEventListener("load", renderCaptcha);
    };
  }, [captchaRequired]);

  useEffect(() => {
    if (captchaRequired) return undefined;
    setCaptchaToken("");
    if (window.turnstile && turnstileWidgetRef.current !== null) {
      window.turnstile.remove(turnstileWidgetRef.current);
      turnstileWidgetRef.current = null;
    }
    return undefined;
  }, [captchaRequired]);

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
      const res = await csrfFetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 🛡️ SECURITY: This is the magic line. It tells the browser to 
        // handle the httpOnly cookie automatically for this request.
        credentials: "include", 
        body: JSON.stringify({ email: username, password, captchaToken })
      });

      const data = await res.json().catch(() => ({}));
      if (data.captchaRequired) setCaptchaRequired(true);

      if (res.status === 429) {
        const retryAfter = Number(data.retryAfterSeconds || res.headers.get("Retry-After"));
        const seconds = Number.isFinite(retryAfter) ? Math.max(1, Math.ceil(retryAfter)) : 15 * 60;
        setRetrySeconds(seconds);
        setError(`Too many login attempts. Try again in ${formatRetryTime(seconds)}.`);
        resetCaptcha();
        return;
      }

      if (res.status === 403 && data.code === "CAPTCHA_REQUIRED") {
        setCaptchaRequired(true);
        setError("Complete CAPTCHA to continue.");
        resetCaptcha();
        return;
      }

      if (data.success) {
        setRetrySeconds(0);
        setCaptchaRequired(false);
        resetCaptcha();
        // No sessionStorage logic needed. The backend sets the cookie.
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
      const response = await csrfFetch(`${BACKEND_URL}/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => ({}));
      setResetStatus(data.message || "If that email is registered, you'll receive a password reset link.");
    } catch (err) {
      console.error(err);
      setError("Password reset is temporarily unavailable.");
    } finally {
      setIsResetSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="w-full md:w-72 flex flex-col justify-between py-10 px-6 md:px-10" style={{ backgroundColor: "#264796" }}>
        <h1 className="text-2xl md:text-4xl font-extrabold leading-snug text-center md:text-left">
          <span className="text-white">Create, Update,<br />Manage<br /></span>
          <span style={{ color: "#e31d23" }}>&amp; Upload Your<br /></span>
          <span className="text-white">PYQP</span>
        </h1>
        <div className="flex flex-col items-center mt-6 md:mt-0">
          <img src={logo} alt="Poornima University Logo" className="w-52 h-auto object-contain" />
        </div>
        <div />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 md:px-0" style={{ borderTopLeftRadius: "1.75rem", borderBottomLeftRadius: "1.75rem", backgroundColor: "#ffffff", boxShadow: "-4px 0 24px rgba(0,0,0,0.04)" }}>
        <div className="w-full max-w-sm px-4 md:px-6 space-y-8">
          <h2 className="text-center text-4xl font-bold text-gray-900">🔐 Login</h2>
          
          {(error || resetStatus || loginLocked) && (
            <p className={`${resetStatus && !error && !loginLocked ? "text-green-600" : "text-red-500"} text-sm text-center font-medium`}>
              {loginLocked ? `Too many login attempts. Try again in ${formatRetryTime(retrySeconds)}.` : error || resetStatus}
            </p>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-7">
            <input
              type="text" value={username}
              onChange={(e) => { setUsername(e.target.value); if (!loginLocked) setError(""); }}
              onFocus={() => setFocusedField("user")}
              onBlur={() => setFocusedField(null)}
              placeholder="Username or email"
              className={`w-full border-0 border-b pb-2 text-gray-600 placeholder-gray-400 text-sm bg-transparent outline-none transition-colors duration-300 ${focusedField === "user" ? "border-[#ffc107]" : "border-[#05488b]"}`}
            />

            <div className="relative">       
              <input
                type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => { setPassword(e.target.value); if (!loginLocked) setError(""); }}
                onFocus={() => setFocusedField("pass")}
                onBlur={() => setFocusedField(null)}
                placeholder="Password"
                className={`w-full border-0 border-b pb-2 text-gray-600 placeholder-gray-400 text-sm bg-transparent outline-none transition-colors duration-300 ${focusedField === "pass" ? "border-[#ffc107]" : "border-[#05488b]"}`}
              />
              {password && (
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-gray-500 hover:text-black focus:outline-none">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              )}
            </div>

            {captchaRequired && (
              <div className="min-h-[65px]">
                {TURNSTILE_SITE_KEY ? (
                  <div ref={turnstileRef} className="flex justify-center" />
                ) : (
                  <p className="text-xs text-center text-red-500 font-medium">
                    CAPTCHA is required but not configured.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit" disabled={isLoading || loginLocked || (captchaRequired && TURNSTILE_SITE_KEY && !captchaToken)}
              className="w-full py-3.5 rounded-lg font-bold text-base tracking-wide transition-all duration-300 hover:opacity-90 shadow-md"
              style={{ backgroundColor: focusedField ? "#ffc107" : "#05488b", color: "#ffffff", opacity: isLoading || loginLocked || (captchaRequired && TURNSTILE_SITE_KEY && !captchaToken) ? 0.7 : 1, cursor: isLoading || loginLocked || (captchaRequired && TURNSTILE_SITE_KEY && !captchaToken) ? "not-allowed" : "pointer" }}
            >
              {loginLocked ? `⏳ Try Again In ${formatRetryTime(retrySeconds)}` : isLoading ? "🔄 Authenticating..." : "🔐 Login"}
            </button>

            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isResetSending}
              className="w-full text-center text-sm font-semibold text-[#05488b] hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isResetSending ? "Sending reset link..." : "Forgot password?"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

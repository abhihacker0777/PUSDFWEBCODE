import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  formatRetryTime,
  loginButtonText,
  TURNSTILE_SITE_KEY
} from "./loginConstants";

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
}) {
  const loginDisabled = isLoading || loginLocked || (captchaRequired && TURNSTILE_SITE_KEY && !captchaToken);

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-0" style={{ borderTopLeftRadius: "1.75rem", borderBottomLeftRadius: "1.75rem", backgroundColor: "#ffffff", boxShadow: "-4px 0 24px rgba(0,0,0,0.04)" }}>
      <div className="w-full max-w-sm px-4 md:px-6 space-y-8">
        <h2 className="text-center text-4xl font-bold text-gray-900">{"\ud83d\udd10 Login"}</h2>

        {(error || resetStatus || loginLocked) && (
          <p className={`${resetStatus && !error && !loginLocked ? "text-green-600" : "text-red-500"} text-sm text-center font-medium`}>
            {loginLocked ? `Too many login attempts. Try again in ${formatRetryTime(retrySeconds)}.` : error || resetStatus}
          </p>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-7">
          <input
            type="text"
            value={username}
            onChange={(e) => updateUsername(e.target.value)}
            onFocus={() => setFocusedField("user")}
            onBlur={() => setFocusedField(null)}
            placeholder="Username or email"
            className={`w-full border-0 border-b pb-2 text-gray-600 placeholder-gray-400 text-sm bg-transparent outline-none transition-colors duration-300 ${focusedField === "user" ? "border-[#ffc107]" : "border-[#05488b]"}`}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => updatePassword(e.target.value)}
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
            type="submit"
            disabled={loginDisabled}
            className="w-full py-3.5 rounded-lg font-bold text-base tracking-wide transition-all duration-300 hover:opacity-90 shadow-md"
            style={{ backgroundColor: focusedField ? "#ffc107" : "#05488b", color: "#ffffff", opacity: loginDisabled ? 0.7 : 1, cursor: loginDisabled ? "not-allowed" : "pointer" }}
          >
            {loginButtonText({ isLoading, loginLocked, retrySeconds })}
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
  );
}

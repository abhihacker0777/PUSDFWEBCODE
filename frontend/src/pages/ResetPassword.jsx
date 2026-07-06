import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../assets/pulogo.png";
import { csrfFetch, getCsrfToken } from "../services/api";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getCsrfToken().catch(() => {});
  }, []);

  const handleSubmit = async (event) => {
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
      const response = await csrfFetch(`${BACKEND_URL}/password-reset/confirm`, {
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

      setStatus(data.message || "Password updated. You can now log in.");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/login"), 1800);
    } catch {
      setError("Password reset is temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="w-full md:w-72 flex flex-col justify-between py-10 px-6 md:px-10 bg-[#264796]">
        <h1 className="text-2xl md:text-4xl font-extrabold leading-snug text-center md:text-left">
          <span className="text-white">Reset<br />Admin<br /></span>
          <span className="text-[#e31d23]">Password</span>
        </h1>
        <div className="flex flex-col items-center mt-6 md:mt-0">
          <img src={logo} alt="Poornima University Logo" className="w-52 h-auto object-contain" />
        </div>
        <div />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 md:px-0 bg-white md:rounded-l-[1.75rem] shadow-[-4px_0_24px_rgba(0,0,0,0.04)]">
        <form onSubmit={handleSubmit} className="w-full max-w-sm px-4 md:px-6 space-y-7">
          <h2 className="text-center text-3xl font-bold text-gray-900">Reset Password</h2>

          {(error || status) && (
            <p className={`text-sm text-center font-medium ${error ? "text-red-500" : "text-green-600"}`}>
              {error || status}
            </p>
          )}

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            className="w-full border-0 border-b border-[#05488b] pb-2 text-gray-600 placeholder-gray-400 text-sm bg-transparent outline-none focus:border-[#ffc107]"
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            className="w-full border-0 border-b border-[#05488b] pb-2 text-gray-600 placeholder-gray-400 text-sm bg-transparent outline-none focus:border-[#ffc107]"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-lg font-bold text-base tracking-wide transition-all duration-300 hover:opacity-90 shadow-md bg-[#05488b] text-white disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>

          <Link to="/login" className="block text-center text-sm font-semibold text-[#05488b] hover:underline">
            Back to login
          </Link>
        </form>
      </div>
    </div>
  );
}

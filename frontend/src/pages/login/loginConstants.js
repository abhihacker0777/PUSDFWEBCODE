export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
export const GENERIC_LOGIN_ERROR = "Incorrect email or password.";

export const formatRetryTime = (totalSeconds) => {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
};

export const loginButtonText = ({ isLoading, loginLocked, retrySeconds }) => {
  if (loginLocked) return `\u23f3 Try Again In ${formatRetryTime(retrySeconds)}`;
  if (isLoading) return "\ud83d\udd04 Authenticating...";
  return "\ud83d\udd10 Login";
};

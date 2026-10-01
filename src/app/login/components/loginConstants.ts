export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
export const GENERIC_LOGIN_ERROR = "Incorrect email or password.";

export const formatRetryTime = (totalSeconds: number | string) => {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
};

export const loginButtonText = ({
  isLoading,
  loginLocked,
  retrySeconds
}: {
  isLoading: boolean;
  loginLocked: boolean;
  retrySeconds: number;
}) => {
  if (loginLocked) return `⏳ Try Again In ${formatRetryTime(retrySeconds)}`;
  if (isLoading) return "🔄 Authenticating...";
  return "🔑 Login";
};

import { useCallback, useEffect, useState } from "react";
import { getCurrentAdmin, logoutAdmin } from "./adminApi";
import { goToLogin, isAdminSessionExpired, readApiResponse } from "./adminHelpers";

export default function useAdminSession() {
  const [authUser, setAuthUser] = useState(null);

  const refreshSession = useCallback(async (isMounted = () => true) => {
    try {
      const response = await getCurrentAdmin();
      if (isAdminSessionExpired(response)) return goToLogin();
      const payload = await readApiResponse(response);
      if (response.ok && payload.user && isMounted()) setAuthUser(payload.user);
    } catch (error) {
      console.error("Admin session check failed:", error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const sessionTimer = window.setTimeout(() => refreshSession(() => mounted), 0);
    return () => {
      mounted = false;
      window.clearTimeout(sessionTimer);
    };
  }, [refreshSession]);

  const handleLogout = useCallback(async () => {
    await logoutAdmin();
    window.location.href = "/login";
  }, []);

  return { authUser, refreshSession, handleLogout };
}

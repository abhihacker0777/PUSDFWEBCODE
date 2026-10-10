import { useCallback, useEffect, useState } from "react";
import { getCurrentAdmin, logoutAdmin } from "../utils/adminApi";
import { goToLogin, isAdminSessionExpired, readApiResponse } from "../utils/adminHelpers";

export default function useAdminSession() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [sessionTelemetry, setSessionTelemetry] = useState<{
    ip: string;
    lastActiveIst: string;
    isOnline: boolean;
  }>({
    ip: "Detecting...",
    lastActiveIst: "Connecting...",
    isOnline: true,
  });

  const refreshSession = useCallback(async (isMounted: () => boolean = () => true) => {
    try {
      const response = await getCurrentAdmin();
      if (isAdminSessionExpired(response) || !response.ok) return goToLogin();
      const payload = await readApiResponse(response);
      if (response.ok && payload.user && isMounted()) {
        setAuthUser(payload.user);
      } else {
        return goToLogin();
      }
    } catch (error) {
      console.error("Admin session check failed:", error);
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    try {
      const hbRes = await fetch("/api/admin/heartbeat", {
        method: "POST",
        credentials: "include",
      });
      if (hbRes.status === 401) {
        window.location.href = "/login?revoked=1";
        return;
      }
      const res = await fetch("/api/admin/sessions", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        window.location.href = "/login?revoked=1";
        return;
      }
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.sessions) && json.sessions.length > 0) {
          const latest = json.sessions[0];
          setSessionTelemetry({
            ip: latest.ipAddress || "Active",
            lastActiveIst: latest.lastActiveIst || new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }),
            isOnline: true,
          });
        }
      }
    } catch {
      // silent heartbeat ping
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

  // Client heartbeat loop (checks every 8s & on window focus/visibility change for instant revocation logout)
  useEffect(() => {
    if (!authUser) return undefined;

    // Send immediate heartbeat on login
    void sendHeartbeat();

    const interval = setInterval(() => {
      void sendHeartbeat();
    }, 8_000);

    const onActiveTrigger = () => {
      void sendHeartbeat();
    };

    window.addEventListener("focus", onActiveTrigger);
    window.addEventListener("visibilitychange", onActiveTrigger);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onActiveTrigger);
      window.removeEventListener("visibilitychange", onActiveTrigger);
    };
  }, [authUser, sendHeartbeat]);

  const handleLogout = useCallback(async () => {
    await logoutAdmin();
    window.location.href = "/login";
  }, []);

  return { authUser, refreshSession, handleLogout, sessionTelemetry };
}


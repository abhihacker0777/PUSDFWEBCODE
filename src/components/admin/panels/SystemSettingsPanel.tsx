"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ShieldCheck, Mail, AlertTriangle, RefreshCw, Radio } from "lucide-react";

export default function SystemSettingsPanel() {
  const [settings, setSettings] = useState<{
    library_admin_invite_notify: boolean;
    admin_login_notify: boolean;
    maintenance_mode: boolean;
    maintenance_message: string;
  }>({
    library_admin_invite_notify: false,
    admin_login_notify: false,
    maintenance_mode: false,
    maintenance_message: "Papers under semester review",
  });
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/system-settings", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const res = await fetch("/api/admin/sessions", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sessions)) setSessions(data.sessions);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
    void fetchSessions();
  }, [fetchSettings, fetchSessions]);

  const updateSetting = async (key: string, value: boolean) => {
    try {
      setSavingKey(key);
      setStatusMsg(null);
      const res = await fetch("/api/admin/system-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setStatusMsg("Setting updated successfully!");
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        const data = await res.json();
        setStatusMsg(`Error: ${data.message || "Failed to update"}`);
      }
    } catch {
      setStatusMsg("Error updating setting");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Super Admin System Settings Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#05488B]" />
            <h2 className="text-base font-bold text-[#05488B]">University IT & System Controls</h2>
          </div>
          {statusMsg && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              statusMsg.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
            }`}>
              {statusMsg}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Setting 1: library_admin_invite_notify */}
          <div className="flex items-start justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all">
            <div className="pr-3">
              <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Library Admin Invite Dispatch</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Dispatches an automated onboarding email when a new library user is added. (Default: <strong>OFF</strong>)
              </p>
              <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {settings.library_admin_invite_notify ? "Enabled" : "Disabled (Default)"}
              </span>
            </div>

            <button
              type="button"
              disabled={savingKey === "library_admin_invite_notify"}
              onClick={() => updateSetting("library_admin_invite_notify", !settings.library_admin_invite_notify)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.library_admin_invite_notify ? "bg-[#05488B]" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.library_admin_invite_notify ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Setting 2: admin_login_notify */}
          <div className="flex items-start justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all">
            <div className="pr-3">
              <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Admin Login Alerts</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Dispatches login email alert when normal library admins sign in. (Default: <strong>OFF</strong>)
              </p>
              <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                {settings.admin_login_notify ? "Enabled" : "Disabled (Default)"}
              </span>
            </div>

            <button
              type="button"
              disabled={savingKey === "admin_login_notify"}
              onClick={() => updateSetting("admin_login_notify", !settings.admin_login_notify)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.admin_login_notify ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.admin_login_notify ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Setting 3: maintenance_mode */}
          <div className="flex items-start justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all">
            <div className="pr-3">
              <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Maintenance Mode Banner</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Displays <em>"Papers under semester review"</em> banner on public routes while admin remains accessible.
              </p>
              <span className={`inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                settings.maintenance_mode ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-700"
              }`}>
                {settings.maintenance_mode ? "Banner Active" : "Normal Operation"}
              </span>
            </div>

            <button
              type="button"
              disabled={savingKey === "maintenance_mode"}
              onClick={() => updateSetting("maintenance_mode", !settings.maintenance_mode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.maintenance_mode ? "bg-amber-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.maintenance_mode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Active Session Telemetry Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            <h2 className="text-base font-bold text-gray-800">Admin Active Session Telemetry</h2>
          </div>
          <button
            type="button"
            onClick={fetchSessions}
            disabled={loadingSessions}
            className="flex items-center gap-1 text-xs font-semibold text-[#05488B] hover:underline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? "animate-spin" : ""}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Admin Account</th>
                <th className="px-3 py-2 text-left font-semibold">IP Address</th>
                <th className="px-3 py-2 text-left font-semibold">Last Active (IST)</th>
                <th className="px-3 py-2 text-left font-semibold">Browser / Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">
                    No active sessions logged yet.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2.5">
                      {s.isOnline ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Online Now
                        </span>
                      ) : s.isRevoked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold text-[10px]">
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium text-[10px]">
                          Idle / Prior
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">
                      <div>{s.displayName}</div>
                      <div className="text-[10px] text-gray-400">{s.email}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-600">
                      {(!s.ipAddress || s.ipAddress === "::1" || s.ipAddress === "127.0.0.1") ? (
                        <span className="inline-flex items-center gap-1 text-gray-600 font-sans text-[11px] bg-gray-100 px-2 py-0.5 rounded">
                          127.0.0.1 (Localhost)
                        </span>
                      ) : (
                        s.ipAddress
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {s.lastActiveIst || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 truncate max-w-[220px]" title={s.userAgent}>
                      {s.userAgent}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


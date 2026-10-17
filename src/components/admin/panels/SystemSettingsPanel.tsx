"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ShieldCheck, Mail, AlertTriangle, RefreshCw, Radio } from "lucide-react";

function sessionStatusBadge(session: { isOnline?: boolean; isRevoked?: boolean }) {
  if (session.isOnline) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        <span>Online Now</span>
      </span>
    );
  }
  if (session.isRevoked) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold text-[10px]">
        Revoked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium text-[10px]">
      Idle / Prior
    </span>
  );
}

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
    maintenance_message: "Papers Under Semester Review",
  });
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/system-settings", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed To Load Settings:", err);
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
      console.error("Failed To Load Sessions:", err);
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
        setStatusMsg("Setting Updated Successfully!");
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        const data = await res.json();
        setStatusMsg(`Error: ${data.message || "Failed To Update Setting"}`);
      }
    } catch {
      setStatusMsg("Error Updating Setting");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {}
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
          {/* 1. Library Admin Invite Dispatch */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Library Admin Invite Dispatch</span>
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
              <p className="text-xs text-gray-500 mt-1">
                Dispatches An Automated Onboarding Email When A New Library User Is Added. (Default: <strong>Off</strong>)
              </p>
            </div>
            <div className="mt-3">
              <span className="inline-block text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {settings.library_admin_invite_notify ? "Enabled" : "Disabled (Default)"}
              </span>
            </div>
          </div>

          {/* 2. Admin Login Alerts */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Admin Login Alerts</span>
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
              <p className="text-xs text-gray-500 mt-1">
                Dispatches Login Email Alert When Normal Library Admins Sign In. (Default: <strong>Off</strong>)
              </p>
            </div>
            <div className="mt-3">
              <span className="inline-block text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                {settings.admin_login_notify ? "Enabled" : "Disabled (Default)"}
              </span>
            </div>
          </div>

          {/* 3. Maintenance Mode Banner */}
          <div className="flex flex-col justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Maintenance Mode Banner</span>
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
              <p className="text-xs text-gray-500 mt-1">
                Displays <em>&quot;Papers Under Semester Review&quot;</em> Banner On Public Routes While Admin Remains Accessible.
              </p>
            </div>
            <div className="mt-3">
              <span className={`inline-block text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded ${
                settings.maintenance_mode ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-700"
              }`}>
                {settings.maintenance_mode ? "Banner Active" : "Normal Operation"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Session Telemetry */}
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
            className="flex items-center gap-1 text-xs font-semibold text-[#05488B] hover:underline cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? "animate-spin" : ""}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <th className="px-3 py-2 text-center font-semibold">Status</th>
                <th className="px-3 py-2 text-center font-semibold">Admin Account</th>
                <th className="px-3 py-2 text-center font-semibold">IP Address</th>
                <th className="px-3 py-2 text-center font-semibold">Last Active (IST)</th>
                <th className="px-3 py-2 text-center font-semibold">Browser / Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">
                    No Active Sessions Logged Yet.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex justify-center">{sessionStatusBadge(s)}</div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-gray-800 text-center">
                      <div>{s.displayName}</div>
                      <div className="text-[10px] text-gray-400">{s.email}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-600 text-center">
                      {(!s.ipAddress || s.ipAddress === "::1" || s.ipAddress === "127.0.0.1") ? (
                        <span className="inline-flex items-center gap-1 text-gray-600 font-sans text-[11px] bg-gray-100 px-2 py-0.5 rounded">
                          127.0.0.1 (Localhost)
                        </span>
                      ) : (
                        s.ipAddress
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-center">
                      {s.lastActiveIst || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 truncate max-w-[220px] text-center" title={s.userAgent}>
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


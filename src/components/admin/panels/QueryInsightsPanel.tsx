"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles
} from "lucide-react";

const WINDOW_OPTIONS = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 }
];

const STATUS_COLORS: Record<string, string> = {
  found: "#22c55e",
  not_found: "#f43f5e",
  info: "#05488B",
  need_more: "#f59e0b",
  unavailable: "#9ca3af",
  unknown: "#9ca3af"
};

const STATUS_LABELS: Record<string, string> = {
  found: "Found Papers",
  not_found: "Not Found",
  info: "Help & Info",
  need_more: "Needs Details",
  unavailable: "Unavailable",
  unknown: "Other"
};

export interface QueryInsightsPanelProps {
  insights: any;
  insightsWindowDays: number;
  insightsLoading: boolean;
  insightsError: string;
  changeInsightsWindow: (days: number) => void;
}

export default function QueryInsightsPanel({
  insights,
  insightsWindowDays,
  insightsLoading,
  insightsError,
  changeInsightsWindow
}: Readonly<QueryInsightsPanelProps>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalQueries = insights?.totalQueries || 0;
  const statusCounts = insights?.statusCounts || {};
  const notFoundRate = insights?.notFoundRate || 0;

  // Prepare Pie Chart data from real Supabase status counts
  const pieData = Object.entries(statusCounts)
    .filter(([, count]) => (count as number) > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count as number,
      color: STATUS_COLORS[status] || "#9ca3af"
    }));

  // Prepare Bar Chart data from top requested papers
  const barData = (insights?.topFoundPapers || []).slice(0, 6).map((item: any) => ({
    name: item.paperName?.length > 18 ? item.paperName.slice(0, 16) + "..." : item.paperName,
    fullName: item.paperName,
    requests: item.count
  }));

  let notFoundTone = "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (notFoundRate >= 30) {
    notFoundTone = "text-rose-600 bg-rose-50 border-rose-200";
  } else if (notFoundRate >= 10) {
    notFoundTone = "text-amber-600 bg-amber-50 border-amber-200";
  }

  return (
    <div className="w-full space-y-5 animate-fade-in font-sans">
      {/* Time Window Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#05488B]" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Analytics Window:</span>
          <div className="flex items-center gap-1.5 ml-1">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => changeInsightsWindow(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  insightsWindowDays === opt.value
                    ? "bg-[#05488B] text-[#ffc107] shadow-xs"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {insightsLoading && (
          <div className="flex items-center gap-1.5 text-xs text-[#05488B] font-medium">
            <div className="w-3.5 h-3.5 border-2 border-[#05488B] border-t-transparent rounded-full animate-spin"></div>
            <span>Updating real-time telemetry...</span>
          </div>
        )}
      </div>

      {insightsError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{insightsError}</span>
        </div>
      )}

      {/* KPI Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Student Queries</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-800">{totalQueries}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#05488B] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Successful Matches</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{statusCounts.found || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Unmatched Searches</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600">{statusCounts.not_found || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Unmatched Rate</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-800">{notFoundRate}%</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${notFoundTone}`}>
                {notFoundRate >= 30 ? "High Demand" : "Healthy"}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Real-time Recharts Telemetry Section */}
      {isMounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Query Status Distribution (Donut Chart) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <PieIcon className="w-4 h-4 text-[#05488B]" />
              <h3 className="text-sm font-bold text-gray-800">Resolution Breakdown</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Real telemetry outcomes for questions asked to PU-Exam Cell AI.
            </p>

            {pieData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-gray-400">
                No telemetry recorded in this window.
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} queries`, name]}
                      contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", borderColor: "#e5e7eb", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Found Papers Demand (Bar Chart) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-[#05488B]" />
              <h3 className="text-sm font-bold text-gray-800">Top Requested Papers</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Most frequently retrieved question papers in student requests.
            </p>

            {barData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-gray-400">
                No paper requests in this window.
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" interval={0} tick={{ fontSize: 10, fill: "#64748b" }} angle={-15} textAnchor="end" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} hits`, "Requests"]}
                      labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName || _label}
                      contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", borderColor: "#e5e7eb", fontSize: "12px" }}
                    />
                    <Bar dataKey="requests" fill="#05488B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ranked Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Missing Papers (What to Upload Next) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-gray-800">High-Priority Missing Papers</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Real student searches that returned 0 results. Upload these to resolve student queries.
          </p>

          {(insights?.topNotFoundQuestions || []).length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No missing queries recorded in this window.
            </div>
          ) : (
            <ol className="divide-y divide-gray-100">
              {(insights?.topNotFoundQuestions || []).map((item: any, i: number) => (
                <li key={`notfound-${item.question || i}`} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs text-gray-700 font-medium truncate" title={item.question}>
                      "{item.question}"
                    </span>
                  </div>
                  <span className="shrink-0 bg-rose-50 text-rose-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {item.count} {item.count === 1 ? "ask" : "asks"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Most Downloaded / Requested Papers */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-[#05488B]" />
            <h3 className="text-sm font-bold text-gray-800">Most Downloaded & Accessed Papers</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Papers students retrieve most frequently from the library archive.
          </p>

          {(insights?.topFoundPapers || []).length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No paper requests recorded in this window.
            </div>
          ) : (
            <ol className="divide-y divide-gray-100">
              {(insights?.topFoundPapers || []).map((item: any, i: number) => (
                <li key={`found-${item.paperName || i}`} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#05488B] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs text-gray-700 font-medium truncate" title={item.paperName}>
                      {item.paperName}
                    </span>
                  </div>
                  <span className="shrink-0 bg-blue-50 text-[#05488B] text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {item.count} {item.count === 1 ? "hit" : "hits"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}


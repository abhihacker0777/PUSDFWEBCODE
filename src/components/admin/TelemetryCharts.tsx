"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Paper } from "@/types/paper";

interface TelemetryChartsProps {
  papers: Paper[];
}

const COLORS = ["#05488B", "#ffc107", "#E31E24", "#22c55e", "#8b5cf6", "#06b6d4"];

export default function TelemetryCharts({ papers }: TelemetryChartsProps) {
  // Papers breakdown by Course
  const courseData = useMemo(() => {
    const counts: Record<string, number> = {};
    papers.forEach((p) => {
      const c = p.course || "Other";
      counts[c] = (counts[c] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [papers]);

  // Papers breakdown by Exam type (MTE vs ETE vs other)
  const examData = useMemo(() => {
    const counts: Record<string, number> = {};
    papers.forEach((p) => {
      const e = p.exam || "Unknown";
      counts[e] = (counts[e] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [papers]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
      
      {/* Chart 1: Papers Count by Program */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#05488B] uppercase tracking-wider">
            Repository Density by Course
          </h3>
          <p className="text-xs text-gray-400">Total uploaded examination papers per degree</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={courseData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#05488B", color: "#fff", borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="count" fill="#05488B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Exam Distribution */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#05488B] uppercase tracking-wider">
            Exam Type Proportions
          </h3>
          <p className="text-xs text-gray-400">Mid Term (MTE) vs End Term (ETE)</p>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={examData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {examData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

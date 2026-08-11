const WINDOW_OPTIONS = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 }
];

const SummaryCard = ({ label, value, tone }) => (
  <div className="flex-1 min-w-[140px] bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-2xl font-bold ${tone || "text-[#374151]"}`}>{value}</p>
  </div>
);

const RankedList = ({ title, subtitle, items, emptyText, countLabel, renderLabel }) => (
  <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4 min-w-0">
    <h3 className="text-base font-bold text-[#374151]">{title}</h3>
    <p className="text-xs text-gray-500 mb-3">{subtitle}</p>
    {items.length === 0 ? (
      <p className="text-sm text-gray-400 py-6 text-center">{emptyText}</p>
    ) : (
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center justify-between gap-3 border-b border-gray-100 last:border-0 pb-2 last:pb-0">
            <span className="flex items-center gap-2 min-w-0">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
              <span className="text-sm text-gray-700 truncate" title={renderLabel(item)}>{renderLabel(item)}</span>
            </span>
            <span className="flex-shrink-0 bg-[#eef5ff] text-[#05488B] text-xs font-bold px-2.5 py-1 rounded-full">{item.count} {countLabel}</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

const STATUS_COLORS = {
  found: "#22c55e",
  not_found: "#f43f5e",
  need_more: "#f59e0b",
  info: "#05488B",
  unavailable: "#9ca3af",
  unknown: "#9ca3af"
};

const STATUS_LABELS = {
  found: "Found",
  not_found: "Not Found",
  need_more: "Needs More Info",
  info: "Info Reply",
  unavailable: "Unavailable",
  unknown: "Unknown"
};

const polarToCartesian = (cx, cy, r, angleDeg) => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
};

const describeArc = (cx, cy, r, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
};

const StatusPieChart = ({ statusCounts }) => {
  const entries = Object.entries(statusCounts || {}).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return <p className="text-sm text-gray-400 text-center py-10">No data in this window yet.</p>;
  }

  let cumulativeAngle = 0;
  const slices = entries.map(([status, count]) => {
    const angle = (count / total) * 360;
    const slice = { status, count, startAngle: cumulativeAngle, endAngle: cumulativeAngle + angle, color: STATUS_COLORS[status] || "#9ca3af" };
    cumulativeAngle += angle;
    return slice;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
      <svg viewBox="0 0 200 200" className="w-44 h-44 flex-shrink-0">
        {slices.length === 1 ? (
          <circle cx="100" cy="100" r="90" fill={slices[0].color} />
        ) : (
          slices.map((slice) => (
            <path key={slice.status} d={describeArc(100, 100, 90, slice.startAngle, slice.endAngle)} fill={slice.color} stroke="white" strokeWidth="2" />
          ))
        )}
        <circle cx="100" cy="100" r="52" fill="white" />
        <text x="100" y="96" textAnchor="middle" className="fill-[#374151]" style={{ fontSize: "24px", fontWeight: 700 }}>{total}</text>
        <text x="100" y="116" textAnchor="middle" className="fill-gray-400" style={{ fontSize: "11px" }}>Total Queries</text>
      </svg>
      <ul className="space-y-2">
        {slices.map((slice) => (
          <li key={slice.status} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: slice.color }}></span>
            <span className="text-gray-700 font-medium">{STATUS_LABELS[slice.status] || slice.status}</span>
            <span className="text-gray-400 text-xs">({slice.count} &middot; {Math.round((slice.count / total) * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function QueryInsightsPanel({
  insights,
  insightsWindowDays,
  insightsLoading,
  insightsError,
  changeInsightsWindow
}) {
  const notFoundTone = insights.notFoundRate >= 30 ? "text-[#f43f5e]" : insights.notFoundRate >= 10 ? "text-amber-600" : "text-[#22c55e]";

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        {WINDOW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => changeInsightsWindow(opt.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${insightsWindowDays === opt.value ? "bg-[#05488B] text-[#ffc107]" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {opt.label}
          </button>
        ))}
        {insightsLoading && <span className="text-xs text-gray-400 ml-2">Loading...</span>}
      </div>

      {insightsError && <p className="text-sm text-[#f43f5e] mb-3">❌ {insightsError}</p>}

      <div className="flex flex-wrap gap-3 mb-4">
        <SummaryCard label="Total Queries" value={insights.totalQueries} />
        <SummaryCard label="Not Found Rate" value={`${insights.notFoundRate}%`} tone={notFoundTone} />
        <SummaryCard label="Found" value={insights.statusCounts.found || 0} tone="text-[#22c55e]" />
        <SummaryCard label="Not Found" value={insights.statusCounts.not_found || 0} tone="text-[#f43f5e]" />
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <RankedList
          title="📌 Papers Students Want But Don't Have"
          subtitle="Most common searches that returned no results - your best guide for what to upload next"
          items={insights.topNotFoundQuestions}
          emptyText="No unanswered searches in this window."
          countLabel="asks"
          renderLabel={(item) => item.question}
        />
        <RankedList
          title="🔥 Most Requested Papers"
          subtitle="Papers students search for and find most often"
          items={insights.topFoundPapers}
          emptyText="No data in this window yet."
          countLabel="hits"
          renderLabel={(item) => item.paperName}
        />
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center">
        <h3 className="text-base font-bold text-[#374151] w-full text-center">📊 Query Status Breakdown</h3>
        <div className="mt-3 w-full max-w-xl">
          <StatusPieChart statusCounts={insights.statusCounts} />
        </div>
      </div>
    </div>
  );
}
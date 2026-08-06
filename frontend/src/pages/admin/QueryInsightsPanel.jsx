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
    </div>
  );
}

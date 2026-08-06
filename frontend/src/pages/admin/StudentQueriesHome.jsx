import { useState } from "react";
import QueryInsightsPanel from "./QueryInsightsPanel";
import StudentQueriesPanel from "./StudentQueriesPanel";

export default function StudentQueriesHome({ insightsProps, ...studentQueriesProps }) {
  const [activeTab, setActiveTab] = useState("queries");
  const [hasLoadedInsights, setHasLoadedInsights] = useState(false);

  const openInsightsTab = () => {
    setActiveTab("insights");
    if (!hasLoadedInsights) {
      setHasLoadedInsights(true);
      insightsProps.fetchInsights();
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("queries")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors ${activeTab === "queries" ? "bg-white text-[#05488B] border-2 border-[#05488B]" : "bg-[#05488B] text-[#ffc107] hover:bg-[#215ea0]"}`}
        >
          💬 Queries
        </button>
        <button
          type="button"
          onClick={openInsightsTab}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors ${activeTab === "insights" ? "bg-white text-[#05488B] border-2 border-[#05488B]" : "bg-[#05488B] text-[#ffc107] hover:bg-[#215ea0]"}`}
        >
          📊 Insights
        </button>
      </div>

      {activeTab === "queries" ? (
        <StudentQueriesPanel {...studentQueriesProps} />
      ) : (
        <QueryInsightsPanel {...insightsProps} />
      )}
    </>
  );
}

import { useState } from "react";
import BulkPaperUpload from "./BulkPaperUpload";
import DashboardPage from "./DashboardPage";

export default function DashboardHome({ coverImg, bulkUploadProps, ...dashboardProps }) {
  const [activeTab, setActiveTab] = useState("edit");

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors ${activeTab === "edit" ? "bg-white text-[#05488B] border-2 border-[#05488B]" : "bg-[#05488B] text-[#ffc107] hover:bg-[#215ea0]"}`}
        >
          ✏️ Edit Data
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bulk")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors ${activeTab === "bulk" ? "bg-white text-[#05488B] border-2 border-[#05488B]" : "bg-[#05488B] text-[#ffc107] hover:bg-[#215ea0]"}`}
        >
          📦 Bulk Paper Operations
        </button>
      </div>

      {activeTab === "edit" ? (
        <DashboardPage {...dashboardProps} />
      ) : (
        <BulkPaperUpload {...bulkUploadProps} />
      )}

      <div className="mt-4 rounded-xl overflow-hidden shadow-sm w-full flex-shrink-0 border border-gray-200 bg-white">
        <img src={coverImg} alt="Poornima University" className="w-full h-auto object-cover object-center transform transition-transform duration-700" />
      </div>
    </>
  );
}

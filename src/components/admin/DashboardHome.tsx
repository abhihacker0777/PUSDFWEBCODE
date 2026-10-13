import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Edit3, Package } from "lucide-react";
import DashboardPage from "./DashboardPage";

const BulkPaperUpload = dynamic(() => import("./forms/BulkPaperUpload"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200">
      <p className="text-gray-600 font-medium">Loading Bulk Upload Operations...</p>
    </div>
  ),
});

export interface DashboardHomeProps {
  coverImg?: any;
  bulkUploadProps: any;
  [key: string]: any;
}

export default function DashboardHome({ coverImg, bulkUploadProps, ...dashboardProps }: Readonly<DashboardHomeProps>) {
  const [activeTab, setActiveTab] = useState<"edit" | "bulk">("edit");

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 mb-4 w-full">
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-lg font-semibold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer w-full sm:w-auto ${
            activeTab === "edit"
              ? "bg-white text-[#05488B] border-2 border-[#05488B]"
              : "bg-[#05488B] text-[#ffc107] hover:bg-[#215ea0]"
          }`}
        >
          <Edit3 className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Edit Data</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bulk")}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-lg font-semibold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer w-full sm:w-auto ${
            activeTab === "bulk"
              ? "bg-white text-[#05488B] border-2 border-[#05488B]"
              : "bg-[#05488B] text-[#ffc107] hover:bg-[#215ea0]"
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Bulk Paper Operations</span>
        </button>
      </div>

      {activeTab === "edit" ? (
        <DashboardPage {...(dashboardProps as any)} />
      ) : (
        <BulkPaperUpload {...bulkUploadProps} />
      )}

      <div className="mt-4 rounded-xl overflow-hidden shadow-sm w-full flex-shrink-0 border border-gray-200 bg-white">
        <img
          src={coverImg?.src || coverImg}
          alt="Poornima University"
          className="w-full h-auto object-cover object-center transform transition-transform duration-700"
        />
      </div>
    </>
  );
}

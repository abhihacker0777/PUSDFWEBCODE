import React from "react";
import { LogOut } from "lucide-react";

export interface AdminHeaderProps {
  activeTitle: string;
  authUser?: any;
  loggedInLabel: string;
  loggedInRoleLabel: string;
  isActive?: boolean;
  onLogout: () => Promise<void>;
}

export default function AdminHeader({
  activeTitle,
  loggedInLabel,
  loggedInRoleLabel,
  isActive = false,
  onLogout
}: Readonly<AdminHeaderProps>) {
  return (
    <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-gray-200 bg-white flex-shrink-0 w-full min-h-[52px]">
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-wide truncate">
          {activeTitle}
        </h1>
      </div>
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        <div className="flex flex-col items-end leading-tight text-right">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isActive ? (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                title="Full Data Fetched - Active"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200"
                title="Fetching Data - Inactive"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                Inactive
              </span>
            )}
            <span className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
              {loggedInLabel}
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#05488b] whitespace-nowrap">
            {loggedInRoleLabel}
          </span>
        </div>

        <button
          onClick={onLogout}
          aria-label="Logout"
          className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold text-[#ffc107] bg-[#05488b] hover:bg-[#043a70] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#05488b] cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4 text-[#ffc107] shrink-0" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

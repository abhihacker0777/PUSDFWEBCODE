import React from "react";
import { LogOut } from "lucide-react";

export interface AdminHeaderProps {
  activeTitle: string;
  authUser: any;
  loggedInLabel: string;
  loggedInRoleLabel: string;
  onLogout: () => Promise<void>;
}

export default function AdminHeader({ activeTitle, authUser, loggedInLabel, loggedInRoleLabel, onLogout }: Readonly<AdminHeaderProps>) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-white flex-shrink-0">
      <h1 className="text-base font-bold text-gray-800 tracking-wide">
        {activeTitle}
      </h1>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-sm font-bold text-gray-800 max-w-[220px] truncate">{loggedInLabel || "PU Central-Library"}</span>
          <span className="text-[11px] font-semibold text-[#05488b]">{loggedInRoleLabel || "Admin"}</span>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold text-[#ffc107] bg-[#05488b] hover:bg-[#043a70] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#05488b] cursor-pointer">
          <LogOut className="w-4 h-4 text-[#ffc107]" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

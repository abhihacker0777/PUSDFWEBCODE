import React from "react";
import { PoornimaLogo } from "./utils/AdminShared";

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  showNew?: boolean;
}

export interface AdminSidebarProps {
  navItems: NavItem[];
  activeNav: string;
  setActiveNav: (nav: string) => void;
  newQueryGif?: any;
  sessionTelemetry?: {
    ip: string;
    lastActiveIst: string;
    isOnline: boolean;
  };
  authUser?: any;
}

export default function AdminSidebar({
  navItems,
  activeNav,
  setActiveNav,
  newQueryGif,
  sessionTelemetry,
  authUser
}: Readonly<AdminSidebarProps>) {
  return (
    <aside className="w-full md:w-52 flex-shrink-0 flex flex-col items-stretch shadow-none md:shadow-lg pt-4 pb-4 md:pb-4 md:pt-4 z-20 justify-between" style={{ backgroundColor: "#f5a623" }}>
      <div>
        <PoornimaLogo />
        <div className="hidden md:block px-4 pt-4 pb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Dashboard</span>
        </div>
        <nav className="flex-1 px-2 md:px-2 mt-3 md:mt-0 pb-2 md:pb-0 flex flex-row md:flex-col items-center md:items-stretch justify-start gap-2 md:gap-0 md:space-y-1 w-full overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                aria-current={activeNav === item.id ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap w-auto md:w-full flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeNav === item.id
                    ? "bg-white text-[#05488b] shadow-md"
                    : "text-black/75 hover:bg-white/15 hover:text-black"
                }`}
              >
                <Icon className={`${activeNav === item.id ? "text-[#05488b]" : ""} w-4 h-4 shrink-0`} />
                <span className="text-left leading-tight min-w-9">{item.label}</span>
                {item.showNew && (
                  <span className="relative flex h-2 w-2 shrink-0 ml-auto mr-1" title="New queries">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

import React, { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "./AdminIcons";
import { ROLE_LABELS } from "./adminConstants";

export const PoornimaLogo: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-2 md:py-6 px-2 mb-0 md:mb-2 border-b-0 md:border-b border-white/20">
    <img src="/puupdatelogo.png" alt="Poornima University Logo" className="w-24 md:w-40 h-auto object-contain" />
  </div>
);


// --- UNIFIED PAGINATION COMPONENT ---
export interface PaginationFooterProps {
  total: number;
  currentPage: number;
  displayCount: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setDisplayCount: (count: number) => void;
}

export const PaginationFooter: React.FC<PaginationFooterProps> = ({ total, currentPage, displayCount, setCurrentPage, setDisplayCount }) => {
  const totalPages = Math.ceil(total / displayCount) || 1;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-white rounded-b-2xl gap-2 sm:gap-0 mt-auto">
      <span className="text-xs text-gray-500">
        Showing {total === 0 ? 0 : (currentPage - 1) * displayCount + 1} to {Math.min(currentPage * displayCount, total)} of {total} entries
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Display</span>
          <select value={displayCount} onChange={(e) => setDisplayCount(Number(e.target.value))} className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none cursor-pointer">
            {[10, 30, 50, 70, 90].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-600"><ChevronLeftIcon /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setCurrentPage(p)} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-semibold transition-colors ${currentPage === p ? "text-white shadow-sm" : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"}`} style={currentPage === p ? { backgroundColor: "#e53e3e" } : {}}>{p}</button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-600"><ChevronRightIcon /></button>
        </div>
      </div>
    </div>
  );
};

export interface CustomDropdownProps {
  id: string;
  label: string;
  options: any[];
  value: any;
  setValue: (val: any) => void;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  disabled?: boolean;
  customWidth?: string;
  customHeight?: string;
  searchable?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ id, label, options, value, setValue, openDropdown, setOpenDropdown, disabled, customWidth, customHeight, searchable }) => {
  const isOpen = openDropdown === id && !disabled;
  const [isAdding, setIsAdding] = useState(false);
  const [draftValue, setDraftValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const commitDraftValue = () => {
    const nextValue = draftValue.trim().slice(0, 100);
    setIsAdding(false);
    setDraftValue("");
    if (nextValue) setValue(nextValue);
  };

  const cancelDraftValue = () => {
    setIsAdding(false);
    setDraftValue("");
  };

  const visibleOptions = searchable && searchTerm.trim()
    ? (options || []).filter((item) => String(item).toLowerCase().includes(searchTerm.trim().toLowerCase()))
    : (options || []);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return undefined;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    updatePosition();

    const handleScroll = (event: any) => {
      if (menuRef.current && menuRef.current.contains(event.target)) return;
      setOpenDropdown(null);
    };
    const handleOutsideClick = (event: any) => {
      if (triggerRef.current && triggerRef.current.contains(event.target)) return;
      if (menuRef.current && menuRef.current.contains(event.target)) return;
      setOpenDropdown(null);
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, setOpenDropdown]);

  if (isAdding) {
    return (
      <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          type="text"
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          onBlur={commitDraftValue}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraftValue();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancelDraftValue();
            }
          }}
          placeholder={`Type ${label}`}
          className="w-full border border-[#ffc107] rounded-lg px-4 py-2 text-base font-medium text-center shadow-sm outline-none text-[#215ea0] bg-white"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button" disabled={disabled}
        onClick={(e) => { e.stopPropagation(); if (!disabled) { setSearchTerm(""); setOpenDropdown(isOpen ? null : id); } }}
        className={`w-full border rounded-lg px-4 py-2 text-base font-medium text-center shadow-sm transition-colors ${disabled ? "bg-white text-[#374151] cursor-not-allowed whitespace-nowrap" : value ? "bg-white border-[#ffc107] text-[#215ea0] truncate" : "bg-white border-[#ffc107] text-[#374151] hover:bg-gray-50 whitespace-nowrap"}`}
        title={value || label}
      >
        {value || label}
      </button>
      {isOpen && menuPosition && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left, width: customWidth ? undefined : menuPosition.width }}
          className={`bg-[#cbe0fe] rounded-lg shadow-2xl z-[9999] border border-blue-200 overflow-hidden ${customWidth || ""}`}
        >
          {searchable && (
            <div className="p-2 border-b border-blue-200/70">
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full border border-blue-300 rounded-md px-3 py-1.5 text-sm outline-none bg-white text-[#374151] placeholder:text-gray-400"
              />
            </div>
          )}
          <div className={`${customHeight ? customHeight : 'max-h-[150px]'} overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc107] [&::-webkit-scrollbar-thumb]:rounded-full`}>
            {visibleOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No matches</div>
            )}
            {visibleOptions.map((item, i) => (
              <button type="button" key={i} onClick={() => { if (String(item).startsWith("+ Add New")) { setDraftValue(""); setIsAdding(true); } else { setValue(item); } setOpenDropdown(null); }} className="w-full text-left px-4 py-3 hover:bg-blue-300 cursor-pointer text-sm md:text-base text-gray-800 transition-colors border-b border-blue-200/50 last:border-0" title={item}>
                {item}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export interface RoleDropdownProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  openRoleMenu: string;
  setOpenRoleMenu: (id: string) => void;
  className?: string;
}

export const RoleDropdown: React.FC<RoleDropdownProps> = ({ id, value, onChange, disabled, openRoleMenu, setOpenRoleMenu, className = "" }) => {
  const isOpen = openRoleMenu === id && !disabled;
  const valKey = String(value || "").toLowerCase();
  const currentLabel = ROLE_LABELS[valKey] || (value ? (value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()) : "View");
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return undefined;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    updatePosition();

    const handleScroll = (event: any) => {
      if (menuRef.current && menuRef.current.contains(event.target)) return;
      setOpenRoleMenu("");
    };
    const handleOutsideClick = (event: any) => {
      if (triggerRef.current && triggerRef.current.contains(event.target)) return;
      if (menuRef.current && menuRef.current.contains(event.target)) return;
      setOpenRoleMenu("");
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, setOpenRoleMenu]);

  return (
    <div className={`relative ${className}`} onClick={(event) => event.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpenRoleMenu(isOpen ? "" : id)}
        className={`w-full h-[45px] px-4 rounded-lg border bg-white flex items-center justify-between text-left text-base shadow-sm transition-colors ${isOpen ? "border-[#ffc107] text-[#215ea0]" : "border-gray-300 text-[#374151] hover:bg-gray-50"} disabled:border-transparent disabled:bg-transparent disabled:text-gray-500 disabled:shadow-none`}
      >
        <span className="truncate">{currentLabel}</span>
        {!disabled && <ChevronDownIcon />}
      </button>
      {isOpen && menuPosition && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          onClick={(event) => event.stopPropagation()}
          style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left, width: menuPosition.width }}
          className="bg-[#cbe0fe] rounded-lg shadow-2xl z-[9999] border border-blue-200 overflow-hidden"
        >
          <div className="max-h-[150px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc107] [&::-webkit-scrollbar-thumb]:rounded-full">
            {[
              { id: "full", label: "Full" },
              { id: "editor", label: "Editor" },
              { id: "view", label: "View" }
            ].map(({ id: roleId, label }) => (
              <button
                type="button"
                key={roleId}
                onClick={() => {
                  onChange(roleId);
                  setOpenRoleMenu("");
                }}
                className={`w-full text-left px-4 py-3 cursor-pointer text-sm md:text-base text-gray-800 transition-colors border-b border-blue-200/50 last:border-0 ${roleId === valKey ? "bg-blue-300 font-bold" : "hover:bg-blue-300"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  topOffset?: number;
}

function useDropdownPosition(
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLButtonElement | null>,
  menuRef: React.RefObject<HTMLDivElement | null>,
  onClose: () => void,
  topOffset = 4
) {
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition((prev) => (prev ? null : prev));
      return undefined;
    }
    if (!triggerRef.current) return undefined;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const nextPos = { top: rect.bottom + topOffset, left: rect.left, width: rect.width };
      setMenuPosition((prev) => {
        if (
          prev &&
          Math.abs(prev.top - nextPos.top) < 0.5 &&
          Math.abs(prev.left - nextPos.left) < 0.5 &&
          Math.abs(prev.width - nextPos.width) < 0.5
        ) {
          return prev;
        }
        return nextPos;
      });
    };
    updatePosition();

    const handleScroll = (event: any) => {
      if (menuRef.current?.contains(event.target)) return;
      onCloseRef.current();
    };
    const handleOutsideClick = (event: any) => {
      if (triggerRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      onCloseRef.current();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, topOffset]);

  return menuPosition;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ id, label, options, value, setValue, openDropdown, setOpenDropdown, disabled, customWidth, customHeight, searchable, topOffset }) => {
  const isOpen = openDropdown === id && !disabled;
  const [isAdding, setIsAdding] = useState(false);
  const [draftValue, setDraftValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  const menuPosition = useDropdownPosition(
    isOpen,
    triggerRef,
    menuRef,
    () => setOpenDropdown(null),
    typeof topOffset === "number" ? topOffset : 4
  );

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

  if (isAdding) {
    return (
      <div className="relative w-full">
        <input
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

  let buttonStateClass = "bg-white border-[#ffc107] text-[#374151] hover:bg-gray-50 whitespace-nowrap";
  if (disabled) {
    buttonStateClass = "bg-white text-[#374151] cursor-not-allowed whitespace-nowrap";
  } else if (value) {
    buttonStateClass = "bg-white border-[#ffc107] text-[#215ea0] truncate";
  }

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button" disabled={disabled}
        onClick={(e) => { e.stopPropagation(); if (!disabled) { setSearchTerm(""); setOpenDropdown(isOpen ? null : id); } }}
        className={`w-full border rounded-lg px-4 py-2 text-base font-medium text-center shadow-sm transition-colors ${buttonStateClass}`}
        title={value || label}
      >
        {value || label}
      </button>
      {isOpen && menuPosition && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left, width: customWidth ? undefined : menuPosition.width }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={`bg-[#cbe0fe] rounded-lg shadow-2xl z-[9999] border border-blue-200 overflow-hidden ${customWidth || ""}`}
        >
          {searchable && (
            <div
              className="p-2 border-b border-blue-200/70 relative"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Escape") {
                    setOpenDropdown(null);
                  }
                }}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full border border-blue-300 rounded-md px-3 py-1.5 text-sm outline-none focus:outline-none focus:ring-1 focus:ring-[#05488B] bg-white text-[#374151] placeholder:text-gray-400 pr-7"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold p-1 cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          <div className={`${customHeight || 'max-h-[150px]'} overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc107] [&::-webkit-scrollbar-thumb]:rounded-full`}>
            {visibleOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No matches</div>
            )}
            {visibleOptions.map((item) => (
              <button type="button" key={String(item)} onClick={() => { if (String(item).startsWith("+ Add New")) { setDraftValue(""); setIsAdding(true); } else { setValue(item); } setOpenDropdown(null); }} className="w-full text-left px-4 py-3 hover:bg-blue-300 cursor-pointer text-sm md:text-base text-gray-800 transition-colors border-b border-blue-200/50 last:border-0" title={item}>
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const menuPosition = useDropdownPosition(
    isOpen,
    triggerRef,
    menuRef,
    () => setOpenRoleMenu(""),
    4
  );

  return (
    <div className={`relative ${className}`}>
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


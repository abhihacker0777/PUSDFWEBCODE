"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Search } from "lucide-react";

interface SelectedFilters {
  course: string | null;
  year: string | null;
  specialization: string | null;
  sem: string | null;
  exam: string | null;
}

interface FiltersProps {
  courses: string[];
  years: string[];
  specs: string[];
  sems: string[];
  exams: string[];
  selected: SelectedFilters;
  handleSelect: (type: string, value: string) => void;
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
}

export default function Filters({
  courses,
  years,
  specs,
  sems,
  exams,
  selected,
  handleSelect,
  searchQuery = "",
  setSearchQuery,
}: Readonly<FiltersProps>) {
  // Detect desktop environment with mouse/hover pointer (not mobile touch)
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkHover = () => {
      setIsDesktop(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    };
    checkHover();
    window.addEventListener("resize", checkHover);
    return () => window.removeEventListener("resize", checkHover);
  }, []);

  // Track specific values locked/pinned by explicit user clicks
  const [lockedValues, setLockedValues] = useState<{
    course: string | null;
    year: string | null;
    specialization: string | null;
    sem: string | null;
    exam: string | null;
  }>({
    course: null,
    year: null,
    specialization: null,
    sem: null,
    exam: null,
  });

  const scrollbarStyles =
    "flex flex-nowrap gap-[15px] overflow-x-auto py-[10px] pr-10 w-full [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc107] [&::-webkit-scrollbar-thumb]:rounded-[20px] hover:[&::-webkit-scrollbar-thumb]:bg-[#05488B] active:[&::-webkit-scrollbar-thumb]:bg-[#05488B]";

  const baseCard =
    "flex-shrink-0 px-8 py-3 rounded-2xl cursor-pointer min-w-[146px] whitespace-nowrap text-center shadow-md hover:shadow-lg transition-colors duration-150 transform-gpu active:scale-95 border-2 border-solid border-transparent box-border font-medium flex items-center justify-center";

  const activeCard =
    "bg-[#2f6db0] text-white border-[#ffc107] !border-[#ffc107] !border-solid !border-[2px] shadow-md";

  // Memoize the sorted specializations
  const sortedSpecs = useMemo(() => {
    if (!specs || specs.length === 0) return [];
    return [...specs].sort((a, b) => a.localeCompare(b));
  }, [specs]);

  const handleClick = (type: string, item: string) => {
    // If clicking the EXACT item that is ALREADY locked at this level -> toggle off / unlock
    if (lockedValues[type as keyof typeof lockedValues] === item) {
      setLockedValues((prev) => {
        if (type === "course") return { course: null, year: null, specialization: null, sem: null, exam: null };
        if (type === "year") return { ...prev, year: null, specialization: null, sem: null, exam: null };
        if (type === "specialization") return { ...prev, specialization: null, sem: null, exam: null };
        if (type === "sem") return { ...prev, sem: null, exam: null };
        if (type === "exam") return { ...prev, exam: null };
        return prev;
      });
      handleSelect(type, "");
      return;
    }

    // Clicking a new item -> immediately select & lock on the very first click
    setLockedValues((prev) => {
      if (type === "course") return { course: item, year: null, specialization: null, sem: null, exam: null };
      if (type === "year") return { ...prev, year: item, specialization: null, sem: null, exam: null };
      if (type === "specialization") return { ...prev, specialization: item, sem: null, exam: null };
      if (type === "sem") return { ...prev, sem: item, exam: null };
      if (type === "exam") return { ...prev, exam: item };
      return prev;
    });

    handleSelect(type, item);
  };

  const handleMouseEnterPill = (type: string, item: string) => {
    if (!isDesktop) return;
    if (selected[type as keyof SelectedFilters] !== item) {
      handleSelect(type, item);
    }
  };

  const handleMouseLeavePill = (type: string, e: React.MouseEvent) => {
    if (!isDesktop) return;

    const next = e.relatedTarget as HTMLElement | null;
    if (!next) {
      const prevLocked = lockedValues[type as keyof typeof lockedValues];
      handleSelect(type, prevLocked || "");
      return;
    }

    // 1. If moving to another pill of the same row, do not clear
    if (next.closest(`[data-filter-pill="${type}"]`)) return;

    // 2. If moving down into a child row container, do not clear
    const childTypes: Record<string, string[]> = {
      course: ["year", "specialization", "sem", "exam"],
      year: ["specialization", "sem", "exam"],
      specialization: ["sem", "exam"],
      sem: ["exam"],
      exam: [],
    };

    const allowedChildren = childTypes[type] || [];
    const isInChildRow = allowedChildren.some((child) =>
      Boolean(next.closest(`[data-filter-row="${child}"]`))
    );

    if (isInChildRow) return;

    // 3. Otherwise, mouse removed from the box -> revert to locked value if one exists, otherwise hide
    const prevLocked = lockedValues[type as keyof typeof lockedValues];
    if (selected[type as keyof SelectedFilters] !== prevLocked) {
      handleSelect(type, prevLocked || "");
    }
  };

  const handleMouseLeaveContainer = (e: React.MouseEvent) => {
    if (!isDesktop) return;
    const next = e.relatedTarget as HTMLElement | null;

    // If exam is chosen and user moves into papers, keep papers visible
    if (selected.exam && next?.closest("[data-paper-section]")) return;

    // Revert all levels to their locked values (or clear if none locked)
    if (!lockedValues.course) {
      handleSelect("clear", "");
    } else {
      if (selected.course !== lockedValues.course) {
        handleSelect("course", lockedValues.course);
      }
      if (!lockedValues.year) {
        handleSelect("year", "");
      } else {
        if (selected.year !== lockedValues.year) {
          handleSelect("year", lockedValues.year);
        }
        if (!lockedValues.specialization) {
          if (selected.specialization) handleSelect("specialization", "");
        } else {
          if (selected.specialization !== lockedValues.specialization) {
            handleSelect("specialization", lockedValues.specialization);
          }
          if (!lockedValues.sem) {
            handleSelect("sem", "");
          } else {
            if (selected.sem !== lockedValues.sem) {
              handleSelect("sem", lockedValues.sem);
            }
            if (!lockedValues.exam) {
              handleSelect("exam", "");
            }
          }
        }
      }
    }
  };

  const renderRow = (
    title: string,
    items: string[],
    type: string,
    isSelected: string | null
  ) => {
    if (!items || items?.length === 0) return null;
    if (searchQuery.trim() && type !== "course") return null;

    const displayItems = type === "specialization" ? sortedSpecs : items;
    const isSearching = Boolean(searchQuery.trim());

    return (
      <div
        className={`w-full ${isSearching ? "mb-1" : "mb-4"}`}
        data-filter-row={type}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-1 sm:mt-5 mb-1">
          {!isSearching && (
            <h3 className="order-2 sm:order-1 font-bold text-gray-800 text-lg">
              {title}
            </h3>
          )}

          {type === "course" && setSearchQuery && (
            <div
              className={`order-1 sm:order-2 relative w-full sm:w-74 md:w-72 lg:w-80 xl:w-84 2xl:w-96 sm:-translate-y-3.5 sm:-translate-x-12 ${
                isSearching ? "sm:ml-auto" : ""
              }`}
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                aria-label="Search paper"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Paper (Eg. B.Tech 1st Sem RDBMS)"
                className="w-full pl-8 pr-8 py-2 text-base sm:text-xs bg-white border border-gray-300 hover:border-gray-400 rounded-full shadow-xs focus:outline-none focus:ring-2 focus:ring-[#05488B] focus:border-transparent text-gray-800 placeholder-gray-400 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {!isSearching && (
          <div className={scrollbarStyles}>
            {displayItems.map((item) => {
              const isActive = isSelected === item;
              return (
                <button
                  type="button"
                  key={`${type}-${item}`}
                  data-filter-pill={type}
                  aria-pressed={isActive}
                  onClick={() => handleClick(type, item)}
                  onMouseEnter={() => handleMouseEnterPill(type, item)}
                  onMouseLeave={(e) => handleMouseLeavePill(type, e)}
                  className={`${baseCard} ${
                    isActive ? activeCard : "bg-white text-gray-700"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full" onMouseLeave={handleMouseLeaveContainer}>
      {renderRow("Course", courses, "course", selected.course)}

      {selected.course && renderRow("Year", years, "year", selected.year)}

      {selected.year &&
        specs?.length > 0 &&
        renderRow(
          "Specialization",
          specs,
          "specialization",
          selected.specialization
        )}

      {(selected.specialization ||
        (selected.year && specs?.length === 0)) &&
        selected.year &&
        renderRow("Semester", sems, "sem", selected.sem)}

      {selected.sem && renderRow("Exam", exams, "exam", selected.exam)}
    </div>
  );
}

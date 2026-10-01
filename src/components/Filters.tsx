"use client";

import React, { useMemo } from "react";

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
  const scrollbarStyles =
    "flex flex-nowrap gap-[15px] overflow-x-auto py-[10px] pr-10 w-full [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc107] [&::-webkit-scrollbar-thumb]:rounded-[20px] hover:[&::-webkit-scrollbar-thumb]:bg-[#05488B] active:[&::-webkit-scrollbar-thumb]:bg-[#05488B]";

  const baseCard =
    "flex-shrink-0 px-8 py-3 rounded-2xl cursor-pointer min-w-[146px] whitespace-nowrap text-center shadow-md hover:shadow-lg transition-all border-2 border-solid border-transparent box-border font-medium flex items-center justify-center";

  const activeCard =
    "bg-[#4a80bc] text-white border-[#ffc107] !border-[#ffc107] !border-solid !border-[2px] shadow-md";

  // ⚡ OPTIMIZATION: Memoize the sorted specializations so it only runs when `specs` changes,
  // preventing unnecessary re-sorting on every single click.
  const sortedSpecs = useMemo(() => {
    if (!specs || specs.length === 0) return [];
    return [...specs].sort((a, b) => a.localeCompare(b));
  }, [specs]);

  const renderRow = (
    title: string,
    items: string[],
    type: string,
    isSelected: string | null
  ) => {
    if (!items || items?.length === 0) return null;
    if (searchQuery.trim() && type !== "course") return null;

    // Use the pre-sorted memoized array if the type is "specialization"
    const displayItems = type === "specialization" ? sortedSpecs : items;
    const isSearching = Boolean(searchQuery.trim());

    return (
      <div className={`w-full ${isSearching ? "mb-1" : "mb-4"}`}>
        {/*
          MANUAL ADJUSTMENT FOR SEARCH BAR POSITION:
          Adjust 'mt-3 sm:mt-5' below to move the search bar higher or lower.
          e.g. 'mt-1' (higher), 'mt-6' (lower), or exact pixels like 'mt-[20px]'.
        */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-1 sm:mt-5 mb-1"
        >
          {!isSearching && (
            <h3 className="order-2 sm:order-1 font-bold text-gray-800 text-lg">
              {title}
            </h3>
          )}

          {type === "course" && setSearchQuery && (
            <div
              className={`order-1 sm:order-2 relative w-full sm:w-74 md:w-72 lg:w-80 xl:w-84 2xl:w-96 sm:-translate-y-3.5 sm:-translate-x-12 ${isSearching ? "sm:ml-auto" : ""
                }`}
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
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
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-2.85z"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Paper (Eg. B.Tech 1st Sem RDBMS)"
                className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-gray-300 hover:border-gray-400 rounded-full shadow-xs focus:outline-none focus:ring-2 focus:ring-[#05488B] focus:border-transparent text-gray-800 placeholder-gray-400 transition-all font-sans"
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
                  onClick={() => handleSelect(type, item)}
                  className={`${baseCard} ${isActive ? activeCard : "bg-white text-gray-700"
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
    <div className="w-full">
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

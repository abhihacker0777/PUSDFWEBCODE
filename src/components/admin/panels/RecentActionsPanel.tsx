import React from "react";
import { ChevronDownIcon, DotsIcon, FilterLinesIcon, SearchIcon } from "../utils/AdminIcons";
import { PaginationFooter } from "../utils/AdminShared";

export interface RecentActionsPanelProps {
  showAllMenu: boolean;
  setShowAllMenu: (show: boolean) => void;
  setShowFilter: (show: boolean) => void;
  setShowQueryFilter: (show: boolean) => void;
  canClearLogs: boolean;
  selected: Set<any>;
  setClearSelectedConfirm: (confirm: boolean) => void;
  setClearLogsConfirm: (confirm: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  showFilter: boolean;
  setSortType: (sort: string) => void;
  filteredLogs: any[];
  currentPage: number;
  displayCount: number;
  selectAll: boolean;
  toggleAll: () => void;
  canEditPapers: boolean;
  canDeletePapers: boolean;
  openAction: any;
  setOpenAction: (id: any) => void;
  setCourse: (c: string) => void;
  setYear: (y: string) => void;
  setSpec: (s: string) => void;
  setSemester: (sem: string) => void;
  setExam: (ex: string) => void;
  setPaper: (p: string) => void;
  setPaperName: (pn: string) => void;
  setSelectedPaperIndex: (idx: any) => void;
  setActiveNav: (nav: string) => void;
  setListDeleteConfirm: (confirm: any) => void;
  toggleRow: (id: any) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setDisplayCount: (count: number) => void;
}

function getStatusBadgeClass(status?: string) {
  if (status === "Deleted" || status === "Bulk Deleted") return "bg-red-500";
  if (status === "Updated" || status === "Bulk Edited") return "bg-blue-500";
  if (status === "Added" || status === "Bulk Added") return "bg-green-500";
  return "bg-green-500";
}

function getRowBgClass(isSelected: boolean, idx: number) {
  if (isSelected) return "bg-amber-50";
  if (idx === 0) return "bg-gray-50/80";
  return "bg-white hover:bg-gray-50/60";
}

function parseLogPapers(spec?: string): any[] | null {
  if (!spec || typeof spec !== "string") return null;
  const trimmed = spec.trim();
  if (!trimmed.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export default function RecentActionsPanel({
  showAllMenu,
  setShowAllMenu,
  setShowFilter,
  setShowQueryFilter,
  canClearLogs,
  selected,
  setClearSelectedConfirm,
  setClearLogsConfirm,
  search,
  setSearch,
  showFilter,
  setSortType,
  filteredLogs,
  currentPage,
  displayCount,
  selectAll,
  toggleAll,
  canEditPapers,
  canDeletePapers,
  openAction,
  setOpenAction,
  setCourse,
  setYear,
  setSpec,
  setSemester,
  setExam,
  setPaper,
  setPaperName,
  setSelectedPaperIndex,
  setActiveNav,
  setListDeleteConfirm,
  toggleRow,
  setCurrentPage,
  setDisplayCount
}: Readonly<RecentActionsPanelProps>) {
  const [expandedLogs, setExpandedLogs] = React.useState<Set<any>>(new Set());

  const toggleExpandLog = (id: any) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 gap-3 md:gap-0">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <button onClick={(e) => { e.stopPropagation(); setShowAllMenu(!showAllMenu); setShowFilter(false); setShowQueryFilter(false); }} className="w-full justify-between md:justify-center flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 rounded-md px-4 py-1.5 bg-white hover:bg-gray-50 shadow-sm"><span>All Records</span><ChevronDownIcon /></button>
            {showAllMenu && (
              <div
                role="menu"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Escape") setShowAllMenu(false); }}
                onClick={(e) => e.stopPropagation()}
                className="absolute mt-2 w-full md:w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                {canClearLogs && selected.size > 0 ? <button onClick={() => { setClearSelectedConfirm(true); setShowAllMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">{selected.size === 1 ? "🧹 Clear Log" : "🧹 Clear Logs"} ({selected.size})</button> : <div className="px-4 py-2 text-sm text-gray-400">No Action</div>}
              </div>
            )}
          </div>
          {canClearLogs && <button onClick={() => setClearLogsConfirm(true)} className="flex-1 md:flex-none justify-center flex items-center gap-1.5 text-sm text-red-600 border border-red-200 rounded-md px-4 py-1.5 bg-red-50 hover:bg-red-100 shadow-sm transition-colors"><span>🧹 Clear Logs</span></button>}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 border border-blue-200 bg-blue-50/60 rounded-lg px-4 py-1.5 w-full sm:w-60"><SearchIcon /><input className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 w-full" placeholder="Search Recent Actions" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="relative w-full sm:w-auto">
            <button onClick={(e) => { e.stopPropagation(); setShowFilter(!showFilter); setShowAllMenu(false); setShowQueryFilter(false); }} className="w-full justify-center p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 shadow-sm"><FilterLinesIcon /></button>
            {showFilter && (
              <div className="absolute right-0 mt-2 w-full sm:w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-2 text-xs text-gray-400 font-semibold">Sort By</div>
                {[["az","A → Z"],["za","Z → A"],["new","New → Old"],["old","Old → New"],["","Default"]].map(([val, label]) => (<button key={val} onClick={() => { setSortType(val); setShowFilter(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">{label}</button>))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl shadow-sm bg-white">
        <div className="w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-[#ffc107] hover:[&::-webkit-scrollbar-thumb]:bg-[#05488B] [&::-webkit-scrollbar-thumb]:rounded-full flex-1">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-white">
                <th className="px-4 py-2 w-10 text-center rounded-tl-xl"><input type="checkbox" checked={selectAll} onChange={toggleAll} disabled={!canClearLogs} className="w-4 h-4 rounded accent-amber-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" /></th>
                <th className="px-4 py-2 text-center text-gray-600 font-semibold">Title</th>
                <th className="px-4 py-2 text-center text-gray-600 font-semibold">Semester</th>
                <th className="px-4 py-2 text-center text-gray-600 font-semibold">Year</th>
                <th className="px-4 py-2 text-center text-gray-600 font-semibold">Exam</th> 
                <th className="px-4 py-2 text-center text-gray-600 font-semibold">Date</th>
                <th className="px-4 py-2 text-center text-gray-600 font-semibold">Status</th>
                <th className="px-4 py-2 text-center text-gray-600 font-semibold">Admin</th>
                <th className="px-4 py-2 text-center text-gray-600 font-semibold rounded-tr-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">No Recent Actions Found.</td></tr>}
              {filteredLogs.slice((currentPage - 1) * displayCount, currentPage * displayCount).map((row, idx) => {
                const isSelected = selected.has(row.id);
                const subPapers = parseLogPapers(row.spec);
                const isExpandable = (subPapers && subPapers.length > 0) || row.status?.startsWith("Bulk");
                const isExpanded = expandedLogs.has(row.id);

                return (
                  <React.Fragment key={row.id}>
                    <tr className={`transition-colors ${getRowBgClass(isSelected, idx)}`}>
                      <td className="px-4 py-2.5 text-center"><input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.id)} disabled={!canClearLogs} className="w-4 h-4 rounded accent-amber-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" /></td>
                      <td className="px-4 py-2.5 text-center text-gray-700 font-medium">
                        <div className="flex items-center justify-center gap-1.5">
                          {isExpandable && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandLog(row.id);
                              }}
                              className="inline-flex items-center justify-center p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                              title={isExpanded ? "Collapse Details" : "Show Affected Papers"}
                            >
                              <svg
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : "rotate-0"}`}
                                aria-hidden="true"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                          <span className="truncate max-w-[240px]">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center text-gray-500">{row.semester}</td>
                      <td className="px-4 py-2.5 text-center text-gray-700 font-medium">{row.year}</td>
                      <td className="px-4 py-2.5 text-center text-gray-500">{row.exam}</td>
                      <td className="px-4 py-2.5 text-center text-gray-500">{row.date}</td>
                      <td className="px-4 py-2.5 text-center"><span className={`inline-flex items-center justify-center rounded-full text-white text-xs font-semibold px-4 py-1 min-w-[96px] whitespace-nowrap ${getStatusBadgeClass(row.status)}`}>{row.status}</span></td>
                      <td className="px-4 py-2.5 text-center text-gray-500">{row.adminName || "-"}</td>
                      <td className="px-4 py-2.5 text-center">
                        {canEditPapers && row.status !== "Deleted" && !row.status?.startsWith("Bulk") ? (
                          <div className="relative inline-block">
                            <button onClick={(e) => { e.stopPropagation(); setOpenAction(openAction === row.id ? null : row.id); }} className="p-1 rounded hover:bg-gray-100 transition-colors"><DotsIcon /></button>
                            {openAction === row.id && (
                              <div className="absolute right-8 top-0 w-28 bg-white border border-gray-200 rounded-lg shadow-2xl z-[100] overflow-hidden">
                                <button onClick={() => { setCourse(row.course || ""); setYear(row.year || ""); setSpec(row.spec || ""); setSemester(row.semester || ""); setExam(row.exam || ""); setPaper(row.name || ""); setPaperName(row.name || ""); setSelectedPaperIndex(row.index || null); setActiveNav("dashboard"); setOpenAction(null); }} className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors">Edit</button>
                                {canDeletePapers && <button onClick={() => { setListDeleteConfirm({ show: true, row }); setOpenAction(null); }} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors">🗑️ Delete</button>}
                              </div>
                            )}
                          </div>
                        ) : <span className="text-gray-400 text-xs italic">{row.status?.startsWith("Bulk") ? "Bulk Operation" : "Removed"}</span>}
                      </td>
                    </tr>
                    {isExpanded && isExpandable && subPapers && subPapers.length > 0 && (
                      <tr key={`${row.id}-details`} className="bg-blue-50/40">
                        <td colSpan={9} className="px-6 py-3 border-t border-b border-blue-100">
                          <div className="bg-white rounded-xl border border-blue-200 overflow-hidden shadow-xs">
                            <div className="px-3.5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 text-xs font-bold text-[#05488B] flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span>📑</span>
                                <span>Papers In {row.status} ({subPapers.length})</span>
                              </span>
                              <span className="text-[11px] font-normal text-gray-500">
                                Performed by: <strong className="text-gray-700">{row.adminName || "PU Central-Library"}</strong> • {row.date}
                              </span>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0 border-b">
                                  <tr>
                                    <th className="px-3 py-2 w-10 text-center">#</th>
                                    <th className="px-3 py-2">Paper Name</th>
                                    <th className="px-3 py-2">Course</th>
                                    <th className="px-3 py-2">Specialization</th>
                                    <th className="px-3 py-2 text-center">Semester</th>
                                    <th className="px-3 py-2 text-center">Year</th>
                                    <th className="px-3 py-2 text-center">Exam</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {subPapers.map((paper: any, pIdx: number) => (
                                    <tr key={paper.id ? String(paper.id) : `${row.id}-${paper.title || paper.name || pIdx}`} className="hover:bg-blue-50/30 transition-colors">
                                      <td className="px-3 py-2 text-center text-gray-400 font-mono text-[11px]">{pIdx + 1}</td>
                                      <td className="px-3 py-2 font-semibold text-gray-800">{paper.title || paper.name || "-"}</td>
                                      <td className="px-3 py-2 text-gray-600">{paper.course || "-"}</td>
                                      <td className="px-3 py-2 text-gray-600">{paper.specialization || paper.spec || "-"}</td>
                                      <td className="px-3 py-2 text-center text-gray-600">{paper.semester || paper.sem || "-"}</td>
                                      <td className="px-3 py-2 text-center text-gray-600">{paper.year || "-"}</td>
                                      <td className="px-3 py-2 text-center">
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                          {paper.exam || "-"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationFooter total={filteredLogs.length} currentPage={currentPage} displayCount={displayCount} setCurrentPage={setCurrentPage} setDisplayCount={setDisplayCount} />
      </div>
    </>
  );
}


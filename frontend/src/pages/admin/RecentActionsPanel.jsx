import { ChevronDownIcon, DotsIcon, FilterLinesIcon, SearchIcon } from "./AdminIcons";
import { PaginationFooter } from "./AdminShared";

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
}) {
  return (<>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 gap-3 md:gap-0">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <button onClick={(e) => { e.stopPropagation(); setShowAllMenu(prev => !prev); setShowFilter(false); setShowQueryFilter(false); }} className="w-full justify-between md:justify-center flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 rounded-md px-4 py-1.5 bg-white hover:bg-gray-50 shadow-sm"><span>All Records</span><ChevronDownIcon /></button>
                    {showAllMenu && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute mt-2 w-full md:w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        {canClearLogs && selected.size > 0 ? <button onClick={() => { setClearSelectedConfirm(true); setShowAllMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">{selected.size === 1 ? "🧹 Clear Log" : "🧹 Clear Logs"} ({selected.size})</button> : <div className="px-4 py-2 text-sm text-gray-400">No Action</div>}
                      </div>
                    )}
                  </div>
                  {canClearLogs && <button onClick={() => setClearLogsConfirm(true)} className="flex-1 md:flex-none justify-center flex items-center gap-1.5 text-sm text-red-600 border border-red-200 rounded-md px-4 py-1.5 bg-red-50 hover:bg-red-100 shadow-sm transition-colors"><span>🧹 Clear Logs</span></button>}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-2 border border-blue-200 bg-blue-50/60 rounded-lg px-4 py-1.5 w-full sm:w-60"><SearchIcon /><input className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} /></div>
                  <div className="relative w-full sm:w-auto">
                    <button onClick={(e) => { e.stopPropagation(); setShowFilter(prev => !prev); setShowAllMenu(false); setShowQueryFilter(false); }} className="w-full justify-center p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 shadow-sm"><FilterLinesIcon /></button>
                    {showFilter && (
                      <div className="absolute right-0 mt-2 w-full sm:w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                        <div className="px-4 py-2 text-xs text-gray-400 font-semibold">SORT BY</div>
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
                      {filteredLogs.length === 0 && <tr><td colSpan="9" className="text-center py-8 text-gray-400">No Recent Actions Found.</td></tr>}
                      {filteredLogs.slice((currentPage - 1) * displayCount, currentPage * displayCount).map((row, idx) => {
                        const isSelected = selected.has(row.id);
                        return (
                          <tr key={row.id} className={`transition-colors ${isSelected ? "bg-amber-50" : idx === 0 ? "bg-gray-50/80" : "bg-white hover:bg-gray-50/60"}`}>
                            <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.id)} disabled={!canClearLogs} className="w-4 h-4 rounded accent-amber-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" /></td>
                            <td className="px-4 py-2.5 text-center text-gray-700 font-medium">{row.name}</td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{row.semester}</td>
                            <td className="px-4 py-2.5 text-center text-gray-700 font-medium">{row.year}</td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{row.exam}</td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{row.date}</td>
                            <td className="px-4 py-2.5 text-center"><span className={`inline-flex items-center justify-center rounded-full text-white text-xs font-semibold px-4 py-1 min-w-[96px] whitespace-nowrap ${row.status === "Deleted" ? "bg-red-500" : row.status === "Updated" ? "bg-blue-500" : "bg-green-500"}`}>{row.status}</span></td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{row.adminName || "-"}</td>
                            <td className="px-4 py-2.5 text-center">
                              {canEditPapers && row.status !== "Deleted" ? (
                                <div className="relative inline-block">
                                  <button onClick={(e) => { e.stopPropagation(); setOpenAction(openAction === row.id ? null : row.id); }} className="p-1 rounded hover:bg-gray-100 transition-colors"><DotsIcon /></button>
                                  {openAction === row.id && (
                                    <div className="absolute right-8 top-0 w-28 bg-white border border-gray-200 rounded-lg shadow-2xl z-[100] overflow-hidden">
                                      <button onClick={() => { setCourse(row.course || ""); setYear(row.year || ""); setSpec(row.spec || ""); setSemester(row.semester || ""); setExam(row.exam || ""); setPaper(row.name || ""); setPaperName(row.name || ""); setSelectedPaperIndex(row.index || null); setActiveNav("dashboard"); setOpenAction(null); }} className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors">Edit</button>
                                      {canDeletePapers && <button onClick={() => { setListDeleteConfirm({ show: true, row }); setOpenAction(null); }} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors">🗑️ Delete</button>}
                                    </div>
                                  )}
                                </div>
                              ) : <span className="text-gray-400 text-xs italic">Removed</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <PaginationFooter total={filteredLogs.length} currentPage={currentPage} displayCount={displayCount} setCurrentPage={setCurrentPage} setDisplayCount={setDisplayCount} />
              </div>
            </>  );
}

import React from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { FilterLinesIcon, SearchIcon } from "./AdminIcons";
import { PaginationFooter } from "./AdminShared";
import { normalizeQueryEmail } from "./adminHelpers";

export default function StudentQueriesPanel({
  querySearch,
  setQuerySearch,
  setShowQueryFilter,
  setShowAllMenu,
  setShowFilter,
  showQueryFilter,
  setQuerySortType,
  groupedQueriesArray,
  queryCurrentPage,
  queryDisplayCount,
  blockedEmails,
  expandedEmails,
  blockLoadingEmail,
  newStudentQueryEmails,
  rememberStudentQueryEmail,
  toggleEmailExpanded,
  newQueryGif,
  canBlockAssistant,
  handleUnblockUser,
  handleBlockUser,
  setQueryCurrentPage,
  setQueryDisplayCount
}) {
  return (<>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 gap-3 md:gap-0">
                
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-2 border border-blue-200 bg-blue-50/60 rounded-lg px-4 py-1.5 w-full sm:w-60"><SearchIcon /><input className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full" placeholder="Search Query or Email" value={querySearch} onChange={e => setQuerySearch(e.target.value)} /></div>
                  <div className="relative w-full sm:w-auto">
                    <button onClick={(e) => { e.stopPropagation(); setShowQueryFilter(prev => !prev); setShowAllMenu(false); setShowFilter(false); }} className="w-full justify-center p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 shadow-sm"><FilterLinesIcon /></button>
                    {showQueryFilter && (
                      <div className="absolute right-0 mt-2 w-full sm:w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                        <div className="px-4 py-2 text-xs text-gray-400 font-semibold">SORT BY</div>
                        {[["new","New → Old"],["old","Old → New"]].map(([val, label]) => (<button key={val} onClick={() => { setQuerySortType(val); setShowQueryFilter(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">{label}</button>))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl shadow-sm bg-white">
                <div className="w-full overflow-y-auto pb-2 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track] [&::-webkit-scrollbar-thumb]:bg-[#ffc107] hover:[&::-webkit-scrollbar-thumb]:bg-[#05488B] [&::-webkit-scrollbar-thumb]:rounded-full flex-1">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr className="border-b-2 border-gray-100 bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <th className="px-4 py-3 text-left text-gray-600 font-semibold w-12"></th>
                        <th className="px-4 py-3 text-left text-gray-600 font-semibold">Student Email</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-semibold">Total Queries</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-semibold">Last Active</th>
                        <th className="px-4 py-3 text-center text-gray-600 font-semibold w-32">Status</th>
                        <th className="px-4 py-3 text-center text-gray-600 font-semibold w-32">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupedQueriesArray.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-400">No Queries Found.</td></tr>}
                      {groupedQueriesArray.slice((queryCurrentPage - 1) * queryDisplayCount, queryCurrentPage * queryDisplayCount).map((group) => {
                        const isBlocked = blockedEmails.includes(group.email);
                        const isExpanded = expandedEmails.has(group.email);
                        const isBlockLoading = blockLoadingEmail === group.email;
                        const hasNewQuery = newStudentQueryEmails.has(normalizeQueryEmail(group.email));
                        return (
                          <React.Fragment key={group.email}>
                            <tr className={`transition-colors cursor-pointer ${isExpanded ? "bg-blue-50/40" : "bg-white hover:bg-gray-50"}`} onClick={() => { rememberStudentQueryEmail(group.email); toggleEmailExpanded(group.email); }}>
                              <td className="px-4 py-3 text-gray-400 text-center">
                                {isExpanded ? <FiChevronDown className="w-5 h-5 text-[#05488B]" /> : <FiChevronRight className="w-5 h-5" />}
                              </td>
                              <td className="px-4 py-3 text-gray-800 font-bold text-base">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="truncate">{group.email}</span>
                                  {hasNewQuery && (
                                    <img src={newQueryGif} alt="New query" className="h-8 w-8 shrink-0 object-contain" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold text-xs">
                                  {group.totalCount} Queries
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{group.lastActiveDate}</td>
                              <td className="px-4 py-3 text-center">
                                {isBlocked ? (
                                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">Blocked</span>
                                ) : (
                                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">Active</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                {!canBlockAssistant ? (
                                  <span className="text-xs font-semibold text-gray-400">View only</span>
                                ) : isBlocked ? (
                                  <button onClick={() => handleUnblockUser(group.email)} disabled={isBlockLoading} className="bg-white border border-green-500 text-green-600 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-50 transition-colors shadow-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-wait">{isBlockLoading ? "Unblocking..." : "Unblock Access"}</button>
                                ) : (
                                  <button onClick={() => handleBlockUser(group.email)} disabled={isBlockLoading} className="bg-white border border-red-500 text-[#E31E24] px-4 py-1.5 rounded-md text-xs font-bold hover:bg-red-50 transition-colors shadow-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-wait">{isBlockLoading ? "Blocking..." : "Block Access"}</button>
                                )}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan="6" className="p-0 border-b border-gray-200">
                                  <div className="bg-gray-50 px-6 py-4 shadow-inner">
                                    <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Query History for {group.email}</h3>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                      <table className="w-full text-sm">
                                        <thead className="bg-gray-100 border-b border-gray-200">
                                          <tr>
                                            <th className="px-4 py-2 text-left text-gray-500 font-semibold w-1/4">Date & Time</th>
                                            <th className="px-4 py-2 text-left text-gray-500 font-semibold w-1/3">Question Asked</th>
                                            <th className="px-4 py-2 text-center text-gray-500 font-semibold">Status</th>
                                            <th className="px-4 py-2 text-left text-gray-500 font-semibold">Result Served</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {group.queries.map((q) => (
                                            <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                                              <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{q.date}</td>
                                              <td className="px-4 py-2.5 text-gray-800 italic">"{q.question}"</td>
                                              <td className="px-4 py-2.5 text-center">
                                                <span className={`inline-flex items-center rounded-full text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider ${q.status === 'found' ? 'bg-green-100 text-green-700' : q.status === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                  {q.status}
                                                </span>
                                              </td>
                                              <td className="px-4 py-2.5 text-[#05488b] font-medium">{q.paperName || "-"}</td>
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
                <PaginationFooter total={groupedQueriesArray.length} currentPage={queryCurrentPage} displayCount={queryDisplayCount} setCurrentPage={setQueryCurrentPage} setDisplayCount={setQueryDisplayCount} />
              </div>
            </>  );
}

import { PaginationFooter } from "./AdminShared";

export default function AssistantSettingsPanel({
  canCreateReplies,
  editingReplyKeyword,
  draftReplies,
  setDraftReplies,
  isSavingReplies,
  handleAddReplies,
  customReplies,
  replyCurrentPage,
  replyDisplayCount,
  isLoading,
  setEditingReplyKeyword,
  canDeleteReplies,
  handleDeleteReply,
  setReplyCurrentPage,
  setReplyDisplayCount
}) {
  return (<div className="flex flex-col gap-6 h-full">
              {(canCreateReplies || editingReplyKeyword) && <div className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-visible">
                 <div className="px-4 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                   <h2 className="text-lg font-bold text-[#05488b]">{editingReplyKeyword && !canCreateReplies ? "Edit Custom AI Reply" : "Add Custom AI Reply"}</h2>
                 </div>
                 <div className="p-4 flex flex-col gap-3">
                    {draftReplies.map((draft, idx) => (
                       <div key={idx} className="flex flex-col md:flex-row gap-3 items-center w-full">
                          <input value={draft.keyword} onChange={e => { const newDrafts = [...draftReplies]; newDrafts[idx].keyword = e.target.value; setDraftReplies(newDrafts); }} disabled={!canCreateReplies} placeholder="Trigger Keyword (e.g., 'library', 'hod')" className="w-full md:w-64 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#ffc107] disabled:bg-gray-50 disabled:text-gray-500" />
                          <input value={draft.reply} onChange={e => { const newDrafts = [...draftReplies]; newDrafts[idx].reply = e.target.value; setDraftReplies(newDrafts); }} placeholder="Assistant Reply Message..." className="w-full flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#ffc107]" />
                          {canCreateReplies && draftReplies.length > 1 && (
                            <button onClick={() => { const newDrafts = draftReplies.filter((_, i) => i !== idx); setDraftReplies(newDrafts); }} className="text-red-500 hover:text-red-700 font-bold px-4 py-2 bg-red-50 rounded-lg transition-colors whitespace-nowrap">X</button>
                          )}
                       </div>
                    ))}
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-2 gap-3 sm:gap-0">
                       {canCreateReplies && <button onClick={() => setDraftReplies([...draftReplies, { keyword: "", reply: "" }])} className="w-full sm:w-auto text-[#05488B] hover:text-[#043a70] font-bold px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap">+ Add Another</button>}
                       <button onClick={handleAddReplies} disabled={isSavingReplies || draftReplies.every(r => !r.keyword.trim() || !r.reply.trim()) || (!canCreateReplies && !editingReplyKeyword)} className="w-full sm:w-auto bg-[#05488B] hover:bg-[#043a70] text-white px-8 py-2 rounded-lg font-medium shadow-sm disabled:opacity-50 transition-colors whitespace-nowrap">{isSavingReplies ? "Saving..." : "Save Replies"}</button>
                    </div>
                 </div>
              </div>}

              <div className="border border-gray-200 rounded-xl shadow-sm bg-white">
                 <div className="px-4 py-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl">
                   <h2 className="text-lg font-bold text-[#05488b]">Existing Custom Replies</h2>
                 </div>
                 <div className="w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-[#ffc107] flex-1">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b-2 border-gray-100 bg-gray-50">
                        <th className="px-4 py-3 text-left text-gray-600 font-semibold w-1/4">Trigger Keyword</th>
                        <th className="px-4 py-3 text-left text-gray-600 font-semibold w-2/4">Reply Message</th>
                        <th className="px-4 py-3 text-center text-gray-600 font-semibold w-1/4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {customReplies.length === 0 && <tr><td colSpan="3" className="text-center py-8 text-gray-400">No Custom Replies Added Yet.</td></tr>}
                      {customReplies.slice((replyCurrentPage - 1) * replyDisplayCount, replyCurrentPage * replyDisplayCount).map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3 text-gray-800 font-bold">"{r.keyword}"</td>
                          <td className="px-4 py-3 text-gray-600 italic">{r.reply}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => {
                                  setDraftReplies([{ keyword: r.keyword, reply: r.reply }]);
                                  setEditingReplyKeyword(r.keyword);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }} 
                                disabled={isLoading} 
                                className="text-[#05488B] hover:text-[#043a70] font-bold px-4 py-1.5 bg-blue-50 hover:bg-blue-100 shadow-sm rounded-md transition-colors"
                              >
                                Edit
                              </button>
                              {canDeleteReplies && <button 
                                onClick={() => handleDeleteReply(r.keyword)} 
                                disabled={isLoading} 
                                className="text-red-500 hover:text-red-700 font-bold px-4 py-1.5 bg-red-50 hover:bg-red-100 shadow-sm rounded-md transition-colors"
                              >
                                Delete
                              </button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                 </div>
                 <PaginationFooter total={customReplies.length} currentPage={replyCurrentPage} displayCount={replyDisplayCount} setCurrentPage={setReplyCurrentPage} setDisplayCount={setReplyDisplayCount} />
              </div>
            </div>  );
}

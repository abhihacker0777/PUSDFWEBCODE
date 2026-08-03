export default function AdminModals({
  deleteConfirm,
  setDeleteConfirm,
  executeDelete,
  listDeleteConfirm,
  setListDeleteConfirm,
  executeListDelete,
  adminDeleteConfirm,
  setAdminDeleteConfirm,
  executeAdminDelete,
  syncConfirm,
  setSyncConfirm,
  executeSync,
  clearLogsConfirm,
  setClearLogsConfirm,
  executeClearLogs,
  clearSelectedConfirm,
  setClearSelectedConfirm,
  executeClearSelected
}) {
  return (
    <>{deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all border-t-8 border-red-500">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Are You Sure?</h2>
            <p className="text-gray-600 mb-8 text-base">Do You Really Want To Permanently Delete <br/><span className="font-bold text-red-600 text-lg">"{deleteConfirm.paperName}"</span><br/>From The Database?</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button onClick={() => setDeleteConfirm({ show: false, paperName: "" })} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-bold transition-colors w-full">❌ Cancel</button>
              <button onClick={() => { setDeleteConfirm({ show: false, paperName: "" }); executeDelete(); }} className="bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full">🗑️ Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {listDeleteConfirm?.show && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all border-t-8 border-red-500">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Are You Sure?</h2>
            <p className="text-gray-600 mb-8 text-base">Do You Really Want To Permanently Delete <br/><span className="font-bold text-red-600 text-lg">"{listDeleteConfirm.row?.name}"</span><br/>From The Database?</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button onClick={() => setListDeleteConfirm({ show: false, row: null })} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-bold transition-colors w-full">❌ Cancel</button>
              <button onClick={executeListDelete} className="bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full">🗑️ Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {adminDeleteConfirm?.show && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all border-t-8 border-red-500">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Are You Sure?</h2>
            <p className="text-gray-600 mb-8 text-base">Do You Really Want To Permanently Delete <br/><span className="inline-block max-w-full break-words font-bold text-red-600 text-lg">"{adminDeleteConfirm.user?.displayName || adminDeleteConfirm.user?.loginIdentifier}"</span><br/>Admin Account?</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button onClick={() => setAdminDeleteConfirm({ show: false, user: null })} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-bold transition-colors w-full">❌ Cancel</button>
              <button onClick={executeAdminDelete} className="bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full">🗑️ Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {syncConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all ">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Replace ALL live papers from the sheet?</h2>
            <p className="text-gray-600 mb-8 text-base">This deletes every paper currently on the site and replaces the whole list with whatever is in the Google Sheet backup right now. Any recent changes not yet reflected in the sheet will be lost.<br/><br/>Only use this to recover from a data problem &mdash; not as a normal "publish" action.<br/><br/><span className="font-bold text-amber-700 text-lg">Click: Yes, Replace Everything</span><br/>Or Click <br/><span className="font-bold text-black text-lg">No, Wait</span></p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button onClick={() => setSyncConfirm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-bold transition-colors w-full">✋ No, Wait</button>
              <button onClick={executeSync} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full">⚠️ Yes, Replace Everything</button>
            </div>
          </div>
        </div>
      )}

      {clearLogsConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Clear All Logs?</h2>
            <p className="text-gray-600 mb-8 text-base">Are You Sure You Want To Permanently Clear Logs For Everyone? <br/><span className="font-bold text-red-600 text-lg block mt-2">Click: Yes, Clear</span>Or To Cancel Please Click On <br/><span className="font-bold text-black text-lg">No, Wait</span></p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button onClick={() => setClearLogsConfirm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-bold transition-colors w-full">✋ No, Wait</button>
              <button onClick={executeClearLogs} className="bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full">🧹 Yes, Clear</button>
            </div>
          </div>
        </div>
      )}

      {clearSelectedConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Clear Selected Logs?</h2>
            <p className="text-gray-600 mb-8 text-base">Are You Sure You Want To Permanently Clear Selected Logs<br/><span className="font-bold text-red-600 text-lg block mt-2">Click: Yes, Clear</span>Or To Cancel Please Click On <br/><span className="font-bold text-black text-lg">No, Wait</span></p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button onClick={() => setClearSelectedConfirm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-bold transition-colors w-full">No, Wait</button>
              <button onClick={executeClearSelected} className="bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full">Yes, Clear</button>
            </div>
          </div>
        </div>
      )}    </>
  );
}

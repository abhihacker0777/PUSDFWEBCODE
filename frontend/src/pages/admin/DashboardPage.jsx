import { cleanStatusMessage, isErrorStatus } from "./adminHelpers";
import { CustomDropdown } from "./AdminShared";
const DashboardPage = ({
  fileName, setFile, setFileName, courses, years, specs, semesters, exams, papers, course, setCourse, year, setYear, spec, setSpec, semester, setSemester, exam, setExam, paper, setPaper, paperName, setPaperName, handleUpload, handleDelete, handleSyncToWebsite, openDropdown, setOpenDropdown, setSelectedPaperIndex, fileError, setFileError, isLoading, uploadStatus, setUploadStatus, deleteStatus, canCreatePapers, canDeletePapers, canSyncPapers, canUploadFiles
}) => (
  <div className="w-full">
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 w-full border relative">
      <div className="space-y-4 flex flex-col items-center">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-xl">
            <div className="w-8 h-8 border-4 border-[#05488B] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 font-bold text-[#05488B]">⏳ Processing...</span>
          </div>
        )}

        {canUploadFiles && <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
          <input 
            type="file" id="fileUpload" className="hidden"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => { 
              const selectedFile = e.target.files[0];
              if (selectedFile) { 
                const fileNameLower = selectedFile.name.toLowerCase();
                if (fileNameLower.endsWith('.pdf') || fileNameLower.endsWith('.docx')) {
                  setFile(selectedFile); setFileName(selectedFile.name); setFileError(false); 
                } else {
                  setUploadStatus("Error: Invalid File! .PDF or .DOCX only.");
                  setTimeout(() => setUploadStatus(""), 4000);
                  e.target.value = ""; 
                }
              } 
            }}
          />
          <label htmlFor="fileUpload" className="bg-[#05488B] hover:bg-[#215ea0] text-[#ffc107] px-6 py-2 rounded-lg cursor-pointer shadow w-full sm:w-auto text-center font-medium">📁 Choose File</label>
          {fileName !== "No file chosen" && (
            <div className="flex items-center justify-between gap-2 bg-gray-100 px-4 py-1.5 rounded-md w-full sm:w-auto">
              <span className="text-sm text-gray-600 max-w-[150px] truncate">{fileName}</span>
              <button onClick={() => { setFileName("No file chosen"); setFile(null); document.getElementById("fileUpload").value = ""; }} className="text-red-500 hover:text-red-700 text-sm font-bold">❌</button>
            </div>
          )}
        </div>}

        <div className="w-full p-4 rounded-xl border shadow-sm overflow-visible relative z-30" style={{ backgroundColor: "#E31E24" }}>
          <div className="flex flex-col gap-4 overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CustomDropdown id="course" label="Course" options={courses} value={course} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[149px]" setValue={(val) => { setCourse(val); setYear(""); setSpec(""); setSemester(""); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              <CustomDropdown id="year" label="Year" options={years} value={year} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[149px]" setValue={(val) => { setYear(val); setSemester(""); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              <CustomDropdown id="spec" label="Specialization" options={specs} value={spec} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[149px]" setValue={(val) => { setSpec(val); setSemester(""); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 overflow-visible">
              <CustomDropdown id="sem" label="Semester" options={semesters} value={semester} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[92px]" setValue={(val) => { setSemester(val); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              <CustomDropdown id="exam" label="Exam" options={exams} value={exam} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[92px]" setValue={(val) => { setExam(val); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              <CustomDropdown id="paper" label="Select to Update" disabled={!exam} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[92px]" options={[...(canCreatePapers ? ["🆕 Create New"] : []), ...papers.map(p => p.name)]} value={paper} setValue={(val) => { if (val === "🆕 Create New") { setPaper("Paper Name ➡️"); setPaperName(""); setSelectedPaperIndex(null); } else { const sel = papers.find(p => p.name === val); setPaper(val); setPaperName(val); setSelectedPaperIndex(sel ? sel.index : null); } }} />
              <input type="text" placeholder="Paper Name" value={paperName} disabled={!paper} onChange={(e) => setPaperName(e.target.value)} className={`w-full border rounded-lg px-4 py-2 text-base font-medium shadow-sm outline-none transition-all placeholder:text-[#374151] ${!paper ? "bg-white cursor-not-allowed" : "bg-white border-[#ffc107]"} ${paperName ? "text-[#215ea0]" : "text-[#374151]"}`} />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between w-full mt-4 relative z-10 px-2 gap-4 lg:gap-0">
          <div className="w-full lg:flex-1 flex items-center justify-center lg:justify-start min-h-[30px] order-2 lg:order-1">
            {fileError && <span className="text-[14px] md:text-[15px] font-medium text-[#0d9488] tracking-wide"><span className="text-[#f43f5e] font-bold mr-1">❌</span> Please Select A File</span>}
            {uploadStatus && !fileError && <span className="text-[14px] md:text-[15px] font-medium text-[#0d9488] tracking-wide"><span className={isErrorStatus(uploadStatus) ? "text-[#f43f5e] font-bold mr-1" : "text-[#22c55e] font-bold mr-1"}>{isErrorStatus(uploadStatus) ? "❌" : "✅"}</span>{cleanStatusMessage(uploadStatus)}</span>}
            {deleteStatus && !fileError && !uploadStatus && <span className="text-[14px] md:text-[15px] font-medium text-[#0d9488] tracking-wide"><span className={isErrorStatus(deleteStatus) ? "text-[#f43f5e] font-bold mr-1" : "text-[#22c55e] font-bold mr-1"}>{isErrorStatus(deleteStatus) ? "❌" : "✅"}</span>{cleanStatusMessage(deleteStatus)}</span>}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6 w-full lg:w-auto order-1 lg:order-2">
            <button onClick={handleUpload} className="w-full sm:w-auto bg-[#05488B] hover:bg-[#215ea0] text-[#ffc107] px-6 py-2 rounded shadow-sm font-medium">{canCreatePapers ? "📤 Upload & Update" : "Update Data"}</button>
            {canDeletePapers && <button onClick={handleDelete} className="w-full sm:w-auto bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2 rounded shadow-sm font-medium">🗑️ Delete</button>}
          </div>
          <div className="w-full lg:flex-1 flex items-center justify-center lg:justify-end order-3">
             {canSyncPapers && <button onClick={handleSyncToWebsite} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded shadow-sm font-medium transition-colors" title="Deletes every paper in the live database and replaces it with whatever is currently in the Google Sheet backup.">⚠️ Restore From Sheet Backup</button>}
          </div>
        </div>
      </div>
    </div>
  </div>
);


export default DashboardPage;

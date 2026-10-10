import React from "react";
import { Loader2 } from "lucide-react";
import { cleanStatusMessage, isErrorStatus } from "./utils/adminHelpers";
import { CustomDropdown } from "./utils/AdminShared";

export interface DashboardPageProps {
  fileName: string;
  setFile: (file: File | null) => void;
  setFileName: (name: string) => void;
  directLink?: string;
  setDirectLink?: (link: string) => void;
  courses: any[];
  years: any[];
  specs: any[];
  semesters: any[];
  exams: any[];
  papers: any[];
  course: string;
  setCourse: (course: string) => void;
  year: string;
  setYear: (year: string) => void;
  spec: string;
  setSpec: (spec: string) => void;
  semester: string;
  setSemester: (sem: string) => void;
  exam: string;
  setExam: (exam: string) => void;
  paper: string;
  setPaper: (paper: string) => void;
  paperName: string;
  setPaperName: (name: string) => void;
  handleUpload: () => Promise<void>;
  handleDelete: () => void;
  handleSyncToWebsite: () => void;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  setSelectedPaperIndex: (index: any) => void;
  fileError: boolean;
  setFileError: (err: boolean) => void;
  isLoading: boolean;
  uploadStatus: string;
  setUploadStatus: (status: string) => void;
  deleteStatus: string;
  canCreatePapers: boolean;
  canEditPapers: boolean;
  canDeletePapers: boolean;
  canSyncPapers: boolean;
  canUploadFiles: boolean;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  fileName, setFile, setFileName, directLink, setDirectLink, courses, years, specs, semesters, exams, papers, course, setCourse, year, setYear, spec, setSpec, semester, setSemester, exam, setExam, paper, setPaper, paperName, setPaperName, handleUpload, handleDelete, handleSyncToWebsite, openDropdown, setOpenDropdown, setSelectedPaperIndex, fileError, setFileError, isLoading, uploadStatus, setUploadStatus, deleteStatus, canCreatePapers, canEditPapers, canDeletePapers, canSyncPapers, canUploadFiles
}) => {
  return (
  <div className="w-full">
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 w-full border relative">
      <div className="space-y-3.5 flex flex-col items-center">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center rounded-xl backdrop-blur-sm">
            <Loader2 className="w-6 h-6 text-[#05488B] animate-spin shrink-0" />
            <span className="ml-2.5 text-sm font-bold text-[#05488B]">Processing...</span>
          </div>
        )}

        {canUploadFiles && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full">
            <input
              type="file" id="fileUpload" className="hidden"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  const fileNameLower = selectedFile.name.toLowerCase();
                  if (fileNameLower.endsWith('.pdf') || fileNameLower.endsWith('.docx')) {
                    setFile(selectedFile); setFileName(selectedFile.name); setFileError(false);
                    if (setDirectLink) setDirectLink("");
                  } else {
                    setUploadStatus("Error: Invalid File! .PDF or .DOCX only.");
                    setTimeout(() => setUploadStatus(""), 4000);
                    e.target.value = "";
                  }
                }
              }}
            />
            <label htmlFor="fileUpload" className="bg-[#05488B] hover:bg-[#215ea0] text-[#ffc107] px-5 py-2 rounded-lg cursor-pointer shadow text-center font-medium text-sm flex items-center justify-center gap-1.5 shrink-0 transition-colors">
              📁 Choose File
            </label>

            {fileName !== "No file chosen" ? (
              <div className="flex items-center justify-between gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-700 max-w-[200px] truncate font-medium">📄 {fileName}</span>
                <button type="button" onClick={() => { setFileName("No file chosen"); setFile(null); const el = document.getElementById("fileUpload") as HTMLInputElement | null; if (el) el.value = ""; }} className="text-red-500 hover:text-red-700 text-xs font-bold ml-1">❌</button>
              </div>
            ) : (
              <>
                <span className="text-xs text-gray-400 font-bold uppercase shrink-0 py-0.5">OR</span>
                <div className="relative w-full sm:max-w-md">
                  <input
                    type="url"
                    placeholder="Paste PDF / DOCX Link (e.g. Google Drive link)..."
                    value={directLink || ""}
                    onChange={(e) => {
                      setDirectLink?.(e.target.value);
                      if (e.target.value.trim()) setFileError(false);
                    }}
                    className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 focus:border-[#05488B] text-gray-800 placeholder-gray-400 px-3 py-1.5 text-xs sm:text-sm rounded-lg shadow-sm outline-none transition-all pr-7"
                  />
                  {directLink && (
                    <button
                      type="button"
                      onClick={() => setDirectLink?.("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-xs font-bold"
                      title="Clear link"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="w-full p-4 rounded-xl border shadow-sm overflow-visible relative z-30" style={{ backgroundColor: "#E31E24" }}>
          <div className="flex flex-col gap-4 overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CustomDropdown id="course" label="Course" topOffset={14} options={courses} value={course} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[149px]" setValue={(val) => { setCourse(val); setYear(""); setSpec(""); setSemester(""); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              <CustomDropdown id="year" label="Year" topOffset={14} options={years} value={year} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[149px]" setValue={(val) => { setYear(val); setSemester(""); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              <CustomDropdown id="spec" label="Specialization" topOffset={14} options={specs} value={spec} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[149px]" setValue={(val) => { setSpec(val); setSemester(""); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 overflow-visible">
              <CustomDropdown id="sem" label="Semester" topOffset={13} options={semesters} value={semester} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[92px]" setValue={(val) => { setSemester(val); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              <CustomDropdown id="exam" label="Exam" topOffset={13} options={exams} value={exam} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[92px]" setValue={(val) => { setExam(val); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              <CustomDropdown id="paper" label="Select to Update" topOffset={6} searchable disabled={!exam} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[92px]" options={[...(canCreatePapers ? ["🆕 Create New"] : []), ...papers.map(p => p.name)]} value={paper} setValue={(val) => { if (val === "🆕 Create New") { setPaper("Paper Name ➡️"); setPaperName(""); setSelectedPaperIndex(null); } else { const sel = papers.find(p => p.name === val); setPaper(val); setPaperName(val); setSelectedPaperIndex(sel ? sel.index : null); } }} />
              <input type="text" placeholder="Paper Name" value={paperName} disabled={!paper} onChange={(e) => setPaperName(e.target.value)} className={`w-full border rounded-lg px-4 py-2 text-base font-medium shadow-sm outline-none transition-all placeholder:text-[#374151] ${!paper ? "bg-white cursor-not-allowed" : "bg-white border-[#ffc107]"} ${paperName ? "text-[#215ea0]" : "text-[#374151]"}`} />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between w-full mt-4 relative z-10 px-2 gap-4 lg:gap-0">
          <div className="w-full lg:flex-1 flex items-center justify-center lg:justify-start min-h-[30px] order-2 lg:order-1">
            {fileError && <span className="text-[14px] md:text-[15px] font-medium text-[#0d9488] tracking-wide"><span className="text-[#f43f5e] font-bold mr-1">❌</span> Please Select A File or Paste Link</span>}
            {uploadStatus && !fileError && <span className="text-[14px] md:text-[15px] font-medium text-[#0d9488] tracking-wide"><span className={isErrorStatus(uploadStatus) ? "text-[#f43f5e] font-bold mr-1" : "text-[#22c55e] font-bold mr-1"}>{isErrorStatus(uploadStatus) ? "❌" : "✅"}</span>{cleanStatusMessage(uploadStatus)}</span>}
            {deleteStatus && !fileError && !uploadStatus && <span className="text-[14px] md:text-[15px] font-medium text-[#0d9488] tracking-wide"><span className={isErrorStatus(deleteStatus) ? "text-[#f43f5e] font-bold mr-1" : "text-[#22c55e] font-bold mr-1"}>{isErrorStatus(deleteStatus) ? "❌" : "✅"}</span>{cleanStatusMessage(deleteStatus)}</span>}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6 w-full lg:w-auto order-1 lg:order-2">
            {(canCreatePapers || canEditPapers) && <button onClick={handleUpload} className="w-full sm:w-auto bg-[#05488B] hover:bg-[#215ea0] text-[#ffc107] px-6 py-2 rounded shadow-sm font-medium whitespace-nowrap shrink-0">{canCreatePapers ? "📤 Upload & Update" : "Update Data"}</button>}
            {canDeletePapers && <button onClick={handleDelete} className="w-full sm:w-auto bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2 rounded shadow-sm font-medium whitespace-nowrap shrink-0">🗑️ Delete</button>}
          </div>
          <div className="w-full lg:flex-1 flex items-center justify-center lg:justify-end order-3">
            {canSyncPapers && <button onClick={handleSyncToWebsite} className="w-full sm:w-auto text-center bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded shadow-sm font-medium transition-colors whitespace-nowrap shrink-0" title="Deletes every paper in the live database and replaces it with whatever is currently in the Google Sheet backup.">⚠️ Restore From Sheet Backup</button>}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default DashboardPage;

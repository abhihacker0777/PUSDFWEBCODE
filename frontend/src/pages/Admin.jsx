import React, { useState, useEffect } from "react";
import logo from "../assets/puupdatelogo.png";
import { FiHome, FiFileText, FiLogOut, FiMessageCircle, FiSettings, FiChevronDown, FiChevronRight } from "react-icons/fi";
import coverImg from "../assets/pucoverlogo.webp";
import { BACKEND_URL, clearPaperCaches as clearClientPaperCaches, csrfFetch } from "../services/api";

const clearPapersCache = () => {
  clearClientPaperCaches();
  sessionStorage.removeItem("papersCache");
  sessionStorage.removeItem("papersCacheTime");
  sessionStorage.removeItem("papersCacheVersion");
};

const isErrorStatus = (message = "") =>
  /error|failed|invalid|required|select|too many|exceed|not connected|rejected|only pdf|permitted/i.test(message);

const cleanStatusMessage = (message = "") =>
  String(message)
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/^(Error|Success):\s*/i, "")
    .trim();

const readApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }
  return { message: await response.text() };
};

const isAdminSessionExpired = (response) => response.status === 401 || response.status === 403;
const goToLogin = () => {
  window.location.href = "/login";
};

const courseSequence = ["B.Arch", "B.Com", "B.Des", "B.Sc", "B.Tech", "BA", "BBA", "BCA", "BVA", "M.Plan", "M.Tech", "MA", "MBA", "MCA", "MPH", "MVA", "Ph.D", "PIHM"];
const yearSequence = ["1 Year", "2 Year", "3 Year", "4 Year", "5 Year"];
const semesterSequence = ["1 Sem", "2 Sem", "3 Sem", "4 Sem", "5 Sem", "6 Sem", "7 Sem", "8 Sem", "9 Sem", "10 Sem"];
const examSequence = ["MSE", "ESE"];
const ADD_COURSE = "+ Add New Course";
const ADD_YEAR = "+ Add New Year";
const ADD_SPEC = "+ Add New Specialization";
const ADD_SEMESTER = "+ Add New Semester";

const uniqueList = (values) => [...new Set(values.filter(Boolean))];

const orderBySequence = (values, sequence) => {
  const known = sequence.filter((item) => values.includes(item));
  const unknown = values.filter((item) => !sequence.includes(item)).sort((a, b) => a.localeCompare(b));
  return [...known, ...unknown];
};

const appendAddOption = (values, addOption) => values.includes(addOption) ? values : [...values, addOption];

const defaultSemestersForYear = (selectedYear) => {
  const yearNumber = Number.parseInt(selectedYear, 10);
  if (!Number.isFinite(yearNumber) || yearNumber < 1) return [];
  const firstSemester = (yearNumber - 1) * 2 + 1;
  return [`${firstSemester} Sem`, `${firstSemester + 1} Sem`]
    .filter((item) => semesterSequence.includes(item));
};

const scopedKey = (...parts) => parts.map((part) => String(part || "").trim().toLowerCase()).join("||");

const notifyPapersUpdated = () => {
  const payload = String(Date.now());
  try { localStorage.setItem("papers.updated", payload); } catch { /* storage can be unavailable */ }
  try { window.dispatchEvent(new Event("papers-updated")); } catch { /* event dispatch can be unavailable */ }
  try {
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel("papers-updated");
      channel.postMessage(payload);
      channel.close();
    }
  } catch { /* broadcast can be unavailable */ }
};

const SearchIcon = () => <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>;
const FilterLinesIcon = () => <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M10 18h4" /></svg>;
const ChevronDownIcon = () => <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>;
const ChevronLeftIcon = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>;
const DotsIcon = () => <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="16" cy="10" r="1.5" /></svg>;

const PoornimaLogo = () => (
  <div className="flex flex-col items-center justify-center py-2 md:py-6 px-2 mb-0 md:mb-2 border-b-0 md:border-b border-white/20">
    <img src={logo} alt="Poornima University Logo" className="w-24 md:w-40 h-auto object-contain" />
  </div>
);

// --- UNIFIED PAGINATION COMPONENT ---
const PaginationFooter = ({ total, currentPage, displayCount, setCurrentPage, setDisplayCount }) => {
  const totalPages = Math.ceil(total / displayCount) || 1;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-white rounded-b-xl gap-2 sm:gap-0 mt-auto">
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

const CustomDropdown = ({ id, label, options, value, setValue, openDropdown, setOpenDropdown, disabled, customWidth, customHeight }) => {
  const isOpen = openDropdown === id && !disabled; 
  const [isAdding, setIsAdding] = useState(false);
  const [draftValue, setDraftValue] = useState("");

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

  if (isAdding) {
    return (
      <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
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

  return (
    <div className="relative w-full">
      <button
        type="button" disabled={disabled}
        onClick={(e) => { e.stopPropagation(); if (!disabled) setOpenDropdown(isOpen ? null : id); }}
        className={`w-full border rounded-lg px-4 py-2 text-base font-medium text-center shadow-sm transition-colors ${disabled ? "bg-white text-[#374151] cursor-not-allowed whitespace-nowrap" : value ? "bg-white border-[#ffc107] text-[#215ea0] truncate" : "bg-white border-[#ffc107] text-[#374151] hover:bg-gray-50 whitespace-nowrap"}`}
        title={value || label}
      >
        {value || label}
      </button>
      {isOpen && (
        <div className={`absolute left-0 top-full mt-1 bg-[#cbe0fe] rounded-lg shadow-2xl z-[9999] border border-blue-200 overflow-hidden ${customWidth ? customWidth : 'w-full'}`}>
          <div className={`${customHeight ? customHeight : 'max-h-[150px]'} overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc107] [&::-webkit-scrollbar-thumb]:rounded-full`}>
            {(options || []).map((item, i) => (
              <button type="button" key={i} onClick={() => { if (String(item).startsWith("+ Add New")) { setDraftValue(""); setIsAdding(true); } else { setValue(item); } setOpenDropdown(null); }} className="w-full text-left px-4 py-3 hover:bg-blue-300 cursor-pointer text-sm md:text-base text-gray-800 transition-colors border-b border-blue-200/50 last:border-0" title={item}>
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardPage = ({
  fileName, setFile, setFileName, courses, years, specs, semesters, exams, papers, course, setCourse, year, setYear, spec, setSpec, semester, setSemester, exam, setExam, paper, setPaper, paperName, setPaperName, handleUpload, handleDelete, handleSyncToWebsite, openDropdown, setOpenDropdown, setSelectedPaperIndex, fileError, setFileError, isLoading, uploadStatus, setUploadStatus, deleteStatus
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
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
        </div>

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
              <CustomDropdown id="paper" label="Select to Update" disabled={!exam} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[92px]" options={["🆕 Create New", ...papers.map(p => p.name)]} value={paper} setValue={(val) => { if (val === "🆕 Create New") { setPaper("Paper Name ➡️"); setPaperName(""); setSelectedPaperIndex(null); } else { const sel = papers.find(p => p.name === val); setPaper(val); setPaperName(val); setSelectedPaperIndex(sel ? sel.index : null); } }} />
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
            <button onClick={handleUpload} className="w-full sm:w-auto bg-[#05488B] hover:bg-[#215ea0] text-[#ffc107] px-6 py-2 rounded shadow-sm font-medium">📤 Upload & Update</button>
            <button onClick={handleDelete} className="w-full sm:w-auto bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2 rounded shadow-sm font-medium">🗑️ Delete</button>
          </div>
          <div className="w-full lg:flex-1 flex items-center justify-center lg:justify-end order-3">
             <button onClick={handleSyncToWebsite} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow-sm font-medium transition-colors">🔄 Fetch To PU-Site</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function PaperUpdateList() {
  const [allPapers, setAllPapers] = useState([]);
  const [studentQueries, setStudentQueries] = useState([]);
  
  // --- NEW ASSISTANT SETTINGS STATE ---
  const [blockedEmails, setBlockedEmails] = useState([]);
  const [customReplies, setCustomReplies] = useState([]);
  const [draftReplies, setDraftReplies] = useState([{ keyword: "", reply: "" }]);
  
  // --- EXPANDABLE ROW STATE ---
  const [expandedEmails, setExpandedEmails] = useState(new Set());

  // --- PAGINATION STATES ---
  const [querySearch, setQuerySearch] = useState("");
  const [querySortType, setQuerySortType] = useState("new");
  const [showQueryFilter, setShowQueryFilter] = useState(false);
  const [queryCurrentPage, setQueryCurrentPage] = useState(1);
  const [queryDisplayCount, setQueryDisplayCount] = useState(10);
  
  const [replyCurrentPage, setReplyCurrentPage] = useState(1);
  const [replyDisplayCount, setReplyDisplayCount] = useState(10);
  
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [spec, setSpec] = useState("");
  const [semester, setSemester] = useState("");
  const [exam, setExam] = useState("");
  const [paper, setPaper] = useState("");        
  const [paperName, setPaperName] = useState(""); 
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");
  const [file, setFile] = useState(null);
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayCount, setDisplayCount] = useState(10);
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showFilter, setShowFilter] = useState(false);
  const [sortType, setSortType] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openAction, setOpenAction] = useState(null);
  const [actionLog, setActionLog] = useState([]);
  const [fileError, setFileError] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, paperName: "" });
  const [listDeleteConfirm, setListDeleteConfirm] = useState({ show: false, row: null });
  const [clearLogsConfirm, setClearLogsConfirm] = useState(false);
  const [clearSelectedConfirm, setClearSelectedConfirm] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [blockLoadingEmail, setBlockLoadingEmail] = useState("");
  const [isSavingReplies, setIsSavingReplies] = useState(false);
  const [syncConfirm, setSyncConfirm] = useState(false);
  const [customSpecsByCourse, setCustomSpecsByCourse] = useState({});
  const [customSemestersByYear, setCustomSemestersByYear] = useState({});

  useEffect(() => setCurrentPage(1), [search, sortType, displayCount]);
  useEffect(() => setQueryCurrentPage(1), [querySearch, querySortType, queryDisplayCount]);
  useEffect(() => setReplyCurrentPage(1), [replyDisplayCount]);

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/papers`, { credentials: "include", cache: "no-store" });
      if (isAdminSessionExpired(res)) { goToLogin(); return false; }
      if (res.status === 409) {
        const payload = await readApiResponse(res);
        setAllPapers([]); setUploadStatus(`Error: ${cleanStatusMessage(payload.message)}`);
        return false;
      }
      if (res.ok) { setAllPapers(await res.json()); return true; }
    } catch (err) { console.error("Server connecting...", err); }
    return false;
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/logs`, { credentials: "include", cache: "no-store" });
      if (isAdminSessionExpired(res)) return goToLogin();
      if (res.ok) setActionLog(await res.json());
    } catch (err) { console.error("Server connecting...", err); }
  };

  const fetchSettings = async () => {
    try {
      const [blockRes, repRes] = await Promise.all([
        fetch(`${BACKEND_URL}/admin/settings/blocked`, { credentials: "include", cache: "no-store" }),
        fetch(`${BACKEND_URL}/admin/settings/replies`, { credentials: "include", cache: "no-store" })
      ]);
      if (blockRes.ok) setBlockedEmails(await blockRes.json());
      if (repRes.ok) setCustomReplies(await repRes.json());
    } catch (err) { console.error("Settings fetch failed", err); }
  };

  useEffect(() => { 
    let isPolling = false;
    const loadData = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        await fetchPapers(); 
        await fetchLogs();
        await fetchSettings();
        const queryRes = await fetch(`${BACKEND_URL}/admin/queries`, { credentials: "include", cache: "no-store" });
        if (queryRes.ok) setStudentQueries(await queryRes.json());
      } catch (error) {
        console.error("Dashboard polling failed:", error);
      } finally { isPolling = false; }
    };

    loadData();
    const intervalId = setInterval(loadData, 30000); 
    
    const closeAll = () => { setOpenDropdown(null); setOpenAction(null); setShowAllMenu(false); setShowFilter(false); setShowQueryFilter(false); };
    window.addEventListener("click", closeAll);
    return () => { clearInterval(intervalId); window.removeEventListener("click", closeAll); };
  }, []);

  // --- NEW ASSISTANT MUTATION FUNCTIONS ---
  const handleBlockUser = async (email) => {
    setBlockLoadingEmail(email);
    try {
      await csrfFetch(`${BACKEND_URL}/admin/settings/block`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      await fetchSettings();
    } finally {
      setBlockLoadingEmail("");
    }
  };

  const handleUnblockUser = async (email) => {
    setBlockLoadingEmail(email);
    try {
      await csrfFetch(`${BACKEND_URL}/admin/settings/unblock`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      await fetchSettings();
    } finally {
      setBlockLoadingEmail("");
    }
  };

  const handleAddReplies = async () => {
    const validReplies = draftReplies.filter(r => r.keyword.trim() && r.reply.trim());
    if (validReplies.length === 0) return;
    
    setIsSavingReplies(true);
    try {
      for (const r of validReplies) {
        await csrfFetch(`${BACKEND_URL}/admin/settings/reply`, { 
          method: "POST", 
          credentials: "include", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ keyword: r.keyword, reply: r.reply }) 
        });
      }
      setDraftReplies([{ keyword: "", reply: "" }]);
      await fetchSettings();
    } finally {
      setIsSavingReplies(false);
    }
  };

  const handleDeleteReply = async (keyword) => {
    setIsLoading(true);
    await csrfFetch(`${BACKEND_URL}/admin/settings/reply/delete`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword }) });
    await fetchSettings();
    setIsLoading(false);
  };
  // ------------------------------------------

  const expectedPaperPayload = (overrides = {}) => ({
    expectedCourse: overrides.course ?? course,
    expectedYear: overrides.year ?? year,
    expectedSpec: overrides.spec ?? spec,
    expectedSem: overrides.sem ?? semester,
    expectedExam: overrides.exam ?? exam,
    expectedName: overrides.name ?? paper
  });

  const appendExpectedPaper = (formData, expected) => {
    Object.entries(expected).forEach(([key, value]) => {
      formData.append(key, value || "");
    });
  };

  const rememberCustomSpec = (value) => {
    const nextValue = String(value || "").trim();
    if (!course || !nextValue) return;
    setCustomSpecsByCourse((prev) => {
      const key = scopedKey(course);
      const existing = prev[key] || [];
      if (existing.includes(nextValue)) return prev;
      return { ...prev, [key]: [...existing, nextValue] };
    });
  };

  const rememberCustomSemester = (value) => {
    const nextValue = String(value || "").trim();
    if (!course || !year || !nextValue) return;
    setCustomSemestersByYear((prev) => {
      const key = scopedKey(course, year);
      const existing = prev[key] || [];
      if (existing.includes(nextValue)) return prev;
      return { ...prev, [key]: [...existing, nextValue] };
    });
  };

  const handleSpecChange = (value) => { rememberCustomSpec(value); setSpec(value); };
  const handleSemesterChange = (value) => { rememberCustomSemester(value); setSemester(value); };

  const handleUpload = async () => {
    if (!file && !selectedPaperIndex) return setFileError(true);
    if (!course || !year || !spec || !semester || !exam || !paperName) {
      setUploadStatus("Error: Please Fill All Fields"); setTimeout(() => setUploadStatus(""), 4000); return;
    }
    
    // Shows the loading circle
    setIsLoading(true); 

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("course", course); formData.append("year", year);
    formData.append("spec", spec); formData.append("sem", semester); formData.append("exam", exam);
    formData.append("name", paperName); 
    if (selectedPaperIndex) {
      formData.append("index", selectedPaperIndex);
      appendExpectedPaper(formData, expectedPaperPayload());
    }

    const currentPaperName = paperName;
    const isUpdating = !!selectedPaperIndex;

    // Trigger the background fetch without awaiting it to lock the screen
    csrfFetch(`${BACKEND_URL}/upload`, { method: "POST", credentials: "include", body: formData })
      .then(async (res) => {
        if (isAdminSessionExpired(res)) return goToLogin();
        const uploadPayload = await readApiResponse(res);
        const uploadMessage = uploadPayload.message || "";
        const uploadFailed = !res.ok || isErrorStatus(uploadMessage);
        
        setUploadStatus(uploadFailed ? `Error: ${cleanStatusMessage(uploadMessage)}` : cleanStatusMessage(uploadMessage));
        setTimeout(() => setUploadStatus(""), 4000);
        if (!res.ok) return;

        const logData = { id: Date.now(), index: selectedPaperIndex, course, spec, name: currentPaperName, semester, year, exam, status: isUpdating ? "Updated" : "Uploaded", date: new Date().toLocaleDateString() };
        setActionLog((prev) => [logData, ...prev]);
        
        csrfFetch(`${BACKEND_URL}/logs`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(logData)
        }).then(fetchLogs).catch((err) => console.error("Log save failed:", err));

        clearPapersCache(); notifyPapersUpdated(); fetchPapers();
      })
      .catch((err) => {
        console.error("Upload failed:", err);
        setUploadStatus("Error: Upload Failed"); setTimeout(() => setUploadStatus(""), 4000);
      });

    // Drops the loading circle in under 1 second and clears the form instantly
    setTimeout(() => {
      setIsLoading(false);
      setFile(null); setFileName("No file chosen"); setPaper(""); setPaperName(""); setSelectedPaperIndex(null);
    }, 600);
  };

  const handleDelete = async () => {
    if (!selectedPaperIndex) { setDeleteStatus("Error: Please Select A Paper"); setTimeout(() => setDeleteStatus(""), 4000); return; }
    setDeleteConfirm({ show: true, paperName: paperName });
  };

  const executeDelete = async () => {
    setIsLoading(true);
    const paperNameToDelete = paperName;
    const indexToDelete = selectedPaperIndex;
    const expected = expectedPaperPayload();
    setDeleteConfirm({ show: false, paperName: "" });

    csrfFetch(`${BACKEND_URL}/delete`, {
      method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index: indexToDelete, ...expected })
    })
    .then(async (res) => {
      if (isAdminSessionExpired(res)) return goToLogin();
      const deletePayload = await readApiResponse(res);
      const deleteMessage = deletePayload.message || "";
      setDeleteStatus(res.ok ? cleanStatusMessage(deleteMessage) : `Error: ${cleanStatusMessage(deleteMessage)}`);
      setTimeout(() => setDeleteStatus(""), 4000);
      if (!res.ok) return;

      await csrfFetch(`${BACKEND_URL}/logs`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Date.now(), index: null, course, spec, name: paperNameToDelete, semester, year, exam, status: "Deleted", date: new Date().toLocaleDateString() })
      });

      clearPapersCache(); notifyPapersUpdated(); fetchPapers(); fetchLogs();
    })
    .catch((error) => {
      console.error("Delete failed:", error);
      setDeleteStatus("Error: Delete Failed"); setTimeout(() => setDeleteStatus(""), 4000);
    });

    setTimeout(() => {
      setIsLoading(false);
      setPaper(""); setPaperName(""); setSelectedPaperIndex(null);
    }, 600);
  };

  const executeClearLogs = async () => {
    setClearLogsConfirm(false); 
    
    // Optimistic UI - clears logs instantly without needing F5
    const oldLogs = [...actionLog];
    setActionLog([]); setSelected(new Set()); setSelectAll(false);

    csrfFetch(`${BACKEND_URL}/logs/clear`, { method: "DELETE", credentials: "include" })
      .then(res => {
        if (isAdminSessionExpired(res)) return goToLogin();
        if (!res.ok) { setActionLog(oldLogs); setDeleteStatus("Error: Clear Logs Failed"); setTimeout(() => setDeleteStatus(""), 4000); }
      })
      .catch(error => { console.error("Clear logs failed:", error); setActionLog(oldLogs); setDeleteStatus("Error: Clear Logs Failed"); setTimeout(() => setDeleteStatus(""), 4000); });
  };
  
  const executeClearSelected = async () => {
    setClearSelectedConfirm(false); 
    
    // Optimistic UI - clears instantly
    const oldLogs = [...actionLog];
    const selectedIds = Array.from(selected);
    setActionLog(prev => prev.filter(log => !selected.has(log.id)));
    setSelected(new Set()); setSelectAll(false);

    csrfFetch(`${BACKEND_URL}/logs/delete`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds })
    })
    .then(res => {
      if (isAdminSessionExpired(res)) return goToLogin();
      if (!res.ok) { setActionLog(oldLogs); setDeleteStatus("Error: Clear Selected Logs Failed"); setTimeout(() => setDeleteStatus(""), 4000); }
    })
    .catch(err => { console.error("Clear selected logs failed:", err); setActionLog(oldLogs); setDeleteStatus("Error: Clear Selected Logs Failed"); setTimeout(() => setDeleteStatus(""), 4000); });
  };

  const executeListDelete = async () => {
    const row = listDeleteConfirm.row;
    if (!row) return;
    setListDeleteConfirm({ show: false, row: null }); 
    setIsLoading(true); 

    if (row.index) {
      csrfFetch(`${BACKEND_URL}/delete`, { 
        method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index: row.index,
          ...expectedPaperPayload({ course: row.course, year: row.year, spec: row.spec, sem: row.semester, exam: row.exam, name: row.name })
        })
      })
      .then(async (res) => {
        if (isAdminSessionExpired(res)) return goToLogin();
        const deletePayload = await readApiResponse(res);
        const deleteMessage = deletePayload.message || "";
        setDeleteStatus(res.ok ? cleanStatusMessage(deleteMessage) : `Error: ${cleanStatusMessage(deleteMessage)}`);
        setTimeout(() => setDeleteStatus(""), 4000);
        if (!res.ok) return;

        await csrfFetch(`${BACKEND_URL}/logs`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: Date.now(), index: null, course: row.course, spec: row.spec, name: row.name, semester: row.semester, year: row.year, exam: row.exam, status: "Deleted", date: new Date().toLocaleDateString() })
        });
        clearPapersCache(); notifyPapersUpdated(); fetchPapers(); fetchLogs();
      })
      .catch(err => { console.error("List delete failed:", err); setDeleteStatus("Error: Delete Failed"); setTimeout(() => setDeleteStatus(""), 4000); });
    } 

    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };
  
  const handleSyncToWebsite = () => setSyncConfirm(true);

  const executeSync = async () => {
    setSyncConfirm(false); setIsLoading(true); 
    try {
      const response = await csrfFetch(`${BACKEND_URL}/sync`, { method: "POST", credentials: "include" });
      if (isAdminSessionExpired(response)) return goToLogin();
      const data = await readApiResponse(response);
      setUploadStatus(data.success ? `Success: ${cleanStatusMessage(data.message)}` : `Error: ${cleanStatusMessage(data.message)}`); 
      setTimeout(() => setUploadStatus(""), 5000); 
      if (response.ok && data.success) { clearPapersCache(); notifyPapersUpdated(); }
    } catch (error) { console.error("Sync failed:", error); setUploadStatus("Error: Sync Failed. Please try again."); setTimeout(() => setUploadStatus(""), 5000); } finally { setIsLoading(false); }
  };

  const courses = appendAddOption(orderBySequence(uniqueList([...allPapers.map(p => p.course), ...courseSequence]), courseSequence), ADD_COURSE);
  const years = course ? appendAddOption(orderBySequence(uniqueList(allPapers.filter(p => p.course === course).map(p => p.year)), yearSequence), ADD_YEAR) : [];
  const customSpecs = customSpecsByCourse[scopedKey(course)] || [];
  const specs = course ? appendAddOption(uniqueList([...allPapers.filter(p => p.course === course).map(p => p.spec), ...customSpecs]).sort((a, b) => a.localeCompare(b)), ADD_SPEC) : [];
  const customSemesters = customSemestersByYear[scopedKey(course, year)] || [];
  const semesters = course && year ? appendAddOption(orderBySequence(uniqueList([...allPapers.filter(p => p.course === course && p.year === year).map(p => p.sem), ...defaultSemestersForYear(year), ...customSemesters]), semesterSequence), ADD_SEMESTER) : [];
  const sheetExams = uniqueList(allPapers.filter(p => p.course === course && p.year === year && p.spec === spec && p.sem === semester).map(p => p.exam));
  const exams = semester ? orderBySequence(uniqueList([...sheetExams, ...examSequence]), examSequence) : [];
  const papers = allPapers.filter(p => p.course === course && p.year === year && p.spec === spec && p.sem === semester && p.exam === exam && p.name);

  // --- FILTERS FOR RECENT ACTION ---
  let filteredLogs = actionLog.filter(r => (r.name ?? "").toLowerCase().includes(search.toLowerCase()) || (r.semester ?? "").toLowerCase().includes(search.toLowerCase()));
  if (sortType === "az") filteredLogs = [...filteredLogs].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  if (sortType === "za") filteredLogs = [...filteredLogs].sort((a, b) => (b.name ?? "").localeCompare(a.name ?? ""));
  if (sortType === "new") filteredLogs = [...filteredLogs].sort((a, b) => b.id - a.id); 
  if (sortType === "old") filteredLogs = [...filteredLogs].sort((a, b) => a.id - b.id); 

  // --- FILTERS & GROUPING FOR STUDENT QUERIES ---
  let processedQueries = studentQueries;
  if (querySearch) {
    processedQueries = processedQueries.filter(q => 
      (q.email ?? "").toLowerCase().includes(querySearch.toLowerCase()) || 
      (q.question ?? "").toLowerCase().includes(querySearch.toLowerCase())
    );
  }

  // GROUP QUERIES BY EMAIL
  const groupedQueriesMap = processedQueries.reduce((acc, q) => {
    const email = String(q.email).toLowerCase();
    if (!acc[email]) acc[email] = [];
    acc[email].push(q);
    return acc;
  }, {});

  // CREATE ARRAY OF GROUPS FOR THE TABLE
  let groupedQueriesArray = Object.entries(groupedQueriesMap).map(([email, queries]) => ({
    email,
    queries,
    totalCount: queries.length,
    lastActiveDate: queries[0]?.date // Assuming the first one is the newest based on earlier sorting
  }));

  if (querySortType === "new") {
    groupedQueriesArray.sort((a, b) => a.queries[0]?.id > b.queries[0]?.id ? -1 : 1);
  } else if (querySortType === "old") {
    groupedQueriesArray.sort((a, b) => a.queries[0]?.id < b.queries[0]?.id ? -1 : 1);
  }

  const toggleEmailExpanded = (email) => {
    setExpandedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectAll) { setSelected(new Set()); setSelectAll(false); }
    else { setSelected(new Set(filteredLogs.map(r => r.id))); setSelectAll(true); }
  };

  const toggleRow = (id) => {
    const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next); setSelectAll(next.size === filteredLogs.length && filteredLogs.length > 0);
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <aside className="w-full md:w-48 flex-shrink-0 flex flex-col items-center md:items-stretch shadow-none md:shadow-lg pt-4 pb-4 md:pb-0 md:pt-4 z-20" style={{ backgroundColor: "#f5a623" }}>
        <PoornimaLogo />
        <div className="hidden md:block px-4 pt-4 pb-1"><span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Dashboard</span></div>
        <nav className="flex-1 px-3 md:px-2 mt-3 md:mt-0 pb-2 md:pb-0 flex flex-row md:flex-col items-center justify-center md:justify-start md:items-stretch space-x-4 md:space-x-0 space-y-0 md:space-y-1 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button onClick={() => setActiveNav("dashboard")} className={`whitespace-nowrap w-auto md:w-full flex items-center justify-center md:justify-start gap-2.5 px-6 md:px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeNav === "dashboard" ? "bg-white text-[#05488b] shadow-md" : "text-black/75 hover:bg-white/15 hover:text-black"}`}><FiHome className={`${activeNav === "dashboard" ? "text-[#05488b]" : ""} w-4 h-4`} /><span>Home</span></button>
          <button onClick={() => setActiveNav("paper")} className={`whitespace-nowrap w-auto md:w-full flex items-center justify-center md:justify-start gap-2.5 px-6 md:px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeNav === "paper" ? "bg-white text-[#05488b] shadow-md" : "text-black/75 hover:bg-white/15 hover:text-black"}`}><FiFileText className={`${activeNav === "paper" ? "text-[#05488b]" : ""} w-4 h-4`} /><span className="text-left leading-tight">Recent Action</span></button>
          <button onClick={() => setActiveNav("queries")} className={`whitespace-nowrap w-auto md:w-full flex items-center justify-center md:justify-start gap-2.5 px-6 md:px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeNav === "queries" ? "bg-white text-[#05488b] shadow-md" : "text-black/75 hover:bg-white/15 hover:text-black"}`}><FiMessageCircle className={`${activeNav === "queries" ? "text-[#05488b]" : ""} w-4 h-4`} /><span className="text-left leading-tight">Student Queries</span></button>
          <button onClick={() => setActiveNav("assistant")} className={`whitespace-nowrap w-auto md:w-full flex items-center justify-center md:justify-start gap-2.5 px-6 md:px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeNav === "assistant" ? "bg-white text-[#05488b] shadow-md" : "text-black/75 hover:bg-white/15 hover:text-black"}`}><FiSettings className={`${activeNav === "assistant" ? "text-[#05488b]" : ""} w-4 h-4`} /><span className="text-left leading-tight">Update Assistant</span></button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-white flex-shrink-0">
          <h1 className="text-base font-bold text-gray-800 tracking-wide">
            {activeNav === "dashboard" ? "Edit Data" : activeNav === "paper" ? "Edited Data" : activeNav === "queries" ? "Student Queries" : "Update Assistant"}
          </h1>
          <button onClick={async () => {
            await csrfFetch(`${BACKEND_URL}/logout`, { method: "POST", credentials: "include" });
            window.location.href = "/login";  
          }} className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-red-500 bg-[#05488b] hover:bg-[#043a70] transition-all"><FiLogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span></button>
        </header>

        <main className="flex-1 overflow-auto px-3 sm:px-5 py-4 bg-gray-100 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track] [&::-webkit-scrollbar-thumb]:bg-[#ffc107] hover:[&::-webkit-scrollbar-thumb]:bg-[#05488B] [&::-webkit-scrollbar-thumb]:rounded-full flex flex-col">
          {activeNav === "dashboard" ? (
            <> 
              <DashboardPage file={file} fileName={fileName} setFile={setFile} setFileName={setFileName} courses={courses} years={years} specs={specs} semesters={semesters} exams={exams} papers={papers} course={course} setCourse={setCourse} year={year} setYear={setYear} spec={spec} setSpec={handleSpecChange} semester={semester} setSemester={handleSemesterChange} exam={exam} setExam={setExam} paper={paper} setPaper={setPaper} paperName={paperName} setPaperName={setPaperName} handleUpload={handleUpload} handleDelete={handleDelete} handleSyncToWebsite={handleSyncToWebsite} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} setSelectedPaperIndex={setSelectedPaperIndex} fileError={fileError} isLoading={isLoading} setFileError={setFileError} uploadStatus={uploadStatus} setUploadStatus={setUploadStatus} deleteStatus={deleteStatus} />
              <div className="mt-4 rounded-xl overflow-hidden shadow-md w-full flex-shrink-0"><img src={coverImg} alt="Poornima University" className="w-full h-24 sm:h-32 md:h-auto md:aspect-[4/1] object-cover object-center transform transition-transform duration-700" /></div>
            </> 
          ) : activeNav === "paper" ? (
            <>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 gap-3 md:gap-0">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <button onClick={(e) => { e.stopPropagation(); setShowAllMenu(prev => !prev); setShowFilter(false); setShowQueryFilter(false); }} className="w-full justify-between md:justify-center flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 rounded-md px-4 py-1.5 bg-white hover:bg-gray-50 shadow-sm"><span>All Records</span><ChevronDownIcon /></button>
                    {showAllMenu && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute mt-2 w-full md:w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        {selected.size > 0 ? <button onClick={() => { setClearSelectedConfirm(true); setShowAllMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">{selected.size === 1 ? "🧹 Clear Log" : "🧹 Clear Logs"} ({selected.size})</button> : <div className="px-4 py-2 text-sm text-gray-400">No Selection</div>}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setClearLogsConfirm(true)} className="flex-1 md:flex-none justify-center flex items-center gap-1.5 text-sm text-red-600 border border-red-200 rounded-md px-4 py-1.5 bg-red-50 hover:bg-red-100 shadow-sm transition-colors"><span>🧹 Clear Logs</span></button>
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
                        <th className="px-4 py-2 w-10 text-center rounded-tl-xl"><input type="checkbox" checked={selectAll} onChange={toggleAll} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" /></th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold">Title</th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold">Semester</th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold">Year</th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold">Exam</th> 
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold">Date</th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold">Status</th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold rounded-tr-xl">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLogs.length === 0 && <tr><td colSpan="8" className="text-center py-8 text-gray-400">No Recent Actions Found.</td></tr>}
                      {filteredLogs.slice((currentPage - 1) * displayCount, currentPage * displayCount).map((row, idx) => {
                        const isSelected = selected.has(row.id);
                        return (
                          <tr key={row.id} className={`transition-colors ${isSelected ? "bg-amber-50" : idx === 0 ? "bg-gray-50/80" : "bg-white hover:bg-gray-50/60"}`}>
                            <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.id)} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" /></td>
                            <td className="px-4 py-2.5 text-center text-gray-700 font-medium">{row.name}</td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{row.semester}</td>
                            <td className="px-4 py-2.5 text-center text-gray-700 font-medium">{row.year}</td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{row.exam}</td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{row.date}</td>
                            <td className="px-4 py-2.5 text-center"><span className={`inline-flex items-center justify-center rounded-full text-white text-xs font-semibold px-4 py-1 min-w-[96px] whitespace-nowrap ${row.status === "Deleted" ? "bg-red-500" : row.status === "Updated" ? "bg-blue-500" : "bg-green-500"}`}>{row.status}</span></td>
                            <td className="px-4 py-2.5 text-center">
                              {row.status !== "Deleted" ? (
                                <div className="relative inline-block">
                                  <button onClick={(e) => { e.stopPropagation(); setOpenAction(openAction === row.id ? null : row.id); }} className="p-1 rounded hover:bg-gray-100 transition-colors"><DotsIcon /></button>
                                  {openAction === row.id && (
                                    <div className="absolute right-8 top-0 w-28 bg-white border border-gray-200 rounded-lg shadow-2xl z-[100] overflow-hidden">
                                      <button onClick={() => { setCourse(row.course || ""); setYear(row.year || ""); setSpec(row.spec || ""); setSemester(row.semester || ""); setExam(row.exam || ""); setPaper(row.name || ""); setPaperName(row.name || ""); setSelectedPaperIndex(row.index || null); setActiveNav("dashboard"); setOpenAction(null); }} className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors">Edit</button>
                                      <button onClick={() => { setListDeleteConfirm({ show: true, row }); setOpenAction(null); }} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors">🗑️ Delete</button>
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
            </>
          ) : activeNav === "queries" ? (
            <>
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

              <div className="border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col flex-1 min-h-[500px] overflow-hidden">
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
                        return (
                          <React.Fragment key={group.email}>
                            <tr className={`transition-colors cursor-pointer ${isExpanded ? "bg-blue-50/40" : "bg-white hover:bg-gray-50"}`} onClick={() => toggleEmailExpanded(group.email)}>
                              <td className="px-4 py-3 text-gray-400 text-center">
                                {isExpanded ? <FiChevronDown className="w-5 h-5 text-[#05488B]" /> : <FiChevronRight className="w-5 h-5" />}
                              </td>
                              <td className="px-4 py-3 text-gray-800 font-bold text-base">
                                {group.email} 
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
                                {isBlocked ? (
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
            </>
          ) : (
            <div className="flex flex-col gap-6 h-full">
              <div className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-visible">
                 <div className="px-4 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                   <h2 className="text-lg font-bold text-[#05488b]">Add Custom AI Reply</h2>
                 </div>
                 <div className="p-4 flex flex-col gap-3">
                    {draftReplies.map((draft, idx) => (
                       <div key={idx} className="flex flex-col md:flex-row gap-3 items-center w-full">
                          <input value={draft.keyword} onChange={e => { const newDrafts = [...draftReplies]; newDrafts[idx].keyword = e.target.value; setDraftReplies(newDrafts); }} placeholder="Trigger Keyword (e.g., 'library', 'hod')" className="w-full md:w-64 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#ffc107]" />
                          <input value={draft.reply} onChange={e => { const newDrafts = [...draftReplies]; newDrafts[idx].reply = e.target.value; setDraftReplies(newDrafts); }} placeholder="Assistant Reply Message..." className="w-full flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#ffc107]" />
                          {draftReplies.length > 1 && (
                            <button onClick={() => { const newDrafts = draftReplies.filter((_, i) => i !== idx); setDraftReplies(newDrafts); }} className="text-red-500 hover:text-red-700 font-bold px-4 py-2 bg-red-50 rounded-lg transition-colors whitespace-nowrap">X</button>
                          )}
                       </div>
                    ))}
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-2 gap-3 sm:gap-0">
                       <button onClick={() => setDraftReplies([...draftReplies, { keyword: "", reply: "" }])} className="w-full sm:w-auto text-[#05488B] hover:text-[#043a70] font-bold px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap">+ Add Another</button>
                       <button onClick={handleAddReplies} disabled={isSavingReplies || draftReplies.every(r => !r.keyword.trim() || !r.reply.trim())} className="w-full sm:w-auto bg-[#05488B] hover:bg-[#043a70] text-white px-8 py-2 rounded-lg font-medium shadow-sm disabled:opacity-50 disabled:cursor-wait transition-colors whitespace-nowrap">{isSavingReplies ? "Saving..." : "Save Replies"}</button>
                    </div>
                 </div>
              </div>

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
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }} 
                                disabled={isLoading} 
                                className="text-[#05488B] hover:text-[#043a70] font-bold px-4 py-1.5 bg-blue-50 hover:bg-blue-100 shadow-sm rounded-md transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteReply(r.keyword)} 
                                disabled={isLoading} 
                                className="text-red-500 hover:text-red-700 font-bold px-4 py-1.5 bg-red-50 hover:bg-red-100 shadow-sm rounded-md transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                 </div>
                 <PaginationFooter total={customReplies.length} currentPage={replyCurrentPage} displayCount={replyDisplayCount} setCurrentPage={setReplyCurrentPage} setDisplayCount={setReplyDisplayCount} />
              </div>
            </div>
          )}
        </main>
      </div>

      {deleteConfirm.show && (
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

      {syncConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all ">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Update Data To PYQP Site?</h2>
            <p className="text-gray-600 mb-8 text-base">To Show The Updated Paper To PYQP Site <br/><span className="font-bold text-green-600 text-lg">Click: Yes, Update</span><br/>Or Any Issue Please Click On <br/><span className="font-bold text-black text-lg">No, Wait</span></p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button onClick={() => setSyncConfirm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-bold transition-colors w-full">✋ No, Wait</button>
              <button onClick={executeSync} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full">🚀 Yes, Update</button>
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
      )}
    </div>
  );
}

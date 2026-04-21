import { useState, useEffect } from "react";
import logo from "../assets/puupdatelogo.png";
import { FiHome, FiFileText, FiLogOut } from "react-icons/fi";
import coverImg from "../assets/pucoverlogo.webp";

const SearchIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
  </svg>
);
const FilterLinesIcon = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
  </svg>
);
const DotsIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
    <circle cx="4" cy="10" r="1.5" />
    <circle cx="10" cy="10" r="1.5" />
    <circle cx="16" cy="10" r="1.5" />
  </svg>
);
const SortAscIcon = () => (
  <svg className="w-2.5 h-2.5 text-gray-500" fill="currentColor" viewBox="0 0 10 10">
    <path d="M5 1L9.33 8H.67z" />
  </svg>
);
const SortDescGreenIcon = () => (
  <svg className="w-2.5 h-2.5" fill="#22c55e" viewBox="0 0 10 10">
    <path d="M5 9L.67 2H9.33z" />
  </svg>
);

const PoornimaLogo = () => (
  <div className="flex flex-col items-center justify-center py-2 md:py-6 px-2 mb-0 md:mb-2 border-b-0 md:border-b border-white/20">
    <img src={logo} alt="Poornima University Logo" className="w-24 md:w-40 h-auto object-contain" />
  </div>
);

const StatusBadge = ({ status }) => (
  <span
    className="inline-flex items-center justify-center rounded-full text-white text-xs font-semibold px-4 py-1 min-w-[96px] whitespace-nowrap"
    style={{ backgroundColor: status === "Update" ? "#22c55e" : "#e53e3e" }}
  >
    {status}
  </span>
);

const CustomDropdown = ({ id, label, options, value, setValue, openDropdown, setOpenDropdown, disabled, customWidth, customHeight }) => {
  const isOpen = openDropdown === id && !disabled; 
  
  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); if (!disabled) setOpenDropdown(isOpen ? null : id); }}
        className={`w-full border rounded-lg px-4 py-2 text-base font-medium text-center shadow-sm transition-colors
          ${disabled 
            ? "bg-white text-[#374151] cursor-not-allowed whitespace-nowrap" 
            : value 
              ? "bg-white border-[#ffc107] text-[#215ea0] truncate" 
              : "bg-white border-[#ffc107] text-[#374151] hover:bg-gray-50 whitespace-nowrap"}
        `}
        title={value || label}
      >
        {value || label}
      </button>
      
      {isOpen && (
        <div 
          className={`absolute left-0 top-full mt-1 bg-[#cbe0fe] rounded-lg shadow-xl z-[100] border border-blue-200 overflow-hidden 
          ${customWidth ? customWidth : 'w-full'}`}
        >
          <div className={`${customHeight ? customHeight : 'max-h-[150px]'} overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc107] [&::-webkit-scrollbar-thumb]:rounded-full`}>
            {(options || []).map((item, i) => (
              <div 
                key={i} 
                onClick={() => { setValue(item); setOpenDropdown(null); }} 
                className="px-4 py-2.5 hover:bg-blue-300 cursor-pointer text-sm md:text-base truncate text-gray-800 transition-colors border-b border-blue-200/50 last:border-0"
                title={item} 
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardPage = ({
  fileName, setFile, setFileName,
  courses, years, specs, semesters, exams, papers,
  course, setCourse, year, setYear, spec, setSpec,
  semester, setSemester, exam, setExam,
  paper, setPaper,
  paperName, setPaperName,
  handleUpload, handleDelete, handleSyncToWebsite,
  openDropdown, setOpenDropdown,
  setSelectedPaperIndex,
  fileError, setFileError, 
  isLoading,
  uploadStatus, setUploadStatus,
  deleteStatus
}) => (

  <div className="w-full">
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 w-full border relative">
      <div className="space-y-4 flex flex-col items-center">

        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-xl">
            <div className="w-8 h-8 border-4 border-[#05488B] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 font-bold text-[#05488B]">Processing...</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
          <input 
            type="file" 
            id="fileUpload" 
            className="hidden"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => { 
              const selectedFile = e.target.files[0];
              if (selectedFile) { 
                const fileNameLower = selectedFile.name.toLowerCase();
                if (fileNameLower.endsWith('.pdf') || fileNameLower.endsWith('.docx')) {
                  setFile(selectedFile); 
                  setFileName(selectedFile.name); 
                  setFileError(false); 
                } else {
                  setUploadStatus("❌ Invalid File! Please Upload Only .PDF Or .DOCX Files.");
                  setTimeout(() => setUploadStatus(""), 4000);
                  e.target.value = ""; 
                }
              } 
            }}
          />
          <label htmlFor="fileUpload" className="bg-[#05488B] hover:bg-[#215ea0] text-[#ffc107] px-6 py-2 rounded-lg cursor-pointer shadow w-full sm:w-auto text-center font-medium">
            Choose File
          </label>

          {fileName !== "No file chosen" && (
            <div className="flex items-center justify-between gap-2 bg-gray-100 px-4 py-1.5 rounded-md w-full sm:w-auto">
              <span className="text-sm text-gray-600 max-w-[150px] truncate">{fileName}</span>
              <button onClick={() => { setFileName("No file chosen"); setFile(null); document.getElementById("fileUpload").value = ""; }} className="text-red-500 hover:text-red-700 text-sm font-bold">✕</button>
            </div>
          )}
        </div>

        <div className="w-full p-4 rounded-xl border shadow-sm" style={{ backgroundColor: "#E31E24" }}>
          <div className="flex flex-col gap-4 overflow-visible">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CustomDropdown id="course" label="Course" options={courses} value={course} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
                setValue={(val) => { setCourse(val); setYear(""); setSpec(""); setSemester(""); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              
              <CustomDropdown id="year" label="Year" options={years} value={year} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
                setValue={(val) => { setYear(val); setSpec(""); setSemester(""); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              
              <CustomDropdown id="spec" label="Specialization" options={specs} value={spec} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
                setValue={(val) => { setSpec(val); setSemester(""); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              <CustomDropdown id="sem" label="Semester" options={semesters} value={semester} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
                setValue={(val) => { setSemester(val); setExam(""); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              
              <CustomDropdown id="exam" label="Exam" options={exams} value={exam} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
                setValue={(val) => { setExam(val); setPaper(""); setPaperName(""); setSelectedPaperIndex(null); }} />
              
              <CustomDropdown 
                id="paper" 
                label="Select to Update" 
                disabled={!exam} 
                openDropdown={openDropdown} 
                setOpenDropdown={setOpenDropdown}
                customWidth="w-full md:w-[266px]" 
                customHeight="max-h-[150px] md:max-h-[93px]" 
                options={["🆕 Create New", ...papers.map(p => p.name)]} 
                value={paper}
                setValue={(val) => {
                  if (val === "🆕 Create New") {
                    setPaper("Paper Name ➡️"); setPaperName(""); setSelectedPaperIndex(null);
                  } else {
                    const sel = papers.find(p => p.name === val);
                    setPaper(val); setPaperName(val); setSelectedPaperIndex(sel ? sel.index : null);
                  }
                }}
              />

              <input
                type="text"
                placeholder="Paper Name"
                value={paperName}
                disabled={!paper} 
                onChange={(e) => setPaperName(e.target.value)}
                className={`w-full border rounded-lg px-4 py-2 text-base font-medium shadow-sm outline-none transition-all placeholder:text-[#374151]
                  ${!paper ? "bg-white cursor-not-allowed" : "bg-white border-[#ffc107]"} 
                  ${paperName ? "text-[#215ea0]" : "text-[#374151]"}
                `}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between w-full mt-4 relative z-10 px-2 gap-4 lg:gap-0">
          
          <div className="w-full lg:flex-1 flex items-center justify-center lg:justify-start min-h-[30px] order-2 lg:order-1">
            {fileError && (
              <span className="text-[14px] md:text-[15px] font-medium text-[#0d9488] tracking-wide">
                <span className="text-[#f43f5e] font-bold mr-1">❌</span> Please Select A File
              </span>
            )}
            
            {uploadStatus && !fileError && (
              <span className="text-[14px] md:text-[15px] font-medium text-[#0d9488] tracking-wide">
                <span className={uploadStatus.includes('❌') ? "text-[#f43f5e] font-bold mr-1" : "text-[#22c55e] font-bold mr-1"}>
                  {uploadStatus.includes('❌') ? '❌' : '✅'}
                </span>
                {uploadStatus.replace(/❌|✅/g, '').trim()}
              </span>
            )}
            
            {deleteStatus && !fileError && !uploadStatus && (
              <span className="text-[14px] md:text-[15px] font-medium text-[#0d9488] tracking-wide">
                <span className={deleteStatus.includes('❌') ? "text-[#f43f5e] font-bold mr-1" : "text-[#22c55e] font-bold mr-1"}>
                  {deleteStatus.includes('❌') ? '❌' : '✅'}
                </span>
                {deleteStatus.replace(/❌|✅/g, '').trim()}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6 w-full lg:w-auto order-1 lg:order-2">
            <button onClick={handleUpload} className="w-full sm:w-auto bg-[#05488B] hover:bg-[#215ea0] text-[#ffc107] px-6 py-2 rounded shadow-sm font-medium">
              Upload & Update
            </button>
            <button onClick={handleDelete} className="w-full sm:w-auto bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2 rounded shadow-sm font-medium">
              Delete
            </button>
          </div>

          <div className="w-full lg:flex-1 flex items-center justify-center lg:justify-end order-3">
             <button 
  onClick={handleSyncToWebsite}
  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow-sm font-medium transition-colors"
>
  🔄 Fetch To PU-Site
</button>
          </div>
          
        </div>
      </div>
    </div>
  </div>
);


export default function PaperUpdateList() {

  const [allPapers, setAllPapers] = useState([]);
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
  const [isLoading, setIsLoading] = useState(false);
  const fetchPapers = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/papers`, { 
        headers: { "Authorization": "Bearer " + token }, 
        cache: "no-store" 
      });

      if (res.status === 401) {
        sessionStorage.removeItem("token");
        window.location.href = "/login"; 
        return;
      }

      if (res.ok) {
        setAllPapers(await res.json());
      }
    } catch (err) {
      console.error("Server is waking up...", err);
    }
  };

  const fetchLogs = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/logs`, {
        headers: { "Authorization": "Bearer " + token }, 
        cache: "no-store" 
      });

      if (res.status === 401) {
        sessionStorage.removeItem("token");
        window.location.href = "/login"; 
        return;
      }

      if (res.ok) {
        setActionLog(await res.json());
      }
    } catch (err) {
      console.error("Server is waking up...", err);
    }
  };

  useEffect(() => { 
    fetchPapers(); 
    fetchLogs(); 

    const intervalId = setInterval(() => {
      fetchPapers();
      fetchLogs();
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const handleUpload = async () => {
    if (!file) { setFileError(true); return; }
    if (!course || !year || !spec || !semester || !exam || !paperName) {
      setUploadStatus("❌ Please Fill All Fields");
      setTimeout(() => setUploadStatus(""), 4000);
      return;
    }
  
  setIsLoading(true); 

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("course", course);
      formData.append("year", year);
      formData.append("spec", spec);
      formData.append("sem", semester);
      formData.append("exam", exam);
      formData.append("name", paperName); 

      if (selectedPaperIndex) {
        formData.append("index", selectedPaperIndex);
      }

      const token = sessionStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: formData,
      });

      const text = await res.text();
      setUploadStatus(text);
      setTimeout(() => setUploadStatus(""), 4000);

      await fetch(`${import.meta.env.VITE_API_URL}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
          id: Date.now(),
          index: selectedPaperIndex, 
          course, spec, name: paperName, semester, year, exam,
          status: selectedPaperIndex ? "Updated" : "Uploaded",
          date: new Date().toLocaleDateString()
        })
      });

      setFile(null);
      setFileName("No file chosen");
      setPaper("");
      setPaperName("");
      setSelectedPaperIndex(null);
      
      fetchPapers();
      fetchLogs(); 
    setIsLoading(false); 
    } catch (err) {
      console.error(err);
      alert("Upload Failed ❌");
    setIsLoading(false); 
    }
  };

  const handleDelete = async () => {
    if (!selectedPaperIndex) {
      setDeleteStatus("❌ Please Select A Paper To Delete");
      setTimeout(() => setDeleteStatus(""), 4000);
      return;
    }
    setDeleteConfirm({ show: true, paperName: paperName });
  };

  const executeDelete = async () => {
    setIsLoading(true); 
    const token = sessionStorage.getItem("token"); 
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/delete`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ index: selectedPaperIndex })
      });

      if (!res.ok) throw new Error(`Server rejected request: ${res.status}`);

      const text = await res.text();
      setDeleteStatus(text);
      setTimeout(() => setDeleteStatus(""), 4000);

      await fetch(`${import.meta.env.VITE_API_URL}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
          id: Date.now(),
          index: null, 
          course, spec, name: paperName, semester, year, exam,
          status: "Deleted",
          date: new Date().toLocaleDateString()
        })
      });

      setPaper("");
      setPaperName("");
      setSelectedPaperIndex(null);
      
      fetchPapers();
      fetchLogs();
    setIsLoading(false); 

    } catch (error) {
       console.error("Error Deleting Paper:", error);
       alert("An error occurred while deleting the paper. Check the console for details.");
     setIsLoading(false); 
    }
  };

  const clearServerLogs = () => {
    setClearLogsConfirm(true);
  };

  const executeClearLogs = async () => {
    setClearLogsConfirm(false);
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("token"); 
      const res = await fetch(`${import.meta.env.VITE_API_URL}/logs/clear`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` } 
      });

      if (res.ok) {
        setActionLog([]); 
        setSelected(new Set());
        console.log("Logs wiped from server and UI");
      } else {
        alert("Server failed to clear logs. Check Render logs!");
      }
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const executeListDelete = async () => {
    const row = listDeleteConfirm.row;
    if (!row) return;
  
  setListDeleteConfirm({ show: false, row: null });
    setIsLoading(true); 

    if (row.index) {
      const token = sessionStorage.getItem("token");
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/delete`, { 
          method: "DELETE",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({ index: row.index })
        });
        alert(await res.text());

        await fetch(`${import.meta.env.VITE_API_URL}/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({
            id: Date.now(),
            index: null,
            course: row.course, spec: row.spec, name: row.name, semester: row.semester, year: row.year, exam: row.exam,
            status: "Deleted",
            date: new Date().toLocaleDateString()
          })
        });

        fetchPapers(); 
        fetchLogs();
    setIsLoading(false); 
      } catch (err) {
        console.error(err);
        alert("Database Delete Failed ❌");
    setIsLoading(false); 
      }
    } else {
      alert("Paper Is Already Deleted From The Database!");
    setIsLoading(false); 
    }
    
    setListDeleteConfirm({ show: false, row: null });
  };
  
  const [syncConfirm, setSyncConfirm] = useState(false);

  const handleSyncToWebsite = () => {
    setSyncConfirm(true);
  };

  const executeSync = async () => {
  setSyncConfirm(false); 
  setIsLoading(true); 
  
  try {
    const token = sessionStorage.getItem("token"); 
    const response = await fetch(`${import.meta.env.VITE_API_URL}/sync`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    const data = await response.json();

    setUploadStatus(data.message); 
    
    setTimeout(() => setUploadStatus(""), 5000); 

    setIsLoading(false); 
  } catch (error) {
    console.error(error);
    
    setUploadStatus("❌ Sync Failed. Please try again.");
    setTimeout(() => setUploadStatus(""), 5000);
    
    setIsLoading(false); 
  }
};

  const courses = [...new Set(allPapers.map(p => p.course))];
  const years = [...new Set(allPapers.filter(p => p.course === course).map(p => p.year))];
  const specs = [...new Set(allPapers.filter(p => p.course === course && p.year === year).map(p => p.spec))];
  const semesters = [...new Set(allPapers.filter(p => p.course === course && p.year === year && p.spec === spec).map(p => p.sem))];
  const exams = [...new Set(allPapers.filter(p => p.course === course && p.year === year && p.spec === spec && p.sem === semester).map(p => p.exam))];
  const papers = allPapers.filter(p => p.course === course && p.year === year && p.spec === spec && p.sem === semester && p.exam === exam);

  const toggleAll = () => {
    if (selectAll) { setSelected(new Set()); setSelectAll(false); }
    else { setSelected(new Set(actionLog.map(r => r.id))); setSelectAll(true); }
  };

  const toggleRow = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setSelectAll(next.size === actionLog.length);
  };

  let filtered = actionLog.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.semester.toLowerCase().includes(search.toLowerCase())
  );
  
  if (sortType === "az") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  if (sortType === "za") filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
  if (sortType === "new") filtered = [...filtered].sort((a, b) => b.id - a.id); 
  if (sortType === "old") filtered = [...filtered].sort((a, b) => a.id - b.id); 

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      
      <aside className="w-full md:w-48 flex-shrink-0 flex flex-col items-center md:items-stretch shadow-none md:shadow-lg pt-4 pb-4 md:pb-0 md:pt-4 z-20" style={{ backgroundColor: "#f5a623" }}>
        
        <PoornimaLogo />
        
        <div className="hidden md:block px-4 pt-4 pb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Dashboard</span>
        </div>
        
        <nav className="flex-1 px-3 md:px-2 mt-3 md:mt-0 pb-2 md:pb-0 flex flex-row md:flex-col items-center justify-center md:justify-start md:items-stretch space-x-4 md:space-x-0 space-y-0 md:space-y-1 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button onClick={() => setActiveNav("dashboard")} className={`whitespace-nowrap w-auto md:w-full flex items-center justify-center md:justify-start gap-2.5 px-6 md:px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeNav === "dashboard" ? "bg-white text-[#05488b] shadow-md" : "text-black/75 hover:bg-white/15 hover:text-black"}`}>
            <FiHome className={`${activeNav === "dashboard" ? "text-[#05488b]" : ""} w-4 h-4`} />
            <span>Dashboard</span>
          </button>
          <button onClick={() => setActiveNav("paper")} className={`whitespace-nowrap w-auto md:w-full flex items-center justify-center md:justify-start gap-2.5 px-6 md:px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeNav === "paper" ? "bg-white text-[#05488b] shadow-md" : "text-black/75 hover:bg-white/15 hover:text-black"}`}>
            <FiFileText className={`${activeNav === "paper" ? "text-[#05488b]" : ""} w-4 h-4`} />
            <span className="text-left leading-tight">Recent Action</span>
          </button>
        </nav>
        
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-white flex-shrink-0">
          <h1 className="text-base font-bold text-gray-800 tracking-wide">
            {activeNav === "dashboard" ? "Edit Data" : "Edited Data"}
          </h1>
          <button onClick={() => {
            sessionStorage.removeItem("token"); 
            window.location.href = "/login";  
          }} className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-red-500 bg-[#05488b] hover:bg-[#043a70] transition-all">
            <FiLogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        <main className="flex-1 overflow-auto px-3 sm:px-5 py-4 bg-gray-100 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track] [&::-webkit-scrollbar-thumb]:bg-[#ffc107] hover:[&::-webkit-scrollbar-thumb]:bg-[#05488B] [&::-webkit-scrollbar-thumb]:rounded-full">
          {activeNav === "dashboard" ? (
            <> 
              <DashboardPage
                file={file} fileName={fileName} setFile={setFile} setFileName={setFileName}
                courses={courses} years={years} specs={specs} semesters={semesters} exams={exams} papers={papers}
                course={course} setCourse={setCourse}
                year={year} setYear={setYear}
                spec={spec} setSpec={setSpec}
                semester={semester} setSemester={setSemester}
                exam={exam} setExam={setExam}
                paper={paper} setPaper={setPaper}
                paperName={paperName} setPaperName={setPaperName}
                handleUpload={handleUpload}
                handleDelete={handleDelete}
                handleSyncToWebsite={handleSyncToWebsite}
                openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
                setSelectedPaperIndex={setSelectedPaperIndex}
                fileError={fileError} 
                isLoading={isLoading}
                setFileError={setFileError}
                uploadStatus={uploadStatus} setUploadStatus={setUploadStatus}
                deleteStatus={deleteStatus}
              />
              
      <div className="mt-4 rounded-xl overflow-hidden shadow-md w-full flex-shrink-0">
        <img 
          src={coverImg} 
          alt="Poornima University" 
          className="w-full h-24 sm:h-32 md:h-auto md:aspect-[4/1] object-cover object-center transform transition-transform duration-700" 
        />
      </div>
            </> 
          ) : (
            <>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 gap-3 md:gap-0">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <button onClick={(e) => { e.stopPropagation(); setShowAllMenu(prev => !prev); setShowFilter(false); }} className="w-full justify-between md:justify-center flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 rounded-md px-4 py-1.5 bg-white hover:bg-gray-50 shadow-sm">
                      <span>All Records</span><ChevronDownIcon />
                    </button>
                    {showAllMenu && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute mt-2 w-full md:w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        {selected.size > 0
                          ? <button onClick={async () => { 
                              if(window.confirm(`Delete ${selected.size} logs permanently?`)) {
                                const token = sessionStorage.getItem("token");
                                const idsToDelete = Array.from(selected);
                                await fetch(`${import.meta.env.VITE_API_URL}/logs/delete`, {
                                  method: "POST",
                                  headers: { 
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}` 
                                  },
                                  body: JSON.stringify({ ids: idsToDelete })
                                });
                                fetchLogs();
                                setSelected(new Set());
                                setShowAllMenu(false);
                              }
                            }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              {selected.size === 1 ? "Clear Log" : "Clear Logs"} ({selected.size})
                            </button>
                          : <div className="px-4 py-2 text-sm text-gray-400">No Selection</div>
                        }
                      </div>
                    )}
                  </div>
                  <button onClick={clearServerLogs} className="flex-1 md:flex-none justify-center flex items-center gap-1.5 text-sm text-red-600 border border-red-200 rounded-md px-4 py-1.5 bg-red-50 hover:bg-red-100 shadow-sm transition-colors">
                    <span>Clear Logs</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-2 border border-blue-200 bg-blue-50/60 rounded-lg px-4 py-1.5 w-full sm:w-60">
                    <SearchIcon />
                    <input className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <div className="relative w-full sm:w-auto">
                    <button onClick={(e) => { e.stopPropagation(); setShowFilter(prev => !prev); setShowAllMenu(false); }} className="w-full justify-center p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 shadow-sm">
                      <FilterLinesIcon />
                    </button>
                    {showFilter && (
                      <div className="absolute right-0 mt-2 w-full sm:w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                        <div className="px-4 py-2 text-xs text-gray-400 font-semibold">SORT BY</div>
                        {[["az","A → Z"],["za","Z → A"],["new","New → Old"],["old","Old → New"],["","Default"]].map(([val, label]) => (
                          <button key={val} onClick={() => { setSortType(val); setShowFilter(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">{label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl shadow-sm bg-white">
                <div className="w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-[#ffc107] hover:[&::-webkit-scrollbar-thumb]:bg-[#05488B] [&::-webkit-scrollbar-thumb]:rounded-full">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr className="border-b-2 border-gray-100 bg-white">
                        <th className="px-4 py-2 w-10 text-center rounded-tl-xl"><input type="checkbox" checked={selectAll} onChange={toggleAll} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" /></th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold"><div className="flex items-center justify-center gap-1">Title </div></th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold"><div className="flex items-center justify-center gap-1">Semester </div></th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold">Year</th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold">Exam</th> 
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold">Date</th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold">Status</th>
                        <th className="px-4 py-2 text-center text-gray-600 font-semibold rounded-tr-xl">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.length === 0 && (
                        <tr><td colSpan="8" className="text-center py-8 text-gray-400">No Recent Actions Found On The Server. Try Uploading Or Deleting A Paper!</td></tr>
                      )}
                      {filtered.slice((currentPage - 1) * displayCount, currentPage * displayCount).map((row, idx) => {
                        const isSelected = selected.has(row.id);
                        return (
                          <tr key={row.id} className={`transition-colors ${isSelected ? "bg-amber-50" : idx === 0 ? "bg-gray-50/80" : "bg-white hover:bg-gray-50/60"}`}>
                            <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.id)} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" /></td>
                            <td className="px-4 py-2.5 text-center text-gray-700 font-medium">{row.name}</td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{row.semester}</td>
                            <td className="px-4 py-2.5 text-center text-gray-700 font-medium">{row.year}</td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{row.exam}</td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{row.date}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`inline-flex items-center justify-center rounded-full text-white text-xs font-semibold px-4 py-1 min-w-[96px] whitespace-nowrap
                                ${row.status === "Deleted" ? "bg-red-500" : row.status === "Updated" ? "bg-blue-500" : "bg-green-500"}`}>
                                {row.status}
                              </span>
                            </td>

                            <td className="px-4 py-2.5 text-center">
                              {row.index ? (
                                <div className="relative inline-block">
                                  <button onClick={(e) => { e.stopPropagation(); setOpenAction(openAction === row.id ? null : row.id); }} className="p-1 rounded hover:bg-gray-100 transition-colors">
                                    <DotsIcon />
                                  </button>
                                  {openAction === row.id && (
                                    <div className="absolute right-8 top-0 w-28 bg-white border border-gray-200 rounded-lg shadow-2xl z-[100] overflow-hidden">
                                      
                                      <button onClick={() => { 
                                        setCourse(row.course || "");
                                        setYear(row.year || "");
                                        setSpec(row.spec || "");
                                        setSemester(row.semester || "");
                                        setExam(row.exam || "");
                                        setPaper(row.name || "");
                                        setPaperName(row.name || "");
                                        setSelectedPaperIndex(row.index || null);
                                        setActiveNav("dashboard"); 
                                        setOpenAction(null); 
                                      }} className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors">
                                        Edit
                                      </button>

                                      <button onClick={() => { 
                                        setListDeleteConfirm({ show: true, row });
                                        setOpenAction(null); 
                                      }} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors">
                                        Delete
                                      </button>

                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs italic">Removed</span>
                              )}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-white rounded-b-xl gap-2 sm:gap-0">
                  <span className="text-xs text-gray-500">Showing {(currentPage - 1) * displayCount + 1} to {Math.min(currentPage * displayCount, filtered.length)} of {filtered.length} entries</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Display</span>
                      <select value={displayCount} onChange={(e) => { setDisplayCount(Number(e.target.value)); setCurrentPage(1); }} className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none cursor-pointer">
                        {[10,30,50,70,90].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-600"><ChevronLeftIcon /></button>
                      {Array.from({ length: Math.ceil(filtered.length / displayCount) }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setCurrentPage(p)} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-semibold transition-colors ${currentPage === p ? "text-white shadow-sm" : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"}`} style={currentPage === p ? { backgroundColor: "#e53e3e" } : {}}>{p}</button>
                      ))}
                      <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filtered.length / displayCount), p + 1))} className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-600"><ChevronRightIcon /></button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
 
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all border-t-8 border-red-500">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Are You Sure?</h2>
            <p className="text-gray-600 mb-8 text-base">
              Do You Really Want To Permanently Delete <br/>
              <span className="font-bold text-red-600 text-lg">"{deleteConfirm.paperName}"</span><br/> 
              From The Database?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button 
                onClick={() => setDeleteConfirm({ show: false, paperName: "" })} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-bold transition-colors w-full"
              >
                Cancel
              </button>
              <button 
                onClick={() => { 
                  setDeleteConfirm({ show: false, paperName: "" }); 
                  executeDelete(); 
                }} 
                className="bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {listDeleteConfirm?.show && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all border-t-8 border-red-500">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Are You Sure?</h2>
            <p className="text-gray-600 mb-8 text-base">
              Do You Really Want To Permanently Delete <br/>
              <span className="font-bold text-red-600 text-lg">"{listDeleteConfirm.row?.name}"</span><br/> 
              From The Database?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button 
                onClick={() => setListDeleteConfirm({ show: false, row: null })} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-bold transition-colors w-full"
              >
                Cancel
              </button>
              <button 
                onClick={executeListDelete} 
                className="bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {syncConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all ">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Update Data To PYQP Site ?</h2>
            <p className="text-gray-600 mb-8 text-base">
              To Show The Updated Paper To PYQP Site <br/>
              <span className="font-bold text-green-600 text-lg">Click: Yes, Update</span><br/> 
              Or Any Issue Please Click On <br/>
              <span className="font-bold text-black text-lg">No, Wait</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button 
                onClick={() => setSyncConfirm(false)} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-bold transition-colors w-full"
              >
                No, Wait
              </button>
              <button 
                onClick={executeSync} 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full"
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}

      {clearLogsConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Clear All Logs ?</h2>
            <p className="text-gray-600 mb-8 text-base">
              Are You Sure You Want To Permanently Clear Logs For Everyone ? <br/>
              <span className="font-bold text-red-600 text-lg block mt-2">Click: Yes, Clear</span>
              Or To Cancel Please Click On <br/>
              <span className="font-bold text-black text-lg">No, Wait</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button 
                onClick={() => setClearLogsConfirm(false)} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-bold transition-colors w-full"
              >
                No, Wait
              </button>
              <button 
                onClick={executeClearLogs} 
                className="bg-[#E31E24] hover:bg-[#c11018] text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
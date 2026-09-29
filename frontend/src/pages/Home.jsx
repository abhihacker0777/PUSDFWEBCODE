import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Filters from "../components/Filters";
import PaperList from "../components/PaperList";
import PaperAssistant from "../components/PaperAssistant";
import { clearPaperCaches, fetchPapers } from "../services/api";
import { searchLocalPapers } from "../utils/localPaperSearch";

const _courseSequence = [
  "B.Arch", "B.Com", "B.Des", "B.Sc", "B.Tech", "BA", "BBA", "BCA", "BPH", "BVA",
  "M.Des", "M.Plan", "M.Tech", "MA", "MBA", "MCA", "MHA", "MPH", "MVA",
  "Ph.D", "PIHM"
];
const yearSequence = ["1 Year", "2 Year", "3 Year", "4 Year", "5 Year"];
const semSequence = ["1 Sem", "2 Sem", "3 Sem", "4 Sem", "5 Sem", "6 Sem", "7 Sem", "8 Sem", "9 Sem", "10 Sem"];
const examSequence = ["MSE", "ESE"];

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [papersData, setPapersData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState({
    course: null, year: null, specialization: null, sem: null, exam: null
  });

  useEffect(() => {
    let disposed = false;

    async function load({ force = false } = {}) {
      if (force) {
        clearPaperCaches();
        setIsLoading(true);
      } else {
        const cached = sessionStorage.getItem("papersCache");
        if (cached) {
          try {
            const cachedAt = Number(sessionStorage.getItem("papersCacheTime") || 0);
            const updatedAt = Number(localStorage.getItem("papers.updated") || 0);
            if (!updatedAt || cachedAt >= updatedAt) {
              setPapersData(JSON.parse(cached));
              setIsLoading(false);
            }
          } catch {
            sessionStorage.removeItem("papersCache");
          }
        }
      }

      try {
        const data = await fetchPapers({ force });
        if (disposed) return;
        setPapersData(data);
      } catch {
        console.error("Fetch failed: Could not retrieve papers data.");
      } finally {
        if (!disposed) setIsLoading(false);
      }
    }

    const refreshFromAdminUpdate = () => {
      setSelected({ course: null, year: null, specialization: null, sem: null, exam: null });
      load({ force: true });
    };

    load();

    const handleStorage = (event) => {
      if (event.key === "papers.updated") refreshFromAdminUpdate();
    };

    window.addEventListener("papers-updated", refreshFromAdminUpdate);
    window.addEventListener("storage", handleStorage);

    let channel = null;
    try {
      if (window.BroadcastChannel) {
        channel = new BroadcastChannel("papers-updated");
        channel.onmessage = refreshFromAdminUpdate;
      }
    } catch {
      channel = null;
    }

    return () => {
      disposed = true;
      window.removeEventListener("papers-updated", refreshFromAdminUpdate);
      window.removeEventListener("storage", handleStorage);
      if (channel) channel.close();
    };
  }, []);

  const unique = (field, filter = {}) => {
    return [...new Set(
      papersData
        .filter(p =>
          Object.keys(filter)
            .filter(k => filter[k])
            .every(k => {
              const pVal = p[k] ?? (k === "specialization" ? p.spec : null);
              return String(pVal ?? "").trim() === String(filter[k] ?? "").trim();
            })
        )
        .map(p => p[field] ?? (field === "specialization" ? p.spec : null))
        .filter(Boolean)
    )];
  };

  const ordered = (list, sequence) => {
    const known = sequence.filter(v => list.includes(v));
    const unknown = list.filter(v => !sequence.includes(v));
    return [...known, ...unknown];
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchLocalPapers(papersData, searchQuery);
  }, [papersData, searchQuery]);

  const handleSelect = (type, value) => {
    if (searchQuery) setSearchQuery("");
    if (type === "course") {
      setSelected({ course: value, year: null, specialization: null, sem: null, exam: null });
    } else if (type === "year") {
      setSelected(prev => ({ ...prev, year: value, specialization: null, sem: null, exam: null }));
    } else if (type === "specialization") {
      setSelected(prev => ({ ...prev, specialization: value, sem: null, exam: null }));
    } else if (type === "sem") {
      setSelected(prev => ({ ...prev, sem: value, exam: null }));
    } else {
      setSelected(prev => ({ ...prev, [type]: value }));
    }
  };

  const years = ordered(unique("year", { course: selected.course }), yearSequence);
  const specs = unique("specialization", { course: selected.course, year: selected.year }).sort((a, b) => a.localeCompare(b));
  const sems = ordered(unique("sem", { course: selected.course, year: selected.year, specialization: selected.specialization }), semSequence);
  const exams = ordered(unique("exam", { course: selected.course, year: selected.year, specialization: selected.specialization, sem: selected.sem }), examSequence);

  const filteredPapers = [...papersData]
    .filter(p =>
      Object.keys(selected).every(k => {
        if (!selected[k]) return true;
        const paperValue = p[k] ?? (k === "specialization" ? p.spec : null);
        return String(paperValue ?? "").trim() === String(selected[k] ?? "").trim();
      })
    )
    .sort((a, b) => {
      const textA = (a.subject || a.title || a.name || "").toLowerCase().trim();
      const textB = (b.subject || b.title || b.name || "").toLowerCase().trim();
      return textA.localeCompare(textB);
    });

  return (
    <div className="w-full min-h-screen bg-[#f3f8fc]">
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-4 md:px-10 py-6">

        {isLoading && papersData.length === 0 ? (
          <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm py-7 flex justify-center items-center mt-4">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mr-3"
              style={{
                animation: 'spin 1s linear infinite, colorChange 2s linear infinite'
              }}
            ></div>

            <style>{`
       @keyframes colorChange {
         0% { border-color: #05488B; border-top-color: transparent; }
         50% { border-color: #ffc107; border-top-color: transparent; }
         100% { border-color: #05488B; border-top-color: transparent; }
       }
     `}</style>

            <p className="text-black font-serif">Loading...</p>
          </div>
        ) : papersData.length === 0 ? (
          <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm py-6 flex flex-col justify-center items-center mt-10 animate-fade-in">
            <p className="text-sm font-serif text-[#212529] mb-1">No Papers Available</p>
            <span className="text-lg font-playfair text-[#4b5563] tracking-tight">Please Check Back Later.</span>
          </div>
        ) : (
          <Filters
            courses={[...unique("course")].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))}
            years={years}
            specs={specs}
            sems={sems}
            exams={exams}
            selected={selected}
            handleSelect={handleSelect}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {searchQuery.trim() ? (
          <div className="mt-4">
            <div className="mb-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-800">
                  Search Results For <span className="text-[#05488B]">"{searchQuery}"</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Found {searchResults.length} Matching Paper{searchResults.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {searchResults.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-8 text-center">
                <span className="text-3xl mb-2 block" role="img" aria-label="search">🔍</span>
                <p className="font-semibold text-gray-800 mb-1">No Papers Found For "{searchQuery}"</p>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Try Checking Spelling Or Search By Course (Eg. <b>B.Tech</b>), Semester (Eg. <b>1 Sem</b>), Exam (Eg. <b>MSE</b>), Or Subject Name (Eg. <b>RDBMS</b>, <b>Mathematics</b>).
                </p>
              </div>
            ) : (
              <PaperList papers={searchResults} isSearchResult={true} />
            )}
          </div>
        ) : (
          selected.exam && (
            <div className="mt-8">
              <PaperList papers={filteredPapers} />
            </div>
          )
        )}
      </main>

      <footer className="mt-20 mb-10 flex flex-col items-center justify-center text-center text-[#374151]">
        <p className="text-sm md:text-base">
          Created By - <a href="https://linkedin.com/in/abhihacker0777" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Abhishek Sankhla</a>
        </p>
        <p className="text-sm md:text-base mt-1">BCA (Cyber Security) Batch - 2025-28</p>
        <p className="text-sm md:text-base mt-0.5">Poornima University</p>
      </footer>

      <PaperAssistant />
    </div>
  );
}

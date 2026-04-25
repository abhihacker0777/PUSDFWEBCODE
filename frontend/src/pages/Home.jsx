import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Filters from "../components/Filters";
import PaperList from "../components/PaperList";
import { fetchPapers } from "../services/api";

const _courseSequence = ["B.Arch","B.Com","B.Des","B.Sc","B.Tech","BA","BBA","BCA","BVA","M.Plan","M.Tech","MA","MBA","MCA","MPH","MVA","Ph.D","PIHM"];
const yearSequence = ["1 Year","2 Year","3 Year","4 Year","5 Year"];
const semSequence = ["1 Sem","2 Sem","3 Sem","4 Sem","5 Sem","6 Sem","7 Sem","8 Sem","9 Sem","10 Sem"];
const examSequence = ["MSE","ESE"];

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [papersData, setPapersData] = useState([]);
  const [selected, setSelected] = useState({
    course: null, year: null, specialization: null, sem: null, exam: null
  });

  useEffect(() => {
    async function load() {
      const cached = sessionStorage.getItem("papersCache");
      if (cached) {
        try {
          setPapersData(JSON.parse(cached));
          setIsLoading(false);
        } catch {
          sessionStorage.removeItem("papersCache");
        }
      }

      try {
        const data = await fetchPapers();
        setPapersData(data);
        sessionStorage.setItem("papersCache", JSON.stringify(data));
      } catch {
        console.error("Fetch failed: Could not retrieve papers data.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
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

  const handleSelect = (type, value) => {
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
      courses={ordered(unique("course"), _courseSequence)}
      years={years}
      specs={specs}
      sems={sems}
      exams={exams}
      selected={selected}
      handleSelect={handleSelect}
    />
  )}

        {selected.exam && (
          <div className="mt-8">
            <PaperList papers={filteredPapers} />
          </div>
        )}
      </main>
    
      <footer className="mt-20 mb-10 flex flex-col items-center justify-center text-center text-[#374151]">
        <p className="text-sm md:text-base">
          Created By - <a href="https://linkedin.com/in/abhihacker0777" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Abhishek Sankhla</a>
        </p>
        <p className="text-sm md:text-base mt-1">BCA (Cyber Security) Batch - 2025-28</p>
        <p className="text-sm md:text-base mt-0.5">Poornima University</p>
      </footer>
    </div>
  );
}
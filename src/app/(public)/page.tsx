"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Filters from "@/components/Filters";
import PaperList, { PaperItem } from "@/components/PaperList";
import PaperAssistant from "@/components/PaperAssistant";
import { clearPaperCaches, fetchPapers } from "@/services/api";
import { searchLocalPapers } from "@/utils/localPaperSearch";

const courseSequence = [
  "B.Arch", "B.Com", "B.Des", "B.Sc", "B.Tech", "BA", "BBA", "BCA", "BPH", "BVA",
  "M.Des", "M.Plan", "M.Tech", "MA", "MBA", "MCA", "MHA", "MPH", "MVA",
  "Ph.D", "PIHM"
];
const yearSequence = ["1 Year", "2 Year", "3 Year", "4 Year", "5 Year"];
const semSequence = ["1 Sem", "2 Sem", "3 Sem", "4 Sem", "5 Sem", "6 Sem", "7 Sem", "8 Sem", "9 Sem", "10 Sem"];
const examSequence = ["MSE", "ESE"];

function tryReadCachedPapers(): PaperItem[] | null {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") return null;
  const cached = sessionStorage.getItem("papersCache");
  if (!cached) return null;
  try {
    const cachedAt = Number(sessionStorage.getItem("papersCacheTime") || 0);
    const updatedAt = Number(localStorage.getItem("papers.updated") || 0);
    if (!updatedAt || cachedAt >= updatedAt) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    sessionStorage.removeItem("papersCache");
  }
  return null;
}

export default function HomePage() {
  const [papersData, setPapersData] = useState<PaperItem[]>(() => {
    return tryReadCachedPapers() ?? [];
  });
  const [isLoading, setIsLoading] = useState(() => papersData.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<{
    course: string | null;
    year: string | null;
    specialization: string | null;
    sem: string | null;
    exam: string | null;
  }>({
    course: null,
    year: null,
    specialization: null,
    sem: null,
    exam: null
  });

  useEffect(() => {
    let disposed = false;

    async function load({ force = false } = {}) {
      if (force) {
        clearPaperCaches();
        setIsLoading(true);
      } else {
        const cached = tryReadCachedPapers();
        if (cached) {
          setPapersData(cached);
          setIsLoading(false);
        }
      }

      try {
        const data = await fetchPapers({ force });
        if (disposed) return;
        if (Array.isArray(data) && data.length > 0) {
          setPapersData(data);
        }
      } catch {
        console.error("Fetch failed: Could not retrieve papers data.");
      } finally {
        if (!disposed) setIsLoading(false);
      }
    }

    const refreshFromAdminUpdate = () => {
      setSelected({ course: null, year: null, specialization: null, sem: null, exam: null });
      void load({ force: true });
    };

    void load();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "papers.updated") refreshFromAdminUpdate();
    };

    window.addEventListener("papers-updated", refreshFromAdminUpdate);
    window.addEventListener("storage", handleStorage);

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && window.BroadcastChannel) {
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

  const unique = useCallback(
    (field: keyof PaperItem, filter: Record<string, string | null> = {}): string[] => {
      const activeFilterKeys = Object.keys(filter).filter((k) => filter[k]);
      return [
        ...new Set(
          papersData
            .filter((p) =>
              activeFilterKeys.every((k) => {
                const pVal = (p as any)[k] ?? (k === "specialization" ? p.spec : null);
                return String(pVal ?? "").trim() === String(filter[k] ?? "").trim();
              })
            )
            .map((p) => (p as any)[field] ?? (field === "specialization" ? p.spec : null))
            .filter(Boolean)
        )
      ] as string[];
    },
    [papersData]
  );

  const ordered = useCallback((list: string[], sequence: string[]): string[] => {
    const known = sequence.filter((v) => list.includes(v));
    const unknown = list.filter((v) => !sequence.includes(v));
    return [...known, ...unknown];
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchLocalPapers(papersData, searchQuery);
  }, [papersData, searchQuery]);

  const handleSelect = useCallback((type: string, value: string) => {
    setSearchQuery("");
    if (type === "course") {
      setSelected({ course: value, year: null, specialization: null, sem: null, exam: null });
    } else if (type === "year") {
      setSelected((prev) => ({ ...prev, year: value, specialization: null, sem: null, exam: null }));
    } else if (type === "specialization") {
      setSelected((prev) => ({ ...prev, specialization: value, sem: null, exam: null }));
    } else if (type === "sem") {
      setSelected((prev) => ({ ...prev, sem: value, exam: null }));
    } else {
      setSelected((prev) => ({ ...prev, [type]: value }));
    }
  }, []);

  const availableCourses = useMemo(() => {
    return ordered(unique("course"), courseSequence);
  }, [ordered, unique]);

  const years = useMemo(() => {
    if (!selected.course) return [];
    return ordered(unique("year", { course: selected.course }), yearSequence);
  }, [ordered, unique, selected.course]);

  const specs = useMemo(() => {
    if (!selected.course || !selected.year) return [];
    return unique("specialization", { course: selected.course, year: selected.year }).sort((a, b) => a.localeCompare(b));
  }, [unique, selected.course, selected.year]);

  const sems = useMemo(() => {
    if (!selected.course || !selected.year) return [];
    return ordered(unique("sem", { course: selected.course, year: selected.year, specialization: selected.specialization }), semSequence);
  }, [ordered, unique, selected.course, selected.year, selected.specialization]);

  const exams = useMemo(() => {
    if (!selected.course || !selected.year || !selected.sem) return [];
    return ordered(unique("exam", { course: selected.course, year: selected.year, specialization: selected.specialization, sem: selected.sem }), examSequence);
  }, [ordered, unique, selected.course, selected.year, selected.specialization, selected.sem]);

  const filteredPapers = useMemo(() => {
    if (!selected.exam) return [];
    return [...papersData]
      .filter((p) =>
        Object.keys(selected).every((k) => {
          if (!(selected as any)[k]) return true;
          const paperValue = (p as any)[k] ?? (k === "specialization" ? p.spec : null);
          return String(paperValue ?? "").trim() === String((selected as any)[k] ?? "").trim();
        })
      )
      .sort((a, b) => {
        const textA = (a.subject || a.title || a.name || "").toLowerCase().trim();
        const textB = (b.subject || b.title || b.name || "").toLowerCase().trim();
        return textA.localeCompare(textB);
      });
  }, [papersData, selected]);

  const lastUpdated = useMemo(() => {
    if (!papersData || papersData.length === 0) return "";
    let maxTime = 0;
    for (const p of papersData) {
      const timeStr = (p as any).updated_at || (p as any).created_at;
      if (timeStr) {
        const t = new Date(timeStr).getTime();
        if (!Number.isNaN(t) && t > maxTime) maxTime = t;
      }
    }
    if (!maxTime) return "";
    const d = new Date(maxTime);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const yr = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${yr}`;
  }, [papersData]);

  const renderFilterContent = () => {
    if (isLoading && papersData.length === 0) {
      return (
        <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm py-7 flex justify-center items-center mt-4">
          <div
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mr-3"
            style={{
              animation: "spin 1s linear infinite, colorChange 2s linear infinite"
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
      );
    }

    if (papersData.length === 0) {
      return (
        <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm py-6 flex flex-col justify-center items-center mt-10 animate-fade-in">
          <p className="text-sm font-serif text-[#212529] mb-1">No Papers Available</p>
          <span className="text-lg font-playfair text-[#4b5563] tracking-tight">Please Check Back Later.</span>
        </div>
      );
    }

    return (
      <Filters
        courses={availableCourses}
        years={years}
        specs={specs}
        sems={sems}
        exams={exams}
        selected={selected}
        handleSelect={handleSelect}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#f3f8fc]">
      <Navbar lastUpdated={lastUpdated} />

      <main className="max-w-[1600px] mx-auto px-4 md:px-10 py-6">
        {renderFilterContent()}

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

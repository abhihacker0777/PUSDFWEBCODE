"use client";

import React, { useMemo } from "react";

export interface PaperItem {
  id?: string | number;
  course?: string;
  year?: string;
  sem?: string;
  semester?: string;
  exam?: string;
  spec?: string;
  specialization?: string;
  name?: string;
  title?: string;
  subject?: string;
  link?: string;
  index?: number | string;
  _score?: number;
}

interface PaperListProps {
  papers: PaperItem[];
  isSearchResult?: boolean;
}

export default function PaperList({ papers, isSearchResult = false }: PaperListProps) {
  // ⚡ OPTIMIZATION: O(N) complexity using a Set and useMemo.
  // This is infinitely faster than filter + findIndex.
  const uniquePapers = useMemo(() => {
    const seen = new Set<string>();
    return (papers || []).filter((paper) => {
      const identifier = `${paper?.course}-${paper?.year}-${paper?.sem || paper?.semester}-${paper?.exam}-${paper?.spec || paper?.specialization}-${paper?.name || paper?.title || paper?.subject}`;
      if (seen.has(identifier)) return false;
      seen.add(identifier);
      return true;
    });
  }, [papers]);

  // 🛡️ SECURITY: URL Sanitization.
  // Ensures the link is actually a web URL, preventing javascript: payloads.
  const getSafeUrl = (url?: string | null): string | null => {
    if (!url) return null;
    try {
      const parsedUrl = new URL(url);
      if (
        (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") &&
        ["drive.google.com", "docs.google.com"].includes(parsedUrl.hostname.toLowerCase())
      ) {
        return parsedUrl.href;
      }
    } catch {
      // Invalid URL format
      return null;
    }
    return null;
  };

  if (uniquePapers.length === 0) return null;

  return (
    <div className={isSearchResult ? "" : "mt-8"}>
      {!isSearchResult && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Papers{" "}
            <span className="ml-2 text-sm font-medium text-[#0d6efd]">
              Access By poornima.edu.in Email.
            </span>
          </h2>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {uniquePapers.map((p) => {
          const safeLink = getSafeUrl(p.link);
          const paperDisplayName = p.name || p.title || p.subject || "Untitled Paper";
          const paperSem = p.sem || p.semester;
          const paperSpec = p.spec || p.specialization;

          return (
            <div 
              key={`${p.course}-${paperDisplayName}-${p.index || p.link || Math.random()}`} 
              className="bg-white p-4 border-l-[6px] border-[#ffca2c] rounded-lg shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center gap-3"
            >
              <span className="text-xl text-gray-400 shrink-0" role="img" aria-label="paper icon">
                📄
              </span>
              
              <div className="flex flex-col flex-grow min-w-0">
                {safeLink ? (
                  <a 
                    href={safeLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#05488B] font-semibold hover:underline truncate"
                  >
                    {paperDisplayName}
                  </a>
                ) : (
                  <span className="text-gray-400 font-medium italic truncate">
                    {paperDisplayName} {p.link ? "(Invalid Link)" : "(Link Pending...)"}
                  </span>
                )}

                {isSearchResult && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {p.course && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#05488B] px-2 py-0.5 rounded-md border border-blue-200">
                        {p.course}
                      </span>
                    )}
                    {paperSem && (
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200">
                        {paperSem}
                      </span>
                    )}
                    {p.exam && (
                      <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                        {p.exam}
                      </span>
                    )}
                    {paperSpec && (
                      <span className="text-[10px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200 truncate max-w-[280px]">
                        {paperSpec}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

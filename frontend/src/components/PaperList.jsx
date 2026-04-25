import React from "react";

export default function PaperList({ papers }) {

  if (!papers || papers.length === 0) return null;

  const uniquePapers = papers.filter((paper, index, self) =>
    index === self.findIndex((p) => 
      p?.name === paper?.name && 
      p?.course === paper?.course &&
      p?.year === paper?.year && 
      p?.sem === paper?.sem
    )
  );

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Papers 
          <span className="ml-2 text-sm font-medium text-[#0d6efd]">
            Access By poornima.edu.in Email.
          </span>
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {uniquePapers.map((p) => (
          <div 
            key={`${p.course}-${p.name}-${p.index}`} 
            className="bg-white p-4 border-l-[6px] border-[#ffca2c] rounded-lg shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex items-center gap-3"
          >
            <span className="text-xl text-gray-400" role="img" aria-label="paper icon">📄</span>
            
            <div className="flex flex-col flex-grow">
              {p.link ? (
                <a 
                  href={p.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#05488B] font-medium hover:underline"
                >
                  {p.name}
                </a>
              ) : (
                <span className="text-gray-400 font-medium italic">
                  {p.name} (Link Pending...)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
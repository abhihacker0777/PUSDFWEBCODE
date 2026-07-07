import { useMemo } from "react";

export default function PaperList({ papers }) {
  // ⚡ OPTIMIZATION: O(N) complexity using a Set and useMemo.
  // This is infinitely faster than filter + findIndex.
  const uniquePapers = useMemo(() => {
    const seen = new Set();
    return (papers || []).filter((paper) => {
      const identifier = `${paper?.course}-${paper?.year}-${paper?.sem}-${paper?.name}`;
      if (seen.has(identifier)) return false;
      seen.add(identifier);
      return true;
    });
  }, [papers]);

  // 🛡️ SECURITY: URL Sanitization.
  // Ensures the link is actually a web URL, preventing javascript: payloads.
  const getSafeUrl = (url) => {
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
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Papers 
          <span className="ml-2 text-sm font-medium text-[#0d6efd]">
            Access By poornima.edu.in Email.
          </span>
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {uniquePapers.map((p) => {
          const safeLink = getSafeUrl(p.link);
          
          return (
            <div 
              key={`${p.course}-${p.name}-${p.index}`} 
              className="bg-white p-4 border-l-[6px] border-[#ffca2c] rounded-lg shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex items-center gap-3"
            >
              <span className="text-xl text-gray-400" role="img" aria-label="paper icon">📄</span>
              
              <div className="flex flex-col flex-grow">
                {safeLink ? (
                  <a 
                    href={safeLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#05488B] font-medium hover:underline"
                  >
                    {p.name}
                  </a>
                ) : (
                  <span className="text-gray-400 font-medium italic">
                    {p.name} {p.link ? "(Invalid Link)" : "(Link Pending...)"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

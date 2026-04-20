import { useState } from "react";

export default function PaperList({ papers }) {
  const [syncConfirm, setSyncConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!papers || papers.length === 0) return null;

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
      alert(data.message); 
      setIsLoading(false); 
    } catch (error) {
      console.error(error);
      alert("❌ Something went wrong while syncing.");
      setIsLoading(false); 
    }
  };

  const uniquePapers = papers.filter((paper, index, self) =>
    index === self.findIndex((p) => p.name === paper.name)
  );

  return (
    <div className="mt-8">
      {syncConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all border-t-8 border-green-500">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sync Updates?</h2>
            <p className="text-gray-600 mb-8 text-base">
              Do You Really Want To <span className="font-bold text-green-600 text-lg">Update Data</span><br/> 
              On The Live Home Page Now?
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

      {isLoading && (
        <div className="fixed inset-0 bg-white/50 z-[10000] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-[#05488B] border-t-transparent rounded-full animate-spin"></div>
            <span className="mt-2 font-bold text-[#05488B]">Syncing...</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {uniquePapers.map((p, i) => (
          <div 
            key={i} 
            className="bg-white p-4 border-l-[6px] border-[#ffca2c] rounded-lg shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex items-center gap-3"
          >
            <span className="text-xl text-gray-400">📄</span>
            <a 
              href={p.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#05488B] font-medium hover:underline flex-grow"
            >
              {p.name}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
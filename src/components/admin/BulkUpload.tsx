import React, { useState, useRef } from 'react';
import { uploadPaper } from './adminApi';

export default function BulkUpload() {
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Refs for file inputs
  const mainFileInputRef = useRef<HTMLInputElement | null>(null);
  const cloneInputRef = useRef<HTMLInputElement | null>(null);
  const [cloneSourceIndex, setCloneSourceIndex] = useState<number | null>(null);

  // Options matching system constants
  const courses = ['BCA', 'B.Tech', 'MCA', 'PIHM', 'MVA', 'Ph.D'];
  const years = ['1 Year', '2 Year', '3 Year', '4 Year'];
  const semesters = ['1 Sem', '2 Sem', '3 Sem', '4 Sem', '5 Sem', '6 Sem', '7 Sem', '8 Sem'];
  const exams = ['MSE', 'ESE'];

  // Handle standard file selection (Empty defaults)
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.endsWith('.docx') || f.name.endsWith('.pdf')
    );

    if (validFiles.length === 0) return;

    const newItems = validFiles.map((file) => ({
      file,
      paperName: file.name.replace(/\.[^/.]+$/, ''), // Strip file extension
      course: '',
      year: '',
      specialization: '',
      semester: '',
      exam: '',
    }));

    setSelectedFiles((prev) => [...prev, ...newItems]);
    setMessage(null);
  };

  // Trigger the hidden file input specifically for cloning a row
  const triggerClone = (index: number) => {
    setCloneSourceIndex(index);
    cloneInputRef.current?.click();
  };

  // Handle file selection when "+ Add Similar" is clicked
  const handleCloneSelect = (files: FileList | null) => {
    if (!files || files.length === 0 || cloneSourceIndex === null) return;

    const sourceItem = selectedFiles[cloneSourceIndex];
    const validFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.endsWith('.docx') || f.name.endsWith('.pdf')
    );

    // Copy the dropdown settings from the source row
    const newItems = validFiles.map((file) => ({
      file,
      paperName: file.name.replace(/\.[^/.]+$/, ''),
      course: sourceItem.course,
      year: sourceItem.year,
      specialization: sourceItem.specialization,
      semester: sourceItem.semester,
      exam: sourceItem.exam,
    }));

    setSelectedFiles((prev) => {
      const updated = [...prev];
      // Insert the new cloned items right below the source item
      updated.splice(cloneSourceIndex + 1, 0, ...newItems);
      return updated;
    });
    
    setCloneSourceIndex(null); // Reset
    if (cloneInputRef.current) cloneInputRef.current.value = ""; // Clear input
  };

  const updateItemField = (index: number, field: string, value: any) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0) return;

    // Validate metadata for every item in queue
    for (const f of selectedFiles) {
      if (!f.course || !f.year || !f.semester || !f.exam || !f.paperName.trim()) {
        setMessage({
          type: 'error',
          text: `Paper "${f.file.name}" is missing required metadata (Course, Year, Sem, Exam, or Paper Name).`,
        });
        return;
      }
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const uploadResults = await Promise.all(
        selectedFiles.map(async (item) => {
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("course", item.course);
          formData.append("year", item.year);
          formData.append("spec", item.specialization || "");
          formData.append("sem", item.semester);
          formData.append("exam", item.exam);
          formData.append("name", item.paperName.trim());

          const res = await uploadPaper(formData);
          return res.ok;
        })
      );

      const successCount = uploadResults.filter(Boolean).length;

      setMessage({
        type: 'success',
        text: `Uploaded ${successCount} of ${selectedFiles.length} papers successfully!`,
      });
      setSelectedFiles([]);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Bulk upload failed. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
      
      {/* Hidden File Inputs */}
      <input
        ref={mainFileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx"
        onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ""; }}
        className="hidden"
      />
      <input
        ref={cloneInputRef}
        type="file"
        multiple
        accept=".pdf,.docx"
        onChange={(e) => handleCloneSelect(e.target.files)}
        className="hidden"
      />

      {/* Header & Main Action */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#003875]">Bulk Paper Upload</h2>
        {selectedFiles.length > 0 && (
          <button
            onClick={() => mainFileInputRef.current?.click()}
            className="bg-slate-100 text-[#003875] font-bold px-4 py-2 rounded-lg text-sm border border-slate-300 hover:bg-slate-200 transition-colors"
          >
            + Add New Blank Paper
          </button>
        )}
      </div>

      {/* Notification Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${ message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>
          {message.text}
        </div>
      )}

      {/* Initial Empty State (When no files are selected) */}
      {selectedFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Papers Selected</h3>
          <p className="text-slate-500 mb-6 max-w-md">
            Click below to select one or more PDF/DOCX files. You will be able to configure their details before uploading.
          </p>
          <button
            onClick={() => mainFileInputRef.current?.click()}
            className="bg-[#003875] text-amber-300 font-bold px-8 py-3 rounded-xl shadow-md hover:bg-[#002860] transition-colors text-lg"
          >
            Select Papers
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Files Ready to Configure ({selectedFiles.length})
            </h3>
            <button onClick={() => setSelectedFiles([])} className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline">
              Clear All
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {selectedFiles.map((item, idx) => (
              <div key={`${item.file.name}-${item.file.size}-${idx}`} className="border-2 border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:border-amber-300 transition-colors relative">
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 pb-3 border-b border-slate-100 gap-3">
                  <span className="text-sm font-bold text-[#003875] truncate flex items-center gap-2">
                    <span className="text-xl">📄</span> {item.file.name}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => triggerClone(idx)}
                      className="flex items-center gap-1.5 bg-amber-100 text-amber-900 hover:bg-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                      title="Select a new file and automatically apply these exact dropdown settings to it"
                    >
                      <span className="text-lg leading-none">+</span> Add Similar
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="col-span-1 md:col-span-2">
                    <label htmlFor={`paper-name-${idx}`} className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Paper Name</label>
                    <input
                      id={`paper-name-${idx}`}
                      type="text"
                      value={item.paperName}
                      onChange={(e) => updateItemField(idx, 'paperName', e.target.value)}
                      placeholder="e.g. Computer Networks"
                      className="p-2 text-sm border-2 border-slate-200 rounded-lg w-full bg-white font-semibold focus:border-[#003875] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="col-span-1">
                    <label htmlFor={`course-${idx}`} className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Course</label>
                    <select
                      id={`course-${idx}`}
                      value={item.course}
                      onChange={(e) => updateItemField(idx, 'course', e.target.value)}
                      className="p-2 text-sm border-2 border-slate-200 rounded-lg w-full bg-white focus:border-[#003875] focus:outline-none"
                    >
                      <option value="">Course</option>
                      {courses.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label htmlFor={`year-${idx}`} className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Year</label>
                    <select
                      id={`year-${idx}`}
                      value={item.year}
                      onChange={(e) => updateItemField(idx, 'year', e.target.value)}
                      className="p-2 text-sm border-2 border-slate-200 rounded-lg w-full bg-white focus:border-[#003875] focus:outline-none"
                    >
                      <option value="">Year</option>
                      {years.map((y) => (<option key={y} value={y}>{y}</option>))}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label htmlFor={`semester-${idx}`} className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Semester</label>
                    <select
                      id={`semester-${idx}`}
                      value={item.semester}
                      onChange={(e) => updateItemField(idx, 'semester', e.target.value)}
                      className="p-2 text-sm border-2 border-slate-200 rounded-lg w-full bg-white focus:border-[#003875] focus:outline-none"
                    >
                      <option value="">Sem</option>
                      {semesters.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label htmlFor={`exam-${idx}`} className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Exam</label>
                    <select
                      id={`exam-${idx}`}
                      value={item.exam}
                      onChange={(e) => updateItemField(idx, 'exam', e.target.value)}
                      className="p-2 text-sm border-2 border-slate-200 rounded-lg w-full bg-white focus:border-[#003875] focus:outline-none"
                    >
                      <option value="">Exam</option>
                      {exams.map((ex) => (<option key={ex} value={ex}>{ex}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center pt-6 border-t border-slate-200">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleBatchUpload}
              className="bg-[#003875] text-amber-300 hover:bg-[#002860] px-10 py-4 rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {isUploading ? (
                <>
                  <span className="w-5 h-5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"></span>
                  <span>Processing Background Upload...</span>
                </>
              ) : (
                selectedFiles.length > 1
                  ? `🚀 Upload ${selectedFiles.length} Papers to Database`
                  : `🚀 Upload ${selectedFiles.length} Paper to Database`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

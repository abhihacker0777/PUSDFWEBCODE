import React, { useState, useRef } from 'react';
import { uploadBulkPapers } from './adminApi';

export default function BulkUpload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);

  // Common Batch Metadata (Applied to new selected files or applied all at once)
  const [commonMetadata, setCommonMetadata] = useState({
    course: '',
    year: '',
    specialization: '',
    semester: '',
    exam: '',
  });

  const fileInputRef = useRef(null);

  // Options matching system constants
  const courses = ['BCA', 'B.Tech', 'MCA', 'PIHM', 'MVA', 'Ph.D'];
  const years = ['1 Year', '2 Year', '3 Year', '4 Year'];
  const semesters = ['1 Sem', '2 Sem', '3 Sem', '4 Sem', '5 Sem', '6 Sem', '7 Sem', '8 Sem'];
  const exams = ['MSE', 'ESE'];

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.endsWith('.docx') || f.name.endsWith('.pdf')
    );

    if (validFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please select valid PDF or DOCX files.' });
      return;
    }

    // Map selected files into queuing batch list with current common metadata defaults
    const newItems = validFiles.map((file) => ({
      file,
      paperName: file.name.replace(/\.[^/.]+$/, ''), // Strip file extension for default paper name
      course: commonMetadata.course,
      year: commonMetadata.year,
      specialization: commonMetadata.specialization,
      semester: commonMetadata.semester,
      exam: commonMetadata.exam,
    }));

    setSelectedFiles((prev) => [...prev, ...newItems]);
    setMessage(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const updateItemField = (index, field, value) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const removeItem = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Bulk apply common batch defaults to all currently queued items
  const applyCommonMetadataToAll = () => {
    if (selectedFiles.length === 0) return;
    setSelectedFiles((prev) =>
      prev.map((item) => ({
        ...item,
        course: commonMetadata.course || item.course,
        year: commonMetadata.year || item.year,
        specialization: commonMetadata.specialization || item.specialization,
        semester: commonMetadata.semester || item.semester,
        exam: commonMetadata.exam || item.exam,
      }))
    );
    setMessage({ type: 'success', text: 'Applied batch defaults to all queued papers.' });
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0) return;

    // Validate metadata for every item in queue
    for (let i = 0; i < selectedFiles.length; i++) {
      const f = selectedFiles[i];
      if (!f.course || !f.year || !f.semester || !f.exam || !f.paperName.trim()) {
        setMessage({
          type: 'error',
          text: `Paper #${i + 1} (${f.file.name}) is missing required metadata (Course, Year, Sem, Exam, or Paper Name).`,
        });
        return;
      }
    }

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    const metadataArray = [];

    selectedFiles.forEach((item) => {
      formData.append('files', item.file);
      metadataArray.push({
        paperName: item.paperName.trim(),
        course: item.course,
        year: item.year,
        specialization: item.specialization.trim(),
        semester: item.semester,
        exam: item.exam,
      });
    });

    formData.append('metadata', JSON.stringify(metadataArray));

    try {
      const response = await uploadBulkPapers(formData);

      if (response.ok || response.status === 200 || response.status === 202) {
        setMessage({
          type: 'success',
          text: `Bulk processing started for ${selectedFiles.length} paper(s)! Background jobs dispatched.`,
        });
        setSelectedFiles([]);
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Bulk upload failed');
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Bulk upload failed. Please check backend logs and try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-[#003875] mb-4">Bulk Paper Upload</h2>

      {/* Batch Default Settings Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Batch Default Settings (Auto-fills new files & quick-applies to queue)
          </span>
          <button
            type="button"
            onClick={applyCommonMetadataToAll}
            className="text-xs font-semibold text-[#003875] hover:underline"
          >
            Apply Defaults to All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <select
            value={commonMetadata.course}
            onChange={(e) => setCommonMetadata({ ...commonMetadata, course: e.target.value })}
            className="p-2 text-xs border rounded-lg bg-white"
          >
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={commonMetadata.year}
            onChange={(e) => setCommonMetadata({ ...commonMetadata, year: e.target.value })}
            className="p-2 text-xs border rounded-lg bg-white"
          >
            <option value="">Select Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Specialization (Opt)"
            value={commonMetadata.specialization}
            onChange={(e) => setCommonMetadata({ ...commonMetadata, specialization: e.target.value })}
            className="p-2 text-xs border rounded-lg bg-white"
          />

          <select
            value={commonMetadata.semester}
            onChange={(e) => setCommonMetadata({ ...commonMetadata, semester: e.target.value })}
            className="p-2 text-xs border rounded-lg bg-white"
          >
            <option value="">Select Semester</option>
            {semesters.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={commonMetadata.exam}
            onChange={(e) => setCommonMetadata({ ...commonMetadata, exam: e.target.value })}
            className="p-2 text-xs border rounded-lg bg-white"
          >
            <option value="">Select Exam</option>
            {exams.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Drag & Drop Target Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          isDragging ? 'border-amber-400 bg-amber-50/40' : 'border-amber-300 bg-amber-50/10'
        }`}
      >
        <div className="text-4xl mb-2">📁</div>
        <p className="font-semibold text-slate-700 mb-1">
          Drag & drop multiple PDF/DOCX files here
        </p>
        <p className="text-xs text-slate-400 mb-4">or click below to browse</p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#003875] text-amber-300 font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#002860] transition-colors shadow-sm"
        >
          📁 Choose Files
        </button>
      </div>

      {/* Notification Message */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Queued Papers List */}
      {selectedFiles.length > 0 ? (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-700">
              Selected Papers Queue ({selectedFiles.length})
            </h3>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              className="text-xs text-red-600 hover:underline"
            >
              Clear Queue
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {selectedFiles.map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 flex flex-wrap gap-2 items-center justify-between"
              >
                {/* File Metadata Controls */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 flex-grow">
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block font-mono truncate">
                      #{idx + 1}: {item.file.name}
                    </span>
                    <input
                      type="text"
                      value={item.paperName}
                      onChange={(e) => updateItemField(idx, 'paperName', e.target.value)}
                      placeholder="Paper Name"
                      className="p-1.5 text-xs border rounded w-full bg-white font-medium"
                    />
                  </div>

                  <select
                    value={item.course}
                    onChange={(e) => updateItemField(idx, 'course', e.target.value)}
                    className="p-1.5 text-xs border rounded bg-white"
                  >
                    <option value="">Course</option>
                    {courses.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <select
                    value={item.year}
                    onChange={(e) => updateItemField(idx, 'year', e.target.value)}
                    className="p-1.5 text-xs border rounded bg-white"
                  >
                    <option value="">Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>

                  <select
                    value={item.semester}
                    onChange={(e) => updateItemField(idx, 'semester', e.target.value)}
                    className="p-1.5 text-xs border rounded bg-white"
                  >
                    <option value="">Sem</option>
                    {semesters.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <select
                    value={item.exam}
                    onChange={(e) => updateItemField(idx, 'exam', e.target.value)}
                    className="p-1.5 text-xs border rounded bg-white"
                  >
                    <option value="">Exam</option>
                    {exams.map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>

                {/* Remove Single File */}
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-slate-400 hover:text-red-600 text-sm p-1 ml-2 transition-colors"
                  title="Remove from batch"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleBatchUpload}
              className="bg-[#003875] text-amber-300 hover:bg-[#002860] px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {isUploading ? 'Uploading Batch...' : `🚀 Upload All (${selectedFiles.length} Papers)`}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-slate-400 mt-4">
          No files selected yet. Drag & drop or choose files above.
        </p>
      )}
    </div>
  );
}
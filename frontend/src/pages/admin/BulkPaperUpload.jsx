import { useState } from "react";
import { CustomDropdown } from "./AdminShared";

const StatusBadge = ({ status, message }) => {
  if (status === "uploading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#05488B]">
        <span className="w-3 h-3 border-2 border-[#05488B] border-t-transparent rounded-full animate-spin"></span>
        Uploading...
      </span>
    );
  }
  if (status === "success") {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#22c55e]">✅ Uploaded</span>;
  }
  if (status === "error") {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#f43f5e]" title={message}>❌ {message || "Failed"}</span>;
  }
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">Pending</span>;
};

const BulkPaperUploadRow = ({ row, options, onFieldChange, onRemove, openDropdown, setOpenDropdown }) => {
  const locked = row.status === "uploading" || row.status === "success";

  return (
    <div className={`w-full rounded-xl border p-4 shadow-sm transition-colors ${row.status === "error" ? "border-[#f43f5e]/60 bg-[#fef2f2]" : row.status === "success" ? "border-[#22c55e]/50 bg-[#f0fdf4]" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs text-gray-500 truncate" title={row.fileName}>📄 {row.fileName}</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={row.status} message={row.message} />
          {!locked && (
            <button type="button" onClick={() => onRemove(row.id)} className="text-red-500 hover:text-red-700 text-sm font-bold" title="Remove from queue">❌</button>
          )}
        </div>
      </div>

      <input
        type="text"
        placeholder="Paper Name"
        value={row.paperName}
        disabled={locked}
        onChange={(e) => onFieldChange(row.id, "paperName", e.target.value)}
        className={`w-full border rounded-lg px-4 py-2 text-base font-medium shadow-sm outline-none transition-all mb-3 placeholder:text-[#374151] ${locked ? "bg-gray-50 cursor-not-allowed text-gray-500" : "bg-white border-[#ffc107] text-[#215ea0]"}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <CustomDropdown id={`${row.id}-course`} label="Course" disabled={locked} options={options.courses} value={row.course} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[149px]" setValue={(val) => onFieldChange(row.id, "course", val)} />
        <CustomDropdown id={`${row.id}-year`} label="Year" disabled={locked} options={options.years} value={row.year} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[149px]" setValue={(val) => onFieldChange(row.id, "year", val)} />
        <CustomDropdown id={`${row.id}-spec`} label="Specialization" disabled={locked} options={options.specs} value={row.spec} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[149px]" setValue={(val) => onFieldChange(row.id, "spec", val)} />
        <CustomDropdown id={`${row.id}-sem`} label="Semester" disabled={locked} options={options.semesters} value={row.semester} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[92px]" setValue={(val) => onFieldChange(row.id, "semester", val)} />
        <CustomDropdown id={`${row.id}-exam`} label="Exam" disabled={locked} options={options.exams} value={row.exam} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} customHeight="max-h-[92px]" setValue={(val) => onFieldChange(row.id, "exam", val)} />
      </div>
    </div>
  );
};

const BulkPaperUpload = ({
  bulkFiles,
  bulkIsDragging,
  bulkIsUploading,
  bulkSummary,
  bulkValidationError,
  addBulkFiles,
  removeBulkFile,
  clearBulkQueue,
  updateBulkFileField,
  bulkOptionsForRow,
  uploadAllBulkFiles,
  bulkDragHandlers,
  canCreatePapers
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  if (!canCreatePapers) {
    return (
      <div className="w-full bg-white rounded-xl shadow-md p-6 border text-center text-gray-500 font-medium">
        You do not have permission to upload new papers.
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-md p-4 sm:p-6 border relative">
      <div
        {...bulkDragHandlers}
        onClick={() => document.getElementById("bulkFileInput").click()}
        className={`w-full rounded-xl border-2 border-dashed p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${bulkIsDragging ? "border-[#05488B] bg-[#eef5ff]" : "border-[#ffc107] bg-[#fffdf5] hover:bg-[#fffaf0]"}`}
      >
        <input
          id="bulkFileInput" type="file" multiple className="hidden"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => { addBulkFiles(e.target.files); e.target.value = ""; }}
        />
        <div className="text-4xl mb-3">📁</div>
        <p className="text-base sm:text-lg font-semibold text-[#374151]">Drag &amp; drop multiple PDF/DOCX files here</p>
        <p className="text-sm text-gray-500 mb-4">or click below to browse</p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); document.getElementById("bulkFileInput").click(); }}
          className="bg-[#05488B] hover:bg-[#215ea0] text-[#ffc107] px-6 py-2 rounded-lg shadow font-medium"
        >
          📂 Choose Files
        </button>
      </div>

      {bulkValidationError && (
        <div className="mt-3 text-sm font-medium text-[#f43f5e] flex items-center gap-1.5">❌ {bulkValidationError}</div>
      )}

      {bulkFiles.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-6 mb-3">
            <h3 className="text-base sm:text-lg font-bold text-[#374151]">Selected Papers Queue ({bulkFiles.length})</h3>
            {!bulkIsUploading && (
              <button type="button" onClick={clearBulkQueue} className="text-sm font-medium text-[#f43f5e] hover:text-[#c11018]">Clear Queue</button>
            )}
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc107] [&::-webkit-scrollbar-thumb]:rounded-full">
            {bulkFiles.map((row) => (
              <BulkPaperUploadRow
                key={row.id}
                row={row}
                options={bulkOptionsForRow(row)}
                onFieldChange={updateBulkFileField}
                onRemove={removeBulkFile}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
              />
            ))}
          </div>

          {bulkSummary && (
            <div className={`mt-4 text-sm font-semibold flex items-center gap-1.5 ${bulkSummary.failed > 0 ? "text-[#f43f5e]" : "text-[#22c55e]"}`}>
              {bulkSummary.failed > 0 ? "❌" : "✅"} {bulkSummary.succeeded} of {bulkSummary.total} paper{bulkSummary.total > 1 ? "s" : ""} uploaded successfully{bulkSummary.failed > 0 ? `, ${bulkSummary.failed} failed` : ""}.
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={uploadAllBulkFiles}
              disabled={bulkIsUploading}
              className="w-full sm:w-auto bg-[#05488B] hover:bg-[#215ea0] disabled:opacity-60 disabled:cursor-not-allowed text-[#ffc107] px-8 py-2.5 rounded-lg shadow-sm font-bold"
            >
              {bulkIsUploading ? "⏳ Uploading..." : `🚀 Upload All (${bulkFiles.length} Paper${bulkFiles.length > 1 ? "s" : ""})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BulkPaperUpload;

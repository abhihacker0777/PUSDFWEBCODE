import { Upload, Edit, Trash2 } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { CustomDropdown } from "../utils/AdminShared";

const StatusBadge = ({ status, message }: { status?: string; message?: string }) => {
  if (status === "uploading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#05488B]">
        <span className="w-3 h-3 border-2 border-[#05488B] border-t-transparent rounded-full animate-spin"></span>
        <span>Uploading...</span>
      </span>
    );
  }
  if (status === "success") {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#22c55e]">✅ {message || "Uploaded"}</span>;
  }
  if (status === "error") {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#f43f5e]" title={message}>❌ {message || "Failed"}</span>;
  }
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">Pending</span>;
};

const getRowCardClass = (isSelected: boolean, status?: string) => {
  if (isSelected) {
    return "bg-amber-50/70 border-amber-400 shadow-sm";
  }
  if (status === "error") {
    return "bg-red-50/50 border-red-200";
  }
  if (status === "success") {
    return "bg-emerald-50/40 border-emerald-200";
  }
  return "bg-gray-50/60 border-gray-200 hover:border-gray-300";
};
const TargetDropdownRow = ({
  rowId,
  target,
  targetIndex,
  isMultiple,
  locked,
  options,
  onFieldChange,
  onRemoveTarget,
  openDropdown,
  setOpenDropdown
}: any) => {
  return (
    <div className={`relative ${targetIndex > 0 ? "pt-2.5 mt-2.5 border-t border-dashed border-gray-200" : ""}`}>
      {targetIndex > 0 && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-[#05488B] tracking-wide">
            Additional Course #{targetIndex + 1}
          </span>
          {!locked && (
            <button
              type="button"
              onClick={() => onRemoveTarget(rowId, target.id)}
              className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-0.5"
              title="Remove this extra course mapping"
            >
              ✕ Remove
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <CustomDropdown
          id={`${rowId}-${target.id}-course`}
          label="Course"
          disabled={locked}
          options={options.courses}
          value={target.course}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          customHeight="max-h-[149px]"
          setValue={(val) => onFieldChange(rowId, target.id, "course", val)}
        />
        <CustomDropdown
          id={`${rowId}-${target.id}-year`}
          label="Year"
          disabled={locked}
          options={options.years}
          value={target.year}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          customHeight="max-h-[149px]"
          setValue={(val) => onFieldChange(rowId, target.id, "year", val)}
        />
        <CustomDropdown
          id={`${rowId}-${target.id}-spec`}
          label="Specialization"
          disabled={locked}
          options={options.specs}
          value={target.spec}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          customHeight="max-h-[149px]"
          setValue={(val) => onFieldChange(rowId, target.id, "spec", val)}
        />
        <CustomDropdown
          id={`${rowId}-${target.id}-sem`}
          label="Semester"
          disabled={locked}
          options={options.semesters}
          value={target.semester}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          customHeight="max-h-[92px]"
          setValue={(val) => onFieldChange(rowId, target.id, "semester", val)}
        />
        <CustomDropdown
          id={`${rowId}-${target.id}-exam`}
          label="Exam"
          disabled={locked}
          options={options.exams}
          value={target.exam}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          customHeight="max-h-[92px]"
          setValue={(val) => onFieldChange(rowId, target.id, "exam", val)}
        />
      </div>
    </div>
  );
};

const BulkPaperUploadRow = ({
  row,
  isSelected,
  onToggleSelect,
  optionsForTarget,
  onFieldChange,
  onRemove,
  onAddTarget,
  onRemoveTarget,
  openDropdown,
  setOpenDropdown
}: any) => {
  const locked = row.status === "uploading" || row.status === "success";

  return (
    <div className={`p-3.5 rounded-xl border transition-all ${getRowCardClass(isSelected, row.status)}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(row.id)}
            disabled={locked}
            className="w-4 h-4 rounded accent-[#05488B] cursor-pointer shrink-0 disabled:opacity-40"
          />
          <span className="text-xl shrink-0">{row.link ? "🔗" : "📄"}</span>
          <div className="min-w-0 flex-1">
            <input
              type="text"
              disabled={locked}
              value={row.paperName}
              placeholder="Paper Name"
              onChange={(e) => onFieldChange(row.id, null, "paperName", e.target.value)}
              className="font-bold text-xs sm:text-sm text-[#05488B] bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#05488B] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 px-1 py-0.5 w-full truncate"
              title="Click to rename paper title"
            />
            <p className="text-[11px] text-gray-500 truncate px-1" title={row.link || row.fileName}>
              {row.link ? `Link: ${row.link}` : `File: ${row.fileName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          <StatusBadge status={row.status} message={row.message} />

          {!locked && (
            <button
              type="button"
              onClick={() => onAddTarget(row.id)}
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
              title="Add this same paper to another course/year/semester without uploading again"
            >
              <span>+</span> Add Similar
            </button>
          )}

          {!locked && (
            <button
              type="button"
              onClick={() => onRemove(row.id)}
              className="text-gray-400 hover:text-red-500 p-1 text-sm font-bold transition-colors"
              title="Remove from queue"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 space-y-2">
        {row.targets.map((target: any, idx: number) => (
          <TargetDropdownRow
            key={target.id}
            rowId={row.id}
            target={target}
            targetIndex={idx}
            isMultiple={row.targets.length > 1}
            locked={locked}
            options={optionsForTarget(target)}
            onFieldChange={onFieldChange}
            onRemoveTarget={onRemoveTarget}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
        ))}
      </div>
    </div>
  );
};

const BulkDbFilters = ({
  prefix,
  dbSearch,
  setDbSearch,
  dbCourseFilter,
  setDbCourseFilter,
  dbSemFilter,
  setDbSemFilter,
  dbExamFilter,
  setDbExamFilter,
  setDbPage,
  uniqueCourses,
  uniqueSemesters,
  uniqueExams,
  openDropdown,
  setOpenDropdown,
}: any) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
      <input
        type="text"
        placeholder="🔍 Search paper name..."
        value={dbSearch}
        onChange={(e) => {
          setDbSearch(e.target.value);
          setDbPage(1);
        }}
        className="w-full bg-white border border-[#ffc107] rounded-lg px-3 py-2 text-xs md:text-sm font-medium outline-none text-[#215ea0] placeholder:text-[#374151] shadow-xs"
      />
      <CustomDropdown
        id={`${prefix}-filter-course`}
        label="All Courses"
        options={["All Courses", ...uniqueCourses]}
        value={dbCourseFilter || "All Courses"}
        setValue={(val: string) => {
          setDbCourseFilter(val === "All Courses" ? "" : val);
          setDbPage(1);
        }}
        openDropdown={openDropdown}
        setOpenDropdown={setOpenDropdown}
        customHeight="max-h-[149px]"
      />
      <CustomDropdown
        id={`${prefix}-filter-sem`}
        label="All Semesters"
        options={["All Semesters", ...uniqueSemesters]}
        value={dbSemFilter || "All Semesters"}
        setValue={(val: string) => {
          setDbSemFilter(val === "All Semesters" ? "" : val);
          setDbPage(1);
        }}
        openDropdown={openDropdown}
        setOpenDropdown={setOpenDropdown}
        customHeight="max-h-[149px]"
      />
      <CustomDropdown
        id={`${prefix}-filter-exam`}
        label="All Exams"
        options={["All Exams", ...uniqueExams]}
        value={dbExamFilter || "All Exams"}
        setValue={(val: string) => {
          setDbExamFilter(val === "All Exams" ? "" : val);
          setDbPage(1);
        }}
        openDropdown={openDropdown}
        setOpenDropdown={setOpenDropdown}
        customHeight="max-h-[149px]"
      />
    </div>
  );
};

const BulkPapersDbTable = ({
  pagedDbPapers,
  dbSelectedIds,
  toggleAllDbPapers,
  toggleDbPaper,
  totalCount,
  dbPage,
  dbPageSize,
  setDbPage,
  accentColor = "accent-[#05488B]",
  activeRowBg = "bg-amber-50",
}: any) => {
  const allSelected =
    pagedDbPapers.length > 0 &&
    pagedDbPapers.every((p: any) => dbSelectedIds.has(String(p.index ?? p.id)));

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
      <div className="max-h-[340px] overflow-y-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 z-10 border-b">
            <tr>
              <th className="p-2.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => toggleAllDbPapers(pagedDbPapers)}
                  className={`w-4 h-4 rounded cursor-pointer ${accentColor}`}
                />
              </th>
              <th className="p-2.5">Paper Name</th>
              <th className="p-2.5">Course</th>
              <th className="p-2.5">Specialization</th>
              <th className="p-2.5">Sem</th>
              <th className="p-2.5">Exam</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedDbPapers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  No papers match your filters.
                </td>
              </tr>
            ) : (
              pagedDbPapers.map((paper: any) => {
                const id = String(paper.index ?? paper.id);
                const isChecked = dbSelectedIds.has(id);
                return (
                  <tr
                    key={id}
                    onClick={() => toggleDbPaper(id)}
                    className={`cursor-pointer transition-colors ${
                      isChecked ? activeRowBg : "hover:bg-gray-50"
                    }`}
                  >
                    <td
                      className="p-2.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDbPaper(id)}
                        className={`w-4 h-4 rounded cursor-pointer ${accentColor}`}
                      />
                    </td>
                    <td className="p-2.5 font-semibold text-gray-800">
                      {paper.name}
                    </td>
                    <td className="p-2.5 text-gray-600">{paper.course}</td>
                    <td className="p-2.5 text-gray-600">
                      {paper.spec || paper.specialization || "-"}
                    </td>
                    <td className="p-2.5 text-gray-600">
                      {paper.sem || paper.semester || "-"}
                    </td>
                    <td className="p-2.5 text-gray-600">{paper.exam}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-2 bg-gray-50 border-t flex items-center justify-between text-xs text-gray-500">
        <span>
          Showing {pagedDbPapers.length} of {totalCount} papers
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={dbPage <= 1}
            onClick={() => setDbPage((p: number) => Math.max(1, p - 1))}
            className="px-2.5 py-1 bg-white border rounded disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-2 py-1 font-bold">Page {dbPage}</span>
          <button
            type="button"
            disabled={dbPage * dbPageSize >= totalCount}
            onClick={() => setDbPage((p: number) => p + 1)}
            className="px-2.5 py-1 bg-white border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

interface BulkEditModeViewProps {
  dbActionMessage: any;
  setDbActionMessage: (msg: any) => void;
  dbSearch: string;
  setDbSearch: (val: string) => void;
  dbCourseFilter: string;
  setDbCourseFilter: (val: string) => void;
  dbSemFilter: string;
  setDbSemFilter: (val: string) => void;
  dbExamFilter: string;
  setDbExamFilter: (val: string) => void;
  dbPage: number;
  setDbPage: (val: any) => void;
  dbPageSize: number;
  uniqueCourses: any[];
  uniqueYears: any[];
  uniqueSemesters: any[];
  uniqueExams: any[];
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  selectedDbPapersList: any[];
  clearDbSelection: () => void;
  editUpdates: any;
  setEditUpdates: (val: any) => void;
  isDbActionLoading: boolean;
  handleExecuteBulkEdit: () => void;
  pagedDbPapers: any[];
  dbSelectedIds: Set<any>;
  toggleAllDbPapers: () => void;
  toggleDbPaper: (id: any) => void;
  totalFilteredCount: number;
}

const BulkEditModeView: React.FC<BulkEditModeViewProps> = ({
  dbActionMessage,
  setDbActionMessage,
  dbSearch,
  setDbSearch,
  dbCourseFilter,
  setDbCourseFilter,
  dbSemFilter,
  setDbSemFilter,
  dbExamFilter,
  setDbExamFilter,
  dbPage,
  setDbPage,
  dbPageSize,
  uniqueCourses,
  uniqueYears,
  uniqueSemesters,
  uniqueExams,
  openDropdown,
  setOpenDropdown,
  selectedDbPapersList,
  clearDbSelection,
  editUpdates,
  setEditUpdates,
  isDbActionLoading,
  handleExecuteBulkEdit,
  pagedDbPapers,
  dbSelectedIds,
  toggleAllDbPapers,
  toggleDbPaper,
  totalFilteredCount,
}) => (
  <div className="space-y-3.5">
    {dbActionMessage && (
      <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
        dbActionMessage.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
      }`}>
        <span>{dbActionMessage.type === "error" ? "❌ " : "✅ "}{dbActionMessage.text}</span>
        <button type="button" onClick={() => setDbActionMessage(null)} className="text-gray-400 hover:text-black">✕</button>
      </div>
    )}

    <BulkDbFilters
      prefix="bulk-edit"
      dbSearch={dbSearch}
      setDbSearch={setDbSearch}
      dbCourseFilter={dbCourseFilter}
      setDbCourseFilter={setDbCourseFilter}
      dbSemFilter={dbSemFilter}
      setDbSemFilter={setDbSemFilter}
      dbExamFilter={dbExamFilter}
      setDbExamFilter={setDbExamFilter}
      setDbPage={setDbPage}
      uniqueCourses={uniqueCourses}
      uniqueSemesters={uniqueSemesters}
      uniqueExams={uniqueExams}
      openDropdown={openDropdown}
      setOpenDropdown={setOpenDropdown}
    />

    {selectedDbPapersList.length > 0 && (
      <div className="p-3.5 bg-blue-50/80 border-2 border-blue-300 rounded-xl space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#05488B]">
            ✏️ Bulk Update Selected ({selectedDbPapersList.length} Papers)
          </span>
          <button type="button" onClick={clearDbSelection} className="text-xs text-gray-500 hover:text-black">
            Clear Selection
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <div>
            <label htmlFor="bulk-edit-drawer-course" className="text-[10px] font-bold text-gray-500 block mb-0.5">NEW COURSE</label>
            <CustomDropdown
              id="bulk-edit-drawer-course"
              label="(Keep Same)"
              options={["(Keep Same)", ...uniqueCourses]}
              value={editUpdates.course || "(Keep Same)"}
              setValue={(val) => setEditUpdates({ ...editUpdates, course: val === "(Keep Same)" ? "" : val })}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              customHeight="max-h-[149px]"
            />
          </div>

          <div>
            <label htmlFor="bulk-edit-drawer-year" className="text-[10px] font-bold text-gray-500 block mb-0.5">NEW YEAR</label>
            <CustomDropdown
              id="bulk-edit-drawer-year"
              label="(Keep Same)"
              options={["(Keep Same)", ...uniqueYears]}
              value={editUpdates.year || "(Keep Same)"}
              setValue={(val) => setEditUpdates({ ...editUpdates, year: val === "(Keep Same)" ? "" : val })}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              customHeight="max-h-[149px]"
            />
          </div>

          <div>
            <label htmlFor="bulk-edit-drawer-spec" className="text-[10px] font-bold text-gray-500 block mb-0.5">NEW SPECIALIZATION</label>
            <input
              id="bulk-edit-drawer-spec"
              placeholder="(Keep Same)"
              value={editUpdates.spec}
              onChange={(e) => setEditUpdates({ ...editUpdates, spec: e.target.value })}
              className="w-full bg-white border border-[#ffc107] rounded-lg px-4 py-2 text-base font-medium text-center shadow-xs outline-none text-[#215ea0] placeholder:text-[#374151]"
            />
          </div>

          <div>
            <label htmlFor="bulk-edit-drawer-sem" className="text-[10px] font-bold text-gray-500 block mb-0.5">NEW SEMESTER</label>
            <CustomDropdown
              id="bulk-edit-drawer-sem"
              label="(Keep Same)"
              options={["(Keep Same)", ...uniqueSemesters]}
              value={editUpdates.semester || "(Keep Same)"}
              setValue={(val) => setEditUpdates({ ...editUpdates, semester: val === "(Keep Same)" ? "" : val })}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              customHeight="max-h-[149px]"
            />
          </div>

          <div>
            <label htmlFor="bulk-edit-drawer-exam" className="text-[10px] font-bold text-gray-500 block mb-0.5">NEW EXAM</label>
            <CustomDropdown
              id="bulk-edit-drawer-exam"
              label="(Keep Same)"
              options={["(Keep Same)", "MSE", "ESE"]}
              value={editUpdates.exam || "(Keep Same)"}
              setValue={(val) => setEditUpdates({ ...editUpdates, exam: val === "(Keep Same)" ? "" : val })}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              customHeight="max-h-[149px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={isDbActionLoading}
            onClick={handleExecuteBulkEdit}
            className="bg-[#05488B] hover:bg-[#215ea0] disabled:opacity-50 text-[#ffc107] font-bold text-xs px-5 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            {isDbActionLoading ? "Updating..." : `💾 Apply Changes to ${selectedDbPapersList.length} Papers`}
          </button>
        </div>
      </div>
    )}

    <BulkPapersDbTable
      pagedDbPapers={pagedDbPapers}
      dbSelectedIds={dbSelectedIds}
      toggleAllDbPapers={toggleAllDbPapers}
      toggleDbPaper={toggleDbPaper}
      totalCount={totalFilteredCount}
      dbPage={dbPage}
      dbPageSize={dbPageSize}
      setDbPage={setDbPage}
      accentColor="accent-[#05488B]"
      activeRowBg="bg-amber-50"
    />
  </div>
);

interface BulkDeleteModeViewProps {
  dbActionMessage: any;
  setDbActionMessage: (msg: any) => void;
  dbSearch: string;
  setDbSearch: (val: string) => void;
  dbCourseFilter: string;
  setDbCourseFilter: (val: string) => void;
  dbSemFilter: string;
  setDbSemFilter: (val: string) => void;
  dbExamFilter: string;
  setDbExamFilter: (val: string) => void;
  dbPage: number;
  setDbPage: (val: any) => void;
  dbPageSize: number;
  uniqueCourses: any[];
  uniqueSemesters: any[];
  uniqueExams: any[];
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  selectedDbPapersList: any[];
  clearDbSelection: () => void;
  isDbActionLoading: boolean;
  setShowDeleteConfirm: (val: boolean) => void;
  pagedDbPapers: any[];
  dbSelectedIds: Set<any>;
  toggleAllDbPapers: () => void;
  toggleDbPaper: (id: any) => void;
  totalFilteredCount: number;
}

const BulkDeleteModeView: React.FC<BulkDeleteModeViewProps> = ({
  dbActionMessage,
  setDbActionMessage,
  dbSearch,
  setDbSearch,
  dbCourseFilter,
  setDbCourseFilter,
  dbSemFilter,
  setDbSemFilter,
  dbExamFilter,
  setDbExamFilter,
  dbPage,
  setDbPage,
  dbPageSize,
  uniqueCourses,
  uniqueSemesters,
  uniqueExams,
  openDropdown,
  setOpenDropdown,
  selectedDbPapersList,
  clearDbSelection,
  isDbActionLoading,
  setShowDeleteConfirm,
  pagedDbPapers,
  dbSelectedIds,
  toggleAllDbPapers,
  toggleDbPaper,
  totalFilteredCount,
}) => (
  <div className="space-y-3.5">
    {dbActionMessage && (
      <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
        dbActionMessage.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
      }`}>
        <span>{dbActionMessage.type === "error" ? "❌ " : "✅ "}{dbActionMessage.text}</span>
        <button type="button" onClick={() => setDbActionMessage(null)} className="text-gray-400 hover:text-black">✕</button>
      </div>
    )}

    <BulkDbFilters
      prefix="bulk-delete"
      dbSearch={dbSearch}
      setDbSearch={setDbSearch}
      dbCourseFilter={dbCourseFilter}
      setDbCourseFilter={setDbCourseFilter}
      dbSemFilter={dbSemFilter}
      setDbSemFilter={setDbSemFilter}
      dbExamFilter={dbExamFilter}
      setDbExamFilter={setDbExamFilter}
      setDbPage={setDbPage}
      uniqueCourses={uniqueCourses}
      uniqueSemesters={uniqueSemesters}
      uniqueExams={uniqueExams}
      openDropdown={openDropdown}
      setOpenDropdown={setOpenDropdown}
    />

    <div className="flex items-center justify-between p-3 bg-red-50/80 border border-red-200 rounded-xl">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-red-900">
          Selected for Deletion: {selectedDbPapersList.length} Paper{selectedDbPapersList.length === 1 ? "" : "s"}
        </span>
        {selectedDbPapersList.length > 0 && (
          <button type="button" onClick={clearDbSelection} className="text-xs text-gray-500 hover:text-black">
            (Clear)
          </button>
        )}
      </div>

      <button
        type="button"
        disabled={selectedDbPapersList.length === 0 || isDbActionLoading}
        onClick={() => setShowDeleteConfirm(true)}
        className="bg-[#E31E24] hover:bg-[#c11018] disabled:opacity-40 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
      >
        {isDbActionLoading ? "Deleting..." : `🗑️ Delete Selected (${selectedDbPapersList.length})`}
      </button>
    </div>

    <BulkPapersDbTable
      pagedDbPapers={pagedDbPapers}
      dbSelectedIds={dbSelectedIds}
      toggleAllDbPapers={toggleAllDbPapers}
      toggleDbPaper={toggleDbPaper}
      totalCount={totalFilteredCount}
      dbPage={dbPage}
      dbPageSize={dbPageSize}
      setDbPage={setDbPage}
      accentColor="accent-[#E31E24]"
      activeRowBg="bg-red-50/70"
    />
  </div>
);

interface BulkSubHeaderNavProps {
  bulkMode: string;
  setBulkMode: (mode: string) => void;
  bulkFilesCount: number;
  canEditPapers: boolean;
  canDeletePapers: boolean;
  selectedQueueCount: number;
  showQuickApply: boolean;
  setShowQuickApply: (show: boolean) => void;
  removeSelectedQueueItems: () => void;
}

const BulkSubHeaderNav: React.FC<BulkSubHeaderNavProps> = ({
  bulkMode,
  setBulkMode,
  bulkFilesCount,
  canEditPapers,
  canDeletePapers,
  selectedQueueCount,
  showQuickApply,
  setShowQuickApply,
  removeSelectedQueueItems,
}) => {
  const uploadButtonClass = bulkMode === "upload"
    ? "bg-[#05488B] text-[#ffc107] shadow-sm ring-2 ring-[#05488B]/20"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  const editButtonClass = bulkMode === "edit"
    ? "bg-[#05488B] text-[#ffc107] shadow-sm ring-2 ring-[#05488B]/20"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  const deleteButtonClass = bulkMode === "delete"
    ? "bg-[#E31E24] text-white shadow-sm ring-2 ring-[#E31E24]/20"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  const quickFillLabel = selectedQueueCount > 0 ? `Selected (${selectedQueueCount})` : "All";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-4 pb-3 border-b border-gray-200">
      <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setBulkMode("upload")}
          className={`px-2 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-center ${uploadButtonClass}`}
        >
          <Upload className="w-3.5 h-3.5 shrink-0" />
          <span>Bulk Upload</span>
          {bulkFilesCount > 0 && <span className="ml-0.5 text-[10px] sm:text-xs">({bulkFilesCount})</span>}
        </button>

        {canEditPapers && (
          <button
            type="button"
            onClick={() => setBulkMode("edit")}
            className={`px-2 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-center ${editButtonClass}`}
          >
            <Edit className="w-3.5 h-3.5 shrink-0" />
            <span>Bulk Edit</span>
          </button>
        )}

        {canDeletePapers && (
          <button
            type="button"
            onClick={() => setBulkMode("delete")}
            className={`px-2 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-center ${deleteButtonClass}`}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Bulk Delete</span>
          </button>
        )}
      </div>

      {bulkMode === "upload" && bulkFilesCount > 0 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuickApply(!showQuickApply)}
            className="bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
          >
            ⚡ Quick Fill {quickFillLabel}
          </button>

          {selectedQueueCount > 0 && (
            <button
              type="button"
              onClick={removeSelectedQueueItems}
              className="bg-red-50 text-red-700 border border-red-300 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
            >
              🗑️ Remove Selected ({selectedQueueCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface BulkDeleteConfirmModalProps {
  selectedCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

const BulkDeleteConfirmModal: React.FC<BulkDeleteConfirmModalProps> = ({
  selectedCount,
  onCancel,
  onConfirm,
}) => (
  <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity">
    <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center transform transition-all border-t-8 border-red-500">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete {selectedCount} Papers?</h2>
      <p className="text-gray-600 mb-6 text-sm">
        Are you sure you want to permanently delete these <span className="font-bold text-red-600">{selectedCount}</span> papers from the database and Google Sheet backup?
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2.5 rounded-lg font-bold transition-colors w-full"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="bg-[#E31E24] hover:bg-[#c11018] text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-colors w-full"
        >
          Yes, Delete All
        </button>
      </div>
    </div>
  </div>
);

interface BulkUploadModeViewProps {
  bulkFiles: any[];
  bulkDragHandlers: any;
  mainInputRef: React.RefObject<HTMLInputElement | null>;
  bulkIsDragging: boolean;
  pasteLinkUrl: string;
  setPasteLinkUrl: (url: string) => void;
  handleAddLinkSubmit: (e: any) => void;
  showQuickApply: boolean;
  setShowQuickApply: (show: boolean) => void;
  selectedQueueIds: Set<any>;
  quickFields: any;
  setQuickFields: (fields: any) => void;
  handleApplyQuick: () => void;
  toggleAllQueueItems: () => void;
  showLinkInput: boolean;
  setShowLinkInput: (show: boolean) => void;
  bulkIsUploading: boolean;
  clearBulkQueue: () => void;
  bulkValidationError: string;
  bulkSummary: any;
  toggleQueueItem: (id: any) => void;
  bulkOptionsForTarget: any;
  updateBulkFileField: any;
  removeBulkFile: any;
  addTargetToRow: any;
  removeTargetFromRow: any;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  uploadAllBulkFiles: () => void;
}

const BulkUploadModeView: React.FC<BulkUploadModeViewProps> = ({
  bulkFiles,
  bulkDragHandlers,
  mainInputRef,
  bulkIsDragging,
  pasteLinkUrl,
  setPasteLinkUrl,
  handleAddLinkSubmit,
  showQuickApply,
  setShowQuickApply,
  selectedQueueIds,
  quickFields,
  setQuickFields,
  handleApplyQuick,
  toggleAllQueueItems,
  showLinkInput,
  setShowLinkInput,
  bulkIsUploading,
  clearBulkQueue,
  bulkValidationError,
  bulkSummary,
  toggleQueueItem,
  bulkOptionsForTarget,
  updateBulkFileField,
  removeBulkFile,
  addTargetToRow,
  removeTargetFromRow,
  openDropdown,
  setOpenDropdown,
  uploadAllBulkFiles,
}) => {
  const queuePlural = bulkFiles.length > 1 ? "s" : "";
  const uploadButtonLabel = `🚀 Upload All (${bulkFiles.length} Paper${queuePlural})`;
  const quickFillCountLabel = selectedQueueIds.size > 0
    ? `${selectedQueueIds.size} Selected Rows`
    : `All ${bulkFiles.length} Rows`;
  const applyButtonLabel = selectedQueueIds.size > 0 ? "Selected" : "All";
  const linkToggleLabel = showLinkInput ? "Hide Link" : "+ Add Link";

  if (bulkFiles.length === 0) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          {...bulkDragHandlers}
          onClick={() => mainInputRef.current?.click()}
          className={`w-full rounded-xl border-2 border-dashed p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors block ${
            bulkIsDragging ? "border-[#05488B] bg-[#eef5ff]" : "border-[#ffc107] bg-[#fffdf5] hover:bg-[#fffaf0]"
          }`}
        >
          <div className="text-3xl mb-2">📁</div>
          <p className="text-base font-semibold text-[#374151]">Drag &amp; drop PDF/DOCX files here</p>
          <p className="text-xs text-gray-500 mb-3">or browse files from your computer</p>
          <span className="inline-block bg-[#05488B] hover:bg-[#215ea0] text-[#ffc107] px-5 py-1.5 rounded-lg shadow font-medium text-sm transition-colors">
            📂 Choose Files
          </span>
        </button>

        <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col sm:flex-row items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 shrink-0">🔗 Have document link?</span>
          <input
            type="url"
            placeholder="Paste Google Drive or direct PDF/DOCX URL..."
            value={pasteLinkUrl}
            onChange={(e) => setPasteLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddLinkSubmit(e); }}
            className="flex-1 w-full bg-white border border-gray-300 focus:border-[#05488B] text-gray-800 placeholder-gray-400 px-3 py-1.5 text-xs rounded-lg shadow-xs outline-none"
          />
          <button
            type="button"
            onClick={handleAddLinkSubmit}
            disabled={!pasteLinkUrl.trim()}
            className="w-full sm:w-auto bg-[#05488B] disabled:opacity-50 hover:bg-[#215ea0] text-[#ffc107] px-4 py-1.5 rounded-lg font-medium text-xs shadow-xs transition-colors shrink-0"
          >
            + Add Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showQuickApply && (
        <div className="mb-3.5 p-3 rounded-xl bg-amber-50/80 border border-amber-300 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">
              ⚡ Quick Fill ({quickFillCountLabel})
            </span>
            <button type="button" onClick={() => setShowQuickApply(false)} className="text-xs text-gray-500 hover:text-black">✕ Close</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input
              placeholder="Course (e.g. B.Tech)"
              value={quickFields.course}
              onChange={(e) => setQuickFields({ ...quickFields, course: e.target.value })}
              className="px-2.5 py-1 text-xs bg-white border rounded"
            />
            <input
              placeholder="Year (e.g. 1 Year)"
              value={quickFields.year}
              onChange={(e) => setQuickFields({ ...quickFields, year: e.target.value })}
              className="px-2.5 py-1 text-xs bg-white border rounded"
            />
            <input
              placeholder="Specialization"
              value={quickFields.spec}
              onChange={(e) => setQuickFields({ ...quickFields, spec: e.target.value })}
              className="px-2.5 py-1 text-xs bg-white border rounded"
            />
            <input
              placeholder="Sem (e.g. 1 Sem)"
              value={quickFields.semester}
              onChange={(e) => setQuickFields({ ...quickFields, semester: e.target.value })}
              className="px-2.5 py-1 text-xs bg-white border rounded"
            />
            <input
              placeholder="Exam (MSE / ESE)"
              value={quickFields.exam}
              onChange={(e) => setQuickFields({ ...quickFields, exam: e.target.value })}
              className="px-2.5 py-1 text-xs bg-white border rounded"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleApplyQuick}
              className="bg-[#05488B] text-[#ffc107] px-4 py-1 rounded text-xs font-bold shadow-xs hover:bg-[#215ea0]"
            >
              Apply To {applyButtonLabel}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 pb-2.5 border-b border-gray-200 gap-2.5">
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedQueueIds.size === bulkFiles.length}
              onChange={toggleAllQueueItems}
              className="w-4 h-4 rounded accent-[#05488B]"
            />
            <span>Select All</span>
          </label>
          <span className="text-xs text-gray-400">|</span>
          <h3 className="text-xs sm:text-sm font-bold text-[#374151]">
            Queue: {bulkFiles.length} Paper{queuePlural}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => mainInputRef.current?.click()}
            className="bg-[#fffdf5] text-[#05488B] border border-[#ffc107] hover:bg-[#ffc107] px-3 py-1 rounded-lg text-xs font-bold transition-colors"
          >
            + Add Files
          </button>

          <button
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
          >
            🔗 {linkToggleLabel}
          </button>

          {!bulkIsUploading && (
            <button
              type="button"
              onClick={clearBulkQueue}
              className="text-xs font-medium text-[#f43f5e] hover:text-[#c11018] ml-1"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {showLinkInput && (
        <div className="mb-3 p-2.5 rounded-lg bg-gray-50 border border-gray-200 flex gap-2">
          <input
            type="url"
            placeholder="Paste PDF / DOCX Link..."
            value={pasteLinkUrl}
            onChange={(e) => setPasteLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddLinkSubmit(e); }}
            className="flex-1 bg-white border border-gray-300 focus:border-[#05488B] text-gray-800 px-3 py-1 text-xs rounded-lg outline-none"
          />
          <button
            type="button"
            onClick={handleAddLinkSubmit}
            disabled={!pasteLinkUrl.trim()}
            className="bg-[#05488B] disabled:opacity-50 text-[#ffc107] px-3 py-1 rounded-lg text-xs font-bold"
          >
            Add
          </button>
        </div>
      )}

      {bulkValidationError && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-50 text-xs font-medium text-[#f43f5e] flex items-center gap-1.5 border border-red-200">
          ❌ {bulkValidationError}
        </div>
      )}

      {bulkSummary && (
        <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 text-xs font-medium text-emerald-800 flex items-center gap-1.5 border border-emerald-200">
          🎉 Completed: {bulkSummary.succeeded} uploaded, {bulkSummary.failed} failed out of {bulkSummary.total} total papers.
        </div>
      )}

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc107] [&::-webkit-scrollbar-thumb]:rounded-full">
        {bulkFiles.map((row: any) => (
          <BulkPaperUploadRow
            key={row.id}
            row={row}
            isSelected={selectedQueueIds.has(row.id)}
            onToggleSelect={toggleQueueItem}
            optionsForTarget={bulkOptionsForTarget}
            onFieldChange={updateBulkFileField}
            onRemove={removeBulkFile}
            onAddTarget={addTargetToRow}
            onRemoveTarget={removeTargetFromRow}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center">
        <button
          type="button"
          disabled={bulkIsUploading || bulkFiles.length === 0}
          onClick={uploadAllBulkFiles}
          className="bg-[#05488B] hover:bg-[#215ea0] disabled:opacity-50 text-[#ffc107] px-8 py-2 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2"
        >
          {bulkIsUploading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-[#ffc107] border-t-transparent rounded-full animate-spin"></span>
              <span>Uploading Papers...</span>
            </span>
          ) : (
            <span>{uploadButtonLabel}</span>
          )}
        </button>
      </div>
    </>
  );
};

export default function BulkPaperUpload({
  bulkMode = "upload",
  setBulkMode,
  bulkFiles = [],
  selectedQueueIds = new Set(),
  toggleQueueItem,
  toggleAllQueueItems,
  removeSelectedQueueItems,
  applyToAllQueueItems,
  bulkIsDragging,
  bulkIsUploading,
  bulkSummary,
  bulkValidationError,
  addBulkFiles,
  addBulkLink,
  addTargetToRow,
  removeTargetFromRow,
  removeBulkFile,
  clearBulkQueue,
  updateBulkFileField,
  bulkOptionsForTarget,
  uploadAllBulkFiles,
  bulkDragHandlers,
  canCreatePapers,
  canEditPapers,
  canDeletePapers,
  // DB Bulk Props
  allPapers = [],
  dbSelectedIds = new Set(),
  toggleDbPaper,
  toggleAllDbPapers,
  clearDbSelection,
  isDbActionLoading,
  dbActionMessage,
  setDbActionMessage,
  executeBulkDelete,
  executeBulkEdit
}: any) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [pasteLinkUrl, setPasteLinkUrl] = useState("");
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [quickFields, setQuickFields] = useState({ course: "", year: "", spec: "", semester: "", exam: "" });
  const cloneInputRef = useRef<HTMLInputElement>(null);
  const [cloneSourceRow, setCloneSourceRow] = useState<any>(null);

  // DB Filter States
  const [dbSearch, setDbSearch] = useState("");
  const [dbCourseFilter, setDbCourseFilter] = useState("");
  const [dbSemFilter, setDbSemFilter] = useState("");
  const [dbExamFilter, setDbExamFilter] = useState("");
  const [dbPage, setDbPage] = useState(1);
  const dbPageSize = 25;

  // DB Bulk Edit Form State
  const [editUpdates, setEditUpdates] = useState({ course: "", year: "", spec: "", semester: "", exam: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const mainInputRef = useRef<HTMLInputElement>(null);

  // Filter DB papers
  const filteredDbPapers = useMemo(() => {
    return allPapers.filter((p: any) => {
      if (dbCourseFilter && p.course !== dbCourseFilter) return false;
      if (dbSemFilter && (p.sem || p.semester) !== dbSemFilter) return false;
      if (dbExamFilter && p.exam !== dbExamFilter) return false;
      if (dbSearch) {
        const query = dbSearch.toLowerCase();
        const text = `${p.name} ${p.course} ${p.spec || p.specialization} ${p.sem || p.semester} ${p.year}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [allPapers, dbCourseFilter, dbSemFilter, dbExamFilter, dbSearch]);

  const pagedDbPapers = useMemo(() => {
    const start = (dbPage - 1) * dbPageSize;
    return filteredDbPapers.slice(start, start + dbPageSize);
  }, [filteredDbPapers, dbPage]);

  const selectedDbPapersList = useMemo(() => {
    return allPapers.filter((p: any) => dbSelectedIds.has(String(p.index ?? p.id)));
  }, [allPapers, dbSelectedIds]);

  const uniqueCourses = useMemo(
    () => [...new Set(allPapers.map((p: any) => p.course).filter(Boolean))].sort((a: any, b: any) => String(a).localeCompare(String(b))),
    [allPapers]
  );
  const uniqueSemesters = useMemo(() => [...new Set(allPapers.map((p: any) => p.sem || p.semester).filter(Boolean))], [allPapers]);
  const uniqueExams = useMemo(() => [...new Set(allPapers.map((p: any) => p.exam).filter(Boolean))], [allPapers]);
  const uniqueYears = ["1 Year", "2 Year", "3 Year", "4 Year", "5 Year"];

  const handleAddLinkSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pasteLinkUrl.trim()) {
      const added = addBulkLink(pasteLinkUrl.trim());
      if (added) {
        setPasteLinkUrl("");
        setShowLinkInput(false);
      }
    }
  };

  const handleApplyQuick = () => {
    const payload: Record<string, string> = {};
    if (quickFields.course) payload.course = quickFields.course;
    if (quickFields.year) payload.year = quickFields.year;
    if (quickFields.spec) payload.spec = quickFields.spec;
    if (quickFields.semester) payload.semester = quickFields.semester;
    if (quickFields.exam) payload.exam = quickFields.exam;

    applyToAllQueueItems(payload);
    setShowQuickApply(false);
  };

  const handleExecuteBulkEdit = () => {
    if (selectedDbPapersList.length === 0) return;
    executeBulkEdit(selectedDbPapersList, editUpdates);
  };

  const handleExecuteBulkDelete = () => {
    if (selectedDbPapersList.length === 0) return;
    executeBulkDelete(selectedDbPapersList);
    setShowDeleteConfirm(false);
  };

  // Handle files selected via the "Add Similar" button
  const handleCloneSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Pass both the files AND the row data we want to copy to your hook
      addBulkFiles(e.target.files, cloneSourceRow); 
    }
    e.target.value = ""; // Reset input
    setCloneSourceRow(null); // Clear state
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-md p-4 sm:p-5 border relative">
      <BulkSubHeaderNav
        bulkMode={bulkMode}
        setBulkMode={setBulkMode}
        bulkFilesCount={bulkFiles.length}
        canEditPapers={canEditPapers}
        canDeletePapers={canDeletePapers}
        selectedQueueCount={selectedQueueIds.size}
        showQuickApply={showQuickApply}
        setShowQuickApply={setShowQuickApply}
        removeSelectedQueueItems={removeSelectedQueueItems}
      />

      <input
        ref={cloneInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleCloneSelect}
      />
      <input
        ref={mainInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => { addBulkFiles(e.target.files); e.target.value = ""; }}
      />

      {bulkMode === "upload" && (
        <BulkUploadModeView
          bulkFiles={bulkFiles}
          bulkDragHandlers={bulkDragHandlers}
          mainInputRef={mainInputRef}
          bulkIsDragging={bulkIsDragging}
          pasteLinkUrl={pasteLinkUrl}
          setPasteLinkUrl={setPasteLinkUrl}
          handleAddLinkSubmit={handleAddLinkSubmit}
          showQuickApply={showQuickApply}
          setShowQuickApply={setShowQuickApply}
          selectedQueueIds={selectedQueueIds}
          quickFields={quickFields}
          setQuickFields={setQuickFields}
          handleApplyQuick={handleApplyQuick}
          toggleAllQueueItems={toggleAllQueueItems}
          showLinkInput={showLinkInput}
          setShowLinkInput={setShowLinkInput}
          bulkIsUploading={bulkIsUploading}
          clearBulkQueue={clearBulkQueue}
          bulkValidationError={bulkValidationError}
          bulkSummary={bulkSummary}
          toggleQueueItem={toggleQueueItem}
          bulkOptionsForTarget={bulkOptionsForTarget}
          updateBulkFileField={updateBulkFileField}
          removeBulkFile={removeBulkFile}
          addTargetToRow={addTargetToRow}
          removeTargetFromRow={removeTargetFromRow}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          uploadAllBulkFiles={uploadAllBulkFiles}
        />
      )}

      {bulkMode === "edit" && (
        <BulkEditModeView
          dbActionMessage={dbActionMessage}
          setDbActionMessage={setDbActionMessage}
          dbSearch={dbSearch}
          setDbSearch={setDbSearch}
          dbCourseFilter={dbCourseFilter}
          setDbCourseFilter={setDbCourseFilter}
          dbSemFilter={dbSemFilter}
          setDbSemFilter={setDbSemFilter}
          dbExamFilter={dbExamFilter}
          setDbExamFilter={setDbExamFilter}
          dbPage={dbPage}
          setDbPage={setDbPage}
          dbPageSize={dbPageSize}
          uniqueCourses={uniqueCourses}
          uniqueYears={uniqueYears}
          uniqueSemesters={uniqueSemesters}
          uniqueExams={uniqueExams}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          selectedDbPapersList={selectedDbPapersList}
          clearDbSelection={clearDbSelection}
          editUpdates={editUpdates}
          setEditUpdates={setEditUpdates}
          isDbActionLoading={isDbActionLoading}
          handleExecuteBulkEdit={handleExecuteBulkEdit}
          pagedDbPapers={pagedDbPapers}
          dbSelectedIds={dbSelectedIds}
          toggleAllDbPapers={toggleAllDbPapers}
          toggleDbPaper={toggleDbPaper}
          totalFilteredCount={filteredDbPapers.length}
        />
      )}

      {bulkMode === "delete" && (
        <BulkDeleteModeView
          dbActionMessage={dbActionMessage}
          setDbActionMessage={setDbActionMessage}
          dbSearch={dbSearch}
          setDbSearch={setDbSearch}
          dbCourseFilter={dbCourseFilter}
          setDbCourseFilter={setDbCourseFilter}
          dbSemFilter={dbSemFilter}
          setDbSemFilter={setDbSemFilter}
          dbExamFilter={dbExamFilter}
          setDbExamFilter={setDbExamFilter}
          dbPage={dbPage}
          setDbPage={setDbPage}
          dbPageSize={dbPageSize}
          uniqueCourses={uniqueCourses}
          uniqueSemesters={uniqueSemesters}
          uniqueExams={uniqueExams}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          selectedDbPapersList={selectedDbPapersList}
          clearDbSelection={clearDbSelection}
          isDbActionLoading={isDbActionLoading}
          setShowDeleteConfirm={setShowDeleteConfirm}
          pagedDbPapers={pagedDbPapers}
          dbSelectedIds={dbSelectedIds}
          toggleAllDbPapers={toggleAllDbPapers}
          toggleDbPaper={toggleDbPaper}
          totalFilteredCount={filteredDbPapers.length}
        />
      )}

      {showDeleteConfirm && (
        <BulkDeleteConfirmModal
          selectedCount={selectedDbPapersList.length}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleExecuteBulkDelete}
        />
      )}
    </div>
  );
}


"use client";

import { useState, useRef, useMemo } from "react";
import { Paper, PaperTargetMapping, BulkUploadQueueItem } from "@/types/paper";
import { uploadPaperAction, bulkDeletePapersAction, bulkEditPapersAction } from "@/actions/paperActions";
import {
  Upload,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  FileText,
  Copy,
  FolderPlus,
  Check,
} from "lucide-react";

interface BulkPaperUploadSectionProps {
  papers: Paper[];
  onRefresh: () => void;
}

export default function BulkPaperUploadSection({ papers, onRefresh }: BulkPaperUploadSectionProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "edit" | "delete">("upload");
  const [queue, setQueue] = useState<BulkUploadQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // DB Selection for Bulk Edit/Delete
  const [selectedDbIds, setSelectedDbIds] = useState<Set<string | number>>(new Set());
  const [editUpdates, setEditUpdates] = useState<Partial<PaperTargetMapping>>({
    course: "",
    year: "",
    spec: "",
    semester: "",
    exam: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add files to queue
  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: BulkUploadQueueItem[] = Array.from(files).map((file) => ({
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      fileName: file.name,
      paperName: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim(),
      targets: [
        {
          id: `target-${Date.now()}-1`,
          course: "B.Tech",
          year: "2024-25",
          spec: "",
          semester: "Sem 1",
          exam: "MTE",
        },
      ],
      status: "pending",
    }));

    setQueue((prev) => [...prev, ...newItems]);
    setUploadMessage(null);
  };

  // "+ Add Similar" cloning logic: keeps course, year, sem, exam but CLEARS specialization
  const handleAddSimilarTarget = (itemId: string, sourceTarget: PaperTargetMapping) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newTarget: PaperTargetMapping = {
          id: `target-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          course: sourceTarget.course,
          year: sourceTarget.year,
          spec: "", // Intentionally left blank as requested so admin can pick another branch
          semester: sourceTarget.semester,
          exam: sourceTarget.exam,
        };
        return {
          ...item,
          targets: [...item.targets, newTarget],
        };
      })
    );
  };

  const handleRemoveTarget = (itemId: string, targetId: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (item.targets.length <= 1) return item;
        return {
          ...item,
          targets: item.targets.filter((t) => t.id !== targetId),
        };
      })
    );
  };

  const handleUpdateTarget = (
    itemId: string,
    targetId: string,
    field: keyof PaperTargetMapping,
    val: string
  ) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          targets: item.targets.map((t) => (t.id === targetId ? { ...t, [field]: val } : t)),
        };
      })
    );
  };

  const handleRemoveQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Upload all papers in queue
  const handleExecuteUpload = async () => {
    if (queue.length === 0 || isProcessing) return;
    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
      if (item.status === "success") continue;

      for (const target of item.targets) {
        const formData = new FormData();
        if (item.file) formData.append("file", item.file);
        if (item.link) formData.append("directLink", item.link);
        formData.append("paperName", item.paperName);
        formData.append("course", target.course);
        formData.append("year", target.year);
        formData.append("spec", target.spec);
        formData.append("semester", target.semester);
        formData.append("exam", target.exam);

        try {
          const res = await uploadPaperAction(formData);
          if (res.success) {
            successCount += 1;
            setQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, status: "success" } : q))
            );
          } else {
            failCount += 1;
            setQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, status: "error", message: res.message } : q))
            );
          }
        } catch {
          failCount += 1;
        }
      }
    }

    setIsProcessing(false);
    setUploadMessage(`Upload finished: ${successCount} successful, ${failCount} failed.`);
    onRefresh();
  };

  // Execute Bulk Delete
  const handleExecuteBulkDelete = async () => {
    if (selectedDbIds.size === 0 || isProcessing) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedDbIds.size} paper(s)?`)) return;

    setIsProcessing(true);
    const ids = Array.from(selectedDbIds);
    const res = await bulkDeletePapersAction(ids);
    setIsProcessing(false);

    if (res.success) {
      setSelectedDbIds(new Set());
      setUploadMessage(`Successfully deleted ${res.count} paper(s).`);
      onRefresh();
    } else {
      alert(`Delete error: ${res.message}`);
    }
  };

  // Execute Bulk Edit
  const handleExecuteBulkEdit = async () => {
    if (selectedDbIds.size === 0 || isProcessing) return;
    setIsProcessing(true);
    const ids = Array.from(selectedDbIds);
    const res = await bulkEditPapersAction(ids, editUpdates);
    setIsProcessing(false);

    if (res.success) {
      setSelectedDbIds(new Set());
      setUploadMessage(`Successfully updated ${res.count} paper(s).`);
      onRefresh();
    } else {
      alert(`Edit error: ${res.message}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-8">
      
      {/* Sub-Header Navigation Tabs: Bulk Upload | Bulk Edit | Bulk Delete */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "upload"
                ? "bg-[#05488B] text-[#ffc107] shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Upload {queue.length > 0 && `(${queue.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "edit"
                ? "bg-[#05488B] text-[#ffc107] shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>Bulk Edit {selectedDbIds.size > 0 && `(${selectedDbIds.size})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("delete")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "delete"
                ? "bg-[#E31E24] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Bulk Delete {selectedDbIds.size > 0 && `(${selectedDbIds.size})`}</span>
          </button>
        </div>

        {uploadMessage && (
          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            {uploadMessage}
          </div>
        )}
      </div>

      {/* TAB 1: BULK UPLOAD */}
      {activeTab === "upload" && (
        <div>
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#ffc107] bg-[#fffdf5] hover:bg-[#fffaf0] rounded-2xl p-8 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                handleFilesAdded(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-amber-100 text-[#05488B] flex items-center justify-center mx-auto mb-3">
              <FolderPlus className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">
              Drag &amp; drop PDF / DOCX question papers here
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse multiple files from your computer
            </p>
          </div>

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase">
                  Upload Queue ({queue.length} document{queue.length > 1 ? "s" : ""})
                </span>
                <button
                  type="button"
                  onClick={() => setQueue([])}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  Clear Queue
                </button>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-[#05488B] shrink-0" />
                        <input
                          type="text"
                          value={item.paperName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQueue((prev) =>
                              prev.map((q) => (q.id === item.id ? { ...q, paperName: val } : q))
                            );
                          }}
                          className="font-bold text-xs sm:text-sm text-[#05488B] bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#05488B] outline-none px-1 py-0.5 w-full truncate"
                          title="Click to edit paper title"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === "success" && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Uploaded
                          </span>
                        )}
                        {item.status === "error" && (
                          <span className="text-xs text-red-500 font-bold flex items-center gap-1" title={item.message}>
                            <AlertCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveQueueItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Targets mapping rows */}
                    <div className="space-y-2">
                      {item.targets.map((target, idx) => (
                        <div key={target.id} className="relative pt-1">
                          {idx > 0 && (
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-bold text-[#05488B]">
                                Additional Course Target #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTarget(item.id, target.id)}
                                className="text-[10px] text-red-500 font-bold hover:underline"
                              >
                                Remove target
                              </button>
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            <div>
                              <input
                                type="text"
                                placeholder="Course (e.g. B.Tech)"
                                value={target.course}
                                onChange={(e) => handleUpdateTarget(item.id, target.id, "course", e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Year (e.g. 2024-25)"
                                value={target.year}
                                onChange={(e) => handleUpdateTarget(item.id, target.id, "year", e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Specialization (leave blank for general)"
                                value={target.spec}
                                onChange={(e) => handleUpdateTarget(item.id, target.id, "spec", e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Semester (e.g. Sem 1)"
                                value={target.semester}
                                onChange={(e) => handleUpdateTarget(item.id, target.id, "semester", e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Exam (e.g. MTE)"
                                value={target.exam}
                                onChange={(e) => handleUpdateTarget(item.id, target.id, "exam", e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* "+ Add Similar" Button */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleAddSimilarTarget(item.id, item.targets[0])}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                        title="Copy course, year, and sem to another branch without re-uploading file"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add Similar (New Branch)</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Upload Action Button */}
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExecuteUpload}
                  className="px-8 py-3 rounded-xl bg-[#05488B] hover:bg-[#215ea0] disabled:opacity-50 text-[#ffc107] font-bold text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#ffc107] border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading to Google Drive &amp; Database...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload All Papers ({queue.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2 & 3: BULK EDIT & BULK DELETE TABLE */}
      {(activeTab === "edit" || activeTab === "delete") && (
        <div className="space-y-4">
          
          {/* Action Bar */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-gray-700">
              Selected: {selectedDbIds.size} paper(s)
            </span>

            {activeTab === "delete" ? (
              <button
                type="button"
                disabled={selectedDbIds.size === 0 || isProcessing}
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 rounded-xl bg-[#E31E24] hover:bg-[#c11018] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedDbIds.size})</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Set New Specialization"
                  value={editUpdates.spec || ""}
                  onChange={(e) => setEditUpdates((prev) => ({ ...prev, spec: e.target.value }))}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800"
                />
                <button
                  type="button"
                  disabled={selectedDbIds.size === 0 || isProcessing}
                  onClick={handleExecuteBulkEdit}
                  className="px-4 py-2 rounded-xl bg-[#05488B] hover:bg-[#215ea0] disabled:opacity-40 text-[#ffc107] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Bulk Edit</span>
                </button>
              </div>
            )}
          </div>

          {/* Database Papers Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 border-b">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={papers.length > 0 && selectedDbIds.size === papers.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDbIds(new Set(papers.map((p) => p.id)));
                        } else {
                          setSelectedDbIds(new Set());
                        }
                      }}
                      className="w-4 h-4 rounded accent-[#05488B]"
                    />
                  </th>
                  <th className="p-3">Paper Title</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">Semester</th>
                  <th className="p-3">Exam</th>
                  <th className="p-3">Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {papers.map((paper) => {
                  const isChecked = selectedDbIds.has(paper.id);
                  return (
                    <tr
                      key={paper.id}
                      onClick={() => {
                        setSelectedDbIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(paper.id)) next.delete(paper.id);
                          else next.add(paper.id);
                          return next;
                        });
                      }}
                      className={`hover:bg-amber-50/50 cursor-pointer transition-colors ${isChecked ? "bg-amber-50/80" : ""}`}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setSelectedDbIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(paper.id);
                              else next.delete(paper.id);
                              return next;
                            });
                          }}
                          className="w-4 h-4 rounded accent-[#05488B]"
                        />
                      </td>
                      <td className="p-3 font-semibold text-gray-900">{paper.name}</td>
                      <td className="p-3">{paper.course}</td>
                      <td className="p-3 text-gray-500">{paper.spec || paper.specialization || "General"}</td>
                      <td className="p-3">{paper.sem || paper.semester}</td>
                      <td className="p-3">{paper.exam}</td>
                      <td className="p-3 text-gray-400">{paper.year}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}

import { useCallback, useState } from "react";
import { uploadPaper, bulkDeletePapersApi, bulkEditPapersApi } from "./adminApi";
import { cleanStatusMessage, clearPapersCache, notifyPapersUpdated, readApiResponse } from "./adminHelpers";
import { buildPaperOptions } from "./paperOptions";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
let bulkFileIdCounter = 0;

const isAcceptedFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
};

const cleanFileNameToPaperName = (name: string) => {
  if (!name) return "";
  const withoutExtension = String(name).replace(/\.(pdf|docx)$/i, "");
  return withoutExtension.trim().slice(0, 160);
};

export interface UseBulkPaperUploadParams {
  allPapers: any[];
  customSpecsByCourse: Record<string, string[]>;
  customSemestersByYear: Record<string, string[]>;
  rememberCustomSpec: (course: string, spec: string) => void;
  rememberCustomSemester: (year: string, semester: string) => void;
  canCreatePapers: boolean;
  canEditPapers: boolean;
  canDeletePapers: boolean;
  fetchPapers: () => Promise<boolean | void>;
  refreshLogs: () => Promise<void>;
}

export default function useBulkPaperUpload({
  allPapers,
  customSpecsByCourse,
  customSemestersByYear,
  rememberCustomSpec,
  rememberCustomSemester,
  canCreatePapers,
  canEditPapers,
  canDeletePapers,
  fetchPapers,
  refreshLogs
}: UseBulkPaperUploadParams) {
  const [bulkMode, setBulkMode] = useState<string>("upload"); // "upload" | "edit" | "delete"
  const [bulkFiles, setBulkFiles] = useState<any[]>([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState<Set<any>>(new Set());
  const [bulkIsDragging, setBulkIsDragging] = useState(false);
  const [bulkIsUploading, setBulkIsUploading] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<any>(null);
  const [bulkValidationError, setBulkValidationError] = useState("");

  // DB Bulk Edit & Delete state
  const [dbSelectedIds, setDbSelectedIds] = useState<Set<any>>(new Set());
  const [isDbActionLoading, setIsDbActionLoading] = useState(false);
  const [dbActionMessage, setDbActionMessage] = useState<any>(null);

  const addBulkFiles = useCallback((fileList: FileList | File[], sourceRowToClone: any = null) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const rejected = incoming.filter((file) => !isAcceptedFile(file));
    const accepted = incoming.filter(isAcceptedFile);

    setBulkFiles((current) => {
      const getInitialTargets = () => {
        if (sourceRowToClone && Array.isArray(sourceRowToClone.targets) && sourceRowToClone.targets.length > 0) {
          return sourceRowToClone.targets.map((t: any) => ({
            id: `target-${Date.now()}-${bulkFileIdCounter++}`,
            course: t.course || "",
            year: t.year || "",
            spec: "",
            semester: t.semester || "",
            exam: t.exam || ""
          }));
        }
        if (sourceRowToClone && sourceRowToClone.course) {
          return [
            {
              id: `target-${Date.now()}-${bulkFileIdCounter++}`,
              course: sourceRowToClone.course || "",
              year: sourceRowToClone.year || "",
              spec: "",
              semester: sourceRowToClone.semester || "",
              exam: sourceRowToClone.exam || ""
            }
          ];
        }
        return [
          {
            id: `target-${Date.now()}-${bulkFileIdCounter++}`,
            course: "",
            year: "",
            spec: "",
            semester: "",
            exam: ""
          }
        ];
      };

      const newRows = accepted.map((file) => ({
        id: `bulk-${Date.now()}-${bulkFileIdCounter++}`,
        file,
        link: "",
        fileName: file.name,
        paperName: cleanFileNameToPaperName(file.name),
        targets: getInitialTargets(),
        status: "pending",
        message: ""
      }));

      // 3. Insert directly below the cloned row, or at the bottom if normal add
      if (sourceRowToClone) {
        const targetIndex = current.findIndex((row) => row.id === sourceRowToClone.id);
        if (targetIndex !== -1) {
          const updatedQueue = [...current];
          updatedQueue.splice(targetIndex + 1, 0, ...newRows);
          return updatedQueue;
        }
      }

      return [...current, ...newRows];
    });

    setBulkValidationError(rejected.length > 0
      ? `Skipped ${rejected.length} file${rejected.length > 1 ? "s" : ""} - only .pdf and .docx are supported.`
      : "");
    setBulkSummary(null);
  }, []);

  const addBulkLink = useCallback((url: string) => {
    const cleanUrl = String(url || "").trim();
    if (!cleanUrl) return;

    let derivedName = "Paper Link";
    try {
      const parsed = new URL(cleanUrl);
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      derivedName = pathParts[pathParts.length - 1] || "Paper Document";
    } catch {
      derivedName = "Paper Document";
    }

    setBulkFiles((current) => [
      ...current,
      {
        id: `bulk-${Date.now()}-${bulkFileIdCounter++}`,
        file: null,
        link: cleanUrl,
        fileName: derivedName,
        paperName: cleanFileNameToPaperName(derivedName),
        targets: [
          {
            id: `target-${Date.now()}-${bulkFileIdCounter++}`,
            course: "",
            year: "",
            spec: "",
            semester: "",
            exam: ""
          }
        ],
        status: "pending",
        message: ""
      }
    ]);
    setBulkSummary(null);
  }, []);

  const addTargetToRow = useCallback((rowId: any) => {
    setBulkFiles((current) => current.map((row) => {
      if (row.id !== rowId) return row;
      const sourceTarget = [...row.targets].reverse().find((t) => t.course) || row.targets[row.targets.length - 1] || row.targets[0] || {};
      const newTarget = {
        id: `target-${Date.now()}-${bulkFileIdCounter++}`,
        course: sourceTarget.course || "",
        year: sourceTarget.year || "",
        spec: "", // Leave specialization empty so admin can choose another specialization
        semester: sourceTarget.semester || "",
        exam: sourceTarget.exam || ""
      };
      return {
        ...row,
        targets: [...row.targets, newTarget]
      };
    }));
  }, []);

  const removeTargetFromRow = useCallback((rowId: any, targetId: any) => {
    setBulkFiles((current) => current.map((row) => {
      if (row.id !== rowId) return row;
      if (row.targets.length <= 1) return row;
      return {
        ...row,
        targets: row.targets.filter((t: any) => t.id !== targetId)
      };
    }));
  }, []);

  const removeBulkFile = useCallback((id: any) => {
    setBulkFiles((current) => current.filter((row) => row.id !== id));
  }, []);

  const clearBulkQueue = useCallback(() => {
    setBulkFiles([]);
    setBulkSummary(null);
    setBulkValidationError("");
  }, []);

  const updateBulkFileField = useCallback((rowId: any, targetId: any, field: string, value: any) => {
    setBulkFiles((current) => current.map((row) => {
      if (row.id !== rowId) return row;

      if (field === "paperName") {
        return { ...row, paperName: value };
      }

      const updatedTargets = row.targets.map((target: any) => {
        if (target.id !== targetId) return target;
        const updated = { ...target, [field]: value };
        if (field === "course") { updated.year = ""; updated.spec = ""; updated.semester = ""; updated.exam = ""; }
        if (field === "year") { updated.semester = ""; updated.exam = ""; }
        // Do NOT wipe semester or exam when specialization is changed
        if (field === "semester") { updated.exam = ""; }
        if (field === "spec") rememberCustomSpec(updated.course, value);
        if (field === "semester") rememberCustomSemester(updated.year, value);
        return updated;
      });

      return { ...row, targets: updatedTargets };
    }));
  }, [rememberCustomSpec, rememberCustomSemester]);

  const bulkOptionsForTarget = useCallback((target: any) => buildPaperOptions({
    allPapers,
    course: target.course,
    year: target.year,
    spec: target.spec,
    semester: target.semester,
    exam: target.exam,
    customSpecsByCourse,
    customSemestersByYear
  }), [allPapers, customSpecsByCourse, customSemestersByYear]);

  const uploadAllBulkFiles = useCallback(async () => {
    if (!canCreatePapers || bulkFiles.length === 0 || bulkIsUploading) return;

    let incompleteCount = 0;
    for (const row of bulkFiles) {
      if (!row.paperName.trim()) {
        incompleteCount += 1;
        continue;
      }
      for (const target of row.targets) {
        if (!target.course || !target.year || !target.spec || !target.semester || !target.exam) {
          incompleteCount += 1;
          break;
        }
      }
    }

    if (incompleteCount > 0) {
      setBulkValidationError(`Complete all dropdowns and paper names for all papers before uploading.`);
      return;
    }

    setBulkValidationError("");
    setBulkSummary(null);
    setBulkIsUploading(true);

    let succeeded = 0;
    let failed = 0;

    for (const row of bulkFiles) {
      setBulkFiles((current) => current.map((item) => (item.id === row.id ? { ...item, status: "uploading", message: "" } : item)));

      let rowFailed = false;
      let sharedFileLink = row.link || null;

      for (let i = 0; i < row.targets.length; i += 1) {
        const target = row.targets[i];
        try {
          const formData = new FormData();
          if (i === 0 && row.file) {
            formData.append("file", row.file);
          } else if (sharedFileLink) {
            formData.append("directLink", sharedFileLink);
          }

          formData.append("course", target.course);
          formData.append("year", target.year);
          formData.append("spec", target.spec);
          formData.append("sem", target.semester);
          formData.append("exam", target.exam);
          formData.append("name", row.paperName.trim());

          const response = await uploadPaper(formData);
          const payload = await readApiResponse(response);

          if (!response.ok) {
            rowFailed = true;
            console.error("Bulk target upload failed:", payload.message);
            setBulkFiles((current) => current.map((item) => (item.id === row.id
              ? { ...item, status: "error", message: cleanStatusMessage(payload.message || "Upload failed") }
              : item)));
            break;
          }

          if (payload.paper?.link) {
            sharedFileLink = payload.paper.link;
          }
        } catch (error) {
          rowFailed = true;
          console.error("Bulk upload target error:", error);
          setBulkFiles((current) => current.map((item) => (item.id === row.id
            ? { ...item, status: "error", message: "Server connection failed" }
            : item)));
          break;
        }
      }

      if (rowFailed) {
        failed += 1;
      } else {
        succeeded += 1;
        setBulkFiles((current) => current.map((item) => (item.id === row.id
          ? { ...item, status: "success", message: `Uploaded (${row.targets.length} course${row.targets.length > 1 ? "s" : ""})` }
          : item)));
      }
    }

    if (succeeded > 0) {
      clearPapersCache();
      notifyPapersUpdated();
      await fetchPapers();
      await refreshLogs();
    }

    setBulkSummary({ succeeded, failed, total: bulkFiles.length });
    setBulkIsUploading(false);
  }, [bulkFiles, bulkIsUploading, canCreatePapers, fetchPapers, refreshLogs]);

  // Queue Selection Actions
  const toggleQueueItem = useCallback((id: any) => {
    setSelectedQueueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllQueueItems = useCallback(() => {
    setSelectedQueueIds((prev) => {
      if (prev.size === bulkFiles.length) return new Set();
      return new Set(bulkFiles.map((f) => f.id));
    });
  }, [bulkFiles]);

  const removeSelectedQueueItems = useCallback(() => {
    setBulkFiles((prev) => prev.filter((f) => !selectedQueueIds.has(f.id)));
    setSelectedQueueIds(new Set());
  }, [selectedQueueIds]);

  const applyToAllQueueItems = useCallback((fields: any) => {
    setBulkFiles((prev) => prev.map((item) => {
      if (selectedQueueIds.size > 0 && !selectedQueueIds.has(item.id)) return item;
      return {
        ...item,
        targets: item.targets.map((t: any, idx: number) => {
          if (idx === 0) {
            return {
              ...t,
              course: fields.course !== undefined ? fields.course : t.course,
              year: fields.year !== undefined ? fields.year : t.year,
              spec: fields.spec !== undefined ? fields.spec : t.spec,
              semester: fields.semester !== undefined ? fields.semester : t.semester,
              exam: fields.exam !== undefined ? fields.exam : t.exam
            };
          }
          return t;
        })
      };
    }));
  }, [selectedQueueIds]);

  // DB Bulk Selection Actions
  const toggleDbPaper = useCallback((id: any) => {
    setDbSelectedIds((prev) => {
      const next = new Set(prev);
      const strId = String(id);
      if (next.has(strId)) next.delete(strId);
      else next.add(strId);
      return next;
    });
  }, []);

  const toggleAllDbPapers = useCallback((papersList: any[]) => {
    setDbSelectedIds((prev) => {
      const targetIds = (papersList || []).map((p) => String(p.index ?? p.id));
      const allSelected = targetIds.length > 0 && targetIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        targetIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...targetIds]);
    });
  }, []);

  const clearDbSelection = useCallback(() => {
    setDbSelectedIds(new Set());
  }, []);

  const executeBulkDelete = useCallback(async (papersToDelete: any[]) => {
    if (!canDeletePapers || papersToDelete.length === 0) return;
    setIsDbActionLoading(true);
    setDbActionMessage(null);

    try {
      const items = papersToDelete.map((p) => ({
        index: p.index ?? p.id,
        expectedPaper: p
      }));
      const res = await bulkDeletePapersApi(items);
      const data = await readApiResponse(res);

      if (res.ok) {
        clearPapersCache();
        notifyPapersUpdated();
        await fetchPapers();
        await refreshLogs();
        setDbSelectedIds(new Set());
        setDbActionMessage({ type: "success", text: data.message || `Deleted ${papersToDelete.length} papers.` });
      } else {
        setDbActionMessage({ type: "error", text: data.message || "Failed to delete papers." });
      }
    } catch (err: any) {
      setDbActionMessage({ type: "error", text: err.message || "Bulk delete failed." });
    } finally {
      setIsDbActionLoading(false);
    }
  }, [canDeletePapers, fetchPapers, refreshLogs]);

  const executeBulkEdit = useCallback(async (papersToEdit: any[], updates: any) => {
    if (!canEditPapers || papersToEdit.length === 0) return;
    setIsDbActionLoading(true);
    setDbActionMessage(null);

    try {
      const items = papersToEdit.map((p) => ({
        index: p.index ?? p.id,
        ...p
      }));
      const res = await bulkEditPapersApi(items, updates);
      const data = await readApiResponse(res);

      if (res.ok) {
        clearPapersCache();
        notifyPapersUpdated();
        await fetchPapers();
        await refreshLogs();
        setDbSelectedIds(new Set());
        setDbActionMessage({ type: "success", text: data.message || `Updated ${papersToEdit.length} papers.` });
      } else {
        setDbActionMessage({ type: "error", text: data.message || "Failed to update papers." });
      }
    } catch (err: any) {
      setDbActionMessage({ type: "error", text: err.message || "Bulk edit failed." });
    } finally {
      setIsDbActionLoading(false);
    }
  }, [canEditPapers, fetchPapers, refreshLogs]);

  const bulkDragHandlers = {
    onDragOver: (event: any) => { event.preventDefault(); setBulkIsDragging(true); },
    onDragLeave: (event: any) => { event.preventDefault(); setBulkIsDragging(false); },
    onDrop: (event: any) => {
      event.preventDefault();
      setBulkIsDragging(false);
      addBulkFiles(event.dataTransfer.files);
    }
  };

  return {
    bulkMode,
    setBulkMode,
    bulkFiles,
    selectedQueueIds,
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
    // Database Bulk Actions
    allPapers,
    dbSelectedIds,
    toggleDbPaper,
    toggleAllDbPapers,
    clearDbSelection,
    isDbActionLoading,
    dbActionMessage,
    setDbActionMessage,
    executeBulkDelete,
    executeBulkEdit
  };
}

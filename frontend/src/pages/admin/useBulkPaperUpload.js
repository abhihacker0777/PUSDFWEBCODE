import { useCallback, useState } from "react";
import { uploadPaper } from "./adminApi";
import { cleanStatusMessage, clearPapersCache, notifyPapersUpdated, readApiResponse } from "./adminHelpers";
import { buildPaperOptions } from "./paperOptions";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
let bulkFileIdCounter = 0;

const isAcceptedFile = (file) => {
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
};

const cleanFileNameToPaperName = (fileName) => {
  const withoutExtension = fileName.replace(/\.(pdf|docx)$/i, "");
  return withoutExtension.trim().slice(0, 160);
};

const emptyRowFields = { course: "", year: "", spec: "", semester: "", exam: "" };

export default function useBulkPaperUpload({
  allPapers,
  customSpecsByCourse,
  customSemestersByYear,
  rememberCustomSpec,
  rememberCustomSemester,
  canCreatePapers,
  fetchPapers,
  refreshLogs
}) {
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkIsDragging, setBulkIsDragging] = useState(false);
  const [bulkIsUploading, setBulkIsUploading] = useState(false);
  const [bulkSummary, setBulkSummary] = useState(null);
  const [bulkValidationError, setBulkValidationError] = useState("");

  const addBulkFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const rejected = incoming.filter((file) => !isAcceptedFile(file));
    const accepted = incoming.filter(isAcceptedFile);

    setBulkFiles((current) => {
      const lastRow = current[current.length - 1];
      const carriedOverFields = lastRow
        ? { course: lastRow.course, year: lastRow.year, spec: lastRow.spec, semester: lastRow.semester, exam: lastRow.exam }
        : emptyRowFields;

      const newRows = accepted.map((file) => ({
        id: `bulk-${Date.now()}-${bulkFileIdCounter++}`,
        file,
        fileName: file.name,
        paperName: cleanFileNameToPaperName(file.name),
        ...carriedOverFields,
        status: "pending",
        message: ""
      }));

      return [...current, ...newRows];
    });

    setBulkValidationError(rejected.length > 0
      ? `Skipped ${rejected.length} file${rejected.length > 1 ? "s" : ""} - only .pdf and .docx are supported.`
      : "");
    setBulkSummary(null);
  }, []);

  const removeBulkFile = useCallback((id) => {
    setBulkFiles((current) => current.filter((row) => row.id !== id));
  }, []);

  const clearBulkQueue = useCallback(() => {
    setBulkFiles([]);
    setBulkSummary(null);
    setBulkValidationError("");
  }, []);

  const updateBulkFileField = useCallback((id, field, value) => {
    setBulkFiles((current) => current.map((row) => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      // Cascading resets, matching the single-paper edit form's behavior.
      if (field === "course") { updated.year = ""; updated.spec = ""; updated.semester = ""; updated.exam = ""; }
      if (field === "year") { updated.semester = ""; updated.exam = ""; }
      if (field === "spec") { updated.semester = ""; updated.exam = ""; }
      if (field === "semester") { updated.exam = ""; }
      if (field === "spec") rememberCustomSpec(updated.course, value);
      if (field === "semester") rememberCustomSemester(updated.year, value);
      return updated;
    }));
  }, [rememberCustomSpec, rememberCustomSemester]);

  const bulkOptionsForRow = useCallback((row) => buildPaperOptions({
    allPapers,
    course: row.course,
    year: row.year,
    spec: row.spec,
    semester: row.semester,
    exam: row.exam,
    customSpecsByCourse,
    customSemestersByYear
  }), [allPapers, customSpecsByCourse, customSemestersByYear]);

  const uploadAllBulkFiles = useCallback(async () => {
    if (!canCreatePapers || bulkFiles.length === 0 || bulkIsUploading) return;

    const incompleteCount = bulkFiles.filter((row) =>
      !row.course || !row.year || !row.spec || !row.semester || !row.exam || !row.paperName.trim()
    ).length;
    if (incompleteCount > 0) {
      setBulkValidationError(`Complete every field for all ${bulkFiles.length} papers before uploading (${incompleteCount} incomplete).`);
      return;
    }

    setBulkValidationError("");
    setBulkSummary(null);
    setBulkIsUploading(true);

    let succeeded = 0;
    let failed = 0;

    for (const row of bulkFiles) {
      setBulkFiles((current) => current.map((item) => (item.id === row.id ? { ...item, status: "uploading", message: "" } : item)));

      try {
        const formData = new FormData();
        formData.append("file", row.file);
        formData.append("course", row.course);
        formData.append("year", row.year);
        formData.append("spec", row.spec);
        formData.append("sem", row.semester);
        formData.append("exam", row.exam);
        formData.append("name", row.paperName.trim());

        const response = await uploadPaper(formData);
        const payload = await readApiResponse(response);

        if (!response.ok) {
          failed += 1;
          setBulkFiles((current) => current.map((item) => (item.id === row.id
            ? { ...item, status: "error", message: cleanStatusMessage(payload.message || "Upload failed") }
            : item)));
          continue;
        }

        succeeded += 1;
        setBulkFiles((current) => current.map((item) => (item.id === row.id
          ? { ...item, status: "success", message: "Uploaded" }
          : item)));
      } catch (error) {
        failed += 1;
        console.error("Bulk upload row failed:", error);
        setBulkFiles((current) => current.map((item) => (item.id === row.id
          ? { ...item, status: "error", message: "Server connection failed" }
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

  const bulkDragHandlers = {
    onDragOver: (event) => { event.preventDefault(); setBulkIsDragging(true); },
    onDragLeave: (event) => { event.preventDefault(); setBulkIsDragging(false); },
    onDrop: (event) => {
      event.preventDefault();
      setBulkIsDragging(false);
      addBulkFiles(event.dataTransfer.files);
    }
  };

  return {
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
  };
}

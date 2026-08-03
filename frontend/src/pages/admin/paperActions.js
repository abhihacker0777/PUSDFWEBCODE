import { deletePaper, syncPapersToWebsite, uploadPaper } from "./adminApi";
import {
  cleanStatusMessage,
  clearPapersCache,
  notifyPapersUpdated,
  readApiResponse
} from "./adminHelpers";

export const createPaperActions = ({
  canEditPapers,
  canUploadFiles,
  canDeletePapers,
  canSyncPapers,
  course,
  year,
  spec,
  semester,
  exam,
  paperName,
  selectedPaperIndex,
  selectedPaper,
  file,
  listDeleteConfirm,
  rememberCustomSpec,
  rememberCustomSemester,
  appendExpectedPaper,
  fetchPapers,
  refreshLogs,
  setFile,
  setFileName,
  setFileError,
  setUploadStatus,
  setDeleteStatus,
  setDeleteConfirm,
  setListDeleteConfirm,
  setSyncConfirm,
  setIsLoading,
  setPaper,
  setPaperName,
  setSelectedPaperIndex
}) => {
  const resetSelectedPaper = () => {
    setPaper("");
    setPaperName("");
    setSelectedPaperIndex(null);
  };

  const handleUpload = async () => {
    if (!canEditPapers) {
      setUploadStatus("Error: You do not have permission to update papers.");
      return;
    }
    if (!course || !year || !spec || !semester || !exam || !paperName.trim()) {
      setFileError(false);
      setUploadStatus("Error: Please complete all fields");
      setTimeout(() => setUploadStatus(""), 4000);
      return;
    }
    if (canUploadFiles && !file && !selectedPaperIndex) {
      setFileError(true);
      setUploadStatus("");
      return;
    }

    rememberCustomSpec(course, spec);
    rememberCustomSemester(year, semester);
    setFileError(false);
    setUploadStatus("Processing...");
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("course", course);
      formData.append("year", year);
      formData.append("spec", spec);
      // backend expects `sem` and `name` fields
      formData.append("sem", semester);
      formData.append("exam", exam);
      formData.append("name", paperName.trim());
      if (selectedPaperIndex) {
        formData.append("index", selectedPaperIndex);
        // include expected snapshot fields for concurrency checks
        if (selectedPaper) {
          formData.append("expectedCourse", selectedPaper.course || "");
          formData.append("expectedYear", selectedPaper.year || "");
          formData.append("expectedSpec", selectedPaper.spec || selectedPaper.specialization || "");
          formData.append("expectedSem", selectedPaper.sem || selectedPaper.semester || "");
          formData.append("expectedExam", selectedPaper.exam || "");
          formData.append("expectedName", selectedPaper.name || selectedPaper.title || "");
        }
      }

      const response = await uploadPaper(formData);
      const payload = await readApiResponse(response);
      if (!response.ok) {
        setUploadStatus(`Error: ${cleanStatusMessage(payload.message || payload.error || "Upload failed")}`);
        return;
      }

      appendExpectedPaper({
        course,
        year,
        spec,
        sem: semester,
        exam,
        name: paperName.trim(),
        url: payload.url || "",
        index: payload.index || selectedPaperIndex || paperName.trim()
      });
      clearPapersCache();
      notifyPapersUpdated();
      await fetchPapers();
      await refreshLogs();
      setUploadStatus(cleanStatusMessage(payload.message || "Success: Data updated"));
      setFile(null);
      setFileName("No file chosen");
      const uploadInput = document.getElementById("fileUpload");
      if (uploadInput) uploadInput.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("Error: Server connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!canDeletePapers) return;
    if (!selectedPaperIndex) {
      setDeleteStatus("Error: Select an existing paper to delete");
      setTimeout(() => setDeleteStatus(""), 4000);
      return;
    }
    setDeleteConfirm({ show: true, paperName });
  };

  const executeDelete = async () => {
    if (!canDeletePapers || !selectedPaperIndex) return;
    setIsLoading(true);
    setDeleteStatus("");
    try {
      const expected = selectedPaper ? {
        expectedCourse: selectedPaper.course || "",
        expectedYear: selectedPaper.year || "",
        expectedSpec: selectedPaper.spec || selectedPaper.specialization || "",
        expectedSem: selectedPaper.sem || selectedPaper.semester || "",
        expectedExam: selectedPaper.exam || "",
        expectedName: selectedPaper.name || selectedPaper.title || ""
      } : {};

      const response = await deletePaper(selectedPaperIndex, expected);
      const payload = await readApiResponse(response);
      if (!response.ok) {
        setDeleteStatus(`Error: ${cleanStatusMessage(payload.message || "Delete failed")}`);
        return;
      }
      clearPapersCache();
      notifyPapersUpdated();
      await fetchPapers();
      await refreshLogs();
      setDeleteStatus(cleanStatusMessage(payload.message || "Success: Paper deleted"));
      resetSelectedPaper();
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteStatus("Error: Server connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const executeListDelete = async () => {
    if (!canDeletePapers || !listDeleteConfirm.row?.index) return;
    setIsLoading(true);
    try {
      const row = listDeleteConfirm.row;
      const expected = row ? {
        expectedCourse: row.course || "",
        expectedYear: row.year || "",
        expectedSpec: row.spec || row.specialization || "",
        expectedSem: row.sem || row.semester || "",
        expectedExam: row.exam || "",
        expectedName: row.name || row.title || ""
      } : {};
      const response = await deletePaper(listDeleteConfirm.row.index, expected);
      const payload = await readApiResponse(response);
      if (!response.ok) {
        setDeleteStatus(`Error: ${cleanStatusMessage(payload.message || "Delete failed")}`);
        return;
      }
      clearPapersCache();
      notifyPapersUpdated();
      await fetchPapers();
      await refreshLogs();
      setDeleteStatus(cleanStatusMessage(payload.message || "Success: Paper deleted"));
    } catch (error) {
      console.error("List delete error:", error);
      setDeleteStatus("Error: Server connection failed");
    } finally {
      setListDeleteConfirm({ show: false, row: null });
      setIsLoading(false);
    }
  };

  const executeSync = async () => {
    if (!canSyncPapers) return;
    setIsLoading(true);
    setUploadStatus("Syncing...");
    try {
      const response = await syncPapersToWebsite();
      const payload = await readApiResponse(response);
      if (!response.ok) {
        setUploadStatus(`Error: ${cleanStatusMessage(payload.message || "Sync failed")}`);
        return;
      }
      setUploadStatus(cleanStatusMessage(payload.message || "Success: Website sync started"));
    } catch (error) {
      console.error("Sync error:", error);
      setUploadStatus("Error: Server connection failed");
    } finally {
      setSyncConfirm(false);
      setIsLoading(false);
    }
  };

  return { handleUpload, handleDelete, executeDelete, executeListDelete, executeSync };
};

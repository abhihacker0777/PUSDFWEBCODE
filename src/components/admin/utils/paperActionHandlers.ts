import { deletePaper, syncPapersToWebsite, uploadPaper } from "./adminApi";
import {
  buildExpectedPaperPayload,
  cleanStatusMessage,
  clearPapersCache,
  isValidDocumentLink,
  notifyPapersUpdated,
  readApiResponse
} from "./adminHelpers";

export interface CreatePaperActionsParams {
  canEditPapers: boolean;
  canUploadFiles: boolean;
  canDeletePapers: boolean;
  canSyncPapers: boolean;
  course: string;
  year: string;
  spec: string;
  semester: string;
  exam: string;
  paperName: string;
  selectedPaperIndex: any;
  selectedPaper: any;
  file: File | null;
  directLink?: string;
  setDirectLink?: (link: string) => void;
  listDeleteConfirm: any;
  rememberCustomSpec: (course: string, spec: string) => void;
  rememberCustomSemester: (year: string, semester: string) => void;
  appendExpectedPaper: (paper: any) => void;
  fetchPapers: () => Promise<any>;
  refreshLogs: () => Promise<any>;
  setFile: (file: File | null) => void;
  setFileName: (name: string) => void;
  setFileError: (err: boolean) => void;
  setUploadStatus: (status: string) => void;
  setDeleteStatus: (status: string) => void;
  setDeleteConfirm: (confirm: any) => void;
  setListDeleteConfirm: (confirm: any) => void;
  setSyncConfirm: (confirm: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setPaper: (paper: string) => void;
  setPaperName: (name: string) => void;
  setSelectedPaperIndex: (index: any) => void;
}

function populateSnapshotFields(formData: FormData, selectedPaper: any) {
  const expected = buildExpectedPaperPayload(selectedPaper);
  Object.entries(expected).forEach(([key, val]) => {
    formData.append(key, val);
  });
}

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
  directLink,
  setDirectLink,
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
}: CreatePaperActionsParams) => {
  const resetSelectedPaper = () => {
    setPaper("");
    setPaperName("");
    setSelectedPaperIndex(null);
  };

  const handleUpload = async () => {
    if (!canEditPapers) {
      setUploadStatus("Error: You Do Not Have Permission To Update Papers.");
      return;
    }
    if (!course || !year || !spec || !semester || !exam || !paperName.trim()) {
      setFileError(false);
      setUploadStatus("Error: Please Complete All Fields");
      setTimeout(() => setUploadStatus(""), 4000);
      return;
    }
    if (canUploadFiles && !file && !directLink?.trim() && !selectedPaperIndex) {
      setFileError(true);
      setUploadStatus("");
      return;
    }

    if (directLink?.trim() && !isValidDocumentLink(directLink.trim())) {
      setUploadStatus("Error: Only .PDF, .DOCX Or Google Drive Links Are Allowed.");
      setTimeout(() => setUploadStatus(""), 4000);
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
      if (directLink?.trim()) formData.append("directLink", directLink.trim());
      formData.append("course", course);
      formData.append("year", year);
      formData.append("spec", spec);
      formData.append("sem", semester);
      formData.append("exam", exam);
      formData.append("name", paperName.trim());
      if (selectedPaperIndex) {
        formData.append("index", selectedPaperIndex);
        populateSnapshotFields(formData, selectedPaper);
      }

      const response = await uploadPaper(formData);
      const payload = await readApiResponse(response);
      if (!response.ok) {
        setUploadStatus(`Error: ${cleanStatusMessage(payload.message || payload.error || "Upload Failed")}`);
        return;
      }

      appendExpectedPaper({
        course,
        year,
        spec,
        sem: semester,
        exam,
        name: paperName.trim(),
        url: payload.paper?.link || payload.paper?.drive_url || payload.data?.drive_url || payload.data?.link || "",
        index: payload.paper?.id || payload.data?.id || selectedPaperIndex || paperName.trim()
      });
      clearPapersCache();
      notifyPapersUpdated();
      await fetchPapers();
      await refreshLogs();
      setUploadStatus(cleanStatusMessage(payload.message || "Success: Data Updated"));
      setFile(null);
      setFileName("No File Chosen");
      if (setDirectLink) setDirectLink("");
      const uploadInput = document.getElementById("fileUpload") as HTMLInputElement | null;
      if (uploadInput) uploadInput.value = "";
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadStatus("Error: Server Connection Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!canDeletePapers) return;
    if (!selectedPaperIndex) {
      setDeleteStatus("Error: Select An Existing Paper To Delete");
      setTimeout(() => setDeleteStatus(""), 4000);
      return;
    }
    setDeleteConfirm({ show: true, paperName });
  };

  const performPaperDelete = async (index: any, expected: any, onSuccess?: () => void) => {
    const response = await deletePaper(index, expected);
    const payload = await readApiResponse(response);
    if (!response.ok) {
      setDeleteStatus(`Error: ${cleanStatusMessage(payload.message || "Delete Failed")}`);
      return;
    }
    clearPapersCache();
    notifyPapersUpdated();
    await fetchPapers();
    await refreshLogs();
    setDeleteStatus(cleanStatusMessage(payload.message || "Success: Paper Deleted"));
    onSuccess?.();
  };

  const executeDelete = async () => {
    if (!canDeletePapers || !selectedPaperIndex) return;
    setIsLoading(true);
    setDeleteStatus("");
    try {
      await performPaperDelete(selectedPaperIndex, buildExpectedPaperPayload(selectedPaper), resetSelectedPaper);
    } catch (error) {
      console.error("Delete Error:", error);
      setDeleteStatus("Error: Server Connection Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const executeListDelete = async () => {
    if (!canDeletePapers || !listDeleteConfirm.row?.index) return;
    setIsLoading(true);
    try {
      await performPaperDelete(listDeleteConfirm.row.index, buildExpectedPaperPayload(listDeleteConfirm.row));
    } catch (error) {
      console.error("List Delete Error:", error);
      setDeleteStatus("Error: Server Connection Failed");
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
        setUploadStatus(`Error: ${cleanStatusMessage(payload.message || "Sync Failed")}`);
        return;
      }
      setUploadStatus(cleanStatusMessage(payload.message || "Success: Website Sync Started"));
    } catch (error) {
      console.error("Sync Error:", error);
      setUploadStatus("Error: Server Connection Failed");
    } finally {
      setSyncConfirm(false);
      setIsLoading(false);
    }
  };

  return { handleUpload, handleDelete, executeDelete, executeListDelete, executeSync };
};


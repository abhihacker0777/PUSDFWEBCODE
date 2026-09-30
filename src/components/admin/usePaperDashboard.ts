import { useCallback, useMemo, useState } from "react";
import { getPapers } from "./adminApi";
import { ADD_SEMESTER, ADD_SPEC } from "./adminConstants";
import { cleanStatusMessage, goToLogin, isAdminSessionExpired, readApiResponse } from "./adminHelpers";
import { createPaperActions } from "./paperActions";
import { buildPaperOptions } from "./paperOptions";
import useBulkPaperUpload from "./useBulkPaperUpload";

export interface UsePaperDashboardParams {
  canCreatePapers: boolean;
  canEditPapers: boolean;
  canUploadFiles: boolean;
  canDeletePapers: boolean;
  canSyncPapers: boolean;
  refreshLogs: () => Promise<void>;
}

export default function usePaperDashboard({
  canCreatePapers,
  canEditPapers,
  canUploadFiles,
  canDeletePapers,
  canSyncPapers,
  refreshLogs
}: UsePaperDashboardParams) {
  const [allPapers, setAllPapers] = useState<any[]>([]);
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [spec, setSpec] = useState("");
  const [semester, setSemester] = useState("");
  const [exam, setExam] = useState("");
  const [paper, setPaper] = useState("");
  const [paperName, setPaperName] = useState("");
  const [selectedPaperIndex, setSelectedPaperIndex] = useState<any>(null);
  const [fileName, setFileName] = useState("No file chosen");
  const [file, setFile] = useState<File | null>(null);
  const [directLink, setDirectLink] = useState("");
  const [fileError, setFileError] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, paperName: "" });
  const [listDeleteConfirm, setListDeleteConfirm] = useState<any>({ show: false, row: null });
  const [syncConfirm, setSyncConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customSpecsByCourse, setCustomSpecsByCourse] = useState<Record<string, string[]>>({});
  const [customSemestersByYear, setCustomSemestersByYear] = useState<Record<string, string[]>>({});

  const fetchPapers = useCallback(async () => {
    try {
      const response = await getPapers();
      if (isAdminSessionExpired(response)) {
        goToLogin();
        return false;
      }
      if (response.status === 409) {
        const payload = await readApiResponse(response);
        setAllPapers([]);
        setUploadStatus(`Error: ${cleanStatusMessage(payload.message)}`);
        return false;
      }
      if (response.ok) {
        const raw = await response.json();
        const papersList = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        setAllPapers(papersList);
        return true;
      }
    } catch (error) {
      console.error("Server connecting...", error);
    }
    return false;
  }, []);

  const rememberCustomSpec = useCallback((courseValue: string, specValue: string) => {
    if (!courseValue || !specValue || specValue === ADD_SPEC) return;
    setCustomSpecsByCourse((current) => {
      const values = current[courseValue] || [];
      if (values.includes(specValue)) return current;
      return { ...current, [courseValue]: [...values, specValue] };
    });
  }, []);

  const rememberCustomSemester = useCallback((yearValue: string, semesterValue: string) => {
    if (!yearValue || !semesterValue || semesterValue === ADD_SEMESTER) return;
    setCustomSemestersByYear((current) => {
      const values = current[yearValue] || [];
      if (values.includes(semesterValue)) return current;
      return { ...current, [yearValue]: [...values, semesterValue] };
    });
  }, []);

  const handleSpecChange = useCallback((value: string) => {
    rememberCustomSpec(course, value);
    setSpec(value);
  }, [course, rememberCustomSpec]);

  const handleSemesterChange = useCallback((value: string) => {
    rememberCustomSemester(year, value);
    setSemester(value);
  }, [year, rememberCustomSemester]);

  const appendExpectedPaper = useCallback((data: any) => {
    setAllPapers((prev) => {
      const normalizedData = {
        ...data,
        index: data.index ?? selectedPaperIndex ?? `pending-${Date.now()}`
      };
      const withoutOld = prev.filter((item) => String(item.index) !== String(normalizedData.index));
      return [normalizedData, ...withoutOld];
    });
  }, [selectedPaperIndex]);

  const bulkUpload = useBulkPaperUpload({
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
  });

  const dropdownData = useMemo(() => buildPaperOptions({
    allPapers,
    course,
    year,
    spec,
    semester,
    exam,
    customSpecsByCourse,
    customSemestersByYear
  }), [allPapers, course, customSemestersByYear, customSpecsByCourse, exam, semester, spec, year]);

  const actions = createPaperActions({
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
    selectedPaper: allPapers.find(p => String(p.index) === String(selectedPaperIndex)) || null,
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
  });

  return {
    fetchPapers,
    deleteConfirm,
    setDeleteConfirm,
    executeDelete: actions.executeDelete,
    listDeleteConfirm,
    setListDeleteConfirm,
    executeListDelete: actions.executeListDelete,
    syncConfirm,
    setSyncConfirm,
    executeSync: actions.executeSync,
    bulkUploadProps: bulkUpload,
    paperActionProps: {
      setCourse,
      setYear,
      setSpec,
      setSemester,
      setExam,
      setPaper,
      setPaperName,
      setSelectedPaperIndex,
      setListDeleteConfirm
    },
    dashboardProps: {
      file,
      fileName,
      directLink,
      setDirectLink,
      setFile,
      setFileName,
      ...dropdownData,
      course,
      setCourse,
      year,
      setYear,
      spec,
      setSpec: handleSpecChange,
      semester,
      setSemester: handleSemesterChange,
      exam,
      setExam,
      paper,
      setPaper,
      paperName,
      setPaperName,
      handleUpload: actions.handleUpload,
      handleDelete: actions.handleDelete,
      handleSyncToWebsite: () => canSyncPapers && setSyncConfirm(true),
      setSelectedPaperIndex,
      fileError,
      isLoading,
      setFileError,
      uploadStatus,
      setUploadStatus,
      deleteStatus,
      canCreatePapers,
      canEditPapers,
      canDeletePapers,
      canSyncPapers,
      canUploadFiles
    }
  };
}

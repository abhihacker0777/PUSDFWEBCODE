export interface Paper {
  id: string | number;
  index?: string | number;
  name: string;
  title?: string;
  subject?: string;
  course: string;
  year: string;
  spec?: string;
  specialization?: string;
  sem?: string;
  semester?: string;
  exam: string;
  link: string;
  drive_url?: string;
  driveFileId?: string;
  drive_file_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaperTargetMapping {
  id: string;
  course: string;
  year: string;
  spec: string;
  semester: string;
  exam: string;
}

export interface BulkUploadQueueItem {
  id: string;
  file: File | null;
  link?: string;
  fileName: string;
  paperName: string;
  targets: PaperTargetMapping[];
  status: "pending" | "uploading" | "success" | "error";
  message?: string;
}

export interface PaperFiltersState {
  course: string;
  year: string;
  specialization: string;
  semester: string;
  exam: string;
}

export interface ExtractedAIIntent {
  intentType?: "GREETING" | "ABOUT" | "ADMISSION_OR_GENERAL" | "PAPER_SEARCH" | "OUT_OF_SCOPE";
  conversationalReply?: string | null;
  course?: string | null;
  specialization?: string | null;
  semester?: string | null;
  exam?: string | null;
  subjectKeywords?: string[];
  academicYear?: string | null;
  confidence?: number;
}

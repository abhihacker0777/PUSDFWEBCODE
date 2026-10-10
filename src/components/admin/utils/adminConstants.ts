export const courseSequence: string[] = [
  "B.Arch", "B.Com", "B.Des", "B.Sc", "B.Tech", "BA", "BBA", "BCA", "BPH", "BVA",
  "M.Des", "M.Plan", "M.Tech", "MA", "MBA", "MCA", "MHA", "MPH", "MVA",
  "Ph.D", "PIHM"
];
export const yearSequence: string[] = ["1 Year", "2 Year", "3 Year", "4 Year", "5 Year"];
export const semesterSequence: string[] = ["1 Sem", "2 Sem", "3 Sem", "4 Sem", "5 Sem", "6 Sem", "7 Sem", "8 Sem", "9 Sem", "10 Sem"];
export const examSequence: string[] = ["MSE", "ESE"];
export const ADD_COURSE: string = "+ Add New Course";
export const ADD_YEAR: string = "+ Add New Year";
export const ADD_SPEC: string = "+ Add New Specialization";
export const ADD_SEMESTER: string = "+ Add New Semester";
export const ROLE_LABELS: Record<string, string> = {
  full: "Full",
  editor: "Editor",
  view: "View",
  Full: "Full",
  Editor: "Editor",
  View: "View",
  admin: "Admin",
  Admin: "Admin"
};
export const ADMIN_PASSWORD_MIN_LENGTH: number = 10;
export const ADMIN_USERNAME_PATTERN: RegExp = /^[a-z0-9._@-]+$/i;
export const STUDENT_QUERY_SEEN_KEY_PREFIX: string = "admin.seenStudentQueries.byEmail";


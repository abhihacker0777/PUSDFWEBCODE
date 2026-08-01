import coverImg from "../assets/pucoverlogo.webp";
import newQueryGif from "../assets/punew.gif";
import AdminHeader from "./admin/AdminHeader";
import AdminModals from "./admin/AdminModals";
import AdminSidebar from "./admin/AdminSidebar";
import AdminUsersPanel from "./admin/AdminUsersPanel";
import AssistantSettingsPanel from "./admin/AssistantSettingsPanel";
import DashboardHome from "./admin/DashboardHome";
import RecentActionsPanel from "./admin/RecentActionsPanel";
import StudentQueriesPanel from "./admin/StudentQueriesPanel";
import useAdminPageController from "./admin/useAdminPageController";

export default function PaperUpdateList() {
  const {
    activeNav,
    sidebarProps,
    headerProps,
    dashboardProps,
    recentActionsProps,
    studentQueriesProps,
    assistantSettingsProps,
    adminUsersPanelProps,
    modalProps
  } = useAdminPageController();

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <AdminSidebar {...sidebarProps} newQueryGif={newQueryGif} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader {...headerProps} />

        <main className="flex-1 overflow-auto px-3 sm:px-5 py-4 bg-gray-100 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track] [&::-webkit-scrollbar-thumb]:bg-[#ffc107] hover:[&::-webkit-scrollbar-thumb]:bg-[#05488B] [&::-webkit-scrollbar-thumb]:rounded-full flex flex-col">
          {activeNav === "dashboard" ? (
            <DashboardHome {...dashboardProps} coverImg={coverImg} />
          ) : activeNav === "paper" ? (
            <RecentActionsPanel {...recentActionsProps} />
          ) : activeNav === "queries" ? (
            <StudentQueriesPanel {...studentQueriesProps} newQueryGif={newQueryGif} />
          ) : activeNav === "assistant" ? (
            <AssistantSettingsPanel {...assistantSettingsProps} />
          ) : activeNav === "admins" ? (
            <AdminUsersPanel {...adminUsersPanelProps} />
          ) : null}
        </main>
      </div>

      <AdminModals {...modalProps} />
    </div>
  );
}
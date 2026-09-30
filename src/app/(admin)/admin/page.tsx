"use client";

import React from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminModals from "@/components/admin/AdminModals";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminUsersPanel from "@/components/admin/AdminUsersPanel";
import AssistantSettingsPanel from "@/components/admin/AssistantSettingsPanel";
import DashboardHome from "@/components/admin/DashboardHome";
import RecentActionsPanel from "@/components/admin/RecentActionsPanel";
import StudentQueriesHome from "@/components/admin/StudentQueriesHome";
import useAdminPageController from "@/components/admin/useAdminPageController";

const coverImg = "/pucoverlogo.webp";
const newQueryGif = "/punew.gif";


export default function AdminPage() {
  const {
    activeNav,
    permissions,
    sidebarProps,
    headerProps,
    dashboardProps,
    bulkUploadProps,
    recentActionsProps,
    studentQueriesProps,
    insightsProps,
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
          {activeNav === "dashboard" && permissions.canEditPapers ? (
            <DashboardHome {...dashboardProps} bulkUploadProps={bulkUploadProps} coverImg={coverImg} />
          ) : activeNav === "paper" && permissions.canMonitor ? (
            <RecentActionsPanel {...recentActionsProps} />
          ) : activeNav === "queries" && permissions.canMonitor ? (
            <StudentQueriesHome {...studentQueriesProps} newQueryGif={newQueryGif} insightsProps={insightsProps} />
          ) : activeNav === "assistant" && permissions.canReadAssistant ? (
            <AssistantSettingsPanel {...assistantSettingsProps} />
          ) : activeNav === "admins" && permissions.canManageAdmins ? (
            <AdminUsersPanel {...adminUsersPanelProps} />
          ) : null}
        </main>
      </div>

      <AdminModals {...modalProps} />
    </div>
  );
}

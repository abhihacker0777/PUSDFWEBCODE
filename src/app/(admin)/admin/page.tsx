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


function renderActivePanel(
  activeNav: string,
  permissions: any,
  props: {
    dashboardProps: any;
    bulkUploadProps: any;
    coverImg: string;
    recentActionsProps: any;
    studentQueriesProps: any;
    newQueryGif: string;
    insightsProps: any;
    assistantSettingsProps: any;
    adminUsersPanelProps: any;
  }
) {
  if (activeNav === "dashboard" && permissions.canEditPapers) {
    return <DashboardHome {...props.dashboardProps} bulkUploadProps={props.bulkUploadProps} coverImg={props.coverImg} />;
  }
  if (activeNav === "paper" && permissions.canMonitor) {
    return <RecentActionsPanel {...props.recentActionsProps} />;
  }
  if (activeNav === "queries" && permissions.canMonitor) {
    return <StudentQueriesHome {...props.studentQueriesProps} newQueryGif={props.newQueryGif} insightsProps={props.insightsProps} />;
  }
  if (activeNav === "assistant" && permissions.canReadAssistant) {
    return <AssistantSettingsPanel {...props.assistantSettingsProps} />;
  }
  if (activeNav === "admins" && permissions.canManageAdmins) {
    return <AdminUsersPanel {...props.adminUsersPanelProps} />;
  }
  return null;
}

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

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <AdminHeader {...headerProps} />

        <main className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 bg-gray-100 min-h-0 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc107] hover:[&::-webkit-scrollbar-thumb]:bg-[#05488B] [&::-webkit-scrollbar-thumb]:rounded-full">
          {renderActivePanel(activeNav, permissions, {
            dashboardProps,
            bulkUploadProps,
            coverImg,
            recentActionsProps,
            studentQueriesProps,
            newQueryGif,
            insightsProps,
            assistantSettingsProps,
            adminUsersPanelProps,
          })}
        </main>
      </div>

      <AdminModals {...modalProps} />
    </div>
  );
}

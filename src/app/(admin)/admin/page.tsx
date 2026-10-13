"use client";

import React from "react";
import {
  AdminHeader,
  AdminModals,
  AdminSidebar,
  AdminUsersPanel,
  DashboardHome,
  RecentActionsPanel,
  StudentQueriesHome,
  SystemSettingsPanel,
  useAdminPageController
} from "@/components/admin";

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
  if (activeNav === "admins" && permissions.canManageAdmins) {
    return <AdminUsersPanel {...props.adminUsersPanelProps} />;
  }
  if (activeNav === "settings" && permissions.canManageAdmins) {
    return <SystemSettingsPanel />;
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
    adminUsersPanelProps,
    modalProps
  } = useAdminPageController();

  return (
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] min-h-[100dvh] overflow-hidden bg-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
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
            adminUsersPanelProps,
          })}
        </main>
      </div>

      <AdminModals {...modalProps} />
    </div>
  );
}

import { useEffect } from "react";
import useActionLogs from "./useActionLogs";
import useAdminChrome from "./useAdminChrome";
import useAdminPermissions from "./useAdminPermissions";
import useAdminSession from "./useAdminSession";
import useAssistantSettings from "./useAssistantSettings";
import useManagedAdmins from "./useManagedAdmins";
import usePaperDashboard from "./usePaperDashboard";
import useStudentQueries from "./useStudentQueries";

export default function useAdminPageController() {
  const session = useAdminSession();
  const permissions = useAdminPermissions(session.authUser);
  const logs = useActionLogs({ canClearLogs: permissions.canClearLogs });
  const assistant = useAssistantSettings(permissions);
  const managedAdmins = useManagedAdmins({ canManageAdmins: permissions.canManageAdmins });
  const studentQueries = useStudentQueries({
    authUser: session.authUser,
    canMonitor: permissions.canMonitor
  });
  const papers = usePaperDashboard({
    canCreatePapers: permissions.canCreatePapers,
    canEditPapers: permissions.canEditPapers,
    canUploadFiles: permissions.canUploadFiles,
    canDeletePapers: permissions.canDeletePapers,
    canSyncPapers: permissions.canSyncPapers,
    refreshLogs: logs.fetchLogs
  });
  const chrome = useAdminChrome({
    authUser: session.authUser,
    adminUsers: managedAdmins.adminUsers,
    permissions,
    hasNewStudentQueries: studentQueries.hasNewStudentQueries,
    onLogout: session.handleLogout
  });
  const fetchLogs = logs.fetchLogs;
  const fetchSettings = assistant.fetchSettings;
  const fetchAdminUsers = managedAdmins.fetchAdminUsers;
  const fetchPapers = papers.fetchPapers;
  const fetchStudentQueries = studentQueries.fetchStudentQueries;

  useEffect(() => {
    if (!session.authUser) return undefined;

    let isPolling = false;
    const loadData = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        await fetchPapers();
        if (permissions.canMonitor) {
          await fetchLogs();
          await fetchStudentQueries();
        }
        await fetchSettings();
        await fetchAdminUsers();
      } catch (error) {
        console.error("Dashboard polling failed:", error);
      } finally {
        isPolling = false;
      }
    };

    loadData();
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, [
    fetchAdminUsers,
    fetchLogs,
    fetchPapers,
    fetchSettings,
    fetchStudentQueries,
    permissions.canMonitor,
    session.authUser
  ]);

  const dashboardProps = {
    ...papers.dashboardProps,
    openDropdown: chrome.openDropdown,
    setOpenDropdown: chrome.setOpenDropdown
  };

  const recentActionsProps = {
    showAllMenu: chrome.showAllMenu,
    setShowAllMenu: chrome.setShowAllMenu,
    setShowFilter: chrome.setShowFilter,
    setShowQueryFilter: chrome.setShowQueryFilter,
    showFilter: chrome.showFilter,
    openAction: chrome.openAction,
    setOpenAction: chrome.setOpenAction,
    setActiveNav: chrome.setActiveNav,
    canClearLogs: permissions.canClearLogs,
    canEditPapers: permissions.canEditPapers,
    canDeletePapers: permissions.canDeletePapers,
    ...logs.showAllMenuState,
    ...logs.recentActionsState,
    ...papers.paperActionProps
  };

  const studentQueriesProps = {
    ...studentQueries.studentQueriesProps,
    setShowQueryFilter: chrome.setShowQueryFilter,
    setShowAllMenu: chrome.setShowAllMenu,
    setShowFilter: chrome.setShowFilter,
    showQueryFilter: chrome.showQueryFilter,
    blockedEmails: assistant.blockedEmails,
    blockLoadingEmail: assistant.blockLoadingEmail,
    canBlockAssistant: permissions.canBlockAssistant,
    handleUnblockUser: assistant.handleUnblockUser,
    handleBlockUser: assistant.handleBlockUser
  };

  const modalProps = {
    deleteConfirm: papers.deleteConfirm,
    setDeleteConfirm: papers.setDeleteConfirm,
    executeDelete: papers.executeDelete,
    listDeleteConfirm: papers.listDeleteConfirm,
    setListDeleteConfirm: papers.setListDeleteConfirm,
    executeListDelete: papers.executeListDelete,
    adminDeleteConfirm: managedAdmins.adminDeleteConfirm,
    setAdminDeleteConfirm: managedAdmins.setAdminDeleteConfirm,
    executeAdminDelete: managedAdmins.executeAdminDelete,
    syncConfirm: papers.syncConfirm,
    setSyncConfirm: papers.setSyncConfirm,
    executeSync: papers.executeSync,
    clearLogsConfirm: logs.clearLogsConfirm,
    setClearLogsConfirm: logs.setClearLogsConfirm,
    executeClearLogs: logs.executeClearLogs,
    clearSelectedConfirm: logs.clearSelectedConfirm,
    setClearSelectedConfirm: logs.setClearSelectedConfirm,
    executeClearSelected: logs.executeClearSelected
  };

  return {
    activeNav: chrome.activeNav,
    sidebarProps: chrome.sidebarProps,
    headerProps: chrome.headerProps,
    dashboardProps,
    recentActionsProps,
    studentQueriesProps,
    assistantSettingsProps: assistant.assistantSettingsProps,
    adminUsersPanelProps: managedAdmins.adminUsersPanelProps,
    modalProps
  };
}

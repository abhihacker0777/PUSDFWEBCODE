import { useMemo } from "react";

export interface AdminPermissions {
  canCreatePapers: boolean;
  canUpdatePapers: boolean;
  canUploadFiles: boolean;
  canDeletePapers: boolean;
  canSyncPapers: boolean;
  canEditPapers: boolean;
  canBlockAssistant: boolean;
  canCreateReplies: boolean;
  canEditAssistant: boolean;
  canDeleteReplies: boolean;
  canReadAssistant: boolean;
  canMonitor: boolean;
  canClearLogs: boolean;
  canManageAdmins: boolean;
}

export default function useAdminPermissions(authUser: any): AdminPermissions {
  return useMemo(() => {
    if (!authUser) {
      return {
        canCreatePapers: false,
        canUpdatePapers: false,
        canUploadFiles: false,
        canDeletePapers: false,
        canSyncPapers: false,
        canEditPapers: false,
        canBlockAssistant: false,
        canCreateReplies: false,
        canEditAssistant: false,
        canDeleteReplies: false,
        canReadAssistant: false,
        canMonitor: false,
        canClearLogs: false,
        canManageAdmins: false
      };
    }

    const isOwner = Boolean(authUser?.isOwner);
    const permissions = new Set<string>(authUser?.permissions || []);
    const canCreatePapers = permissions.has("papers:create");
    const canUpdatePapers = permissions.has("papers:update");

    return {
      canCreatePapers,
      canUpdatePapers,
      canUploadFiles: permissions.has("papers:file"),
      canDeletePapers: permissions.has("papers:delete"),
      canSyncPapers: permissions.has("papers:sync"),
      canEditPapers: canCreatePapers || canUpdatePapers,
      canBlockAssistant: permissions.has("assistant:block"),
      canCreateReplies: permissions.has("assistant:reply:create"),
      canEditAssistant: permissions.has("assistant:reply:update"),
      canDeleteReplies: permissions.has("assistant:reply:delete"),
      canReadAssistant: permissions.has("assistant:read"),
      canMonitor: permissions.has("monitor:read"),
      canClearLogs: permissions.has("logs:write"),
      canManageAdmins: Boolean(isOwner || permissions.has("admins:manage"))
    };
  }, [authUser]);
}

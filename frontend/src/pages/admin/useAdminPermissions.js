import { useMemo } from "react";

export default function useAdminPermissions(authUser) {
  return useMemo(() => {
    const permissions = new Set(authUser?.permissions || []);
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
      canManageAdmins: Boolean(authUser?.isOwner)
    };
  }, [authUser]);
}

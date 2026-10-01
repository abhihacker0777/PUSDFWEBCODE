export type AdminRole = "Full" | "Editor" | "View";

export interface AdminUser {
  id: string;
  auth_user_id?: string;
  email: string;
  login_identifier: string;
  display_name: string;
  role: AdminRole;
  is_active: boolean;
  created_at?: string;
}

export interface AdminPermissions {
  canCreatePapers: boolean;
  canEditPapers: boolean;
  canDeletePapers: boolean;
  canManageAdmins: boolean;
  canMonitor: boolean;
  canReadAssistant: boolean;
  canWriteAssistant: boolean;
  canUploadFiles: boolean;
  canSyncPapers: boolean;
}

export function getRolePermissions(role?: string, isPrimaryOwner = false): AdminPermissions {
  if (isPrimaryOwner || role === "Full") {
    return {
      canCreatePapers: true,
      canEditPapers: true,
      canDeletePapers: true,
      canManageAdmins: isPrimaryOwner,
      canMonitor: true,
      canReadAssistant: true,
      canWriteAssistant: true,
      canUploadFiles: true,
      canSyncPapers: true,
    };
  }

  if (role === "Editor") {
    return {
      canCreatePapers: true,
      canEditPapers: true,
      canDeletePapers: false,
      canManageAdmins: false,
      canMonitor: true,
      canReadAssistant: true,
      canWriteAssistant: false,
      canUploadFiles: true,
      canSyncPapers: false,
    };
  }

  // "View" role: Read-only
  return {
    canCreatePapers: false,
    canEditPapers: false,
    canDeletePapers: false,
    canManageAdmins: false,
    canMonitor: true,
    canReadAssistant: true,
    canWriteAssistant: false,
    canUploadFiles: false,
    canSyncPapers: false,
  };
}

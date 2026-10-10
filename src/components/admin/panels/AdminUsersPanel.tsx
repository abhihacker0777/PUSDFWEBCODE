import React, { useState } from "react";
import AdminUserCreateForm from "../forms/AdminUserCreateForm";
import AdminUsersTable from "./AdminUsersTable";
import SystemSettingsPanel from "./SystemSettingsPanel";

export interface AdminUsersPanelProps {
  adminUsers: any[];
  setAdminUsers: React.Dispatch<React.SetStateAction<any[]>>;
  adminForm: any;
  setAdminForm: React.Dispatch<React.SetStateAction<any>>;
  adminPasswordDrafts: Record<string, string>;
  setAdminPasswordDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  adminSavingId: string;
  adminStatus: string;
  handleCreateAdminUser: (e: React.FormEvent) => Promise<void>;
  handleUpdateAdminUser: (user: any) => Promise<void>;
  handleDeleteAdminUser: (user: any) => void;
}

const AdminUsersPanel: React.FC<AdminUsersPanelProps> = ({
  adminUsers,
  setAdminUsers,
  adminForm,
  setAdminForm,
  adminPasswordDrafts,
  setAdminPasswordDrafts,
  adminSavingId,
  adminStatus,
  handleCreateAdminUser,
  handleUpdateAdminUser,
  handleDeleteAdminUser
}) => {
  const [openRoleMenu, setOpenRoleMenu] = useState("");
  const [visibleDraftPasswordIds, setVisibleDraftPasswordIds] = useState<Set<string>>(new Set());

  const updateUserDraft = (id: string, patch: any) => {
    setAdminUsers((current) => current.map((user) => user.id === id ? { ...user, ...patch } : user));
  };

  const toggleDraftPassword = (id: string, forceVisible?: boolean) => {
    setVisibleDraftPasswordIds((current) => {
      const next = new Set(current);
      if (forceVisible) next.add(id);
      else if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <AdminUserCreateForm
        adminForm={adminForm}
        adminSavingId={adminSavingId}
        adminStatus={adminStatus}
        handleCreateAdminUser={handleCreateAdminUser}
        openRoleMenu={openRoleMenu}
        setAdminForm={setAdminForm}
        setOpenRoleMenu={setOpenRoleMenu}
      />

      <AdminUsersTable
        adminUsers={adminUsers}
        adminPasswordDrafts={adminPasswordDrafts}
        adminSavingId={adminSavingId}
        handleDeleteAdminUser={handleDeleteAdminUser}
        handleUpdateAdminUser={handleUpdateAdminUser}
        openRoleMenu={openRoleMenu}
        setAdminPasswordDrafts={setAdminPasswordDrafts}
        setOpenRoleMenu={setOpenRoleMenu}
        toggleDraftPassword={toggleDraftPassword}
        updateUserDraft={updateUserDraft}
        visibleDraftPasswordIds={visibleDraftPasswordIds}
      />
    </div>
  );
};

export default AdminUsersPanel;


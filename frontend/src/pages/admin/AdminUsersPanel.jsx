import { useState } from "react";
import AdminUserCreateForm from "./AdminUserCreateForm";
import AdminUsersTable from "./AdminUsersTable";

const AdminUsersPanel = ({
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
  const [visibleDraftPasswordIds, setVisibleDraftPasswordIds] = useState(new Set());

  const updateUserDraft = (id, patch) => {
    setAdminUsers((current) => current.map((user) => user.id === id ? { ...user, ...patch } : user));
  };

  const toggleDraftPassword = (id, forceVisible) => {
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

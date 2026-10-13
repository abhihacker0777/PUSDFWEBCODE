import { useCallback, useState } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser
} from "../utils/adminApi";
import { ADMIN_PASSWORD_MIN_LENGTH, ADMIN_USERNAME_PATTERN } from "../utils/adminConstants";
import { cleanStatusMessage, goToLogin, isAdminSessionExpired, readApiResponse } from "../utils/adminHelpers";

const emptyAdminForm = { displayName: "", username: "", email: "", password: "", role: "view" };

export interface UseManagedAdminsParams {
  canManageAdmins: boolean;
}

export default function useManagedAdmins({ canManageAdmins }: UseManagedAdminsParams) {
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [adminPasswordDrafts, setAdminPasswordDrafts] = useState<Record<string, string>>({});
  const [adminSavingId, setAdminSavingId] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [adminDeleteConfirm, setAdminDeleteConfirm] = useState<{ show: boolean; user: any }>({ show: false, user: null });

  const fetchAdminUsers = useCallback(async () => {
    if (!canManageAdmins) return;
    try {
      const response = await getAdminUsers();
      if (isAdminSessionExpired(response)) return goToLogin();
      const payload = await readApiResponse(response);
      if (response.ok) setAdminUsers(payload.users || []);
    } catch (error) {
      console.error("Admin Users Fetch Failed:", error);
    }
  }, [canManageAdmins]);

  const handleCreateAdminUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageAdmins) return;

    const payload = {
      displayName: adminForm.displayName.trim(),
      username: adminForm.username.trim(),
      email: adminForm.email.trim(),
      password: adminForm.password,
      role: adminForm.role
    };

    if (!payload.displayName || !ADMIN_USERNAME_PATTERN.test(payload.username) || payload.password.length < ADMIN_PASSWORD_MIN_LENGTH) {
      setAdminStatus("Error: Invalid Admin User Details.");
      return;
    }

    setAdminSavingId("create");
    setAdminStatus("");
    try {
      const response = await createAdminUser(payload);
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Failed To Add Admin User");
      setAdminForm(emptyAdminForm);
      setAdminStatus(`Success: ${data.message || (data.inviteSent ? "Admin User Added & Onboarding Invite Email Dispatched." : "Admin User Added.")}`);
      await fetchAdminUsers();
    } catch (error: any) {
      setAdminStatus(`Error: ${cleanStatusMessage(error.message || "Failed To Add Admin User")}`);
    } finally {
      setAdminSavingId("");
    }
  };

  const handleUpdateAdminUser = async (user: any) => {
    if (!canManageAdmins || user?.isOwner) return;
    const nextPassword = adminPasswordDrafts[user.id] || "";
    if (nextPassword && nextPassword.length < ADMIN_PASSWORD_MIN_LENGTH) {
      setAdminStatus(`Error: Password Must Be At Least ${ADMIN_PASSWORD_MIN_LENGTH} Characters.`);
      return;
    }

    setAdminSavingId(user.id);
    setAdminStatus("");
    try {
      const body: any = {
        id: user.id,
        displayName: (user.displayName || "").trim(),
        email: (user.email || "").trim(),
        role: user.role || "view",
        isActive: user.isActive !== false
      };
      if (nextPassword) body.password = nextPassword;

      const response = await updateAdminUser(body);
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Failed To Update Admin User");
      setAdminPasswordDrafts((current) => ({ ...current, [user.id]: "" }));
      setAdminStatus("Success: Admin User Updated");
      await fetchAdminUsers();
    } catch (error: any) {
      setAdminStatus(`Error: ${cleanStatusMessage(error.message || "Failed To Update Admin User")}`);
    } finally {
      setAdminSavingId("");
    }
  };

  const handleDeleteAdminUser = (user: any) => {
    if (!canManageAdmins || user?.isOwner) return;
    setAdminDeleteConfirm({ show: true, user });
  };

  const executeAdminDelete = async () => {
    const user = adminDeleteConfirm.user;
    if (!canManageAdmins || !user?.id || user.isOwner) return;
    setAdminSavingId(user.id);
    try {
      const response = await deleteAdminUser(user.id);
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Failed To Delete Admin User");
      setAdminDeleteConfirm({ show: false, user: null });
      setAdminStatus("Success: Admin User Deleted");
      await fetchAdminUsers();
    } catch (error: any) {
      setAdminStatus(`Error: ${cleanStatusMessage(error.message || "Failed To Delete Admin User")}`);
    } finally {
      setAdminSavingId("");
    }
  };

  return {
    adminUsers,
    fetchAdminUsers,
    adminDeleteConfirm,
    setAdminDeleteConfirm,
    executeAdminDelete,
    adminUsersPanelProps: {
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
    }
  };
}


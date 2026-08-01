import { useCallback, useState } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser
} from "./adminApi";
import { ADMIN_PASSWORD_MIN_LENGTH, ADMIN_USERNAME_PATTERN } from "./adminConstants";
import { cleanStatusMessage, goToLogin, isAdminSessionExpired, readApiResponse } from "./adminHelpers";

const emptyAdminForm = { displayName: "", username: "", email: "", password: "", role: "view" };

export default function useManagedAdmins({ canManageAdmins }) {
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [adminPasswordDrafts, setAdminPasswordDrafts] = useState({});
  const [adminSavingId, setAdminSavingId] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [adminDeleteConfirm, setAdminDeleteConfirm] = useState({ show: false, user: null });

  const fetchAdminUsers = useCallback(async () => {
    if (!canManageAdmins) return;
    try {
      const response = await getAdminUsers();
      if (isAdminSessionExpired(response)) return goToLogin();
      const payload = await readApiResponse(response);
      if (response.ok) setAdminUsers(payload.users || []);
    } catch (error) {
      console.error("Admin users fetch failed", error);
    }
  }, [canManageAdmins]);

  const handleCreateAdminUser = async (event) => {
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
      setAdminStatus("Error: Invalid admin user details.");
      return;
    }

    setAdminSavingId("create");
    setAdminStatus("");
    try {
      const response = await createAdminUser(payload);
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Failed to add admin user");
      setAdminForm(emptyAdminForm);
      setAdminStatus("Success: Admin user added");
      await fetchAdminUsers();
    } catch (error) {
      setAdminStatus(`Error: ${cleanStatusMessage(error.message || "Failed to add admin user")}`);
    } finally {
      setAdminSavingId("");
    }
  };

  const handleUpdateAdminUser = async (user) => {
    if (!canManageAdmins || user?.isOwner) return;
    const nextPassword = adminPasswordDrafts[user.id] || "";
    if (nextPassword && nextPassword.length < ADMIN_PASSWORD_MIN_LENGTH) {
      setAdminStatus(`Error: Password must be at least ${ADMIN_PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    setAdminSavingId(user.id);
    setAdminStatus("");
    try {
      const body = {
        id: user.id,
        displayName: (user.displayName || "").trim(),
        email: (user.email || "").trim(),
        role: user.role || "view",
        isActive: user.isActive !== false
      };
      if (nextPassword) body.password = nextPassword;

      const response = await updateAdminUser(body);
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.message || "Failed to update admin user");
      setAdminPasswordDrafts((current) => ({ ...current, [user.id]: "" }));
      setAdminStatus("Success: Admin user updated");
      await fetchAdminUsers();
    } catch (error) {
      setAdminStatus(`Error: ${cleanStatusMessage(error.message || "Failed to update admin user")}`);
    } finally {
      setAdminSavingId("");
    }
  };

  const handleDeleteAdminUser = (user) => {
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
      if (!response.ok) throw new Error(data.message || "Failed to delete admin user");
      setAdminDeleteConfirm({ show: false, user: null });
      setAdminStatus("Success: Admin user deleted");
      await fetchAdminUsers();
    } catch (error) {
      setAdminStatus(`Error: ${cleanStatusMessage(error.message || "Failed to delete admin user")}`);
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

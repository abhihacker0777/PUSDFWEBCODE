import { useEffect, useMemo, useState } from "react";
import { FiFileText, FiHome, FiMessageCircle, FiSettings, FiUsers } from "react-icons/fi";
import { ROLE_LABELS } from "./adminConstants";

const getActiveTitle = (activeNav) => {
  if (activeNav === "dashboard") return "Edit Data";
  if (activeNav === "paper") return "Edited Data";
  if (activeNav === "queries") return "Student Queries";
  if (activeNav === "assistant") return "Update Assistant";
  return "Admins";
};

export default function useAdminChrome({
  authUser,
  adminUsers,
  permissions,
  hasNewStudentQueries,
  onLogout
}) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showQueryFilter, setShowQueryFilter] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openAction, setOpenAction] = useState(null);

  useEffect(() => {
    const closeAll = () => {
      setOpenDropdown(null);
      setOpenAction(null);
      setShowAllMenu(false);
      setShowFilter(false);
      setShowQueryFilter(false);
    };
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  const navItems = useMemo(() => ([
    permissions.canEditPapers && { id: "dashboard", label: "Home", icon: FiHome },
    permissions.canMonitor && { id: "paper", label: "Recent Action", icon: FiFileText },
    permissions.canMonitor && {
      id: "queries",
      label: "Student Queries",
      icon: FiMessageCircle,
      showNew: hasNewStudentQueries && activeNav !== "queries"
    },
    permissions.canReadAssistant && { id: "assistant", label: "Update Assistant", icon: FiSettings },
    permissions.canManageAdmins && { id: "admins", label: "Admins", icon: FiUsers }
  ].filter(Boolean)), [activeNav, hasNewStudentQueries, permissions]);

  const matchingAdminUser = useMemo(() => {
    if (!authUser || adminUsers.length === 0) return null;
    return adminUsers.find((user) =>
      (authUser.id && user.id === authUser.id) ||
      (authUser.loginIdentifier && user.loginIdentifier === authUser.loginIdentifier) ||
      (authUser.email && user.email === authUser.email)
    ) || null;
  }, [authUser, adminUsers]);

  const savedDisplayName = matchingAdminUser?.displayName || authUser?.displayName || "";
  const loggedInLabel = savedDisplayName && savedDisplayName.toLowerCase() !== "admin"
    ? savedDisplayName
    : authUser?.email || authUser?.loginIdentifier || "Admin";
  const loggedInRoleLabel = authUser?.isOwner ? "Admin" : `${ROLE_LABELS[authUser?.role] || "User"}`;

  return {
    activeNav,
    setActiveNav,
    openDropdown,
    setOpenDropdown,
    openAction,
    setOpenAction,
    showAllMenu,
    setShowAllMenu,
    showFilter,
    setShowFilter,
    showQueryFilter,
    setShowQueryFilter,
    sidebarProps: { navItems, activeNav, setActiveNav },
    headerProps: {
      activeTitle: getActiveTitle(activeNav),
      authUser,
      loggedInLabel,
      loggedInRoleLabel,
      onLogout
    }
  };
}

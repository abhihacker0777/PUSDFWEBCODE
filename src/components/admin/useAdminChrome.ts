import { useEffect, useMemo, useState } from "react";
import { FileText, Home, MessageCircle, Settings, Users } from "lucide-react";
import { ROLE_LABELS } from "./adminConstants";

const getActiveTitle = (activeNav: string): string => {
  if (activeNav === "dashboard") return "Edit Data";
  if (activeNav === "paper") return "Edited Data";
  if (activeNav === "queries") return "Student Queries";
  if (activeNav === "assistant") return "Update Assistant";
  return "Admins";
};

export interface UseAdminChromeParams {
  authUser: any;
  adminUsers: any[];
  permissions: any;
  hasNewStudentQueries: boolean;
  onLogout: () => Promise<void>;
}

export default function useAdminChrome({
  authUser,
  adminUsers,
  permissions,
  hasNewStudentQueries,
  onLogout
}: UseAdminChromeParams) {
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    const availableNavIds = [
      permissions.canEditPapers && "dashboard",
      permissions.canMonitor && "paper",
      permissions.canMonitor && "queries",
      permissions.canReadAssistant && "assistant",
      permissions.canManageAdmins && "admins"
    ].filter(Boolean) as string[];

    if (availableNavIds.length > 0 && !availableNavIds.includes(activeNav)) {
      setActiveNav(availableNavIds[0]);
    }
  }, [activeNav, permissions.canEditPapers, permissions.canMonitor, permissions.canReadAssistant, permissions.canManageAdmins]);
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showQueryFilter, setShowQueryFilter] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openAction, setOpenAction] = useState<any>(null);

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
    permissions.canEditPapers && { id: "dashboard", label: "Home", icon: Home },
    permissions.canMonitor && { id: "paper", label: "Recent Action", icon: FileText },
    permissions.canMonitor && {
      id: "queries",
      label: "Student Queries",
      icon: MessageCircle,
      showNew: hasNewStudentQueries && activeNav !== "queries"
    },
    permissions.canReadAssistant && { id: "assistant", label: "Update Assistant", icon: Settings },
    permissions.canManageAdmins && { id: "admins", label: "Admins", icon: Users }
  ].filter(Boolean) as any[]), [activeNav, hasNewStudentQueries, permissions]);

  const [showPersonalName, setShowPersonalName] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPersonalName(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const matchingAdminUser = useMemo(() => {
    if (!authUser || adminUsers.length === 0) return null;
    return adminUsers.find((user) =>
      (authUser.id && user.id === authUser.id) ||
      (authUser.loginIdentifier && user.loginIdentifier === authUser.loginIdentifier) ||
      (authUser.email && user.email === authUser.email)
    ) || null;
  }, [authUser, adminUsers]);

  const savedDisplayName = matchingAdminUser?.displayName || authUser?.displayName || "";
  const isGeneric = (name: string) => {
    const lower = name.toLowerCase();
    return lower === "admin" || lower === "administrator";
  };
  let personalName = authUser?.email || authUser?.loginIdentifier || "PU Central-Library";
  if (savedDisplayName && !isGeneric(savedDisplayName)) {
    personalName = savedDisplayName;
  } else if (authUser?.displayName && !isGeneric(authUser.displayName)) {
    personalName = authUser.displayName;
  }

  const isOwner = Boolean(authUser?.isOwner);
  const currentRole = authUser?.role ? String(authUser.role).toLowerCase() : "";
  let loggedInRoleLabel = "Admin";
  if (authUser && !isOwner) {
    loggedInRoleLabel = ROLE_LABELS[currentRole] || authUser?.role || "Admin";
  }

  const loggedInLabel = showPersonalName ? personalName : "PU Central-Library";

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

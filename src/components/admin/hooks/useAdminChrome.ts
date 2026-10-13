import { useEffect, useMemo, useState } from "react";
import { FileText, Home, MessageCircle, ShieldCheck, Users } from "lucide-react";

const getActiveTitle = (activeNav: string): string => {
  if (activeNav === "dashboard") return "Edit Data";
  if (activeNav === "paper") return "Edited Data";
  if (activeNav === "queries") return "Student Queries";
  if (activeNav === "admins") return "Admin Accounts";
  if (activeNav === "settings") return "University IT & System Controls";
  return "Dashboard";
};

function getLoggedInLabels(isActive: boolean, resolvedRole: string, personName: string) {
  if (!isActive) {
    if (resolvedRole === "super_admin") {
      return { label: "Admin", roleLabel: "PU Central-Library (Super Admin)" };
    }
    if (resolvedRole === "editor") {
      return { label: "Editor", roleLabel: "PU Central-Library" };
    }
    if (resolvedRole === "view") {
      return { label: "View", roleLabel: "PU Central-Library" };
    }
    return { label: "Admin", roleLabel: "PU Central-Library" };
  }

  if (resolvedRole === "super_admin") {
    return { label: personName || "Admin", roleLabel: "Super Admin" };
  }
  if (resolvedRole === "editor") {
    return { label: personName || "Editor", roleLabel: "Editor" };
  }
  if (resolvedRole === "view") {
    return { label: personName || "View", roleLabel: "View" };
  }
  return { label: personName || "Admin", roleLabel: "Admin" };
}

export interface UseAdminChromeParams {
  authUser: any;
  adminUsers: any[];
  permissions: any;
  hasNewStudentQueries: boolean;
  onLogout: () => Promise<void>;
  sessionTelemetry?: any;
  isDataFetched?: boolean;
}

export default function useAdminChrome({
  authUser,
  adminUsers,
  permissions,
  hasNewStudentQueries,
  onLogout,
  sessionTelemetry,
  isDataFetched = false
}: UseAdminChromeParams) {
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    const availableNavIds = [
      permissions.canEditPapers && "dashboard",
      permissions.canMonitor && "paper",
      permissions.canMonitor && "queries",
      permissions.canManageAdmins && "admins",
      permissions.canManageAdmins && "settings"
    ].filter(Boolean) as string[];

    if (availableNavIds.length > 0 && !availableNavIds.includes(activeNav)) {
      setActiveNav(availableNavIds[0]);
    }
  }, [activeNav, permissions.canEditPapers, permissions.canMonitor, permissions.canManageAdmins]);
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
    permissions.canManageAdmins && { id: "admins", label: "Admins", icon: Users },
    permissions.canManageAdmins && { id: "settings", label: "System Controls", icon: ShieldCheck }
  ].filter(Boolean) as any[]), [activeNav, hasNewStudentQueries, permissions]);

  const matchingAdminUser = useMemo(() => {
    if (!authUser || adminUsers.length === 0) return null;
    return adminUsers.find((user) =>
      (authUser.id && user.id === authUser.id) ||
      (authUser.loginIdentifier && String(user.loginIdentifier || "").toLowerCase() === String(authUser.loginIdentifier || "").toLowerCase()) ||
      (authUser.email && String(user.email || "").toLowerCase() === String(authUser.email || "").toLowerCase())
    ) || null;
  }, [authUser, adminUsers]);

  const isOwner = Boolean(authUser?.isOwner);
  const rawRole = String(authUser?.role || matchingAdminUser?.role || "").toLowerCase().trim();

  const personName = isOwner
    ? (authUser?.displayName || matchingAdminUser?.display_name || "")
    : (matchingAdminUser?.display_name || matchingAdminUser?.displayName || authUser?.displayName || "");

  const [cachedRole, setCachedRole] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_user_role");
      if (stored) return stored;
      if (localStorage.getItem("admin_is_superadmin") === "1") return "super_admin";
    }
    return "";
  });

  const resolvedRole = useMemo(() => {
    if (
      isOwner ||
      authUser?.isOwner ||
      rawRole === "super admin" ||
      rawRole === "superadmin" ||
      String(authUser?.role || "").toLowerCase().trim() === "super admin" ||
      permissions?.canManageAdmins ||
      cachedRole === "super_admin"
    ) {
      return "super_admin";
    }
    if (rawRole === "editor" || String(authUser?.role || "").toLowerCase().trim() === "editor" || cachedRole === "editor") {
      return "editor";
    }
    if (rawRole === "view" || String(authUser?.role || "").toLowerCase().trim() === "view" || cachedRole === "view") {
      return "view";
    }
    return "full";
  }, [isOwner, authUser, rawRole, permissions, cachedRole]);

  useEffect(() => {
    if (authUser) {
      let r = "full";
      if (
        isOwner ||
        authUser.isOwner ||
        rawRole === "super admin" ||
        rawRole === "superadmin" ||
        String(authUser.role || "").toLowerCase().trim() === "super admin"
      ) {
        r = "super_admin";
      } else if (rawRole === "editor" || String(authUser.role || "").toLowerCase().trim() === "editor") {
        r = "editor";
      } else if (rawRole === "view" || String(authUser.role || "").toLowerCase().trim() === "view") {
        r = "view";
      }
      try {
        localStorage.setItem("admin_user_role", r);
        localStorage.setItem("admin_is_superadmin", r === "super_admin" ? "1" : "0");
        setCachedRole(r);
      } catch {
      }
    }
  }, [authUser, rawRole, isOwner]);

  const isActive = Boolean(isDataFetched && authUser);

  const { label: loggedInLabel, roleLabel: loggedInRoleLabel } = getLoggedInLabels(isActive, resolvedRole, personName);

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
    sidebarProps: { navItems, activeNav, setActiveNav, sessionTelemetry, authUser },
    headerProps: {
      activeTitle: getActiveTitle(activeNav),
      authUser,
      loggedInLabel,
      loggedInRoleLabel,
      isActive,
      onLogout
    }
  };
}


import { useEffect, useMemo, useState } from "react";
import { FileText, Home, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { ROLE_LABELS } from "../utils/adminConstants";

const getActiveTitle = (activeNav: string): string => {
  if (activeNav === "dashboard") return "Edit Data";
  if (activeNav === "paper") return "Edited Data";
  if (activeNav === "queries") return "Student Queries";
  if (activeNav === "admins") return "Admin Accounts";
  if (activeNav === "settings") return "University IT & System Controls";
  return "Dashboard";
};

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

  // Dynamic person name from .env / authUser for owner, or database for other admins (no hardcoded name strings)
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
        // ignore
      }
    }
  }, [authUser, rawRole, isOwner]);

  const isActive = Boolean(isDataFetched && authUser);

  // During loading / inactive (!isActive):
  // Super Admin:
  //   Top: Admin
  //   Downside: PU Central-Library (Super Admin)
  // Full:
  //   Top: Admin
  //   Downside: PU Central-Library
  // Editor:
  //   Top: Editor
  //   Downside: PU Central-Library
  // View:
  //   Top: View
  //   Downside: PU Central-Library
  //
  // After data load / active (isActive):
  // Super Admin:
  //   Top: Name Of Person From .env File
  //   Downside: Super Admin
  // Full:
  //   Top: Name Of Person From Database That We Create From Superadmin Panel
  //   Downside: Admin
  // Editor:
  //   Top: Name Of Person From Database That We Create From Superadmin Panel
  //   Downside: Editor
  // View:
  //   Top: Name Of Person From Database That We Create From Superadmin Panel
  //   Downside: View

  let loggedInLabel = "Admin";
  let loggedInRoleLabel = "PU Central-Library";

  if (!isActive) {
    if (resolvedRole === "super_admin") {
      loggedInLabel = "Admin";
      loggedInRoleLabel = "PU Central-Library (Super Admin)";
    } else if (resolvedRole === "editor") {
      loggedInLabel = "Editor";
      loggedInRoleLabel = "PU Central-Library";
    } else if (resolvedRole === "view") {
      loggedInLabel = "View";
      loggedInRoleLabel = "PU Central-Library";
    } else {
      // Full
      loggedInLabel = "Admin";
      loggedInRoleLabel = "PU Central-Library";
    }
  } else {
    if (resolvedRole === "super_admin") {
      loggedInLabel = personName || "Admin";
      loggedInRoleLabel = "Super Admin";
    } else if (resolvedRole === "editor") {
      loggedInLabel = personName || "Editor";
      loggedInRoleLabel = "Editor";
    } else if (resolvedRole === "view") {
      loggedInLabel = personName || "View";
      loggedInRoleLabel = "View";
    } else {
      // Full
      loggedInLabel = personName || "Admin";
      loggedInRoleLabel = "Admin";
    }
  }

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


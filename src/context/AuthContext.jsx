import { createContext, useContext, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { getCurrentUserApi, loginApi, logoutApi } from "../api/authApi";
import { initializeFcm, unregisterFcmToken } from "../services/fcmService";

import {
  ACCESS_TOKEN_KEY,
  CURRENT_USER_KEY,
  clearAuthStorage,
  persistAuthTokens,
} from "../api/axios";

const AuthContext = createContext(null);

export { ACCESS_TOKEN_KEY, CURRENT_USER_KEY };

// ============================================================
// AUTH PROVIDER
// ============================================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ==========================================================
  // RESTORE LOGIN SESSION
  // ==========================================================

  useEffect(() => {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);

    const storedUser = sessionStorage.getItem(CURRENT_USER_KEY);

    // --------------------------------------------------------
    // No token = not logged in
    // --------------------------------------------------------

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // --------------------------------------------------------
    // Restore cached user immediately
    // --------------------------------------------------------

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);
      } catch (error) {
        console.error("AUTH: Failed to parse stored user:", error);

        sessionStorage.removeItem(CURRENT_USER_KEY);
      }
    }

    // --------------------------------------------------------
    // Validate / refresh current user from backend
    // --------------------------------------------------------

    getCurrentUserApi()
      .then((data) => {
        if (!data) {
          throw new Error("Current user response is empty");
        }

        setUser(data);

        sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
      })
      .catch((error) => {
        console.error("AUTH: Failed to restore session:", error);

        /*
         * IMPORTANT:
         *
         * If we already have a cached user, don't
         * immediately destroy the session because a
         * temporary API/network failure should not kick
         * the user to login.
         */

        if (!storedUser) {
          clearAuthStorage();

          setUser(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const completeLogin = (data) => {
    persistAuthTokens(data);
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  };

  const login = async (email, password) => {
    const data = await loginApi(email, password);

    if (data?.mfaRequired) {
      return data;
    }

    // --------------------------------------------------------
    // Save access + refresh tokens
    // --------------------------------------------------------

    persistAuthTokens(data);

    // --------------------------------------------------------
    // Save complete user/login response
    // --------------------------------------------------------

    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));

    setUser(data);

    return data;
  };

  const isSystemAdmin = () => user?.role?.toUpperCase() === "ADMIN";

  const getProjectMembership = (projectId) => {
    if (isSystemAdmin()) return null;
    return (
      (user?.projectMemberships || []).find(
        (membership) => Number(membership.projectId) === Number(projectId),
      ) || null
    );
  };

  const hasProjectRole = (projectId, roles = []) => {
    const membership = getProjectMembership(projectId);
    return (
      !!membership &&
      roles
        .map((r) => r.toUpperCase())
        .includes(String(membership.role).toUpperCase())
    );
  };

  const hasResponsibility = (projectId, responsibilities = []) => {
    const membership = getProjectMembership(projectId);
    return (
      !!membership &&
      String(membership.role).toUpperCase() === "MEMBER" &&
      responsibilities
        .map((r) => r.toUpperCase())
        .includes(String(membership.responsibilityRole || "").toUpperCase())
    );
  };

  const hasAnyProjectRole = (roles = []) => {
    const wanted = roles.map((role) => String(role).toUpperCase());
    return (user?.projectMemberships || []).some((membership) =>
      wanted.includes(String(membership?.role || "").toUpperCase()),
    );
  };

  const getProjectRole = (projectId) =>
    getProjectMembership(projectId)?.role || null;

  const getProjectRoleLabel = (projectId) => {
    const role = getProjectRole(projectId);
    if (!role)
      return isSystemAdmin() ? "System Administrator" : "No project role";
    return String(role)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const isProjectAdmin = (projectId) =>
    hasProjectRole(projectId, ["PROJECT_ADMIN"]);
  const isTeamLead = (projectId) => hasProjectRole(projectId, ["TEAM_LEAD"]);
  const isProjectDeveloper = (projectId) =>
    hasProjectRole(projectId, ["DEVELOPER"]);

  // ==========================================================
  // PROJECT-AWARE PERMISSIONS
  // ==========================================================
  const normalizePermission = (permission) => {
    if (!permission) return "";
    const value = String(permission)
      .trim()
      .toUpperCase()
      .replace(/[\s.-]+/g, "_");
    return value;
  };

  // Project-scoped default permissions. These are the UI fallback permissions
  // used when the backend login payload does not include a project-specific
  // permission collection. Keep this matrix aligned with the project RBAC model.
  const ROLE_DEFAULT_PERMISSIONS = {
    PROJECT_ADMIN: [
      "PROJECT_VIEW",
      "PROJECT_SETTINGS_MANAGE",
      "PROJECT_UPDATE",
      "PROJECT_MEMBER_MANAGE",
      "PROJECT_ROLE_MANAGE",
      "PROJECT_WORKFLOW_MANAGE",
      "PROJECT_BOARD_MANAGE",
      "PROJECT_REPORT_VIEW",
      "PROJECT_AUDIT_VIEW",
      "TICKET_CREATE",
      "TICKET_VIEW",
      "TICKET_EDIT",
      "TICKET_ASSIGN",
      "TICKET_STATUS_CHANGE",
      "TICKET_DELETE",
      "BACKLOG_MANAGE",
      "SPRINT_MANAGE",
      "SPRINT_ANALYTICS_VIEW",
      "COMMENT_CREATE",
      "ATTACHMENT_UPLOAD",
      "WORKLOG_CREATE",
      "PROJECT_TEAM_VIEW",
      "TICKET_TYPE_MANAGE",
      "TICKET_STATUS_MANAGE",
      "TICKET_PRIORITY_MANAGE",
      "NOTIFICATION_MANAGE",
      "AUTOMATION_MANAGE",
      "DAILY_SCRUM_VIEW",
      "DAILY_SCRUM_UPDATE",
      "NOTIFICATION_VIEW",
    ],
    TEAM_LEAD: [
      "PROJECT_VIEW",
      "TICKET_CREATE",
      "TICKET_VIEW",
      "TICKET_EDIT",
      "TICKET_ASSIGN",
      "TICKET_STATUS_CHANGE",
      "BACKLOG_MANAGE",
      "SPRINT_MANAGE",
      "SPRINT_ANALYTICS_VIEW",
      "COMMENT_CREATE",
      "ATTACHMENT_UPLOAD",
      "WORKLOG_CREATE",
      "PROJECT_REPORT_VIEW",
      "PROJECT_TEAM_VIEW",
      "DAILY_SCRUM_VIEW",
      "DAILY_SCRUM_UPDATE",
      "NOTIFICATION_VIEW",
    ],
    DEVELOPER: [
      "PROJECT_VIEW",
      "TICKET_CREATE",
      "TICKET_VIEW",
      "TICKET_EDIT",
      "TICKET_STATUS_CHANGE",
      "COMMENT_CREATE",
      "ATTACHMENT_UPLOAD",
      "WORKLOG_CREATE",
      "DAILY_SCRUM_VIEW",
      "DAILY_SCRUM_UPDATE",
      "NOTIFICATION_VIEW",
    ],
    VIEWER: ["PROJECT_VIEW", "TICKET_VIEW", "PROJECT_REPORT_VIEW"],
  };

  const getProjectPermissions = (projectId) => {
    if (isSystemAdmin()) {
      return [
        "SYSTEM_MANAGE",
        "USER_MANAGE",
        "ROLE_MANAGE",
        "PERMISSION_MANAGE",
        "PROJECT_CREATE",
        "PROJECT_VIEW",
        "SECURITY_MANAGE",
      ];
    }

    const membership = getProjectMembership(projectId);
    const role = normalizePermission(membership?.role);

    // Prefer project-scoped permissions when the backend supplies them.
    if (
      Array.isArray(membership?.permissions) &&
      membership.permissions.length
    ) {
      return membership.permissions;
    }

    // Project permissions must never fall back to the user's global
    // permission collection. That would leak access from one project into
    // another when the same user has different project roles.
    return ROLE_DEFAULT_PERMISSIONS[role] || [];
  };

  const hasActionPermission = (projectId, permission) => {
    if (!permission) return true;
    const required = normalizePermission(permission);
    const permissions = getProjectPermissions(projectId);

    return permissions.some((value) => {
      const granted = normalizePermission(value);
      return (
        granted === required ||
        granted === "*" ||
        granted === "ALL" ||
        (granted.endsWith("_*") && required.startsWith(granted.slice(0, -1)))
      );
    });
  };

  const getPrimaryProjectId = () => {
    const stored = sessionStorage.getItem("planora.activeProjectId");
    if (stored && getProjectMembership(stored)) return Number(stored);
    const first = user?.projectMemberships?.find((m) =>
      ["PROJECT_ADMIN", "TEAM_LEAD", "DEVELOPER", "VIEWER", "MEMBER"].includes(
        normalizePermission(m?.role),
      ),
    );
    return first?.projectId ?? null;
  };

  const setActiveProjectId = (projectId) => {
    if (projectId == null || !getProjectMembership(projectId)) {
      sessionStorage.removeItem("planora.activeProjectId");
      return null;
    }
    sessionStorage.setItem("planora.activeProjectId", String(projectId));
    return Number(projectId);
  };

  const hasPermission = (permission) => {
    if (!permission) return true;
    if (isSystemAdmin()) return true;

    const required = String(permission).trim().toLowerCase();
    if (!required) return true;

    const permissions = Array.isArray(user?.permissions)
      ? user.permissions
      : [];

    return permissions.some((value) => {
      const granted = String(value || "")
        .trim()
        .toLowerCase();
      return (
        granted === required ||
        granted === "*" ||
        granted === "all" ||
        (granted.endsWith(".*") && required.startsWith(granted.slice(0, -1)))
      );
    });
  };

  // ==========================================================
  // SESSION EXPIRY (SPA-SAFE)
  // ==========================================================

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthStorage();
      setUser(null);
      navigate("/login", { replace: true });
    };

    window.addEventListener("planora:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener(
        "planora:session-expired",
        handleSessionExpired,
      );
  }, [navigate]);

  // ==========================================================
  // FCM PUSH REGISTRATION
  // ==========================================================

  useEffect(() => {
    if (!user) return undefined;

    let cleanup;

    initializeFcm().then((dispose) => {
      cleanup = dispose;
    });

    return () => {
      cleanup?.();
    };
  }, [user]);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = async () => {
    try {
      await unregisterFcmToken();
      await logoutApi();
    } catch {
      // Still clear local session.
    }

    clearAuthStorage();

    setUser(null);

    navigate("/login", {
      replace: true,
    });
  };

  // ==========================================================
  // CONTEXT
  // ==========================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        completeLogin,
        hasPermission,
        hasActionPermission,
        getProjectPermissions,
        getPrimaryProjectId,
        setActiveProjectId,
        isSystemAdmin,
        getProjectMembership,
        hasProjectRole,
        hasAnyProjectRole,
        getProjectRole,
        getProjectRoleLabel,
        isProjectAdmin,
        isTeamLead,
        isProjectDeveloper,
        hasResponsibility,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// USE AUTH
// ============================================================

export const useAuth = () => {
  return useContext(AuthContext);
};

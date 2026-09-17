import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProjectAdminLayout from "./ProjectAdminLayout";
import SystemAdminLayout from "./SystemAdminLayout";

/**
 * Canonical role workspaces:
 * ADMIN         -> /systemadmin
 * PROJECT_ADMIN -> /projectadmin
 * TEAM_LEAD     -> /teamlead
 */
export default function RoleManagementLayout() {
  const { user, loading, isSystemAdmin, hasAnyProjectRole } = useAuth();
  const { pathname } = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const isSystemPath =
    pathname === "/systemadmin" || pathname.startsWith("/systemadmin/");
  const isProjectAdminPath =
    pathname === "/projectadmin" || pathname.startsWith("/projectadmin/");
  const isTeamLeadPath =
    pathname === "/teamlead" || pathname.startsWith("/teamlead/");

  if (isSystemPath) {
    return isSystemAdmin() ? (
      <SystemAdminLayout />
    ) : (
      <Navigate to="/login" replace />
    );
  }

  if (isProjectAdminPath) {
    return hasAnyProjectRole(["PROJECT_ADMIN"]) ? (
      <ProjectAdminLayout />
    ) : (
      <Navigate to="/login" replace />
    );
  }

  if (isTeamLeadPath) {
    return hasAnyProjectRole(["TEAM_LEAD"]) ? (
      <ProjectAdminLayout />
    ) : (
      <Navigate to="/login" replace />
    );
  }

  return <Navigate to="/login" replace />;
}

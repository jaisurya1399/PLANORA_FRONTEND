import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DeveloperLayout from "./DeveloperLayout";
import ProjectAdminLayout from "./ProjectAdminLayout";
import ViewerLayout from "./ViewerLayout";

export default function MemberRoleLayout() {
  const { getPrimaryProjectId, getProjectRole } = useAuth();
  const projectId = getPrimaryProjectId();
  const role = String(getProjectRole(projectId) || "").toUpperCase();

  if (role === "PROJECT_ADMIN" || role === "TEAM_LEAD") {
    return <ProjectAdminLayout />;
  }
  if (role === "DEVELOPER") {
    return <DeveloperLayout />;
  }
  if (role === "VIEWER") {
    return <ViewerLayout />;
  }

  return <Navigate to="/member" replace />;
}

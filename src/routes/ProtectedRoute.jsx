import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  allowedRoles,
  allowedPermissions,
  allowedProjectRoles,
}) {
  const {
    user,
    loading,
    hasPermission,
    hasActionPermission,
    getProjectMembership,
    getPrimaryProjectId,
    isSystemAdmin,
  } = useAuth();
  const location = useLocation();
  const params = useParams();

  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const activeProjectId =
    params.id ||
    params.projectId ||
    sessionStorage.getItem("planora.activeProjectId") ||
    getPrimaryProjectId();

  const activeMembership = activeProjectId
    ? getProjectMembership(activeProjectId)
    : null;
  const activeProjectRole = String(activeMembership?.role || "").toUpperCase();
  const globalRole = String(user?.role || "").toUpperCase();

  // Explicit project-role guard. This is always evaluated against the
  // currently selected project, never against any project membership.
  if (allowedProjectRoles?.length) {
    const allowed = allowedProjectRoles.map((r) => String(r).toUpperCase());
    if (!isSystemAdmin() && !allowed.includes(activeProjectRole)) {
      return <Navigate to="/member" replace state={{ from: location }} />;
    }
  }

  let roleAllowed = true;
  if (allowedRoles?.length) {
    const allowed = allowedRoles.map((r) => String(r).toUpperCase());
    roleAllowed = allowed.some((requiredRole) => {
      if (requiredRole === "ADMIN") return globalRole === "ADMIN";
      if (requiredRole === "MEMBER") return globalRole === "MEMBER";
      // Backward compatibility: legacy role-specific route guards now map
      // to the selected project's project role.
      return requiredRole === activeProjectRole;
    });
  }

  const hasRequiredPermission =
    !allowedPermissions?.length ||
    allowedPermissions.some((permission) =>
      activeProjectId
        ? hasActionPermission(activeProjectId, permission)
        : hasPermission(permission),
    );

  if (!roleAllowed || !hasRequiredPermission) {
    return (
      <Box
        sx={{ minHeight: "60vh", display: "grid", placeItems: "center", p: 3 }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 520,
            width: "100%",
            p: 4,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <Stack spacing={1.5} alignItems="flex-start">
            <Typography variant="h5" fontWeight={800}>
              Access denied
            </Typography>
            <Typography color="text.secondary">
              You do not have permission to access this page in the current
              project.
            </Typography>
            <Button variant="contained" onClick={() => window.history.back()}>
              Go back
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return <Outlet />;
}

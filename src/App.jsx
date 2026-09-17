import { Box, CircularProgress } from "@mui/material";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import DeveloperLayout from "./layouts/DeveloperLayout";
import ProjectAdminLayout from "./layouts/ProjectAdminLayout";
import SystemAdminLayout from "./layouts/SystemAdminLayout";
import ViewerLayout from "./layouts/ViewerLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

// ============================================================
// AUTH
// ============================================================
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const MfaVerify = lazy(() => import("./pages/auth/MfaVerify"));

// ============================================================
// ADMIN - MANAGEMENT
// ============================================================
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const DashboardAnalytics = lazy(
  () => import("./pages/admin/DashboardAnalytics"),
);
const EnterpriseReports = lazy(() => import("./pages/admin/EnterpriseReports"));
const EnterpriseManagement = lazy(
  () => import("./pages/admin/EnterpriseManagement"),
);
const Projects = lazy(() => import("./pages/admin/Projects"));
const ProjectCreate = lazy(() => import("./pages/projects/ProjectCreate"));
const ProjectDetails = lazy(() => import("./pages/projects/ProjectDetails"));
const ProjectEdit = lazy(() => import("./pages/projects/ProjectEdit"));
const ProjectSettings = lazy(() => import("./pages/projects/ProjectSettings"));
const ProjectAudit = lazy(() => import("./pages/projects/ProjectAudit"));
const Epics = lazy(() => import("./pages/admin/Epics"));
const Tickets = lazy(() => import("./pages/admin/Tickets"));
const Backlog = lazy(() => import("./pages/admin/Backlog"));
const Board = lazy(() => import("./pages/admin/Board"));
const Roadmap = lazy(() => import("./pages/admin/Roadmap"));
const Milestones = lazy(() => import("./pages/admin/Milestones"));
const Releases = lazy(() => import("./pages/admin/Releases"));
const DailyScrum = lazy(() => import("./pages/admin/DailyScrum"));
const MemberAvailability = lazy(
  () => import("./pages/workspace/MemberAvailability"),
);
const ScrumDashboard = lazy(() => import("./pages/admin/ScrumDashboard"));
const TicketDetails = lazy(() => import("./pages/workspace/TicketDetails"));

// ============================================================
// ADMIN - REFERENTIAL
// ============================================================
const Activities = lazy(() => import("./pages/admin/Activities"));
const ProjectStatus = lazy(() => import("./pages/admin/ProjectStatus"));
const TicketStatus = lazy(() => import("./pages/admin/TicketStatus"));
const TicketTypes = lazy(() => import("./pages/admin/TicketTypes"));
const CustomFields = lazy(() => import("./pages/admin/CustomFields"));
const FieldConfigurations = lazy(
  () => import("./pages/admin/FieldConfigurations"),
);
const ScreenConfigurations = lazy(
  () => import("./pages/admin/ScreenConfigurations"),
);
const WorkflowConfiguration = lazy(
  () => import("./pages/admin/WorkflowConfiguration"),
);
const TicketTemplates = lazy(() => import("./pages/admin/TicketTemplates"));
const ProjectTeams = lazy(() => import("./pages/admin/ProjectTeams"));
const ProjectSecuritySchemes = lazy(
  () => import("./pages/admin/ProjectSecuritySchemes"),
);
const TicketPriorities = lazy(() => import("./pages/admin/TicketPriorities"));

// ============================================================
// ADMIN - GENERAL
// ============================================================
const Users = lazy(() => import("./pages/admin/Users"));
const Permissions = lazy(() => import("./pages/admin/Permissions"));
const Roles = lazy(() => import("./pages/admin/Roles"));
const SecuritySettings = lazy(() => import("./pages/admin/SecuritySettings"));
const AiPmAssistant = lazy(() => import("./pages/workspace/AiPmAssistant"));
const Reminders = lazy(() => import("./pages/workspace/Reminders"));

// ============================================================
// ADMIN - TIMESHEET
// ============================================================
const TimesheetDashboard = lazy(
  () => import("./pages/admin/TimesheetDashboard"),
);
const TimesheetExport = lazy(() => import("./pages/admin/TimesheetExport"));
const Timesheet = lazy(() => import("./pages/admin/Timesheet"));
const TimeTrackingReports = lazy(
  () => import("./pages/admin/TimeTrackingReports"),
);

// ============================================================
// NOTIFICATIONS
// ============================================================
const Notifications = lazy(() => import("./pages/notifications/Notifications"));
const CommunicationHub = lazy(() => import("./pages/chat/CommunicationHub"));

// ============================================================
// TEAM MEMBER / DEVELOPER
// ============================================================
const DeveloperDashboard = lazy(() => import("./pages/workspace/Dashboard"));
const MyProjects = lazy(() => import("./pages/workspace/MyProjects"));
const DeveloperMyTasks = lazy(() => import("./pages/workspace/MyTasks"));
const DeveloperBoard = lazy(() => import("./pages/workspace/DeveloperBoard"));
const DeveloperDailyScrum = lazy(
  () => import("./pages/workspace/DeveloperDailyScrum"),
);
const DeveloperTimesheet = lazy(
  () => import("./pages/workspace/DeveloperTimesheet"),
);
const DeveloperProfile = lazy(
  () => import("./pages/workspace/DeveloperProfile"),
);

// ============================================================
// ROUTE-LEVEL LOADING FALLBACK
// ============================================================
// Each page above is code-split into its own chunk (React.lazy), so the
// browser only downloads the ~50-90KB a route actually needs instead of a
// single 1.2MB+ bundle covering every admin/developer screen up front.
// This fallback is what's visible for the brief moment a chunk is fetched.
function RouteFallback() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        width: "100%",
      }}
    >
      <CircularProgress size={28} thickness={4} />
    </Box>
  );
}

function MemberLanding() {
  const { getPrimaryProjectId, getProjectRole } = useAuth();
  const projectId = getPrimaryProjectId();
  const role = String(getProjectRole(projectId) || "").toUpperCase();

  if (role === "PROJECT_ADMIN")
    return <Navigate to="/member/projectadmin" replace />;
  if (role === "TEAM_LEAD") return <Navigate to="/member/teamlead" replace />;
  if (role === "DEVELOPER") return <Navigate to="/member/developer" replace />;
  if (role === "VIEWER") return <Navigate to="/member/viewer" replace />;

  return <Navigate to="/login" replace />;
}

function RoleLanding() {
  const { isSystemAdmin, user } = useAuth();

  if (isSystemAdmin()) {
    return <Navigate to="/systemadmin" replace />;
  }

  if (String(user?.role || "").toUpperCase() === "MEMBER") {
    return <Navigate to="/member" replace />;
  }

  return <Navigate to="/login" replace />;
}

function LegacyAdminRedirect() {
  const { isSystemAdmin } = useAuth();
  const rawPath = window.location.pathname.replace(/^\/admin(?=\/|$)/, "");
  const suffix = rawPath && rawPath !== "/" ? rawPath : "";

  if (isSystemAdmin()) {
    return <Navigate to={`/systemadmin${suffix}`} replace />;
  }

  return <Navigate to="/member" replace />;
}

function LegacyRoleRedirect() {
  const { isSystemAdmin, getPrimaryProjectId, getProjectRole } = useAuth();

  if (isSystemAdmin()) {
    return <Navigate to="/systemadmin" replace />;
  }

  const raw = window.location.pathname;
  const match = raw.match(
    /^\/(projectadmin|teamlead|developer|viewer)(?:\/(.*))?$/,
  );
  const rolePath = match?.[1];
  const suffix = match?.[2] ? `/${match[2]}` : "";

  const role = String(
    getProjectRole(getPrimaryProjectId()) || "",
  ).toUpperCase();

  const expectedRole = {
    projectadmin: "PROJECT_ADMIN",
    teamlead: "TEAM_LEAD",
    developer: "DEVELOPER",
    viewer: "VIEWER",
  }[rolePath];

  if (!expectedRole || role !== expectedRole) {
    return <Navigate to="/member" replace />;
  }

  return <Navigate to={`/member/${rolePath}${suffix}`} replace />;
}

/** Project operational routes shared by Project Admin and Team Lead. */
function ProjectManagementRoutes({ scope = "project" }) {
  const isProjectAdmin = scope === "project";
  const canConfigure = isProjectAdmin;
  const workspaceRoles = isProjectAdmin ? ["PROJECT_ADMIN"] : ["TEAM_LEAD"];

  return (
    <>
      <Route
        path="dashboard-analytics"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<DashboardAnalytics />} />
      </Route>
      <Route
        path="projects"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<MyProjects />} />
      </Route>
      <Route
        path="projects/:id"
        element={
          <ProtectedRoute
            allowedProjectRoles={[
              "PROJECT_ADMIN",
              "TEAM_LEAD",
              "DEVELOPER",
              "VIEWER",
            ]}
          />
        }
      >
        <Route index element={<ProjectDetails />} />
      </Route>
      {canConfigure && (
        <>
          <Route
            path="projects/:id/edit"
            element={<ProtectedRoute allowedProjectRoles={["PROJECT_ADMIN"]} />}
          >
            <Route index element={<ProjectEdit />} />
          </Route>
          <Route
            path="projects/:id/settings"
            element={<ProtectedRoute allowedProjectRoles={["PROJECT_ADMIN"]} />}
          >
            <Route index element={<ProjectSettings />} />
          </Route>
          <Route
            path="projects/:id/audit"
            element={<ProtectedRoute allowedProjectRoles={["PROJECT_ADMIN"]} />}
          >
            <Route index element={<ProjectAudit />} />
          </Route>
        </>
      )}

      <Route
        path="epics"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<Epics />} />
      </Route>
      <Route
        path="tickets"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<Tickets />} />
      </Route>
      <Route
        path="tickets/:id"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<TicketDetails />} />
      </Route>
      <Route
        path="backlog"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<Backlog />} />
      </Route>
      <Route
        path="board"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<Board />} />
      </Route>
      <Route
        path="roadmap"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<Roadmap />} />
      </Route>
      <Route
        path="milestones"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<Milestones />} />
      </Route>
      <Route
        path="releases"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<Releases />} />
      </Route>
      <Route
        path="daily-scrum"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<DailyScrum />} />
      </Route>
      <Route
        path="member-availability"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<MemberAvailability />} />
      </Route>
      <Route
        path="scrum-dashboard"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<ScrumDashboard />} />
      </Route>
      <Route
        path="communication"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<CommunicationHub />} />
      </Route>
      <Route
        path="reminders"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<Reminders />} />
      </Route>
      <Route
        path="ai-pm"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<AiPmAssistant />} />
      </Route>
      <Route
        path="time-tracking"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<TimeTrackingReports />} />
      </Route>
      <Route
        path="timesheet"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<Timesheet />} />
      </Route>
      <Route
        path="notifications"
        element={<ProtectedRoute allowedProjectRoles={workspaceRoles} />}
      >
        <Route index element={<Notifications />} />
      </Route>
    </>
  );
}

function SystemAdminRouteChildren() {
  return (
    <>
      <Route index element={<Dashboard />} />
      <Route
        path="projects"
        element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
      >
        <Route index element={<Projects />} />
      </Route>
      <Route
        path="projects/create"
        element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
      >
        <Route index element={<ProjectCreate />} />
      </Route>
      <Route
        path="projects/:id"
        element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
      >
        <Route index element={<ProjectDetails />} />
      </Route>
      <Route
        path="projects/:id/edit"
        element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
      >
        <Route index element={<ProjectEdit />} />
      </Route>

      <Route
        path="enterprise-reports"
        element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
      >
        <Route index element={<EnterpriseReports />} />
      </Route>
      <Route
        path="enterprise-management"
        element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
      >
        <Route index element={<EnterpriseManagement />} />
      </Route>

      {/* Activity master is system metadata, not project/ticket audit. */}
      <Route
        path="activities"
        element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
      >
        <Route index element={<Activities />} />
      </Route>

      <Route path="users" element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route index element={<Users />} />
      </Route>
      <Route path="roles" element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route index element={<Roles />} />
      </Route>
      <Route
        path="permissions"
        element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
      >
        <Route index element={<Permissions />} />
      </Route>
      <Route
        path="security"
        element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
      >
        <Route index element={<SecuritySettings />} />
      </Route>
    </>
  );
}

function ProjectAdminRouteChildren() {
  return (
    <>
      <Route index element={<Dashboard />} />
      {ProjectManagementRoutes({ scope: "project" })}
      <Route path="project-status" element={<ProtectedRoute />}>
        <Route index element={<ProjectStatus />} />
      </Route>
      <Route path="ticket-status" element={<ProtectedRoute />}>
        <Route index element={<TicketStatus />} />
      </Route>
      <Route path="ticket-types" element={<ProtectedRoute />}>
        <Route index element={<TicketTypes />} />
      </Route>
      <Route path="custom-fields" element={<ProtectedRoute />}>
        <Route index element={<CustomFields />} />
      </Route>
      <Route path="field-configurations" element={<ProtectedRoute />}>
        <Route index element={<FieldConfigurations />} />
      </Route>
      <Route path="screen-configurations" element={<ProtectedRoute />}>
        <Route index element={<ScreenConfigurations />} />
      </Route>
      <Route path="workflow" element={<ProtectedRoute />}>
        <Route index element={<WorkflowConfiguration />} />
      </Route>
      <Route path="ticket-templates" element={<ProtectedRoute />}>
        <Route index element={<TicketTemplates />} />
      </Route>
      <Route path="project-teams" element={<ProtectedRoute />}>
        <Route index element={<ProjectTeams />} />
      </Route>
      <Route path="project-security" element={<ProtectedRoute />}>
        <Route index element={<ProjectSecuritySchemes />} />
      </Route>
      <Route path="ticket-priorities" element={<ProtectedRoute />}>
        <Route index element={<TicketPriorities />} />
      </Route>
      <Route path="activities" element={<ProtectedRoute />}>
        <Route index element={<ProjectAudit />} />
      </Route>
    </>
  );
}

function TeamLeadRouteChildren() {
  return (
    <>
      <Route index element={<Dashboard />} />
      {ProjectManagementRoutes({ scope: "teamlead" })}
    </>
  );
}

function DeveloperRouteChildren() {
  return (
    <>
      <Route index element={<DeveloperDashboard />} />
      <Route
        path="projects"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<MyProjects />} />
      </Route>
      <Route
        path="projects/:id"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<ProjectDetails />} />
      </Route>
      <Route
        path="tasks"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<DeveloperMyTasks />} />
      </Route>
      <Route
        path="board"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<DeveloperBoard />} />
      </Route>
      <Route
        path="daily-scrum"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<DeveloperDailyScrum />} />
      </Route>
      <Route
        path="notifications"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<Notifications />} />
      </Route>
      <Route
        path="availability"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<MemberAvailability />} />
      </Route>
      <Route
        path="timesheet"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<DeveloperTimesheet />} />
      </Route>
      <Route path="profile" element={<DeveloperProfile />} />
      <Route
        path="communication"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<CommunicationHub />} />
      </Route>
      <Route
        path="ai-pm"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<AiPmAssistant />} />
      </Route>
      <Route
        path="reminders"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<Reminders />} />
      </Route>
    </>
  );
}

function ViewerRouteChildren() {
  return (
    <>
      <Route index element={<DeveloperDashboard />} />
      <Route
        path="projects"
        element={<ProtectedRoute allowedProjectRoles={["VIEWER"]} />}
      >
        <Route index element={<MyProjects />} />
      </Route>
      <Route
        path="projects/:id"
        element={<ProtectedRoute allowedProjectRoles={["VIEWER"]} />}
      >
        <Route index element={<ProjectDetails />} />
      </Route>
      <Route
        path="tickets/:id"
        element={<ProtectedRoute allowedProjectRoles={["VIEWER"]} />}
      >
        <Route index element={<TicketDetails />} />
      </Route>
      <Route path="reports" element={<ProtectedRoute />}>
        <Route index element={<DashboardAnalytics />} />
      </Route>
      <Route
        path="communication"
        element={<ProtectedRoute allowedProjectRoles={["DEVELOPER"]} />}
      >
        <Route index element={<CommunicationHub />} />
      </Route>
      <Route path="profile" element={<DeveloperProfile />} />
    </>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/mfa-verify" element={<MfaVerify />} />

        <Route element={<ProtectedRoute />}>
          <Route index element={<RoleLanding />} />

          {/* System role: ADMIN only. */}
          <Route
            path="/systemadmin/*"
            element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
          >
            <Route element={<SystemAdminLayout />}>
              {SystemAdminRouteChildren()}
            </Route>
          </Route>

          {/* Project role workspace: global role must be MEMBER. */}
          <Route
            path="/member/*"
            element={<ProtectedRoute allowedRoles={["MEMBER"]} />}
          >
            <Route index element={<MemberLanding />} />

            <Route
              path="projectadmin/*"
              element={
                <ProtectedRoute
                  allowedRoles={["MEMBER"]}
                  allowedProjectRoles={["PROJECT_ADMIN"]}
                />
              }
            >
              <Route element={<ProjectAdminLayout />}>
                {ProjectAdminRouteChildren()}
              </Route>
            </Route>

            <Route
              path="teamlead/*"
              element={
                <ProtectedRoute
                  allowedRoles={["MEMBER"]}
                  allowedProjectRoles={["TEAM_LEAD"]}
                />
              }
            >
              <Route element={<ProjectAdminLayout />}>
                {TeamLeadRouteChildren()}
              </Route>
            </Route>

            {/* Ticket details opened from My Tasks can belong to any project
                visible to the developer. Do not guard this route by the
                currently selected project's role, otherwise React Router
                redirects to /member before TicketDetails can load the ticket. */}
            <Route
              path="developer/tickets/:id"
              element={<ProtectedRoute allowedRoles={["MEMBER"]} />}
            >
              <Route element={<DeveloperLayout />}>
                <Route index element={<TicketDetails />} />
              </Route>
            </Route>

            <Route
              path="developer/*"
              element={
                <ProtectedRoute
                  allowedRoles={["MEMBER"]}
                  allowedProjectRoles={["DEVELOPER"]}
                />
              }
            >
              <Route element={<DeveloperLayout />}>
                {DeveloperRouteChildren()}
              </Route>
            </Route>

            <Route
              path="viewer/*"
              element={
                <ProtectedRoute
                  allowedRoles={["MEMBER"]}
                  allowedProjectRoles={["VIEWER"]}
                />
              }
            >
              <Route element={<ViewerLayout />}>{ViewerRouteChildren()}</Route>
            </Route>
          </Route>

          {/* Compatibility redirects for old role URLs. */}
          <Route path="/admin/*" element={<LegacyAdminRedirect />} />
          <Route path="/projectadmin/*" element={<LegacyRoleRedirect />} />
          <Route path="/teamlead/*" element={<LegacyRoleRedirect />} />
          <Route path="/developer/*" element={<LegacyRoleRedirect />} />
          <Route path="/viewer/*" element={<LegacyRoleRedirect />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

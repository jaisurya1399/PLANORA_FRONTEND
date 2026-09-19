import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProjectDashboardAnalytics } from "../../api/dashboardAnalyticsApi";
import { getPermissions } from "../../api/permissionApi";
import { getActiveProjects, getProjects } from "../../api/projectApi";
import { getRoles } from "../../api/roleApi";
import { getActiveTickets, getTickets } from "../../api/ticketApi";
import { getUsers } from "../../api/userApi";
import { PageLoadingSkeleton } from "../../components/common/LoadingSkeleton";
import MetricCard from "../../components/common/MetricCard";
import ProgressRing from "../../components/common/ProgressRing";
import { useAuth } from "../../context/AuthContext";

function Panel({ title, subtitle, action, children, sx }) {
  return (
    <Card sx={{ height: "100%", ...sx }}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.35 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function ProjectRoleDashboard() {
  const { getPrimaryProjectId, getProjectMembership } = useAuth();
  const projectId = getPrimaryProjectId();
  const membership = projectId ? getProjectMembership(projectId) : null;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    getProjectDashboardAnalytics(projectId, 30)
      .then(setData)
      .catch((err) =>
        setError(
          err?.response?.data?.message || "Unable to load project dashboard.",
        ),
      )
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <PageLoadingSkeleton />;
  if (!projectId)
    return <Alert severity="warning">Select a project to continue.</Alert>;

  const tickets = Array.isArray(data?.sprintReport) ? data.sprintReport : [];
  const statusDistribution = Array.isArray(data?.statusDistribution)
    ? data.statusDistribution
    : [];
  const totalIssues = statusDistribution.reduce(
    (sum, item) => sum + Number(item?.count || item?.issues || 0),
    0,
  );
  const currentRole = String(membership?.role || "").replace(/_/g, " ");

  return (
    <Box className="app-page pm-fade-up">
      <Box className="page-header">
        <Box>
          <Typography variant="h1" className="pm-gradient-title">
            Project Dashboard
          </Typography>
          <Typography className="page-subtitle">
            {membership?.projectName ||
              data?.project?.name ||
              "Current project"}{" "}
            · {currentRole || "Project member"}
          </Typography>
        </Box>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={2} className="pm-stagger">
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Project tickets"
            value={totalIssues}
            icon={<ConfirmationNumberRoundedIcon />}
            tone="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Sprints"
            value={tickets.length}
            icon={<FolderRoundedIcon />}
            tone="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Completed sprint work"
            value={tickets.reduce(
              (sum, x) => sum + Number(x?.completed || 0),
              0,
            )}
            icon={<CheckCircleRoundedIcon />}
            tone="neutral"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Active role"
            value={currentRole || "—"}
            icon={<ShieldRoundedIcon />}
            tone="warning"
          />
        </Grid>
      </Grid>
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
            Project analytics
          </Typography>
          <Typography color="text.secondary">
            Use the project navigation to work with Board, Backlog, Sprints,
            Reports and team features allowed for your role.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

function SystemAdminDashboard() {
  const [data, setData] = useState({
    users: 0,
    projects: 0,
    activeProjects: 0,
    tickets: 0,
    activeTickets: 0,
    roles: 0,
    permissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  // Falls back to "/systemadmin" (the actually-registered route prefix),
  // not the legacy "/admin" path — that one only exists as a
  // LegacyAdminRedirect catch-all in App.jsx and forced an extra
  // remount-causing redirect hop on every navigate() call here.
  const workspaceBase = location.pathname.startsWith("/member/projectadmin")
    ? "/member/projectadmin"
    : location.pathname.startsWith("/member/teamlead")
      ? "/member/teamlead"
      : location.pathname.startsWith("/member/viewer")
        ? "/member/viewer"
        : "/systemadmin";

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [
          users,
          projects,
          activeProjects,
          tickets,
          activeTickets,
          roles,
          permissions,
        ] = await Promise.all([
          getUsers(),
          getProjects(),
          getActiveProjects(),
          getTickets(),
          getActiveTickets(),
          getRoles(),
          getPermissions(),
        ]);
        setData({
          users: users.length,
          projects: projects.length,
          activeProjects: activeProjects.length,
          tickets: tickets.length,
          activeTickets: activeTickets.length,
          roles: roles.length,
          permissions: permissions.length,
        });
      } catch (err) {
        setError(
          err.response?.status === 403
            ? "You do not have permission to view the admin dashboard."
            : "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const activeRate = useMemo(
    () =>
      data.tickets ? Math.round((data.activeTickets / data.tickets) * 100) : 0,
    [data],
  );
  const projectRate = useMemo(
    () =>
      data.projects
        ? Math.round((data.activeProjects / data.projects) * 100)
        : 0,
    [data],
  );

  if (loading) return <PageLoadingSkeleton />;

  return (
    <Box className="app-page pm-fade-up">
      <Box
        className="page-header"
        sx={{ alignItems: { xs: "stretch", sm: "center" } }}
      >
        <Box>
          {/* <span className="pm-eyebrow">Admin overview</span> */}
          <Typography
            variant="h1"
            className="pm-gradient-title"
            sx={{ display: "inline-block", mt: 0.5 }}
          >
            {getGreeting()}
          </Typography>
          <Typography className="page-subtitle">
            A decision-first view of projects, tickets and platform activity.
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ flexShrink: 0 }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate(`${workspaceBase}/projects`)}
          >
            View projects
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate(`${workspaceBase}/projects/create`)}
          >
            Create project
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} className="pm-stagger" mb={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Active projects"
            value={data.activeProjects}
            hint={`${projectRate}% of all projects`}
            icon={<FolderRoundedIcon />}
            path={`${workspaceBase}/projects`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Open tickets"
            value={data.activeTickets}
            hint={`${activeRate}% of all tickets`}
            icon={<ConfirmationNumberRoundedIcon />}
            tone="primary"
            path={`${workspaceBase}/tickets`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="People"
            value={data.users}
            hint="Registered users"
            icon={<PeopleRoundedIcon />}
            tone="success"
            path={`${workspaceBase}/users`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Roles & permissions"
            value={`${data.roles} / ${data.permissions}`}
            hint="Governance coverage"
            icon={<ShieldRoundedIcon />}
            tone="neutral"
            path={`${workspaceBase}/roles`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.25 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Panel
            title="Platform health"
            subtitle="Current workload mix and operational capacity"
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={3}
              alignItems="center"
              sx={{ mb: 2.5 }}
            >
              <ProgressRing
                value={projectRate}
                color="var(--pm-primary)"
                label="Projects active"
              />
              <ProgressRing
                value={activeRate}
                color="#3ED9B0"
                label="Tickets active"
              />
              <Box
                sx={{
                  flex: 1,
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 1.5,
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "var(--pm-primary-soft)",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    All projects
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {data.projects}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "var(--pm-primary-soft)",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    All tickets
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {data.tickets}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "var(--pm-primary-soft)",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Active tickets
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {data.activeTickets}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel title="Needs attention" subtitle="Recommended next actions">
            <Stack spacing={1}>
              <Button
                fullWidth
                onClick={() => navigate(`${workspaceBase}/tickets`)}
                sx={{
                  justifyContent: "flex-start",
                  p: 1.5,
                  bgcolor: "#FEF2F2",
                  color: "#991B1B",
                  "&:hover": { bgcolor: "#FEE2E2" },
                }}
                startIcon={<WarningAmberRoundedIcon />}
                endIcon={<ArrowForwardRoundedIcon />}
              >
                <Box sx={{ flex: 1, textAlign: "left" }}>
                  <Typography fontWeight={750}>Review open tickets</Typography>
                  <Typography variant="caption">
                    {data.activeTickets} active items need triage
                  </Typography>
                </Box>
              </Button>
              <Button
                fullWidth
                onClick={() => navigate(`${workspaceBase}/projects`)}
                sx={{
                  justifyContent: "flex-start",
                  p: 1.5,
                  bgcolor: "var(--pm-primary-soft)",
                  color: "var(--pm-primary-hover)",
                  "&:hover": { bgcolor: "var(--pm-primary-soft)" },
                }}
                startIcon={<FolderRoundedIcon />}
                endIcon={<ArrowForwardRoundedIcon />}
              >
                <Box sx={{ flex: 1, textAlign: "left" }}>
                  <Typography fontWeight={750}>
                    Review active projects
                  </Typography>
                  <Typography variant="caption">
                    {data.activeProjects} projects are currently active
                  </Typography>
                </Box>
              </Button>
              <Button
                fullWidth
                onClick={() => navigate(`${workspaceBase}/member-availability`)}
                sx={{
                  justifyContent: "flex-start",
                  p: 1.5,
                  bgcolor: "#F0FDF4",
                  color: "#166534",
                  "&:hover": { bgcolor: "#DCFCE7" },
                }}
                startIcon={<AccessTimeRoundedIcon />}
                endIcon={<ArrowForwardRoundedIcon />}
              >
                <Box sx={{ flex: 1, textAlign: "left" }}>
                  <Typography fontWeight={750}>
                    Check team availability
                  </Typography>
                  <Typography variant="caption">
                    Review capacity before assigning new work
                  </Typography>
                </Box>
              </Button>
            </Stack>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Panel
            title="Admin shortcuts"
            subtitle="High-frequency configuration and governance tasks"
          >
            <Grid container spacing={1.5}>
              {[
                ["Users", `${workspaceBase}/users`, PeopleRoundedIcon],
                ["Roles", `${workspaceBase}/roles`, ShieldRoundedIcon],
                [
                  "Notifications",
                  `${workspaceBase}/notifications`,
                  CheckCircleRoundedIcon,
                ],
                [
                  "Timesheet",
                  `${workspaceBase}/timesheet`,
                  AccessTimeRoundedIcon,
                ],
              ].map(([label, path, Icon]) => (
                <Grid size={{ xs: 6, sm: 6, md: 3 }} key={path}>
                  <Box
                    onClick={() => navigate(path)}
                    className="pm-hover-lift"
                    sx={{
                      cursor: "pointer",
                      p: 2,
                      borderRadius: 3,
                      border: "1px solid var(--pm-border)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 1.5,
                      background: "var(--pm-surface)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        background: "var(--pm-primary-soft)",
                        color: "var(--pm-primary)",
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <Typography fontWeight={700} fontSize={14}>
                        {label}
                      </Typography>
                      <ArrowForwardRoundedIcon
                        fontSize="small"
                        sx={{ color: "text.secondary" }}
                      />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Panel>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function Dashboard() {
  const { isSystemAdmin } = useAuth();
  return isSystemAdmin() ? <SystemAdminDashboard /> : <ProjectRoleDashboard />;
}

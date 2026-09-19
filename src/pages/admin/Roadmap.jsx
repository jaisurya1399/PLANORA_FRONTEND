import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FlagIcon from "@mui/icons-material/Flag";
import FolderIcon from "@mui/icons-material/Folder";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import { getEpicsByProject } from "../../api/epicApi";
import { getProjectMilestones } from "../../api/milestoneApi";
import { getProjectUsers } from "../../api/projectUserApi";
import { getTicketsByEpic } from "../../api/ticketApi";

export default function Roadmap() {
  const { user, getPrimaryProjectId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceBase = location.pathname.startsWith("/member/projectadmin")
    ? "/member/projectadmin"
    : location.pathname.startsWith("/member/teamlead")
      ? "/member/teamlead"
      : "/admin";

  // ============================================================
  // DATA
  // ============================================================

  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);

  const [ticketsByEpic, setTicketsByEpic] = useState({});
  const [milestones, setMilestones] = useState([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  // ============================================================
  // SELECTION
  // ============================================================

  const [selectedProjectId, setSelectedProjectId] = useState("");

  // ============================================================
  // LOADING
  // ============================================================

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingEpics, setLoadingEpics] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState({});

  // ============================================================
  // UI
  // ============================================================

  const [expandedEpics, setExpandedEpics] = useState({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      setError("");

      const memberships = Array.isArray(user?.projectMemberships)
        ? user.projectMemberships
        : [];
      const activeId = getPrimaryProjectId();
      const projectList = memberships
        .filter((m) => m?.projectId && Number(m.projectId) === Number(activeId))
        .map((m) => ({
          id: Number(m.projectId),
          name: m.projectName || m.project?.name || `Project #${m.projectId}`,
        }));

      setProjects(projectList);

      if (projectList.length > 0) {
        setSelectedProjectId(String(projectList[0].id));
      }
    } catch (err) {
      console.error("Failed to load projects:", err);

      setError(err.response?.data?.message || "Failed to load projects.");
    } finally {
      setLoadingProjects(false);
    }
  };

  // ============================================================
  // LOAD PROJECT DATA
  // ============================================================

  const loadProjectData = async (projectId) => {
    if (!projectId) {
      setEpics([]);
      setProjectUsers([]);
      setTicketsByEpic({});
      return;
    }

    try {
      setLoadingEpics(true);
      setLoadingUsers(true);
      setError("");

      const [epicsData, usersData] = await Promise.all([
        getEpicsByProject(Number(projectId)),
        getProjectUsers(Number(projectId)),
      ]);

      setEpics(Array.isArray(epicsData) ? epicsData : []);
      setProjectUsers(Array.isArray(usersData) ? usersData : []);

      setTicketsByEpic({});
      setExpandedEpics({});

      loadMilestones(projectId);
    } catch (err) {
      console.error("Failed to load project roadmap:", err);

      setError(
        err.response?.data?.message || "Failed to load project roadmap.",
      );
    } finally {
      setLoadingEpics(false);
      setLoadingUsers(false);
    }
  };

  // ============================================================
  // LOAD MILESTONES (upcoming)
  // ============================================================

  const loadMilestones = async (projectId) => {
    if (!projectId) {
      setMilestones([]);
      return;
    }

    try {
      setLoadingMilestones(true);

      const data = await getProjectMilestones(Number(projectId));
      const list = Array.isArray(data) ? data : [];

      list.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });

      setMilestones(list);
    } catch (err) {
      console.error("Failed to load milestones:", err);
    } finally {
      setLoadingMilestones(false);
    }
  };

  // ============================================================
  // LOAD TICKETS FOR EPIC
  // ============================================================

  const loadTickets = async (epicId) => {
    if (!epicId) {
      return;
    }

    try {
      setLoadingTickets((previous) => ({
        ...previous,
        [epicId]: true,
      }));

      const data = await getTicketsByEpic(Number(epicId));

      setTicketsByEpic((previous) => ({
        ...previous,
        [epicId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error("Failed to load tickets:", err);

      setError(err.response?.data?.message || "Failed to load tickets.");
    } finally {
      setLoadingTickets((previous) => ({
        ...previous,
        [epicId]: false,
      }));
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadProjects();
  }, [user, getPrimaryProjectId]);

  // ============================================================
  // PROJECT CHANGE
  // ============================================================

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
    }
  }, [selectedProjectId]);

  // ============================================================
  // EPIC EXPAND
  // ============================================================

  const handleEpicExpand = async (epicId) => {
    const isExpanded = expandedEpics[epicId];

    setExpandedEpics((previous) => ({
      ...previous,
      [epicId]: !isExpanded,
    }));

    // Load tickets only first time
    if (!isExpanded && ticketsByEpic[epicId] === undefined) {
      await loadTickets(epicId);
    }
  };

  // ============================================================
  // SELECTED PROJECT
  // ============================================================

  const selectedProject = useMemo(() => {
    return projects.find(
      (project) => String(project.id) === String(selectedProjectId),
    );
  }, [projects, selectedProjectId]);

  // ============================================================
  // STATUS
  // ============================================================

  const getEpicStatusColor = (status) => {
    const value = String(status || "").toUpperCase();

    if (value === "COMPLETED" || value === "DONE") {
      return "success";
    }

    if (value === "IN_PROGRESS" || value === "IN PROGRESS") {
      return "warning";
    }

    if (value === "CANCELLED" || value === "CANCELED") {
      return "error";
    }

    return "default";
  };

  const getTicketStatusColor = (ticket) => {
    const status = String(
      ticket.statusName || ticket.status || "",
    ).toUpperCase();

    if (status === "DONE" || status === "COMPLETED") {
      return "success";
    }

    if (status === "IN_PROGRESS" || status === "IN PROGRESS") {
      return "warning";
    }

    if (status === "BLOCKED") {
      return "error";
    }

    return "default";
  };

  // ============================================================
  // USER NAME
  // ============================================================

  const getProjectUserName = (user) => {
    return (
      user.userName ||
      user.name ||
      user.userEmail ||
      user.email ||
      `User #${user.userId || user.id}`
    );
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    if (!selectedProjectId) {
      await loadProjects();
      return;
    }

    await loadProjectData(selectedProjectId);

    setSuccess("Roadmap refreshed successfully.");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Box className="app-page pm-fade-up">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Roadmap
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Project → Epic → Ticket
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loadingProjects || loadingEpics || loadingUsers}
        >
          Refresh
        </Button>
      </Box>

      {/* ======================================================
          PROJECT SELECTOR
      ====================================================== */}

      <Card
        sx={{
          mb: 3,
          borderRadius: 2,
        }}
      >
        <CardContent>
          <FormControl fullWidth sx={{ display: "none" }}>
            <InputLabel>Select Project</InputLabel>

            <Select
              value={selectedProjectId}
              label="Select Project"
              onChange={(event) => {
                setSelectedProjectId(event.target.value);
              }}
              disabled={loadingProjects}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* ======================================================
          PROJECT SUMMARY
      ====================================================== */}

      {selectedProject && (
        <Card
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={3}
              alignItems={{
                xs: "flex-start",
                md: "center",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <FolderIcon color="primary" />

                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {selectedProject.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {selectedProject.description || "No project description"}
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ ml: { md: "auto" } }}>
                <Chip
                  label={`${epics.length} Epic${epics.length === 1 ? "" : "s"}`}
                  icon={<AccountTreeIcon />}
                  variant="outlined"
                />
              </Box>

              <Box>
                <Chip
                  label={`${projectUsers.length} User${
                    projectUsers.length === 1 ? "" : "s"
                  }`}
                  variant="outlined"
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ======================================================
          UPCOMING MILESTONES
      ====================================================== */}

      {selectedProject && (
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <FlagIcon color="primary" fontSize="small" />

                <Typography variant="subtitle1" fontWeight={700}>
                  Upcoming Milestones
                </Typography>
              </Stack>

              <Button
                size="small"
                onClick={() => navigate(`${workspaceBase}/milestones`)}
              >
                View All
              </Button>
            </Stack>

            {loadingMilestones ? (
              <Typography variant="body2" color="text.secondary">
                Loading milestones...
              </Typography>
            ) : milestones.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No milestones yet for this project.{" "}
                <Button
                  size="small"
                  onClick={() => navigate(`${workspaceBase}/milestones`)}
                >
                  Create one
                </Button>
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {milestones.slice(0, 4).map((milestone) => {
                  const progress = Math.max(
                    0,
                    Math.min(100, Number(milestone.progressPercent) || 0),
                  );

                  return (
                    <Box
                      key={milestone.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        cursor: "pointer",
                      }}
                      onClick={() => navigate(`${workspaceBase}/milestones`)}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={0.5}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {milestone.name}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            label={milestone.status}
                            variant="outlined"
                          />

                          <Typography variant="caption" color="text.secondary">
                            {milestone.dueDate
                              ? `Due ${milestone.dueDate}`
                              : "No due date"}
                          </Typography>
                        </Stack>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loadingEpics ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 8,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* ==================================================
              EMPTY
          ================================================== */}

          {!selectedProjectId ? (
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  Select a project to view its roadmap.
                </Typography>
              </CardContent>
            </Card>
          ) : epics.length === 0 ? (
            <Card>
              <CardContent>
                <Stack spacing={1} alignItems="center" sx={{ py: 5 }}>
                  <AccountTreeIcon
                    sx={{
                      fontSize: 48,
                      color: "text.secondary",
                    }}
                  />

                  <Typography variant="h6" color="text.secondary">
                    No Epics Found
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    This project does not have any active epics.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            /* ==================================================
               EPICS
            ================================================== */

            <Stack spacing={2}>
              {epics.map((epic) => {
                const tickets = ticketsByEpic[epic.id] || [];

                const expanded = Boolean(expandedEpics[epic.id]);

                const loading = Boolean(loadingTickets[epic.id]);

                return (
                  <Card
                    key={epic.id}
                    sx={{
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    {/* ==================================================
                        EPIC HEADER
                    ================================================== */}

                    <Box
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                      }}
                      onClick={() => handleEpicExpand(epic.id)}
                    >
                      <IconButton
                        size="small"
                        sx={{
                          transform: expanded
                            ? "rotate(0deg)"
                            : "rotate(-90deg)",
                          transition: "transform 0.2s",
                        }}
                        aria-label="Expand"
                      >
                        <ExpandMoreIcon />
                      </IconButton>

                      <AccountTreeIcon color="primary" />

                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700}>{epic.name}</Typography>

                        <Typography variant="body2" color="text.secondary">
                          {epic.description || "No description"}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={epic.status || "PLANNED"}
                          color={getEpicStatusColor(epic.status)}
                        />

                        <Chip
                          size="small"
                          label={`${tickets.length} Ticket${
                            tickets.length === 1 ? "" : "s"
                          }`}
                          variant="outlined"
                        />
                      </Stack>
                    </Box>

                    {/* ==================================================
                        EPIC DETAILS
                    ================================================== */}

                    <Collapse in={expanded}>
                      <Divider />

                      <Box sx={{ p: 2 }}>
                        {/* ==========================================
                            EPIC INFO
                        ========================================== */}

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={3}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Owner
                            </Typography>

                            <Typography fontWeight={600}>
                              {epic.ownerName ||
                                epic.ownerEmail ||
                                "Not assigned"}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Start Date
                            </Typography>

                            <Typography fontWeight={600}>
                              {epic.startDate || "-"}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Target Date
                            </Typography>

                            <Typography fontWeight={600}>
                              {epic.targetDate || "-"}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Project Members
                            </Typography>

                            <Typography fontWeight={600}>
                              {projectUsers.length}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Divider sx={{ mb: 2 }} />

                        {/* ==========================================
                            TICKETS LOADING
                        ========================================== */}

                        {loading ? (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              py: 4,
                            }}
                          >
                            <CircularProgress size={28} />
                          </Box>
                        ) : tickets.length === 0 ? (
                          <Box
                            sx={{
                              textAlign: "center",
                              py: 4,
                            }}
                          >
                            <ConfirmationNumberIcon
                              sx={{
                                fontSize: 40,
                                color: "text.secondary",
                                mb: 1,
                              }}
                            />

                            <Typography color="text.secondary">
                              No tickets in this epic.
                            </Typography>
                          </Box>
                        ) : (
                          /* ==========================================
                             TICKETS
                          ========================================== */

                          <Stack spacing={1.5}>
                            {tickets.map((ticket) => (
                              <Card
                                key={ticket.id}
                                variant="outlined"
                                sx={{
                                  borderRadius: 1.5,
                                }}
                              >
                                <CardContent
                                  sx={{
                                    "&:last-child": {
                                      pb: 2,
                                    },
                                  }}
                                >
                                  <Stack
                                    direction={{
                                      xs: "column",
                                      md: "row",
                                    }}
                                    spacing={2}
                                    alignItems={{
                                      xs: "flex-start",
                                      md: "center",
                                    }}
                                  >
                                    <ConfirmationNumberIcon color="action" />

                                    <Box
                                      sx={{
                                        flex: 1,
                                      }}
                                    >
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        flexWrap="wrap"
                                      >
                                        <Typography
                                          variant="body2"
                                          fontWeight={700}
                                        >
                                          {ticket.code || `#${ticket.id}`}
                                        </Typography>

                                        <Typography fontWeight={600}>
                                          {ticket.name}
                                        </Typography>
                                      </Stack>

                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                          mt: 0.5,
                                        }}
                                      >
                                        {ticket.content || "No description"}
                                      </Typography>
                                    </Box>

                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      flexWrap="wrap"
                                    >
                                      <Chip
                                        size="small"
                                        label={
                                          ticket.statusName ||
                                          ticket.status ||
                                          "Unknown"
                                        }
                                        color={getTicketStatusColor(ticket)}
                                      />

                                      {ticket.priorityName && (
                                        <Chip
                                          size="small"
                                          label={ticket.priorityName}
                                          variant="outlined"
                                        />
                                      )}
                                    </Stack>
                                  </Stack>

                                  <Divider sx={{ my: 1.5 }} />

                                  <Stack
                                    direction={{
                                      xs: "column",
                                      sm: "row",
                                    }}
                                    spacing={{
                                      xs: 0.5,
                                      sm: 3,
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Owner:{" "}
                                      <strong>{ticket.ownerName || "-"}</strong>
                                    </Typography>

                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Responsible:{" "}
                                      <strong>
                                        {ticket.responsibleName || "-"}
                                      </strong>
                                    </Typography>

                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Estimation:{" "}
                                      <strong>{ticket.estimation ?? 0}</strong>
                                    </Typography>
                                  </Stack>
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </Collapse>
                  </Card>
                );
              })}
            </Stack>
          )}
        </>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={() => setError("")}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert severity="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}

import AddIcon from "@mui/icons-material/Add";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TicketIcon from "@mui/icons-material/ConfirmationNumber";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RestoreIcon from "@mui/icons-material/Restore";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import EpicAnalyticsDialog from "./EpicAnalyticsDialog";

import {
  createEpic,
  deleteEpic,
  getActiveEpicsByProject,
  getEpicsByProject,
  restoreEpic,
  updateEpic,
} from "../../api/epicApi";

import { getProjectMilestones } from "../../api/milestoneApi";

import {
  createTicket,
  deleteTicket,
  getTicketsByEpic,
  updateTicket,
} from "../../api/ticketApi";

import { getProjectUsers } from "../../api/projectUserApi";
import { getTicketPriorities } from "../../api/ticketPriorityApi";
import { getTicketStatuses } from "../../api/ticketStatusApi";
import { getTicketTypes } from "../../api/ticketTypeApi";

const emptyEpicForm = {
  projectId: "",
  name: "",
  startsAt: "",
  endsAt: "",
  parentId: "",
  milestoneId: "",
};

const emptyTicketForm = {
  name: "",
  content: "",
  ownerId: "",
  responsibleId: "",
  statusId: "",
  projectId: "",
  code: "",
  typeId: "",
  order: 0,
  priorityId: "",
  estimation: 0,
  epicId: "",

  // NEW
  dueDate: "",
};

const Epics = () => {
  const { user, getPrimaryProjectId } = useAuth();
  // =========================================================
  // EPIC STATE
  // =========================================================

  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [epicDialogOpen, setEpicDialogOpen] = useState(false);
  const [epicDialogMode, setEpicDialogMode] = useState("create");

  const [selectedEpic, setSelectedEpic] = useState(null);

  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [analyticsEpic, setAnalyticsEpic] = useState(null);

  const [epicForm, setEpicForm] = useState(emptyEpicForm);

  const [expandedEpicIds, setExpandedEpicIds] = useState([]);

  const [epicTickets, setEpicTickets] = useState({});

  const [loadingEpics, setLoadingEpics] = useState(false);
  const [savingEpic, setSavingEpic] = useState(false);

  // =========================================================
  // TICKET STATE
  // =========================================================

  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [ticketDialogMode, setTicketDialogMode] = useState("create");

  const [selectedTicket, setSelectedTicket] = useState(null);

  const [ticketForm, setTicketForm] = useState(emptyTicketForm);

  const [users, setUsers] = useState([]);
  const [ticketStatuses, setTicketStatuses] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [ticketPriorities, setTicketPriorities] = useState([]);

  const [savingTicket, setSavingTicket] = useState(false);

  // =========================================================
  // UI STATE
  // =========================================================

  const [search, setSearch] = useState("");

  const [showDeleted, setShowDeleted] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // =========================================================
  // LOAD INITIAL DATA
  // =========================================================

  useEffect(() => {
    loadProjects();
    loadTicketMasterData();
  }, [getPrimaryProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      loadEpics(selectedProjectId);
      loadMilestones(selectedProjectId);
    } else {
      setEpics([]);
      setMilestones([]);
      setExpandedEpicIds([]);
      setEpicTickets({});
    }
  }, [selectedProjectId, showDeleted]);

  // =========================================================
  // PROJECTS
  // =========================================================

  const loadProjects = async () => {
    try {
      const memberships = Array.isArray(user?.projectMemberships)
        ? user.projectMemberships
        : [];
      const activeId = getPrimaryProjectId();
      const list = memberships
        .filter((m) => m?.projectId && Number(m.projectId) === Number(activeId))
        .map((m) => ({
          id: Number(m.projectId),
          name: m.projectName || m.project?.name || `Project #${m.projectId}`,
        }));

      setProjects(list);
      setSelectedProjectId(list.length ? String(list[0].id) : "");
    } catch (error) {
      showMessage(
        error?.response?.data?.message || "Failed to load projects",
        "error",
      );
    }
  };

  // =========================================================
  // EPICS
  // =========================================================

  const loadEpics = async (projectId = selectedProjectId) => {
    if (!projectId) return;

    try {
      setLoadingEpics(true);

      const data = showDeleted
        ? await getEpicsByProject(projectId)
        : await getActiveEpicsByProject(projectId);

      const epicList = Array.isArray(data) ? data : [];

      // Sort Epic by ID in ascending order
      const sortedEpics = [...epicList].sort((a, b) => {
        return Number(a.id) - Number(b.id);
      });

      setEpics(sortedEpics);

      setExpandedEpicIds([]);
      setEpicTickets({});
    } catch (error) {
      showMessage(
        error?.response?.data?.message || "Failed to load epics",
        "error",
      );
    } finally {
      setLoadingEpics(false);
    }
  };

  const loadMilestones = async (projectId = selectedProjectId) => {
    if (!projectId) return;

    try {
      setLoadingMilestones(true);

      const data = await getProjectMilestones(projectId);

      setMilestones(Array.isArray(data) ? data : []);
    } catch (error) {
      showMessage(
        error?.response?.data?.message || "Failed to load milestones",
        "error",
      );
    } finally {
      setLoadingMilestones(false);
    }
  };

  const filteredEpics = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return epics;
    }

    return epics.filter((epic) => {
      return (
        epic.name?.toLowerCase().includes(value) ||
        String(epic.id).includes(value)
      );
    });
  }, [epics, search]);

  // =========================================================
  // EPIC FORM
  // =========================================================

  const openCreateEpic = () => {
    setEpicDialogMode("create");
    setSelectedEpic(null);

    setEpicForm({
      ...emptyEpicForm,
      projectId: selectedProjectId,
    });

    setEpicDialogOpen(true);
  };

  const openEditEpic = (epic) => {
    setEpicDialogMode("edit");
    setSelectedEpic(epic);

    setEpicForm({
      projectId: epic.projectId || selectedProjectId,
      name: epic.name || "",
      startsAt: epic.startsAt || "",
      endsAt: epic.endsAt || "",
      parentId: epic.parentId ? String(epic.parentId) : "",
      milestoneId: epic.milestoneId ? String(epic.milestoneId) : "",
    });

    setEpicDialogOpen(true);
  };

  const openAnalytics = (epic) => {
    setAnalyticsEpic(epic);
    setAnalyticsDialogOpen(true);
  };

  const closeAnalytics = () => {
    setAnalyticsDialogOpen(false);
    setAnalyticsEpic(null);
  };

  const closeEpicDialog = () => {
    if (savingEpic) return;

    setEpicDialogOpen(false);
    setSelectedEpic(null);
    setEpicForm(emptyEpicForm);
  };

  const handleEpicChange = (event) => {
    const { name, value } = event.target;

    setEpicForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveEpic = async () => {
    if (!epicForm.projectId) {
      showMessage("Please select a project", "error");
      return;
    }

    if (!epicForm.name.trim()) {
      showMessage("Epic name is required", "error");
      return;
    }

    if (!epicForm.startsAt || !epicForm.endsAt) {
      showMessage("Start date and end date are required", "error");
      return;
    }

    if (epicForm.endsAt < epicForm.startsAt) {
      showMessage("End date must be on or after start date", "error");
      return;
    }

    if (!epicForm.milestoneId) {
      showMessage("Please select a milestone", "error");
      return;
    }

    try {
      setSavingEpic(true);

      const payload = {
        projectId: Number(epicForm.projectId),
        name: epicForm.name.trim(),
        startsAt: epicForm.startsAt,
        endsAt: epicForm.endsAt,
        parentId: epicForm.parentId ? Number(epicForm.parentId) : null,
        milestoneId: Number(epicForm.milestoneId),
      };

      let savedEpic;

      if (epicDialogMode === "edit" && selectedEpic) {
        savedEpic = await updateEpic(selectedEpic.id, payload);

        showMessage("Epic updated successfully", "success");
      } else {
        savedEpic = await createEpic(payload);

        showMessage("Epic created successfully", "success");
      }

      setEpicDialogOpen(false);

      await loadEpics(epicForm.projectId);

      if (savedEpic?.id) {
        setExpandedEpicIds((previous) => [...previous, savedEpic.id]);
      }
    } catch (error) {
      showMessage(
        error?.response?.data?.message || "Failed to save epic",
        "error",
      );
    } finally {
      setSavingEpic(false);
    }
  };

  const handleDeleteEpic = async (epic) => {
    const confirmed = window.confirm(`Delete epic "${epic.name}"?`);

    if (!confirmed) return;

    try {
      await deleteEpic(epic.id);

      showMessage("Epic deleted successfully", "success");

      await loadEpics(selectedProjectId);
    } catch (error) {
      showMessage(
        error?.response?.data?.message || "Failed to delete epic",
        "error",
      );
    }
  };

  const handleRestoreEpic = async (epic) => {
    try {
      await restoreEpic(epic.id);

      showMessage("Epic restored successfully", "success");

      await loadEpics(selectedProjectId);
    } catch (error) {
      showMessage(
        error?.response?.data?.message || "Failed to restore epic",
        "error",
      );
    }
  };

  // =========================================================
  // PARENT EPICS
  // =========================================================

  const parentEpics = useMemo(() => {
    return epics.filter((epic) => {
      if (
        epicDialogMode === "edit" &&
        selectedEpic &&
        epic.id === selectedEpic.id
      ) {
        return false;
      }

      return true;
    });
  }, [epics, epicDialogMode, selectedEpic]);

  // =========================================================
  // EPIC → TICKETS
  // =========================================================

  const toggleEpic = async (epicId) => {
    const isExpanded = expandedEpicIds.includes(epicId);

    if (isExpanded) {
      setExpandedEpicIds((previous) => previous.filter((id) => id !== epicId));

      return;
    }

    setExpandedEpicIds((previous) => [...previous, epicId]);

    await loadTicketsForEpic(epicId);
  };

  const loadTicketsForEpic = async (epicId) => {
    try {
      const data = await getTicketsByEpic(epicId);

      setEpicTickets((previous) => ({
        ...previous,
        [epicId]: Array.isArray(data) ? data : [],
      }));
    } catch (error) {
      showMessage(
        error?.response?.data?.message || "Failed to load tickets",
        "error",
      );
    }
  };

  // =========================================================
  // TICKET MASTER DATA
  // =========================================================

  const loadTicketMasterData = async () => {
    try {
      const [statusesData, typesData, prioritiesData] = await Promise.all([
        getTicketStatuses(),
        getTicketTypes(),
        getTicketPriorities(),
      ]);

      if (selectedProjectId) {
        const members = await getProjectUsers(Number(selectedProjectId));
        setUsers(
          Array.isArray(members)
            ? members
                .map((m) => ({
                  id: m.userId ?? m.user?.id,
                  name: m.userName ?? m.user?.name,
                  fullName: m.userFullName ?? m.user?.fullName,
                  email: m.userEmail ?? m.user?.email,
                  role: m.role,
                }))
                .filter((u) => u.id != null)
            : [],
        );
      } else {
        setUsers([]);
      }
      setTicketStatuses(Array.isArray(statusesData) ? statusesData : []);
      setTicketTypes(Array.isArray(typesData) ? typesData : []);
      setTicketPriorities(Array.isArray(prioritiesData) ? prioritiesData : []);
    } catch (error) {
      showMessage("Failed to load ticket master data", "error");
    }
  };

  // =========================================================
  // ADD TICKET INSIDE EPIC
  // =========================================================

  const openCreateTicket = (epic) => {
    setTicketDialogMode("create");
    setSelectedTicket(null);

    setTicketForm({
      ...emptyTicketForm,
      projectId: epic.projectId || selectedProjectId,
      epicId: epic.id,
    });

    setTicketDialogOpen(true);
  };

  const openEditTicket = (ticket, epic) => {
    setTicketDialogMode("edit");
    setSelectedTicket(ticket);

    setTicketForm({
      name: ticket.name || "",
      content: ticket.content || "",

      ownerId: ticket.ownerId ? String(ticket.ownerId) : "",

      responsibleId: ticket.responsibleId ? String(ticket.responsibleId) : "",

      statusId: ticket.statusId ? String(ticket.statusId) : "",

      projectId: ticket.projectId || epic.projectId || selectedProjectId,

      code: ticket.code || "",

      typeId: ticket.typeId ? String(ticket.typeId) : "",

      order: ticket.order ?? 0,

      priorityId: ticket.priorityId ? String(ticket.priorityId) : "",

      estimation: ticket.estimation ?? 0,

      epicId: epic.id,

      // NEW
      // Convert backend datetime into
      // yyyy-MM-ddTHH:mm format required by
      // datetime-local input.
      dueDate: ticket.dueDate ? String(ticket.dueDate).slice(0, 16) : "",
    });

    setTicketDialogOpen(true);
  };

  const closeTicketDialog = () => {
    if (savingTicket) return;

    setTicketDialogOpen(false);
    setSelectedTicket(null);
    setTicketForm(emptyTicketForm);
  };

  const handleTicketChange = (event) => {
    const { name, value } = event.target;

    setTicketForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // TICKET PAYLOAD
  // =========================================================

  const buildTicketPayload = () => {
    const payload = {
      name: ticketForm.name.trim(),

      content: ticketForm.content.trim(),

      ownerId: Number(ticketForm.ownerId),

      statusId: Number(ticketForm.statusId),

      projectId: Number(ticketForm.projectId),

      code: ticketForm.code.trim(),

      typeId: Number(ticketForm.typeId),

      order: Number(ticketForm.order || 0),

      priorityId: Number(ticketForm.priorityId),

      estimation: Number(ticketForm.estimation || 0),

      epicId: Number(ticketForm.epicId),

      // NEW
      // Send null when no due date is selected.
      dueDate: ticketForm.dueDate ? ticketForm.dueDate : null,
    };

    if (ticketForm.responsibleId) {
      payload.responsibleId = Number(ticketForm.responsibleId);
    } else {
      payload.responsibleId = null;
    }

    return payload;
  };

  // =========================================================
  // SAVE TICKET
  // =========================================================

  const saveTicket = async () => {
    if (!ticketForm.name.trim()) {
      showMessage("Ticket name is required", "error");

      return;
    }

    if (!ticketForm.content.trim()) {
      showMessage("Ticket content is required", "error");

      return;
    }

    if (!ticketForm.ownerId) {
      showMessage("Owner is required", "error");

      return;
    }

    if (!ticketForm.statusId) {
      showMessage("Status is required", "error");

      return;
    }

    if (!ticketForm.typeId) {
      showMessage("Ticket type is required", "error");

      return;
    }

    if (!ticketForm.priorityId) {
      showMessage("Priority is required", "error");

      return;
    }

    try {
      setSavingTicket(true);

      const payload = buildTicketPayload();

      if (ticketDialogMode === "edit" && selectedTicket) {
        await updateTicket(selectedTicket.id, payload);

        showMessage("Ticket updated successfully", "success");
      } else {
        await createTicket(payload);

        showMessage("Ticket created successfully", "success");
      }

      const epicId = Number(ticketForm.epicId);

      setTicketDialogOpen(false);
      setSelectedTicket(null);
      setTicketForm(emptyTicketForm);

      await loadTicketsForEpic(epicId);

      if (!expandedEpicIds.includes(epicId)) {
        setExpandedEpicIds((previous) => [...previous, epicId]);
      }
    } catch (error) {
      showMessage(
        error?.response?.data?.message || "Failed to save ticket",
        "error",
      );
    } finally {
      setSavingTicket(false);
    }
  };

  const handleDeleteTicket = async (ticket, epicId) => {
    const confirmed = window.confirm(`Delete ticket "${ticket.name}"?`);

    if (!confirmed) return;

    try {
      await deleteTicket(ticket.id);

      showMessage("Ticket deleted successfully", "success");

      await loadTicketsForEpic(epicId);
    } catch (error) {
      showMessage(
        error?.response?.data?.message || "Failed to delete ticket",
        "error",
      );
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================

  const getUserName = (id) => {
    const user = users.find((item) => Number(item.id) === Number(id));

    return user?.name || user?.fullName || user?.email || "-";
  };

  const showMessage = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const selectedProject = projects.find(
    (project) => Number(project.id) === Number(selectedProjectId),
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Box className="app-page pm-fade-up">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "stretch",
          md: "center",
        }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Epics
          </Typography>

          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Create Epics first, then add multiple Tickets inside each Epic.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateEpic}
          disabled={!selectedProjectId}
        >
          Add Epic
        </Button>
      </Stack>

      {/* =====================================================
          PROJECT + SEARCH
      ====================================================== */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
          >
            <FormControl fullWidth sx={{ display: "none" }}>
              <InputLabel>Project</InputLabel>

              <Select
                value={selectedProjectId}
                label="Project"
                onChange={(event) => {
                  setSelectedProjectId(event.target.value);
                }}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Search Epic"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <Button
              variant={showDeleted ? "contained" : "outlined"}
              onClick={() => setShowDeleted((previous) => !previous)}
              sx={{ minWidth: 150 }}
            >
              {showDeleted ? "Active Epics" : "Deleted Epics"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* =====================================================
          SELECTED PROJECT
      ====================================================== */}

      {selectedProject && (
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Project: {selectedProject.name}
        </Typography>
      )}

      {/* =====================================================
          EPIC LIST
      ====================================================== */}

      {loadingEpics ? (
        <Typography color="text.secondary">Loading epics...</Typography>
      ) : filteredEpics.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center">
              No epics found for this project.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredEpics.map((epic) => {
            const expanded = expandedEpicIds.includes(epic.id);

            const tickets = epicTickets[epic.id] || [];

            return (
              <Card key={epic.id}>
                <CardContent sx={{ pb: 1 }}>
                  {/* EPIC HEADER */}

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={() => toggleEpic(epic.id)}>
                      {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>

                    <Box sx={{ flex: 1 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        flexWrap="wrap"
                      >
                        <Typography variant="h6" fontWeight={700}>
                          {epic.name}
                        </Typography>

                        <Chip size="small" label={`EPIC-${epic.id}`} />

                        {epic.milestoneName && (
                          <Chip
                            size="small"
                            variant="outlined"
                            color="primary"
                            label={`Milestone: ${epic.milestoneName}`}
                          />
                        )}

                        {epic.deletedAt && (
                          <Chip size="small" color="error" label="Deleted" />
                        )}
                      </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                      >
                        {epic.startsAt} → {epic.endsAt}
                      </Typography>
                    </Box>

                    {!epic.deletedAt && (
                      <>
                        <Tooltip title="Add Ticket">
                          <IconButton
                            color="primary"
                            onClick={() => openCreateTicket(epic)}
                          >
                            <TicketIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Epic">
                          <IconButton onClick={() => openEditEpic(epic)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Epic Progress / Burndown / Report">
                          <IconButton
                            color="info"
                            onClick={() => openAnalytics(epic)}
                          >
                            <AssessmentIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Epic">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteEpic(epic)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {epic.deletedAt && (
                      <Tooltip title="Restore Epic">
                        <IconButton
                          color="success"
                          onClick={() => handleRestoreEpic(epic)}
                        >
                          <RestoreIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>

                  {/* EPIC CONTENT */}

                  <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Divider sx={{ my: 2 }} />

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="subtitle1" fontWeight={700}>
                        Tickets ({tickets.length})
                      </Typography>

                      {!epic.deletedAt && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => openCreateTicket(epic)}
                        >
                          Add Ticket
                        </Button>
                      )}
                    </Stack>

                    {tickets.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 2 }}
                      >
                        No tickets found in this Epic.
                      </Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {tickets.map((ticket) => (
                          <Card
                            key={ticket.id}
                            variant="outlined"
                            sx={{
                              backgroundColor: "background.default",
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
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <TicketIcon fontSize="small" color="action" />

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
                                    <Typography fontWeight={600}>
                                      {ticket.name}
                                    </Typography>

                                    {ticket.code && (
                                      <Chip size="small" label={ticket.code} />
                                    )}
                                  </Stack>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Ticket ID: {ticket.id}
                                  </Typography>

                                  {ticket.dueDate && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Due:{" "}
                                      {String(ticket.dueDate).replace("T", " ")}
                                    </Typography>
                                  )}
                                </Box>

                                <Tooltip title="Edit Ticket">
                                  <IconButton
                                    onClick={() => openEditTicket(ticket, epic)}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete Ticket">
                                  <IconButton
                                    color="error"
                                    onClick={() =>
                                      handleDeleteTicket(ticket, epic.id)
                                    }
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* =====================================================
          EPIC DIALOG
      ====================================================== */}

      <Dialog
        open={epicDialogOpen}
        onClose={closeEpicDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {epicDialogMode === "edit" ? "Edit Epic" : "Create Epic"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <FormControl fullWidth sx={{ display: "none" }}>
              <InputLabel>Project</InputLabel>

              <Select
                name="projectId"
                value={epicForm.projectId}
                label="Project"
                onChange={handleEpicChange}
                disabled={epicDialogMode === "edit"}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Milestone</InputLabel>

              <Select
                name="milestoneId"
                value={epicForm.milestoneId}
                label="Milestone"
                onChange={handleEpicChange}
                disabled={loadingMilestones || milestones.length === 0}
              >
                {milestones
                  .filter((milestone) => milestone.status !== "CANCELLED")
                  .map((milestone) => (
                    <MenuItem key={milestone.id} value={String(milestone.id)}>
                      {milestone.name}
                    </MenuItem>
                  ))}
              </Select>

              {milestones.length === 0 && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  Create a milestone for this project before creating an Epic.
                </Typography>
              )}
            </FormControl>

            <TextField
              name="name"
              label="Epic Name"
              value={epicForm.name}
              onChange={handleEpicChange}
              fullWidth
              required
            />

            <TextField
              name="startsAt"
              label="Start Date"
              type="date"
              value={epicForm.startsAt}
              onChange={handleEpicChange}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              required
            />

            <TextField
              name="endsAt"
              label="End Date"
              type="date"
              value={epicForm.endsAt}
              onChange={handleEpicChange}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Parent Epic</InputLabel>

              <Select
                name="parentId"
                value={epicForm.parentId}
                label="Parent Epic"
                onChange={handleEpicChange}
              >
                <MenuItem value="">None</MenuItem>

                {parentEpics.map((parent) => (
                  <MenuItem key={parent.id} value={String(parent.id)}>
                    {parent.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeEpicDialog} disabled={savingEpic}>
            Cancel
          </Button>

          <Button variant="contained" onClick={saveEpic} disabled={savingEpic}>
            {savingEpic
              ? "Saving..."
              : epicDialogMode === "edit"
                ? "Update Epic"
                : "Create Epic"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          EPIC ANALYTICS
      ====================================================== */}

      <EpicAnalyticsDialog
        open={analyticsDialogOpen}
        onClose={closeAnalytics}
        epic={analyticsEpic}
      />

      {/* =====================================================
          TICKET DIALOG
      ====================================================== */}

      <Dialog
        open={ticketDialogOpen}
        onClose={closeTicketDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {ticketDialogMode === "edit" ? "Edit Ticket" : "Add Ticket to Epic"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            {/* Project */}

            <FormControl fullWidth sx={{ display: "none" }}>
              <InputLabel>Project</InputLabel>

              <Select
                name="projectId"
                value={ticketForm.projectId}
                label="Project"
                disabled
              >
                {projects
                  .filter(
                    (project) =>
                      Number(project.id) === Number(ticketForm.projectId),
                  )
                  .map((project) => (
                    <MenuItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Epic */}

            <FormControl fullWidth>
              <InputLabel>Epic</InputLabel>

              <Select
                name="epicId"
                value={ticketForm.epicId}
                label="Epic"
                disabled
              >
                {epics
                  .filter(
                    (epic) => Number(epic.id) === Number(ticketForm.epicId),
                  )
                  .map((epic) => (
                    <MenuItem key={epic.id} value={String(epic.id)}>
                      {epic.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Ticket Name */}

            <TextField
              name="name"
              label="Ticket Name"
              value={ticketForm.name}
              onChange={handleTicketChange}
              fullWidth
              required
            />

            {/* Content */}

            <TextField
              name="content"
              label="Ticket Description"
              value={ticketForm.content}
              onChange={handleTicketChange}
              fullWidth
              required
              multiline
              minRows={4}
            />

            {/* Code */}

            {/*
            <TextField
              name="code"
              label="Ticket Code"
              value={ticketForm.code}
              onChange={handleTicketChange}
              fullWidth
              required
            />
            */}

            {/* Owner */}

            <FormControl fullWidth>
              <InputLabel>Owner</InputLabel>

              <Select
                name="ownerId"
                value={ticketForm.ownerId}
                label="Owner"
                onChange={handleTicketChange}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {user.name || user.fullName || user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Responsible */}

            <FormControl fullWidth>
              <InputLabel>Responsible</InputLabel>

              <Select
                name="responsibleId"
                value={ticketForm.responsibleId}
                label="Responsible"
                onChange={handleTicketChange}
              >
                <MenuItem value="">None</MenuItem>

                {users.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {user.name || user.fullName || user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Status */}

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>

              <Select
                name="statusId"
                value={ticketForm.statusId}
                label="Status"
                onChange={handleTicketChange}
              >
                {ticketStatuses.map((status) => (
                  <MenuItem key={status.id} value={String(status.id)}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Type */}

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>

              <Select
                name="typeId"
                value={ticketForm.typeId}
                label="Type"
                onChange={handleTicketChange}
              >
                {ticketTypes.map((type) => (
                  <MenuItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Priority */}

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>

              <Select
                name="priorityId"
                value={ticketForm.priorityId}
                label="Priority"
                onChange={handleTicketChange}
              >
                {ticketPriorities.map((priority) => (
                  <MenuItem key={priority.id} value={String(priority.id)}>
                    {priority.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Order */}

            <TextField
              name="order"
              label="Order"
              type="number"
              value={ticketForm.order}
              onChange={handleTicketChange}
              fullWidth
              inputProps={{
                min: 0,
              }}
            />

            {/* Estimation */}

            <TextField
              name="estimation"
              label="Estimation"
              type="number"
              value={ticketForm.estimation}
              onChange={handleTicketChange}
              fullWidth
              inputProps={{
                min: 0,
                step: 0.5,
              }}
            />

            {/* =================================================
                DUE DATE & TIME
            ================================================== */}

            <TextField
              name="dueDate"
              label="Due Date & Time"
              type="datetime-local"
              value={ticketForm.dueDate}
              onChange={handleTicketChange}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              helperText="Set the deadline for this ticket."
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeTicketDialog} disabled={savingTicket}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={saveTicket}
            disabled={savingTicket}
          >
            {savingTicket
              ? "Saving..."
              : ticketDialogMode === "edit"
                ? "Update Ticket"
                : "Create Ticket"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          SNACKBAR
      ====================================================== */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() =>
          setSnackbar((previous) => ({
            ...previous,
            open: false,
          }))
        }
      >
        <Alert
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar((previous) => ({
              ...previous,
              open: false,
            }))
          }
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Epics;

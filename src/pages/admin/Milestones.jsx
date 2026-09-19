import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import TicketIcon from "@mui/icons-material/ConfirmationNumber";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FlagIcon from "@mui/icons-material/Flag";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";
import { useAuth } from "../../context/AuthContext";

import {
  assignTicketToMilestone,
  createMilestone,
  deleteMilestone,
  getMilestone,
  getMilestoneTickets,
  getProjectMilestones,
  removeTicketFromMilestone,
  updateMilestone,
  updateMilestoneStatus,
} from "../../api/milestoneApi";

import { getTicketsByProject } from "../../api/ticketApi";

import { useToast } from "../../context/ToastContext";

// ==============================================================
// CONSTANTS
// ==============================================================

const STATUS_OPTIONS = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const STATUS_META = {
  PLANNED: { label: "Planned", color: "default" },
  IN_PROGRESS: { label: "In Progress", color: "info" },
  COMPLETED: { label: "Completed", color: "success" },
  CANCELLED: { label: "Cancelled", color: "error" },
};

const emptyMilestoneForm = {
  name: "",
  description: "",
  startDate: "",
  dueDate: "",
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const isOverdue = (milestone) => {
  if (!milestone?.dueDate) return false;
  if (milestone.status === "COMPLETED" || milestone.status === "CANCELLED") {
    return false;
  }

  return milestone.dueDate < todayStr();
};

const formatDate = (value) => {
  if (!value) return "No date";

  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

// ==============================================================
// COMPONENT
// ==============================================================

const Milestones = () => {
  const { user, getPrimaryProjectId } = useAuth();
  const { success, error: showError } = useToast();

  // ------------------------------------------------------------
  // PROJECT STATE
  // ------------------------------------------------------------

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);

  // ------------------------------------------------------------
  // MILESTONE STATE
  // ------------------------------------------------------------

  const [milestones, setMilestones] = useState([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [search, setSearch] = useState("");

  const [expandedId, setExpandedId] = useState(null);
  const [milestoneTicketsMap, setMilestoneTicketsMap] = useState({});
  const [loadingTicketsFor, setLoadingTicketsFor] = useState(null);

  // ------------------------------------------------------------
  // CREATE / EDIT DIALOG
  // ------------------------------------------------------------

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [form, setForm] = useState(emptyMilestoneForm);
  const [saving, setSaving] = useState(false);

  // ------------------------------------------------------------
  // STATUS MENU
  // ------------------------------------------------------------

  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusMenuMilestone, setStatusMenuMilestone] = useState(null);

  // ------------------------------------------------------------
  // ADD TICKETS DIALOG
  // ------------------------------------------------------------

  const [addTicketsOpen, setAddTicketsOpen] = useState(false);
  const [addTicketsMilestone, setAddTicketsMilestone] = useState(null);
  const [projectTickets, setProjectTickets] = useState([]);
  const [loadingProjectTickets, setLoadingProjectTickets] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [savingTickets, setSavingTickets] = useState(false);

  // ==============================================================
  // LOAD PROJECTS
  // ==============================================================

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);

        const memberships = Array.isArray(user?.projectMemberships)
          ? user.projectMemberships
          : [];
        const activeId = getPrimaryProjectId();
        const list = memberships
          .filter(
            (m) => m?.projectId && Number(m.projectId) === Number(activeId),
          )
          .map((m) => ({
            id: Number(m.projectId),
            name: m.projectName || m.project?.name || `Project #${m.projectId}`,
          }));

        setProjects(list);
        setSelectedProjectId(list.length ? String(list[0].id) : "");
      } catch (err) {
        showError(err?.response?.data?.message || "Failed to load projects");
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [user, getPrimaryProjectId]);

  // ==============================================================
  // LOAD MILESTONES
  // ==============================================================

  const loadMilestones = async (projectId = selectedProjectId) => {
    if (!projectId) return;

    try {
      setLoadingMilestones(true);

      const data = await getProjectMilestones(projectId);
      const list = Array.isArray(data) ? data : [];

      list.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });

      setMilestones(list);
      setExpandedId(null);
      setMilestoneTicketsMap({});
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to load milestones");
    } finally {
      setLoadingMilestones(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadMilestones(selectedProjectId);
    } else {
      setMilestones([]);
      setExpandedId(null);
      setMilestoneTicketsMap({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const refreshOneMilestone = async (milestoneId) => {
    try {
      const updated = await getMilestone(selectedProjectId, milestoneId);

      setMilestones((previous) =>
        previous.map((item) =>
          item.id === milestoneId ? { ...item, ...updated } : item,
        ),
      );
    } catch {
      // Non-fatal: the list will self-correct on next full reload.
    }
  };

  const filteredMilestones = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return milestones;

    return milestones.filter(
      (milestone) =>
        milestone.name?.toLowerCase().includes(value) ||
        milestone.description?.toLowerCase().includes(value),
    );
  }, [milestones, search]);

  // ==============================================================
  // MILESTONE TICKETS (EXPAND)
  // ==============================================================

  const loadMilestoneTickets = async (milestoneId) => {
    try {
      setLoadingTicketsFor(milestoneId);

      const data = await getMilestoneTickets(selectedProjectId, milestoneId);

      setMilestoneTicketsMap((previous) => ({
        ...previous,
        [milestoneId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      showError(
        err?.response?.data?.message || "Failed to load milestone tickets",
      );
    } finally {
      setLoadingTicketsFor(null);
    }
  };

  const toggleExpand = (milestone) => {
    const nextId = expandedId === milestone.id ? null : milestone.id;

    setExpandedId(nextId);

    if (nextId && !milestoneTicketsMap[nextId]) {
      loadMilestoneTickets(nextId);
    }
  };

  // ==============================================================
  // CREATE / EDIT MILESTONE
  // ==============================================================

  const openCreateDialog = () => {
    setDialogMode("create");
    setSelectedMilestone(null);
    setForm(emptyMilestoneForm);
    setDialogOpen(true);
  };

  const openEditDialog = (milestone) => {
    setDialogMode("edit");
    setSelectedMilestone(milestone);
    setForm({
      name: milestone.name || "",
      description: milestone.description || "",
      startDate: milestone.startDate || "",
      dueDate: milestone.dueDate || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setSelectedMilestone(null);
    setForm(emptyMilestoneForm);
  };

  const handleFormChange = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showError("Milestone name is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || "",
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
    };

    try {
      setSaving(true);

      if (dialogMode === "edit" && selectedMilestone) {
        await updateMilestone(selectedProjectId, selectedMilestone.id, payload);
        success("Milestone updated");
      } else {
        await createMilestone(selectedProjectId, payload);
        success("Milestone created");
      }

      closeDialog();
      await loadMilestones(selectedProjectId);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to save milestone");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (milestone) => {
    const confirmed = await requestConfirm(
      `Delete milestone "${milestone.name}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteMilestone(selectedProjectId, milestone.id);
      success("Milestone deleted");
      await loadMilestones(selectedProjectId);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to delete milestone");
    }
  };

  // ==============================================================
  // STATUS CHANGE
  // ==============================================================

  const openStatusMenu = (event, milestone) => {
    setStatusMenuAnchor(event.currentTarget);
    setStatusMenuMilestone(milestone);
  };

  const closeStatusMenu = () => {
    setStatusMenuAnchor(null);
    setStatusMenuMilestone(null);
  };

  const handleStatusChange = async (newStatus) => {
    const milestone = statusMenuMilestone;
    closeStatusMenu();

    if (!milestone || newStatus === milestone.status) return;

    if (newStatus === "COMPLETED") {
      const confirmed = await requestConfirm(
        `Mark milestone "${milestone.name}" as Completed?`,
      );
      if (!confirmed) return;
    }

    try {
      await updateMilestoneStatus(selectedProjectId, milestone.id, newStatus);
      success(`Milestone marked as ${STATUS_META[newStatus].label}`);
      await refreshOneMilestone(milestone.id);
    } catch (err) {
      showError(
        err?.response?.data?.message || "Failed to update milestone status",
      );
    }
  };

  // ==============================================================
  // ADD / REMOVE TICKETS
  // ==============================================================

  const openAddTickets = async (milestone) => {
    setAddTicketsMilestone(milestone);
    setAddTicketsOpen(true);
    setTicketSearch("");
    setSelectedTicketIds([]);

    try {
      setLoadingProjectTickets(true);

      const [allTickets, milestoneTickets] = await Promise.all([
        getTicketsByProject(selectedProjectId),
        milestoneTicketsMap[milestone.id]
          ? Promise.resolve(milestoneTicketsMap[milestone.id])
          : getMilestoneTickets(selectedProjectId, milestone.id),
      ]);

      setMilestoneTicketsMap((previous) => ({
        ...previous,
        [milestone.id]: Array.isArray(milestoneTickets) ? milestoneTickets : [],
      }));

      const assignedIds = new Set(
        (Array.isArray(milestoneTickets) ? milestoneTickets : []).map(
          (ticket) => ticket.id,
        ),
      );

      const candidates = (Array.isArray(allTickets) ? allTickets : []).filter(
        (ticket) => !assignedIds.has(ticket.id),
      );

      setProjectTickets(candidates);
    } catch (err) {
      showError(
        err?.response?.data?.message || "Failed to load project tickets",
      );
    } finally {
      setLoadingProjectTickets(false);
    }
  };

  const closeAddTickets = () => {
    if (savingTickets) return;

    setAddTicketsOpen(false);
    setAddTicketsMilestone(null);
    setProjectTickets([]);
    setSelectedTicketIds([]);
    setTicketSearch("");
  };

  const filteredCandidateTickets = useMemo(() => {
    const value = ticketSearch.trim().toLowerCase();

    if (!value) return projectTickets;

    return projectTickets.filter(
      (ticket) =>
        ticket.name?.toLowerCase().includes(value) ||
        ticket.code?.toLowerCase().includes(value),
    );
  }, [projectTickets, ticketSearch]);

  const toggleTicketSelected = (ticketId) => {
    setSelectedTicketIds((previous) =>
      previous.includes(ticketId)
        ? previous.filter((id) => id !== ticketId)
        : [...previous, ticketId],
    );
  };

  const handleAddTickets = async () => {
    if (!addTicketsMilestone || selectedTicketIds.length === 0) return;

    try {
      setSavingTickets(true);

      await Promise.all(
        selectedTicketIds.map((ticketId) =>
          assignTicketToMilestone(
            selectedProjectId,
            addTicketsMilestone.id,
            ticketId,
          ),
        ),
      );

      success(
        `${selectedTicketIds.length} ticket${
          selectedTicketIds.length === 1 ? "" : "s"
        } added to milestone`,
      );

      await loadMilestoneTickets(addTicketsMilestone.id);
      await refreshOneMilestone(addTicketsMilestone.id);

      closeAddTickets();
    } catch (err) {
      showError(
        err?.response?.data?.message || "Failed to add tickets to milestone",
      );
    } finally {
      setSavingTickets(false);
    }
  };

  const handleRemoveTicket = async (milestone, ticket) => {
    const confirmed = await requestConfirm(
      `Remove ${ticket.code || ticket.name} from "${milestone.name}"?`,
    );

    if (!confirmed) return;

    try {
      await removeTicketFromMilestone(
        selectedProjectId,
        milestone.id,
        ticket.id,
      );
      success("Ticket removed from milestone");
      await loadMilestoneTickets(milestone.id);
      await refreshOneMilestone(milestone.id);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to remove ticket");
    }
  };

  // ==============================================================
  // RENDER
  // ==============================================================

  return (
    <Box className="app-page pm-fade-up">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Milestones
          </Typography>

          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Plan release targets, track progress, and assign tickets.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          disabled={!selectedProjectId}
        >
          Create Milestone
        </Button>
      </Stack>

      {/* =====================================================
          PROJECT + SEARCH
      ====================================================== */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth sx={{ display: "none" }}>
              <InputLabel>Project</InputLabel>

              <Select
                value={selectedProjectId}
                label="Project"
                onChange={(event) => setSelectedProjectId(event.target.value)}
                disabled={loadingProjects}
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
              label="Search Milestones"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* =====================================================
          MILESTONE LIST
      ====================================================== */}

      {loadingMilestones ? (
        <Stack alignItems="center" py={6}>
          <CircularProgress size={28} />
        </Stack>
      ) : !selectedProjectId ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center">
              Select a project to view its milestones.
            </Typography>
          </CardContent>
        </Card>
      ) : filteredMilestones.length === 0 ? (
        <Card>
          <CardContent>
            <Stack alignItems="center" spacing={1.5} py={3}>
              <FlagIcon sx={{ fontSize: 40, color: "text.disabled" }} />

              <Typography color="text.secondary" textAlign="center">
                {milestones.length === 0
                  ? "No milestones yet for this project."
                  : "No milestones match your search."}
              </Typography>

              {milestones.length === 0 && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={openCreateDialog}
                >
                  Create your first milestone
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredMilestones.map((milestone) => {
            const expanded = expandedId === milestone.id;
            const tickets = milestoneTicketsMap[milestone.id] || [];
            const overdue = isOverdue(milestone);
            const statusMeta =
              STATUS_META[milestone.status] || STATUS_META.PLANNED;
            const progress = Math.max(
              0,
              Math.min(100, Number(milestone.progressPercent) || 0),
            );

            return (
              <Card
                key={milestone.id}
                variant="outlined"
                sx={{
                  borderColor: overdue ? "error.main" : "divider",
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => toggleExpand(milestone)}
                      sx={{ mt: 0.5 }}
                      aria-label="Expand"
                    >
                      {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        flexWrap="wrap"
                      >
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{
                            cursor: "pointer",
                          }}
                          onClick={() => toggleExpand(milestone)}
                        >
                          {milestone.name}
                        </Typography>

                        <Chip
                          size="small"
                          label={statusMeta.label}
                          color={statusMeta.color}
                          variant={
                            milestone.status === "CANCELLED"
                              ? "outlined"
                              : "filled"
                          }
                          onClick={(event) => openStatusMenu(event, milestone)}
                          sx={{ cursor: "pointer" }}
                        />

                        {overdue && (
                          <Chip
                            size="small"
                            color="error"
                            icon={<WarningAmberIcon />}
                            label="Overdue"
                          />
                        )}
                      </Stack>

                      {milestone.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mt={0.5}
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {milestone.description}
                        </Typography>
                      )}

                      <Stack
                        direction="row"
                        spacing={2}
                        mt={1}
                        flexWrap="wrap"
                        alignItems="center"
                      >
                        <Typography
                          variant="caption"
                          color={overdue ? "error.main" : "text.secondary"}
                          fontWeight={overdue ? 700 : 400}
                        >
                          Due {formatDate(milestone.dueDate)}
                        </Typography>

                        {milestone.startDate && (
                          <Typography variant="caption" color="text.secondary">
                            Starts {formatDate(milestone.startDate)}
                          </Typography>
                        )}

                        <Typography variant="caption" color="text.secondary">
                          {milestone.completedTickets ?? 0} /{" "}
                          {milestone.totalTickets ?? 0} tickets complete
                        </Typography>
                      </Stack>

                      <Box sx={{ mt: 1.5, maxWidth: 420 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          mb={0.5}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Progress
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            {progress}%
                          </Typography>
                        </Stack>

                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          color={
                            statusMeta.color === "default"
                              ? "primary"
                              : statusMeta.color
                          }
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Box>

                    <Stack direction="row">
                      <Tooltip title="Edit Milestone">
                        <IconButton
                          onClick={() => openEditDialog(milestone)}
                          aria-label="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete Milestone">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(milestone)}
                          aria-label="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  {/* TICKETS */}

                  <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Divider sx={{ my: 2 }} />

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        Tickets ({tickets.length})
                      </Typography>

                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => openAddTickets(milestone)}
                      >
                        Add Tickets
                      </Button>
                    </Stack>

                    {loadingTicketsFor === milestone.id ? (
                      <Stack alignItems="center" py={2}>
                        <CircularProgress size={22} />
                      </Stack>
                    ) : tickets.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 1 }}
                      >
                        No tickets on this milestone yet. Use "Add Tickets" to
                        assign some.
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {tickets.map((ticket) => (
                          <Card
                            key={ticket.id}
                            variant="outlined"
                            sx={{ backgroundColor: "background.default" }}
                          >
                            <CardContent
                              sx={{
                                py: 1,
                                "&:last-child": { pb: 1 },
                              }}
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1.5}
                              >
                                <TicketIcon fontSize="small" color="action" />

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    flexWrap="wrap"
                                  >
                                    {ticket.code && (
                                      <Chip size="small" label={ticket.code} />
                                    )}

                                    <Typography fontWeight={600} noWrap>
                                      {ticket.name}
                                    </Typography>
                                  </Stack>

                                  <Stack
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="center"
                                    mt={0.25}
                                  >
                                    {ticket.statusName && (
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        label={ticket.statusName}
                                      />
                                    )}

                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {ticket.responsibleName || "Unassigned"}
                                    </Typography>
                                  </Stack>
                                </Box>

                                <Tooltip title="Remove from milestone">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleRemoveTicket(milestone, ticket)
                                    }
                                    aria-label="Close"
                                  >
                                    <CloseIcon fontSize="small" />
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
          STATUS MENU
      ====================================================== */}

      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={closeStatusMenu}
      >
        {STATUS_OPTIONS.map((status) => (
          <MenuItem
            key={status}
            selected={statusMenuMilestone?.status === status}
            onClick={() => handleStatusChange(status)}
          >
            <Chip
              size="small"
              label={STATUS_META[status].label}
              color={STATUS_META[status].color}
              sx={{ mr: 1 }}
            />
            {STATUS_META[status].label}
          </MenuItem>
        ))}
      </Menu>

      {/* =====================================================
          CREATE / EDIT DIALOG
      ====================================================== */}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {dialogMode === "edit" ? "Edit Milestone" : "Create Milestone"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <TextField
              label="Name"
              value={form.name}
              onChange={handleFormChange("name")}
              required
              fullWidth
              autoFocus
            />

            <TextField
              label="Description"
              value={form.description}
              onChange={handleFormChange("description")}
              multiline
              rows={3}
              fullWidth
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={handleFormChange("startDate")}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Due Date"
                type="date"
                value={form.dueDate}
                onChange={handleFormChange("dueDate")}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          ADD TICKETS DIALOG
      ====================================================== */}

      <Dialog
        open={addTicketsOpen}
        onClose={closeAddTickets}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Add Tickets
          {addTicketsMilestone ? ` to "${addTicketsMilestone.name}"` : ""}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search tickets by name or code"
            value={ticketSearch}
            onChange={(event) => setTicketSearch(event.target.value)}
            sx={{ mb: 2, mt: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {loadingProjectTickets ? (
            <Stack alignItems="center" py={3}>
              <CircularProgress size={24} />
            </Stack>
          ) : filteredCandidateTickets.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>
              No available tickets to add.
            </Typography>
          ) : (
            <List
              sx={{
                maxHeight: 360,
                overflowY: "auto",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              {filteredCandidateTickets.map((ticket) => (
                <ListItemButton
                  key={ticket.id}
                  onClick={() => toggleTicketSelected(ticket.id)}
                  dense
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      edge="start"
                      checked={selectedTicketIds.includes(ticket.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        {ticket.code && (
                          <Chip size="small" label={ticket.code} />
                        )}
                        <Typography>{ticket.name}</Typography>
                      </Stack>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flex: 1, ml: 1 }}
          >
            {selectedTicketIds.length} selected
          </Typography>

          <Button onClick={closeAddTickets} disabled={savingTickets}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleAddTickets}
            disabled={savingTickets || selectedTicketIds.length === 0}
          >
            {savingTickets
              ? "Adding..."
              : `Add ${selectedTicketIds.length || ""} Ticket${
                  selectedTicketIds.length === 1 ? "" : "s"
                }`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Milestones;

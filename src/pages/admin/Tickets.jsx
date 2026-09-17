import AddIcon from "@mui/icons-material/Add";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
  createTicket,
  deleteTicket,
  getActiveTickets,
  getDeletedTickets,
  getResolvedTickets,
  getTickets,
  restoreTicket,
  updateTicket,
} from "../../api/ticketApi";

import {
  createTicketRelation,
  deleteTicketRelation,
  getTicketRelationsByTicket,
} from "../../api/ticketRelationApi";

import {
  createTicketSavedView,
  deleteTicketSavedView,
  getTicketSavedViews,
  updateTicketSavedView,
} from "../../api/ticketSavedViewApi";

import { getActiveEpicsByProject } from "../../api/epicApi";
import { getProjectLabels } from "../../api/labelApi";
import { getProjectMilestones } from "../../api/milestoneApi";
import { getProjectUsers } from "../../api/projectUserApi";
import { getSprintsByProject } from "../../api/sprintApi";
import { getTicketPriorities } from "../../api/ticketPriorityApi";
import { getTicketStatuses } from "../../api/ticketStatusApi";
import { getTicketTypes } from "../../api/ticketTypeApi";

const emptyForm = {
  name: "",
  content: "",
  ownerId: "",
  responsibleId: "",
  statusId: "",
  projectId: "",
  typeId: "",
  order: 0,
  priorityId: "",
  estimation: 0,
  dueDate: "",
  epicId: "",
  sprintId: "",
  milestoneId: "",
  labelIds: [],
  parentId: "",
};

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

// Natural ascending ticket order:
// CCARES-1, CCARES-2, CCARES-9, CCARES-10, CCARES-11...
// Falls back to numeric ID when a ticket code is unavailable.
const compareTicketsAscending = (a, b) => {
  const getCode = (ticket) =>
    String(ticket?.code ?? ticket?.ticketCode ?? "").trim();

  const aCode = getCode(a);
  const bCode = getCode(b);

  const aMatch = aCode.match(/^(.*?)(\\d+)$/);
  const bMatch = bCode.match(/^(.*?)(\\d+)$/);

  if (aMatch && bMatch) {
    const aPrefix = aMatch[1].toLowerCase();
    const bPrefix = bMatch[1].toLowerCase();

    if (aPrefix === bPrefix) {
      const numberCompare = Number(aMatch[2]) - Number(bMatch[2]);

      if (numberCompare !== 0) {
        return numberCompare;
      }
    } else {
      const prefixCompare = aPrefix.localeCompare(bPrefix, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      if (prefixCompare !== 0) {
        return prefixCompare;
      }
    }
  } else if (aCode || bCode) {
    const codeCompare = aCode.localeCompare(bCode, undefined, {
      numeric: true,
      sensitivity: "base",
    });

    if (codeCompare !== 0) {
      return codeCompare;
    }
  }

  return Number(a?.id || 0) - Number(b?.id || 0);
};

export default function Tickets() {
  const { user, getPrimaryProjectId } = useAuth();
  const [tickets, setTickets] = useState([]);

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [types, setTypes] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [epics, setEpics] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [labels, setLabels] = useState([]);

  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [search, setSearch] = useState("");
  // Active is the default operational view. All/Resolved/Deleted are kept
  // as explicit historical views so old tickets do not overwhelm the daily list.
  const [ticketView, setTicketView] = useState("active");

  // ---------------------------------------------------------
  // TICKET LIST FILTERS (status/priority/assignee/sprint/epic/label/root)
  // ---------------------------------------------------------

  const [filterStatusId, setFilterStatusId] = useState("");
  const [filterPriorityId, setFilterPriorityId] = useState("");
  const [filterResponsibleId, setFilterResponsibleId] = useState("");
  const [filterSprintId, setFilterSprintId] = useState("");
  const [filterEpicId, setFilterEpicId] = useState("");
  const [filterLabelId, setFilterLabelId] = useState("");
  const [filterRootOnly, setFilterRootOnly] = useState(false);

  // ---------------------------------------------------------
  // SAVED TICKET VIEWS
  // ---------------------------------------------------------

  const [savedViews, setSavedViews] = useState([]);
  const [savedViewsLoading, setSavedViewsLoading] = useState(false);
  const [viewsMenuAnchor, setViewsMenuAnchor] = useState(null);
  const [selectedViewId, setSelectedViewId] = useState("");
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState("");
  const [savingView, setSavingView] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");

  const [selectedTicket, setSelectedTicket] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState(0);

  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [relations, setRelations] = useState([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [relationSaving, setRelationSaving] = useState(false);
  const [relationTicketId, setRelationTicketId] = useState("");
  const [relationType, setRelationType] = useState("RELATES_TO");

  const [commentsLoading, setCommentsLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const [attachments, setAttachments] = useState([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [ticketView]);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectMetadata(selectedProjectId);
      getProjectUsers(Number(selectedProjectId))
        .then((data) =>
          setUsers(
            Array.isArray(data)
              ? data
                  .map((m) => ({
                    id: m.userId ?? m.user?.id,
                    name: m.userName ?? m.user?.name,
                    fullName: m.userFullName ?? m.user?.fullName,
                    email: m.userEmail ?? m.user?.email,
                    role: m.role,
                  }))
                  .filter((u) => u.id != null)
              : [],
          ),
        )
        .catch(() => setUsers([]));
    } else {
      clearProjectMetadata();
      setUsers([]);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    // Project-scoped filter values (and the active saved view) no longer
    // apply once the selected project changes.
    setFilterEpicId("");
    setFilterSprintId("");
    setFilterLabelId("");
    setSelectedViewId("");

    if (selectedProjectId) {
      loadSavedViews(selectedProjectId);
    } else {
      setSavedViews([]);
    }
  }, [selectedProjectId]);

  const loadMasterData = async () => {
    try {
      setLoading(true);

      const [statusesData, typesData, prioritiesData] = await Promise.all([
        getTicketStatuses(),
        getTicketTypes(),
        getTicketPriorities(),
      ]);

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

      setUsers([]);

      setStatuses(Array.isArray(statusesData) ? statusesData : []);

      setTypes(Array.isArray(typesData) ? typesData : []);

      setPriorities(Array.isArray(prioritiesData) ? prioritiesData : []);

      const currentProjectIds = new Set(
        projectList.map((project) => Number(project.id)),
      );

      if (
        selectedProjectId &&
        !currentProjectIds.has(Number(selectedProjectId))
      ) {
        setSelectedProjectId("");
      }

      if (projectList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(String(projectList[0].id));
      }
    } catch (error) {
      showMessage(
        getErrorMessage(error, "Failed to load master data"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const clearProjectMetadata = () => {
    setEpics([]);
    setSprints([]);
    setMilestones([]);
    setLabels([]);
  };

  const loadProjectMetadata = async (projectId) => {
    if (!projectId) {
      clearProjectMetadata();
      return;
    }

    try {
      setMetadataLoading(true);

      const [epicsData, sprintsData, milestonesData, labelsData] =
        await Promise.all([
          getActiveEpicsByProject(projectId),
          getSprintsByProject(projectId),
          getProjectMilestones(projectId),
          getProjectLabels(projectId),
        ]);

      setEpics(Array.isArray(epicsData) ? epicsData : []);

      setSprints(Array.isArray(sprintsData) ? sprintsData : []);

      setMilestones(Array.isArray(milestonesData) ? milestonesData : []);

      setLabels(Array.isArray(labelsData) ? labelsData : []);
    } catch (error) {
      clearProjectMetadata();

      showMessage(
        getErrorMessage(error, "Failed to load project ticket metadata"),
        "error",
      );
    } finally {
      setMetadataLoading(false);
    }
  };

  // ---------------------------------------------------------
  // SAVED VIEWS: LOAD / APPLY / SAVE / UPDATE / DELETE
  // ---------------------------------------------------------

  const loadSavedViews = async (projectId) => {
    try {
      setSavedViewsLoading(true);

      const data = await getTicketSavedViews(projectId);

      setSavedViews(Array.isArray(data) ? data : []);
    } catch (error) {
      setSavedViews([]);

      showMessage(
        getErrorMessage(error, "Failed to load saved views"),
        "error",
      );
    } finally {
      setSavedViewsLoading(false);
    }
  };

  const applySavedView = (view) => {
    setSearch(view.q || "");
    setFilterStatusId(view.statusId ? String(view.statusId) : "");
    setFilterPriorityId(view.priorityId ? String(view.priorityId) : "");
    setFilterResponsibleId(
      view.responsibleId ? String(view.responsibleId) : "",
    );
    setFilterSprintId(view.sprintId ? String(view.sprintId) : "");
    setFilterEpicId(view.epicId ? String(view.epicId) : "");
    setFilterLabelId(view.labelId ? String(view.labelId) : "");
    setFilterRootOnly(Boolean(view.rootOnly));

    setSelectedViewId(String(view.id));

    setViewsMenuAnchor(null);
  };

  const buildCurrentFilterPayload = () => ({
    q: search.trim(),
    statusId: filterStatusId ? Number(filterStatusId) : null,
    priorityId: filterPriorityId ? Number(filterPriorityId) : null,
    responsibleId: filterResponsibleId ? Number(filterResponsibleId) : null,
    sprintId: filterSprintId ? Number(filterSprintId) : null,
    epicId: filterEpicId ? Number(filterEpicId) : null,
    labelId: filterLabelId ? Number(filterLabelId) : null,
    rootOnly: filterRootOnly,
  });

  const openSaveViewDialog = () => {
    if (!selectedProjectId) {
      showMessage("Select a project first", "error");
      return;
    }

    setSaveViewName("");
    setSaveViewDialogOpen(true);
  };

  const handleCloseSaveViewDialog = () => {
    if (savingView) {
      return;
    }

    setSaveViewDialogOpen(false);
  };

  const handleSaveView = async () => {
    if (savingView) {
      return;
    }

    if (!saveViewName.trim()) {
      showMessage("View name is required", "error");
      return;
    }

    try {
      setSavingView(true);

      const created = await createTicketSavedView(selectedProjectId, {
        name: saveViewName.trim(),
        ...buildCurrentFilterPayload(),
      });

      showMessage("View saved", "success");

      setSaveViewDialogOpen(false);

      await loadSavedViews(selectedProjectId);

      if (created?.id) {
        setSelectedViewId(String(created.id));
      }
    } catch (error) {
      showMessage(getErrorMessage(error, "Failed to save view"), "error");
    } finally {
      setSavingView(false);
    }
  };

  const handleUpdateView = async (view, event) => {
    event?.stopPropagation();

    try {
      await updateTicketSavedView(selectedProjectId, view.id, {
        name: view.name,
        ...buildCurrentFilterPayload(),
      });

      showMessage("View updated with current filters", "success");

      await loadSavedViews(selectedProjectId);
    } catch (error) {
      showMessage(getErrorMessage(error, "Failed to update view"), "error");
    }
  };

  const handleDeleteView = async (view, event) => {
    event?.stopPropagation();

    try {
      await deleteTicketSavedView(selectedProjectId, view.id);

      showMessage("View deleted", "success");

      if (String(selectedViewId) === String(view.id)) {
        setSelectedViewId("");
      }

      await loadSavedViews(selectedProjectId);
    } catch (error) {
      showMessage(getErrorMessage(error, "Failed to delete view"), "error");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilterStatusId("");
    setFilterPriorityId("");
    setFilterResponsibleId("");
    setFilterSprintId("");
    setFilterEpicId("");
    setFilterLabelId("");
    setFilterRootOnly(false);
    setSelectedViewId("");
  };

  const loadTickets = async () => {
    try {
      setLoading(true);

      const data =
        ticketView === "all"
          ? await getTickets()
          : ticketView === "resolved"
            ? await getResolvedTickets()
            : ticketView === "deleted"
              ? await getDeletedTickets()
              : await getActiveTickets();

      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      setTickets([]);

      showMessage(getErrorMessage(error, "Failed to load tickets"), "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    const value = search.trim().toLowerCase();

    let result = tickets;

    if (selectedProjectId) {
      result = result.filter(
        (ticket) => Number(ticket.projectId) === Number(selectedProjectId),
      );
    }

    if (filterStatusId) {
      result = result.filter(
        (ticket) => Number(ticket.statusId) === Number(filterStatusId),
      );
    }

    if (filterPriorityId) {
      result = result.filter(
        (ticket) => Number(ticket.priorityId) === Number(filterPriorityId),
      );
    }

    if (filterResponsibleId) {
      result = result.filter(
        (ticket) =>
          Number(ticket.responsibleId) === Number(filterResponsibleId),
      );
    }

    if (filterSprintId) {
      result = result.filter(
        (ticket) => Number(ticket.sprintId) === Number(filterSprintId),
      );
    }

    if (filterEpicId) {
      result = result.filter(
        (ticket) => Number(ticket.epicId) === Number(filterEpicId),
      );
    }

    if (filterLabelId) {
      result = result.filter((ticket) => {
        const ticketLabelIds = Array.isArray(ticket.labelIds)
          ? ticket.labelIds.map(String)
          : Array.isArray(ticket.labels)
            ? ticket.labels.map((label) => String(label?.id)).filter(Boolean)
            : [];

        return ticketLabelIds.includes(String(filterLabelId));
      });
    }

    if (filterRootOnly) {
      result = result.filter((ticket) => !ticket.parentId);
    }

    if (!value) {
      return [...result].sort(compareTicketsAscending);
    }

    result = result.filter((ticket) => {
      const labelText = Array.isArray(ticket.labels)
        ? ticket.labels
            .map((label) => label?.name || label?.labelName || "")
            .join(" ")
        : "";

      return (
        ticket.name?.toLowerCase().includes(value) ||
        ticket.code?.toLowerCase().includes(value) ||
        String(ticket.id).toLowerCase().includes(value) ||
        ticket.epicName?.toLowerCase().includes(value) ||
        ticket.sprintName?.toLowerCase().includes(value) ||
        ticket.milestoneName?.toLowerCase().includes(value) ||
        labelText.toLowerCase().includes(value)
      );
    });

    return [...result].sort(compareTicketsAscending);
  }, [
    tickets,
    selectedProjectId,
    search,
    filterStatusId,
    filterPriorityId,
    filterResponsibleId,
    filterSprintId,
    filterEpicId,
    filterLabelId,
    filterRootOnly,
  ]);

  const openCreate = () => {
    setDialogMode("create");
    setSelectedTicket(null);

    setForm({
      ...emptyForm,
      projectId: selectedProjectId,
    });

    setDialogOpen(true);
  };

  const openEdit = async (ticket) => {
    const projectId = ticket.projectId || selectedProjectId;

    setDialogMode("edit");
    setSelectedTicket(ticket);

    setSelectedProjectId(projectId ? String(projectId) : "");

    if (projectId) {
      await loadProjectMetadata(projectId);
    }

    setForm({
      name: ticket.name || "",
      content: ticket.content || "",
      ownerId: ticket.ownerId ? String(ticket.ownerId) : "",
      responsibleId: ticket.responsibleId ? String(ticket.responsibleId) : "",
      statusId: ticket.statusId ? String(ticket.statusId) : "",
      projectId: projectId ? String(projectId) : "",
      typeId: ticket.typeId ? String(ticket.typeId) : "",
      order: ticket.order ?? 0,
      priorityId: ticket.priorityId ? String(ticket.priorityId) : "",
      estimation: ticket.estimation ?? 0,
      dueDate: ticket.dueDate ? String(ticket.dueDate).slice(0, 16) : "",
      epicId: ticket.epicId ? String(ticket.epicId) : "",
      sprintId: ticket.sprintId ? String(ticket.sprintId) : "",
      milestoneId: ticket.milestoneId ? String(ticket.milestoneId) : "",
      labelIds: getTicketLabelIds(ticket),
      parentId: ticket.parentId ? String(ticket.parentId) : "",
    });

    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);

    setSelectedTicket(null);

    setForm({
      ...emptyForm,
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "projectId") {
      setForm((previous) => ({
        ...previous,
        projectId: value,
        epicId: "",
        sprintId: "",
        milestoneId: "",
        labelIds: [],
        parentId: "",
      }));

      setSelectedProjectId(value);
      setUsers([]);

      return;
    }

    if (name === "labelIds") {
      const selectedValues = Array.isArray(value) ? value : [];

      setForm((previous) => ({
        ...previous,
        labelIds: selectedValues,
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const buildPayload = () => {
    return {
      name: form.name.trim(),
      content: form.content.trim(),
      ownerId: Number(form.ownerId),
      responsibleId: form.responsibleId ? Number(form.responsibleId) : null,
      statusId: Number(form.statusId),
      projectId: Number(form.projectId),
      typeId: Number(form.typeId),
      order: Number(form.order || 0),
      priorityId: Number(form.priorityId),
      estimation: Number(form.estimation || 0),
      dueDate: form.dueDate || null,
      epicId: form.epicId ? Number(form.epicId) : null,
      sprintId: form.sprintId ? Number(form.sprintId) : null,
      milestoneId: form.milestoneId ? Number(form.milestoneId) : null,
      labelIds: Array.isArray(form.labelIds)
        ? form.labelIds.filter(Boolean).map(Number)
        : [],
      parentId: form.parentId ? Number(form.parentId) : null,
    };
  };

  const validateForm = () => {
    if (!form.projectId) {
      showMessage("Please select a project", "error");
      return false;
    }

    const selectedProject = projects.find(
      (project) => Number(project.id) === Number(form.projectId),
    );

    if (!selectedProject) {
      showMessage("Selected project does not exist", "error");
      return false;
    }

    if (!form.name.trim()) {
      showMessage("Ticket name is required", "error");
      return false;
    }

    if (form.name.trim().length > 255) {
      showMessage("Ticket name must not exceed 255 characters", "error");
      return false;
    }

    if (!form.content.trim()) {
      showMessage("Ticket description is required", "error");
      return false;
    }

    if (!form.ownerId) {
      showMessage("Reporter is required", "error");
      return false;
    }

    if (!form.statusId) {
      showMessage("Status is required", "error");
      return false;
    }

    if (!form.typeId) {
      showMessage("Type is required", "error");
      return false;
    }

    if (!form.priorityId) {
      showMessage("Priority is required", "error");
      return false;
    }

    if (Number(form.order) < 0) {
      showMessage("Order cannot be negative", "error");
      return false;
    }

    if (Number(form.estimation) < 0) {
      showMessage("Estimation cannot be negative", "error");
      return false;
    }

    if (
      dialogMode === "edit" &&
      selectedTicket &&
      Number(selectedTicket.projectId) !== Number(form.projectId)
    ) {
      showMessage("Ticket project cannot be changed during edit", "error");
      return false;
    }

    const existingUserIds = new Set(users.map((user) => Number(user.id)));

    if (!existingUserIds.has(Number(form.ownerId))) {
      showMessage("Reporter must be an existing user", "error");
      return false;
    }

    if (
      form.responsibleId &&
      !existingUserIds.has(Number(form.responsibleId))
    ) {
      showMessage("Assignee must be an existing user", "error");
      return false;
    }

    return true;
  };

  const saveTicket = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayload();

      if (dialogMode === "edit" && selectedTicket) {
        await updateTicket(selectedTicket.id, payload);

        showMessage("Ticket updated successfully", "success");
      } else {
        await createTicket(payload);

        showMessage("Ticket created successfully", "success");
      }

      closeDialog();

      await loadTickets();
    } catch (error) {
      showMessage(getErrorMessage(error, "Failed to save ticket"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ticket) => {
    const confirmed = window.confirm(`Delete ticket "${ticket.name}"?`);

    if (!confirmed) return;

    try {
      await deleteTicket(ticket.id);

      showMessage("Ticket deleted successfully", "success");

      await loadTickets();
    } catch (error) {
      showMessage(getErrorMessage(error, "Failed to delete ticket"), "error");
    }
  };

  const handleRestore = async (ticket) => {
    try {
      await restoreTicket(ticket.id);

      showMessage("Ticket restored successfully", "success");

      await loadTickets();
    } catch (error) {
      showMessage(getErrorMessage(error, "Failed to restore ticket"), "error");
    }
  };

  const openTicketDetails = async (ticket) => {
    setSelectedTicket(ticket);
    setDetailTab(0);
    setDetailOpen(true);
    setRelations([]);
    setRelationTicketId("");
    setRelationType("RELATES_TO");

    await Promise.all([
      loadComments(ticket.id),
      loadActivity(ticket.id),
      loadRelations(ticket.id),
    ]);
  };

  const loadComments = async (ticketId) => {
    if (!ticketId) return;

    try {
      setCommentsLoading(true);

      const data = await getTicketComments(ticketId);

      setComments(normalizeArray(data));
    } catch (error) {
      showMessage(getErrorMessage(error, "Failed to load comments"), "error");
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadActivity = async (ticketId) => {
    if (!ticketId) return;

    try {
      setActivityLoading(true);

      const data = await getTicketActivity(ticketId);

      setActivity(normalizeArray(data));
    } catch (error) {
      showMessage(
        getErrorMessage(error, "Failed to load ticket activity"),
        "error",
      );
    } finally {
      setActivityLoading(false);
    }
  };

  const addComment = async () => {
    const value = commentText.trim();

    if (!value) return;

    if (!selectedTicket?.id) return;

    try {
      setCommentSaving(true);

      await createTicketComment(selectedTicket.id, value);

      setCommentText("");

      await loadComments(selectedTicket.id);

      await loadActivity(selectedTicket.id);

      showMessage("Comment added successfully", "success");
    } catch (error) {
      showMessage(getErrorMessage(error, "Failed to add comment"), "error");
    } finally {
      setCommentSaving(false);
    }
  };

  const updateCommentHandler = async (commentId) => {
    const value = editingCommentText.trim();

    if (!value) return;

    try {
      setCommentSaving(true);

      await updateTicketComment(selectedTicket.id, commentId, value);

      setEditingCommentId(null);
      setEditingCommentText("");

      await loadComments(selectedTicket.id);

      await loadActivity(selectedTicket.id);
    } catch (error) {
      showMessage(getErrorMessage(error, "Failed to update comment"), "error");
    } finally {
      setCommentSaving(false);
    }
  };

  const deleteCommentHandler = async (commentId) => {
    const confirmed = window.confirm("Delete this comment?");

    if (!confirmed) return;

    try {
      await deleteTicketComment(selectedTicket.id, commentId);

      await loadComments(selectedTicket.id);

      await loadActivity(selectedTicket.id);

      showMessage("Comment deleted successfully", "success");
    } catch (error) {
      showMessage(getErrorMessage(error, "Failed to delete comment"), "error");
    }
  };

  const loadRelations = async (ticketId) => {
    if (!ticketId) return;

    try {
      setRelationsLoading(true);

      const data = await getTicketRelationsByTicket(ticketId);
      setRelations(normalizeArray(data));
    } catch (error) {
      setRelations([]);
      showMessage(
        getErrorMessage(error, "Failed to load ticket relations"),
        "error",
      );
    } finally {
      setRelationsLoading(false);
    }
  };

  const addRelation = async () => {
    if (!selectedTicket?.id || !relationTicketId) {
      showMessage("Please select a related ticket", "error");
      return;
    }

    if (Number(selectedTicket.id) === Number(relationTicketId)) {
      showMessage("A ticket cannot be related to itself", "error");
      return;
    }

    try {
      setRelationSaving(true);

      await createTicketRelation({
        ticketId: Number(selectedTicket.id),
        relationId: Number(relationTicketId),
        type: relationType.trim() || "RELATES_TO",
      });

      await loadRelations(selectedTicket.id);
      await loadActivity(selectedTicket.id);

      setRelationTicketId("");
      setRelationType("RELATES_TO");

      showMessage("Ticket relation added successfully", "success");
    } catch (error) {
      showMessage(
        getErrorMessage(error, "Failed to add ticket relation"),
        "error",
      );
    } finally {
      setRelationSaving(false);
    }
  };

  const removeRelation = async (relation) => {
    const relationId = relation?.id ?? relation?.relationId;

    if (!relationId) {
      showMessage("Invalid ticket relation", "error");
      return;
    }

    const confirmed = window.confirm("Delete this ticket relation?");

    if (!confirmed) return;

    try {
      setRelationSaving(true);

      await deleteTicketRelation(relationId);
      await loadRelations(selectedTicket?.id);
      await loadActivity(selectedTicket?.id);

      showMessage("Ticket relation deleted successfully", "success");
    } catch (error) {
      showMessage(
        getErrorMessage(error, "Failed to delete ticket relation"),
        "error",
      );
    } finally {
      setRelationSaving(false);
    }
  };

  const getRelationTicketId = (relation) => {
    if (!relation) return null;

    return (
      relation.relationId ??
      relation.relatedTicketId ??
      relation.ticketId ??
      relation.relatedId ??
      null
    );
  };

  const getRelationType = (relation) => {
    return relation?.type || relation?.relationType || "RELATES_TO";
  };

  const getRelationTicket = (relation) => {
    const relatedId = getRelationTicketId(relation);

    return tickets.find((ticket) => Number(ticket.id) === Number(relatedId));
  };

  const handleAttachmentSelect = (event) => {
    const selected = Array.from(event.target.files || []);

    const valid = [];
    const invalid = [];

    selected.forEach((file) => {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        invalid.push(file.name);
      } else {
        valid.push(file);
      }
    });

    if (invalid.length > 0) {
      showMessage(`File exceeds 10 MB: ${invalid.join(", ")}`, "error");
    }

    setAttachments((previous) => [...previous, ...valid]);

    event.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments((previous) => previous.filter((_, i) => i !== index));
  };

  const getErrorMessage = (error, fallback) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallback
    );
  };

  const getProjectName = (projectId) => {
    const project = projects.find(
      (item) => Number(item.id) === Number(projectId),
    );

    return project?.name || "-";
  };

  const getEpicName = (ticket) => {
    if (!ticket) return "-";

    if (ticket.epicName) {
      return ticket.epicName;
    }

    const epic = epics.find(
      (item) => Number(item.id) === Number(ticket.epicId),
    );

    return epic?.name || "-";
  };

  const getSprintName = (ticket) => {
    if (!ticket) return "Backlog";

    if (ticket.sprintName) {
      return ticket.sprintName;
    }

    const sprint = sprints.find(
      (item) => Number(item.id) === Number(ticket.sprintId),
    );

    return sprint?.name || "Backlog";
  };

  const getMilestoneName = (ticket) => {
    if (!ticket) return "-";

    if (ticket.milestoneName) {
      return ticket.milestoneName;
    }

    const milestone = milestones.find(
      (item) => Number(item.id) === Number(ticket.milestoneId),
    );

    return milestone?.name || "-";
  };

  const getUserName = (userId) => {
    const user = users.find((item) => Number(item.id) === Number(userId));

    return user?.name || user?.fullName || user?.email || "-";
  };

  const getEstimation = (estimation) => {
    if (estimation === null || estimation === undefined || estimation === "") {
      return "-";
    }

    return `${Number(estimation).toFixed(2)} h`;
  };

  const getTicketLabelIds = (ticket) => {
    if (Array.isArray(ticket.labelIds)) {
      return ticket.labelIds.map(String);
    }

    if (Array.isArray(ticket.labels)) {
      return ticket.labels
        .map((label) => label?.id)
        .filter(Boolean)
        .map(String);
    }

    return [];
  };

  const getTicketLabels = (ticket) => {
    if (Array.isArray(ticket.labels)) {
      return ticket.labels;
    }

    if (Array.isArray(ticket.labelIds)) {
      return ticket.labelIds
        .map((id) => labels.find((label) => Number(label.id) === Number(id)))
        .filter(Boolean);
    }

    return [];
  };

  const getStatusName = (statusId) => {
    const status = statuses.find(
      (item) => Number(item.id) === Number(statusId),
    );

    return status?.name || "-";
  };

  const getPriorityName = (priorityId) => {
    const priority = priorities.find(
      (item) => Number(item.id) === Number(priorityId),
    );

    return priority?.name || "-";
  };

  const getTypeName = (typeId) => {
    const type = types.find((item) => Number(item.id) === Number(typeId));

    return type?.name || "-";
  };

  const showMessage = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  return (
    <Box className="app-page pm-fade-up">
      <Stack
        className="page-header"
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
      >
        <Box>
          {/* <span className="pm-eyebrow">Delivery</span> */}
          <Typography
            variant="h1"
            className="pm-gradient-title"
            sx={{ display: "inline-block", mt: 0.5 }}
          >
            Tickets
          </Typography>

          <Typography className="page-subtitle">
            Manage project tickets, sprints, milestones, labels and epics.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadTickets}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            disabled={projects.length === 0}
          >
            Add Ticket
          </Button>
        </Stack>
      </Stack>

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
                onChange={(event) => setSelectedProjectId(event.target.value)}
                disabled={projects.length === 0}
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
              label="Search Ticket"
              placeholder="Name, code, epic, sprint, milestone, label..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <FormControl fullWidth sx={{ minWidth: 180 }}>
              <InputLabel>Ticket View</InputLabel>
              <Select
                value={ticketView}
                label="Ticket View"
                onChange={(event) => setTicketView(event.target.value)}
              >
                <MenuItem value="active">Active Tickets</MenuItem>
                <MenuItem value="all">All Tickets</MenuItem>
                <MenuItem value="resolved">Resolved / Closed</MenuItem>
                <MenuItem value="deleted">Deleted Tickets</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* =================================================
              ADVANCED FILTERS (status / priority / assignee /
              sprint / epic / label / root only)
          ================================================== */}

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
            sx={{ mt: 2 }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>

              <Select
                value={filterStatusId}
                label="Status"
                onChange={(event) => setFilterStatusId(event.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>

                {statuses.map((status) => (
                  <MenuItem key={status.id} value={String(status.id)}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>

              <Select
                value={filterPriorityId}
                label="Priority"
                onChange={(event) => setFilterPriorityId(event.target.value)}
              >
                <MenuItem value="">All Priorities</MenuItem>

                {priorities.map((priority) => (
                  <MenuItem key={priority.id} value={String(priority.id)}>
                    {priority.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Assignee</InputLabel>

              <Select
                value={filterResponsibleId}
                label="Assignee"
                onChange={(event) => setFilterResponsibleId(event.target.value)}
              >
                <MenuItem value="">All Assignees</MenuItem>

                {users.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {user.name || user.fullName || user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Sprint</InputLabel>

              <Select
                value={filterSprintId}
                label="Sprint"
                onChange={(event) => setFilterSprintId(event.target.value)}
                disabled={!selectedProjectId || sprints.length === 0}
              >
                <MenuItem value="">All Sprints</MenuItem>

                {sprints.map((sprint) => (
                  <MenuItem key={sprint.id} value={String(sprint.id)}>
                    {sprint.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Epic</InputLabel>

              <Select
                value={filterEpicId}
                label="Epic"
                onChange={(event) => setFilterEpicId(event.target.value)}
                disabled={!selectedProjectId || epics.length === 0}
              >
                <MenuItem value="">All Epics</MenuItem>

                {epics.map((epic) => (
                  <MenuItem key={epic.id} value={String(epic.id)}>
                    {epic.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Label</InputLabel>

              <Select
                value={filterLabelId}
                label="Label"
                onChange={(event) => setFilterLabelId(event.target.value)}
                disabled={!selectedProjectId || labels.length === 0}
              >
                <MenuItem value="">All Labels</MenuItem>

                {labels.map((label) => (
                  <MenuItem key={label.id} value={String(label.id)}>
                    {label.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              sx={{
                whiteSpace: "nowrap",
                justifyContent: "center",
              }}
              control={
                <Switch
                  checked={filterRootOnly}
                  onChange={(event) => setFilterRootOnly(event.target.checked)}
                />
              }
              label="Root only"
            />
          </Stack>

          {/* =================================================
              SAVED VIEWS
          ================================================== */}

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 2 }}
          >
            <Button
              variant="outlined"
              startIcon={<BookmarkIcon />}
              onClick={(event) => setViewsMenuAnchor(event.currentTarget)}
              disabled={!selectedProjectId}
            >
              Views{savedViews.length > 0 ? ` (${savedViews.length})` : ""}
            </Button>

            <Menu
              anchorEl={viewsMenuAnchor}
              open={Boolean(viewsMenuAnchor)}
              onClose={() => setViewsMenuAnchor(null)}
            >
              {savedViewsLoading ? (
                <MenuItem disabled>Loading views...</MenuItem>
              ) : savedViews.length === 0 ? (
                <MenuItem disabled>No saved views for this project</MenuItem>
              ) : (
                savedViews.map((view) => (
                  <MenuItem
                    key={view.id}
                    selected={String(selectedViewId) === String(view.id)}
                    onClick={() => applySavedView(view)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      minWidth: 260,
                    }}
                  >
                    <ListItemText primary={view.name} sx={{ flex: 1 }} />

                    <Tooltip title="Update view with current filters">
                      <IconButton
                        size="small"
                        onClick={(event) => handleUpdateView(view, event)}
                      >
                        <SaveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete view">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(event) => handleDeleteView(view, event)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </MenuItem>
                ))
              )}
            </Menu>

            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={openSaveViewDialog}
              disabled={!selectedProjectId}
            >
              Save Current Filters as View
            </Button>

            <Button size="small" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* =====================================================
          SAVE VIEW DIALOG
      ====================================================== */}

      <Dialog
        open={saveViewDialogOpen}
        onClose={handleCloseSaveViewDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Save Current Filters as View</DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="View Name"
            fullWidth
            value={saveViewName}
            onChange={(event) => setSaveViewName(event.target.value)}
            disabled={savingView}
            inputProps={{ maxLength: 255 }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button onClick={handleCloseSaveViewDialog} disabled={savingView}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveView}
            disabled={savingView}
          >
            {savingView ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent>
            <Typography textAlign="center" color="text.secondary">
              No tickets found.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredTickets.map((ticket) => {
            const ticketLabels = getTicketLabels(ticket);

            return (
              <Card
                key={ticket.id}
                sx={{
                  cursor: "pointer",
                  transition: "0.2s",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: 3,
                  },
                }}
                onClick={() => openTicketDetails(ticket)}
              >
                <CardContent>
                  <Stack
                    direction={{
                      xs: "column",
                      md: "row",
                    }}
                    spacing={2}
                    alignItems={{
                      xs: "stretch",
                      md: "center",
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Typography variant="h6" fontWeight={600}>
                          {ticket.name}
                        </Typography>

                        {ticket.code && (
                          <Chip size="small" label={ticket.code} />
                        )}

                        {ticket.deletedAt && (
                          <Chip size="small" color="error" label="Deleted" />
                        )}
                      </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.75}
                      >
                        Project: {getProjectName(ticket.projectId)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Status: {getStatusName(ticket.statusId)} · Priority:{" "}
                        {getPriorityName(ticket.priorityId)} · Type:{" "}
                        {getTypeName(ticket.typeId)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Epic: {getEpicName(ticket)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Sprint: {getSprintName(ticket)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Milestone: {getMilestoneName(ticket)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Reporter: {getUserName(ticket.ownerId)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Assignee: {getUserName(ticket.responsibleId)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Estimation: {getEstimation(ticket.estimation)}
                      </Typography>

                      {ticketLabels.length > 0 && (
                        <Stack
                          direction="row"
                          spacing={0.75}
                          flexWrap="wrap"
                          mt={1}
                        >
                          {ticketLabels.map((label, index) => (
                            <Chip
                              key={label?.id ?? index}
                              size="small"
                              label={label?.name || label?.labelName || label}
                            />
                          ))}
                        </Stack>
                      )}
                    </Box>

                    <Stack
                      direction="row"
                      spacing={1}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {!ticket.deletedAt ? (
                        <>
                          <Button
                            startIcon={<EditIcon />}
                            onClick={() => openEdit(ticket)}
                          >
                            Edit
                          </Button>

                          <Button
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(ticket)}
                          >
                            Delete
                          </Button>
                        </>
                      ) : (
                        <Button
                          color="success"
                          onClick={() => handleRestore(ticket)}
                        >
                          Restore
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: "92vh",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            px: 4,
            py: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {dialogMode === "edit" ? "Edit Ticket" : "Create New Ticket"}
            </Typography>

            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {dialogMode === "edit"
                ? "Update ticket details"
                : "Create a new project ticket"}
            </Typography>
          </Box>

          <IconButton onClick={closeDialog} disabled={saving}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent
          sx={{
            px: 4,
            py: 4,
          }}
        >
          {metadataLoading && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Loading project metadata...
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },
              gap: 3,
            }}
          >
            <FormControl fullWidth required sx={{ display: "none" }}>
              <InputLabel>Project</InputLabel>

              <Select
                name="projectId"
                value={form.projectId}
                label="Project"
                onChange={handleChange}
                disabled={dialogMode === "edit"}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="name"
              label="Ticket Name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>

              <Select
                name="typeId"
                value={form.typeId}
                label="Type"
                onChange={handleChange}
              >
                {types.map((type) => (
                  <MenuItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>

              <Select
                name="statusId"
                value={form.statusId}
                label="Status"
                onChange={handleChange}
              >
                {statuses.map((status) => (
                  <MenuItem key={status.id} value={String(status.id)}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Priority</InputLabel>

              <Select
                name="priorityId"
                value={form.priorityId}
                label="Priority"
                onChange={handleChange}
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority.id} value={String(priority.id)}>
                    {priority.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Reporter</InputLabel>

              <Select
                name="ownerId"
                value={form.ownerId}
                label="Reporter"
                onChange={handleChange}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {user.name || user.fullName || user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>

              <Select
                name="responsibleId"
                value={form.responsibleId}
                label="Assignee"
                onChange={handleChange}
              >
                <MenuItem value="">Unassigned</MenuItem>

                {users.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {user.name || user.fullName || user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Epic</InputLabel>

              <Select
                name="epicId"
                value={form.epicId}
                label="Epic"
                onChange={handleChange}
                disabled={!form.projectId}
              >
                <MenuItem value="">None</MenuItem>

                {epics.map((epic) => (
                  <MenuItem key={epic.id} value={String(epic.id)}>
                    {epic.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Milestone</InputLabel>

              <Select
                name="milestoneId"
                value={form.milestoneId}
                label="Milestone"
                onChange={handleChange}
                disabled={!form.projectId}
              >
                <MenuItem value="">None</MenuItem>

                {milestones.map((milestone) => (
                  <MenuItem key={milestone.id} value={String(milestone.id)}>
                    {milestone.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Parent Ticket</InputLabel>

              <Select
                name="parentId"
                value={form.parentId}
                label="Parent Ticket"
                onChange={handleChange}
              >
                <MenuItem value="">No Parent</MenuItem>

                {tickets
                  .filter(
                    (ticket) =>
                      Number(ticket.projectId) === Number(form.projectId) &&
                      Number(ticket.id) !== Number(selectedTicket?.id),
                  )
                  .map((ticket) => (
                    <MenuItem key={ticket.id} value={String(ticket.id)}>
                      {ticket.code
                        ? `${ticket.code} - ${ticket.name}`
                        : ticket.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              name="order"
              label="Order"
              type="number"
              value={form.order}
              onChange={handleChange}
              inputProps={{
                min: 0,
              }}
              fullWidth
            />

            <TextField
              name="estimation"
              label="Estimation (hours)"
              type="number"
              value={form.estimation}
              onChange={handleChange}
              inputProps={{
                min: 0,
                step: 0.5,
              }}
              fullWidth
            />

            <TextField
              name="dueDate"
              label="Due date & time"
              type="datetime-local"
              value={form.dueDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText="Project admins are notified automatically when this task becomes overdue."
            />

            <TextField
              name="content"
              label="Description"
              value={form.content}
              onChange={handleChange}
              fullWidth
              multiline
              minRows={5}
              maxRows={10}
              required
              sx={{
                gridColumn: {
                  xs: "span 1",
                  sm: "span 2",
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 4,
            py: 2.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button onClick={closeDialog} disabled={saving} variant="outlined">
            Cancel
          </Button>

          <Button variant="contained" onClick={saveTicket} disabled={saving}>
            {saving ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} color="inherit" />
                <span>Saving...</span>
              </Stack>
            ) : dialogMode === "edit" ? (
              "Update Ticket"
            ) : (
              "Create Ticket"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {selectedTicket?.name}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {selectedTicket?.code}
            </Typography>
          </Box>

          <IconButton onClick={() => setDetailOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Tabs
          value={detailTab}
          onChange={(_, value) => setDetailTab(value)}
          sx={{
            px: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Tab label="Details" />

          <Tab
            icon={<SendIcon fontSize="small" />}
            iconPosition="start"
            label="Comments"
          />

          <Tab
            icon={<HistoryIcon fontSize="small" />}
            iconPosition="start"
            label="Activity"
          />

          <Tab label="Relations" />

          <Tab
            icon={<AttachFileIcon fontSize="small" />}
            iconPosition="start"
            label="Attachments"
          />
        </Tabs>

        <DialogContent>
          {detailTab === 0 && (
            <Box sx={{ pt: 2 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <DetailItem
                  label="Project"
                  value={getProjectName(selectedTicket?.projectId)}
                />

                <DetailItem
                  label="Type"
                  value={getTypeName(selectedTicket?.typeId)}
                />

                <DetailItem
                  label="Status"
                  value={getStatusName(selectedTicket?.statusId)}
                />

                <DetailItem
                  label="Priority"
                  value={getPriorityName(selectedTicket?.priorityId)}
                />

                <DetailItem
                  label="Reporter"
                  value={getUserName(selectedTicket?.ownerId)}
                />

                <DetailItem
                  label="Assignee"
                  value={getUserName(selectedTicket?.responsibleId)}
                />

                <DetailItem label="Epic" value={getEpicName(selectedTicket)} />

                <DetailItem
                  label="Sprint"
                  value={getSprintName(selectedTicket)}
                />

                <DetailItem
                  label="Milestone"
                  value={getMilestoneName(selectedTicket)}
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography fontWeight={700} mb={1}>
                Description
              </Typography>

              <Typography
                sx={{
                  whiteSpace: "pre-wrap",
                }}
                color="text.secondary"
              >
                {selectedTicket?.content}
              </Typography>
            </Box>
          )}

          {detailTab === 1 && (
            <Box sx={{ pt: 2 }}>
              <Stack spacing={2}>
                <TextField
                  multiline
                  minRows={3}
                  fullWidth
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                />

                <Box display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={addComment}
                    disabled={commentSaving || !commentText.trim()}
                  >
                    {commentSaving ? "Posting..." : "Comment"}
                  </Button>
                </Box>

                {commentsLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : comments.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No comments yet.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {comments.map((comment, index) => {
                      const id = comment.id ?? comment.commentId ?? index;

                      const author =
                        comment.authorName ||
                        comment.userName ||
                        comment.author?.name ||
                        comment.user?.name ||
                        "User";

                      const text =
                        comment.content ||
                        comment.comment ||
                        comment.body ||
                        "";

                      const editing = editingCommentId === id;

                      return (
                        <Box key={id}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                          >
                            <Box flex={1}>
                              <Typography fontWeight={700}>{author}</Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatDate(
                                  comment.createdAt ||
                                    comment.createdDate ||
                                    comment.timestamp,
                                )}
                              </Typography>

                              {editing ? (
                                <Box mt={1}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    value={editingCommentText}
                                    onChange={(event) =>
                                      setEditingCommentText(event.target.value)
                                    }
                                  />

                                  <Stack direction="row" spacing={1} mt={1}>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => updateCommentHandler(id)}
                                    >
                                      Save
                                    </Button>

                                    <Button
                                      size="small"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingCommentText("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </Stack>
                                </Box>
                              ) : (
                                <Typography
                                  sx={{
                                    mt: 1,
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {text}
                                </Typography>
                              )}
                            </Box>

                            {!editing && (
                              <Stack direction="row">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingCommentId(id);
                                    setEditingCommentText(text);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>

                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => deleteCommentHandler(id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            )}
                          </Stack>

                          <Divider
                            sx={{
                              mt: 2,
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            </Box>
          )}

          {detailTab === 2 && (
            <Box sx={{ pt: 2 }}>
              {activityLoading ? (
                <Box display="flex" justifyContent="center" py={5}>
                  <CircularProgress />
                </Box>
              ) : activity.length === 0 ? (
                <Typography textAlign="center" color="text.secondary" py={5}>
                  No activity found.
                </Typography>
              ) : (
                <Stack>
                  {activity.map((event, index) => {
                    const actor =
                      event.actorName ||
                      event.userName ||
                      event.actor?.name ||
                      event.user?.name ||
                      "System";

                    const action =
                      event.action ||
                      event.eventType ||
                      event.type ||
                      "UPDATED";

                    const description =
                      event.description || buildActivityDescription(event);

                    return (
                      <Box
                        key={event.id ?? event.eventId ?? index}
                        sx={{
                          py: 2,
                        }}
                      >
                        <Stack direction="row" spacing={2}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              mt: 1,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                              flexShrink: 0,
                            }}
                          />

                          <Box>
                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              alignItems="center"
                            >
                              <Typography fontWeight={700}>{actor}</Typography>

                              <Chip size="small" label={action} />

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatDate(
                                  event.createdAt ||
                                    event.timestamp ||
                                    event.occurredAt,
                                )}
                              </Typography>
                            </Stack>

                            <Typography color="text.secondary" mt={0.5}>
                              {description}
                            </Typography>
                          </Box>
                        </Stack>

                        {index < activity.length - 1 && (
                          <Divider
                            sx={{
                              mt: 2,
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          )}

          {detailTab === 3 && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Ticket Relations
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3}>
                <FormControl fullWidth>
                  <InputLabel>Related Ticket</InputLabel>
                  <Select
                    value={relationTicketId}
                    label="Related Ticket"
                    onChange={(event) =>
                      setRelationTicketId(event.target.value)
                    }
                    disabled={relationSaving || !selectedTicket}
                  >
                    <MenuItem value="">Select ticket</MenuItem>

                    {tickets
                      .filter(
                        (ticket) =>
                          Number(ticket.id) !== Number(selectedTicket?.id),
                      )
                      .map((ticket) => (
                        <MenuItem key={ticket.id} value={String(ticket.id)}>
                          {ticket.code
                            ? `${ticket.code} - ${ticket.name}`
                            : ticket.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Relation Type"
                  value={relationType}
                  onChange={(event) => setRelationType(event.target.value)}
                  disabled={relationSaving}
                  placeholder="RELATES_TO"
                />

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addRelation}
                  disabled={
                    relationSaving || relationsLoading || !relationTicketId
                  }
                  sx={{ minWidth: 150 }}
                >
                  Add Relation
                </Button>
              </Stack>

              {relationsLoading ? (
                <Box display="flex" justifyContent="center" py={5}>
                  <CircularProgress />
                </Box>
              ) : relations.length === 0 ? (
                <Typography textAlign="center" color="text.secondary" py={5}>
                  No relations found.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {relations.map((relation, index) => {
                    const relatedTicket = getRelationTicket(relation);
                    const relatedId = getRelationTicketId(relation);
                    const relationKey =
                      relation?.id ??
                      relation?.relationId ??
                      `${relatedId}-${index}`;

                    return (
                      <Card
                        key={relationKey}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      >
                        <CardContent
                          sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            justifyContent="space-between"
                            alignItems={{ xs: "stretch", sm: "center" }}
                          >
                            <Box>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                flexWrap="wrap"
                              >
                                <Chip
                                  size="small"
                                  label={getRelationType(relation)}
                                />

                                <Typography fontWeight={600}>
                                  {relatedTicket?.code
                                    ? `${relatedTicket.code} - ${relatedTicket.name}`
                                    : relatedTicket?.name ||
                                      `Ticket #${relatedId || "-"}`}
                                </Typography>
                              </Stack>

                              {!relatedTicket && relatedId && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Related ticket ID: {relatedId}
                                </Typography>
                              )}
                            </Box>

                            <IconButton
                              color="error"
                              onClick={() => removeRelation(relation)}
                              disabled={relationSaving}
                              aria-label="Delete relation"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Box>
          )}

          {detailTab === 4 && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Maximum file size: 10 MB per file.
              </Alert>

              <Button
                component="label"
                variant="outlined"
                startIcon={<AttachFileIcon />}
              >
                Add Attachment
                <input
                  hidden
                  type="file"
                  multiple
                  onChange={handleAttachmentSelect}
                />
              </Button>

              <List sx={{ mt: 2 }}>
                {attachments.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="No attachments selected"
                      secondary="Select files to attach them to this ticket."
                    />
                  </ListItem>
                ) : (
                  attachments.map((file, index) => (
                    <ListItem
                      key={`${file.name}-${index}`}
                      secondaryAction={
                        <IconButton
                          color="error"
                          onClick={() => removeAttachment(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Box>
          )}
        </DialogContent>
      </Dialog>

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
          variant="filled"
          onClose={() =>
            setSnackbar((previous) => ({
              ...previous,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function DetailItem({ label, value }) {
  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      <Typography fontWeight={600} mt={0.5}>
        {value || "-"}
      </Typography>
    </Box>
  );
}

function normalizeArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.events)) {
    return data.events;
  }

  if (Array.isArray(data?.comments)) {
    return data.comments;
  }

  return [];
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString();
}

function buildActivityDescription(event) {
  const field = event.fieldName || event.field || event.metadata?.fieldName;

  const oldValue =
    event.oldValue ?? event.previousValue ?? event.metadata?.oldValue;

  const newValue =
    event.newValue ?? event.currentValue ?? event.metadata?.newValue;

  if (field) {
    return (
      `changed ${field}` +
      (oldValue !== undefined ? ` from ${oldValue}` : "") +
      (newValue !== undefined ? ` to ${newValue}` : "")
    );
  }

  return event.action || "updated the ticket";
}

/* -------------------------------------------------------------------------- */
/* API HELPERS                                                                */
/* -------------------------------------------------------------------------- */

async function getTicketComments(ticketId) {
  const api = await import("../../api/ticketApi");

  return api.getTicketComments(ticketId);
}

async function createTicketComment(ticketId, content) {
  const api = await import("../../api/ticketApi");

  return api.createTicketComment(ticketId, content);
}

async function updateTicketComment(ticketId, commentId, content) {
  const api = await import("../../api/ticketApi");

  return api.updateTicketComment(ticketId, commentId, content);
}

async function deleteTicketComment(ticketId, commentId) {
  const api = await import("../../api/ticketApi");

  return api.deleteTicketComment(ticketId, commentId);
}

async function getTicketActivity(ticketId) {
  const api = await import("../../api/ticketApi");

  return api.getTicketActivity(ticketId);
}

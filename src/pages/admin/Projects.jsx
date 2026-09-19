import AddIcon from "@mui/icons-material/Add";
import ArchiveIcon from "@mui/icons-material/Archive";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestoreIcon from "@mui/icons-material/Restore";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { Paper } from "@mui/material";

import {
  archiveProject,
  createProject,
  deleteProject,
  getProjects,
  restoreProject,
  unarchiveProject,
  updateProject,
} from "../../api/projectApi";

import { getActiveProjectStatuses } from "../../api/projectStatusApi";

import {
  createProjectUser,
  deleteProjectUser,
  getProjectUsers,
} from "../../api/projectUserApi";

import { getUsers } from "../../api/userApi";

import {
  createProjectFavorite,
  deleteProjectFavoriteByUserAndProject,
  getProjectFavoritesByUser,
} from "../../api/projectFavoriteApi";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function Projects() {
  const { user } = useAuth();
  const toast = useToast();

  const currentUserId = user?.id ?? user?.userId ?? null;

  // =========================================================
  // PROJECT DATA
  // =========================================================

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [loadingFormData, setLoadingFormData] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [loadingProjectUsers, setLoadingProjectUsers] = useState(false);
  const [addingProjectUser, setAddingProjectUser] = useState(false);
  const [removingProjectUser, setRemovingProjectUser] = useState(false);

  // =========================================================
  // PROJECT DIALOGS
  // =========================================================

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // =========================================================
  // PROJECT USER DIALOG
  // =========================================================

  const [projectUsersDialogOpen, setProjectUsersDialogOpen] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);

  const [projectUsers, setProjectUsers] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserRole, setSelectedUserRole] = useState("MEMBER");
  const [selectedResponsibilityRole, setSelectedResponsibilityRole] =
    useState("DEVELOPER");

  // =========================================================
  // PROJECT FORM
  // =========================================================

  const [form, setForm] = useState({
    name: "",
    description: "",
    ownerId: "",
    statusId: "",
    ticketPrefix: "",
    statusType: "default",
  });

  // =========================================================
  // MESSAGES
  // =========================================================

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // FAVORITES
  // =========================================================

  const [favoriteProjectIds, setFavoriteProjectIds] = useState(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [togglingFavoriteId, setTogglingFavoriteId] = useState(null);
  const [starredOnly, setStarredOnly] = useState(false);

  // =========================================================
  // LOAD PROJECTS
  // =========================================================

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProjects();

      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load projects:", err);

      setProjects([]);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load projects",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD FAVORITES
  // =========================================================

  const loadFavorites = async () => {
    if (!currentUserId) {
      setFavoriteProjectIds(new Set());
      return;
    }

    try {
      setFavoritesLoading(true);

      const data = await getProjectFavoritesByUser(currentUserId);

      const ids = Array.isArray(data)
        ? data.map((favorite) => Number(favorite.projectId ?? favorite.id))
        : [];

      setFavoriteProjectIds(new Set(ids));
    } catch (err) {
      console.error("Failed to load project favorites:", err);

      setFavoriteProjectIds(new Set());
    } finally {
      setFavoritesLoading(false);
    }
  };

  // =========================================================
  // TOGGLE FAVORITE (optimistic, revert on error)
  // =========================================================

  const handleToggleFavorite = async (project) => {
    if (!currentUserId) {
      toast.error("You must be logged in to favorite a project");
      return;
    }

    const projectId = Number(project.id);

    if (togglingFavoriteId === projectId) {
      return;
    }

    const wasFavorite = favoriteProjectIds.has(projectId);

    setTogglingFavoriteId(projectId);

    setFavoriteProjectIds((previous) => {
      const next = new Set(previous);

      if (wasFavorite) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }

      return next;
    });

    try {
      if (wasFavorite) {
        await deleteProjectFavoriteByUserAndProject(currentUserId, projectId);
      } else {
        await createProjectFavorite({
          userId: currentUserId,
          projectId,
        });
      }
    } catch (err) {
      console.error("Failed to toggle project favorite:", err);

      // Revert optimistic update.
      setFavoriteProjectIds((previous) => {
        const next = new Set(previous);

        if (wasFavorite) {
          next.add(projectId);
        } else {
          next.delete(projectId);
        }

        return next;
      });

      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to update favorite",
      );
    } finally {
      setTogglingFavoriteId(null);
    }
  };

  // =========================================================
  // LOAD USERS + STATUSES + ROLES
  // =========================================================

  const loadFormData = async () => {
    try {
      setLoadingFormData(true);
      setError("");

      const [usersData, statusesData] = await Promise.all([
        getUsers(),
        getActiveProjectStatuses(),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);

      setStatuses(Array.isArray(statusesData) ? statusesData : []);
    } catch (err) {
      console.error("Failed to load project form data:", err);

      setUsers([]);
      setStatuses([]);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load users or project statuses",
      );
    } finally {
      setLoadingFormData(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadProjects();
    loadFormData();
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [currentUserId]);

  // =========================================================
  // SET DEFAULT ROLE FROM DATABASE
  // =========================================================

  // =========================================================
  // RESET PROJECT FORM
  // =========================================================

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      ownerId: "",
      statusId: "",
      ticketPrefix: "",
      statusType: "default",
    });
  };

  // =========================================================
  // ADD PROJECT
  // =========================================================

  const handleAdd = async () => {
    if (saving || deleting || restoring) {
      return;
    }

    setSelectedProject(null);

    resetForm();

    setError("");

    if (users.length === 0 || statuses.length === 0) {
      await loadFormData();
    }

    setDialogOpen(true);
  };

  // =========================================================
  // EDIT PROJECT
  // =========================================================

  const handleEdit = async (project) => {
    if (saving || deleting || restoring) {
      return;
    }

    setSelectedProject(project);

    setForm({
      name: project.name || "",
      description: project.description || "",
      ownerId: project.ownerId || "",
      statusId: project.statusId || "",
      ticketPrefix: project.ticketPrefix || "",
      statusType: project.statusType || "default",
    });

    setError("");

    if (users.length === 0 || statuses.length === 0) {
      await loadFormData();
    }

    setDialogOpen(true);
  };

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // SAVE PROJECT
  // =========================================================

  const handleSave = async () => {
    if (saving) {
      return;
    }

    setError("");

    if (!form.name.trim()) {
      setError("Project name is required");
      return;
    }

    if (!form.ownerId) {
      setError("Owner is required");
      return;
    }

    const selectedOwner = users.find(
      (user) => Number(user.id) === Number(form.ownerId),
    );

    if (!selectedOwner) {
      setError("Selected owner does not exist");
      return;
    }

    if (!form.statusId) {
      setError("Status is required");
      return;
    }

    if (!form.ticketPrefix.trim()) {
      setError("Ticket prefix is required");
      return;
    }

    if (form.name.trim().length > 255) {
      setError("Project name must not exceed 255 characters");
      return;
    }

    if (form.ticketPrefix.trim().length > 255) {
      setError("Ticket prefix must not exceed 255 characters");
      return;
    }

    if (form.statusType.trim().length > 255) {
      setError("Status type must not exceed 255 characters");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      ownerId: Number(form.ownerId),
      statusId: Number(form.statusId),
      ticketPrefix: form.ticketPrefix.trim(),
      statusType: form.statusType.trim() || "default",
    };

    try {
      setSaving(true);

      if (selectedProject) {
        await updateProject(selectedProject.id, payload);

        setSuccess("Project updated successfully");
      } else {
        await createProject(payload);

        setSuccess("Project created successfully");
      }

      setDialogOpen(false);

      setSelectedProject(null);

      resetForm();

      await loadProjects();
    } catch (err) {
      console.error("Failed to save project:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to save project",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE CLICK
  // =========================================================

  const handleDeleteClick = (project) => {
    if (deleting || saving || restoring) {
      return;
    }

    setSelectedProject(project);

    setError("");

    setDeleteDialogOpen(true);
  };

  // =========================================================
  // DELETE PROJECT
  // =========================================================

  const handleDelete = async () => {
    if (!selectedProject || deleting) {
      return;
    }

    try {
      setDeleting(true);

      setError("");

      await deleteProject(selectedProject.id);

      setSuccess("Project deleted successfully");

      setDeleteDialogOpen(false);

      setSelectedProject(null);

      await loadProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to delete project",
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // RESTORE PROJECT
  // =========================================================

  const handleRestore = async (project) => {
    if (restoring || saving || deleting) {
      return;
    }

    try {
      setRestoring(true);

      setError("");

      await restoreProject(project.id);

      setSuccess("Project restored successfully");

      await loadProjects();
    } catch (err) {
      console.error("Failed to restore project:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to restore project",
      );
    } finally {
      setRestoring(false);
    }
  };

  // =========================================================
  // ARCHIVE / UNARCHIVE PROJECT
  // =========================================================

  const handleArchiveToggle = async (project) => {
    if (!project || archiving || saving || deleting || restoring) return;
    try {
      setArchiving(true);
      setError("");
      if (project.archivedAt) {
        await unarchiveProject(project.id);
        setSuccess("Project unarchived successfully");
      } else {
        await archiveProject(project.id);
        setSuccess("Project archived successfully");
      }
      await loadProjects();
    } catch (err) {
      console.error("Failed to update project archive state:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to update project archive state",
      );
    } finally {
      setArchiving(false);
    }
  };

  // =========================================================
  // CLOSE PROJECT DIALOG
  // =========================================================

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);

    setSelectedProject(null);

    setError("");

    resetForm();
  };

  // =========================================================
  // CLOSE DELETE DIALOG
  // =========================================================

  const handleCloseDeleteDialog = () => {
    if (deleting) {
      return;
    }

    setDeleteDialogOpen(false);

    setSelectedProject(null);
  };

  // =========================================================
  // LOAD PROJECT USERS
  // =========================================================

  const loadProjectUsers = async (projectId) => {
    try {
      setLoadingProjectUsers(true);

      setError("");

      const data = await getProjectUsers(projectId);

      setProjectUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load project users:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load project users",
      );

      setProjectUsers([]);
    } finally {
      setLoadingProjectUsers(false);
    }
  };

  // =========================================================
  // OPEN MANAGE USERS
  // =========================================================

  const handleManageUsers = async (project) => {
    if (saving || deleting || restoring) {
      return;
    }

    setSelectedProject(project);

    setProjectUsers([]);

    setSelectedUserId("");

    setSelectedUserRole("MEMBER");

    setSelectedResponsibilityRole("DEVELOPER");

    setError("");

    setProjectUsersDialogOpen(true);

    if (users.length === 0) {
      await loadFormData();
    }

    await loadProjectUsers(project.id);
  };

  // =========================================================
  // CLOSE MANAGE USERS
  // =========================================================

  const handleCloseProjectUsersDialog = () => {
    if (addingProjectUser || removingProjectUser) {
      return;
    }

    setProjectUsersDialogOpen(false);

    setProjectUsers([]);

    setSelectedUserId("");

    setSelectedUserRole("MEMBER");

    setSelectedResponsibilityRole("DEVELOPER");

    setSelectedProject(null);

    setError("");
  };

  // =========================================================
  // ADD USER TO PROJECT
  // =========================================================

  const handleAddProjectUser = async () => {
    if (!selectedProject) {
      setError("Project is not selected");
      return;
    }

    if (!selectedUserId) {
      setError("Please select a user");
      return;
    }

    if (!selectedUserRole) {
      setError("Please select project access");
      return;
    }

    if (selectedUserRole === "MEMBER" && !selectedResponsibilityRole) {
      setError("Please select a member responsibility");
      return;
    }

    if (addingProjectUser) {
      return;
    }

    const selectedExistingUser = users.find(
      (user) => Number(user.id) === Number(selectedUserId),
    );

    if (!selectedExistingUser) {
      setError("Selected user does not exist");
      return;
    }

    const alreadyAssigned = projectUsers.some(
      (projectUser) => Number(projectUser.userId) === Number(selectedUserId),
    );

    if (alreadyAssigned) {
      setError("This user is already assigned to the project");
      return;
    }

    try {
      setAddingProjectUser(true);

      setError("");

      const payload = {
        userId: Number(selectedUserId),
        projectId: Number(selectedProject.id),
        role: selectedUserRole,
        responsibilityRole:
          selectedUserRole === "MEMBER" ? selectedResponsibilityRole : null,
      };

      await createProjectUser(payload);

      setSuccess("User added to project successfully");

      setSelectedUserId("");

      setSelectedUserRole("MEMBER");

      setSelectedResponsibilityRole("DEVELOPER");

      await loadProjectUsers(selectedProject.id);
    } catch (err) {
      console.error("Failed to add project user:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to add user to project",
      );
    } finally {
      setAddingProjectUser(false);
    }
  };

  // =========================================================
  // REMOVE USER FROM PROJECT
  // =========================================================

  const handleRemoveProjectUser = async (projectUser) => {
    if (!projectUser?.id || removingProjectUser) {
      return;
    }

    try {
      setRemovingProjectUser(true);

      setError("");

      await deleteProjectUser(projectUser.id);

      setSuccess("User removed from project successfully");

      if (selectedProject?.id) {
        await loadProjectUsers(selectedProject.id);
      }
    } catch (err) {
      console.error("Failed to remove project user:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to remove user from project",
      );
    } finally {
      setRemovingProjectUser(false);
    }
  };

  // =========================================================
  // PROJECT STATUS
  // =========================================================

  const getProjectStatus = (project) => {
    if (project.deletedAt) return { label: "Deleted", color: "error" };
    if (project.archivedAt) return { label: "Archived", color: "warning" };
    return { label: project.statusName || "Active", color: "success" };
  };

  // =========================================================
  // GET AVAILABLE USERS
  // =========================================================

  const getAvailableUsers = () => {
    const assignedUserIds = new Set(
      projectUsers.map((projectUser) => Number(projectUser.userId)),
    );

    return users.filter((user) => !assignedUserIds.has(Number(user.id)));
  };

  // =========================================================
  // VISIBLE PROJECTS (STARRED ONLY FILTER)
  // =========================================================

  const visibleProjects = starredOnly
    ? projects.filter((project) => favoriteProjectIds.has(Number(project.id)))
    : projects;

  // =========================================================
  // UI
  // =========================================================

  return (
    <Box className="app-page pm-fade-up">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <Box
        className="page-header"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 2,
        }}
      >
        <Box>
          {/* <span className="pm-eyebrow">Portfolio</span> */}
          <Typography
            variant="h1"
            className="pm-gradient-title"
            sx={{ display: "inline-block", mt: 0.5 }}
          >
            Projects
          </Typography>

          <Typography className="page-subtitle">
            Manage projects and project users.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
          }}
        >
          <FormControlLabel
            sx={{ mr: 1 }}
            control={
              <Switch
                checked={starredOnly}
                onChange={(event) => setStarredOnly(event.target.checked)}
              />
            }
            label="Starred only"
          />

          <Tooltip title="Refresh">
            <IconButton
              onClick={loadProjects}
              disabled={loading || saving || deleting || restoring || archiving}
              aria-label="Refresh"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={saving || deleting || restoring || archiving}
          >
            Add Project
          </Button>
        </Box>
      </Box>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* =====================================================
          PROJECT TABLE
      ====================================================== */}

      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 48 }}>
                <strong>{"\u2605"}</strong>
              </TableCell>

              <TableCell>
                <strong>ID</strong>
              </TableCell>

              <TableCell>
                <strong>Name</strong>
              </TableCell>

              <TableCell>
                <strong>Description</strong>
              </TableCell>

              <TableCell>
                <strong>Owner</strong>
              </TableCell>

              <TableCell>
                <strong>Status</strong>
              </TableCell>

              <TableCell>
                <strong>Ticket Prefix</strong>
              </TableCell>

              {/* <TableCell>
                <strong>Status Type</strong>
              </TableCell> */}

              <TableCell align="center">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : visibleProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    {starredOnly
                      ? "No starred projects yet."
                      : "No projects found."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visibleProjects.map((project) => {
                const status = getProjectStatus(project);

                return (
                  <TableRow
                    key={project.id}
                    hover
                    sx={{
                      opacity:
                        project.deletedAt || project.archivedAt ? 0.65 : 1,
                    }}
                  >
                    <TableCell align="center">
                      <Tooltip
                        title={
                          favoriteProjectIds.has(Number(project.id))
                            ? "Remove from starred"
                            : "Add to starred"
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleFavorite(project)}
                            disabled={
                              togglingFavoriteId === Number(project.id) ||
                              favoritesLoading
                            }
                            aria-label="Favorite"
                          >
                            {favoriteProjectIds.has(Number(project.id)) ? (
                              <StarIcon fontSize="small" color="warning" />
                            ) : (
                              <StarBorderIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>

                    <TableCell>{project.id}</TableCell>

                    <TableCell>
                      <Typography fontWeight={600}>{project.name}</Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        minWidth: 300,
                        maxWidth: 500,
                        verticalAlign: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                          lineHeight: 1.6,
                        }}
                      >
                        {project.description || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {project.ownerName || "-"}
                        </Typography>

                        {project.ownerEmail && (
                          <Typography variant="caption" color="text.secondary">
                            {project.ownerEmail}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={project.ticketPrefix || "-"}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>

                    {/* <TableCell>{project.statusType || "default"}</TableCell> */}

                    <TableCell align="center">
                      {/* MANAGE USERS */}

                      <Tooltip title="Manage Users">
                        <span>
                          <IconButton
                            color="secondary"
                            onClick={() => handleManageUsers(project)}
                            disabled={
                              saving ||
                              deleting ||
                              restoring ||
                              Boolean(project.deletedAt || project.archivedAt)
                            }
                            aria-label="Manage members"
                          >
                            <GroupIcon />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {/* EDIT */}

                      <Tooltip title="Edit">
                        <span>
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(project)}
                            disabled={
                              saving ||
                              deleting ||
                              restoring ||
                              Boolean(project.deletedAt || project.archivedAt)
                            }
                            aria-label="Edit"
                          >
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {/* ARCHIVE / UNARCHIVE */}

                      {!project.deletedAt && (
                        <Tooltip
                          title={project.archivedAt ? "Unarchive" : "Archive"}
                        >
                          <span>
                            <IconButton
                              color={project.archivedAt ? "success" : "warning"}
                              onClick={() => handleArchiveToggle(project)}
                              disabled={
                                archiving || saving || deleting || restoring
                              }
                              aria-label="Archive"
                            >
                              {project.archivedAt ? (
                                <UnarchiveIcon />
                              ) : (
                                <ArchiveIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                      {/* DELETE / RESTORE */}

                      {project.deletedAt ? (
                        <Tooltip title="Restore">
                          <span>
                            <IconButton
                              color="success"
                              onClick={() => handleRestore(project)}
                              disabled={restoring || saving || deleting}
                              aria-label="Restore"
                            >
                              {restoring ? (
                                <CircularProgress size={20} />
                              ) : (
                                <RestoreIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteClick(project)}
                              disabled={deleting || saving || restoring}
                              aria-label="Delete"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* =====================================================
          ADD / EDIT PROJECT DIALOG
      ====================================================== */}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedProject ? "Edit Project" : "Add Project"}
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              label="Project Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              required
              disabled={saving}
              inputProps={{
                maxLength: 255,
              }}
            />

            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              disabled={saving}
            />

            {/* OWNER */}

            <FormControl fullWidth required>
              <InputLabel>Owner</InputLabel>

              <Select
                name="ownerId"
                value={form.ownerId}
                label="Owner"
                onChange={handleChange}
                disabled={saving || loadingFormData}
              >
                {users.length === 0 ? (
                  <MenuItem disabled>
                    {loadingFormData
                      ? "Loading users..."
                      : "No users available"}
                  </MenuItem>
                ) : (
                  users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name || "Unnamed user"}

                      {user.email ? ` (${user.email})` : ""}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* PROJECT STATUS */}

            <FormControl fullWidth required>
              <InputLabel>Project Status</InputLabel>

              <Select
                name="statusId"
                value={form.statusId}
                label="Project Status"
                onChange={handleChange}
                disabled={saving || loadingFormData}
              >
                {statuses.length === 0 ? (
                  <MenuItem disabled>No project statuses available</MenuItem>
                ) : (
                  statuses.map((status) => (
                    <MenuItem key={status.id} value={status.id}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        {status.color && (
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              backgroundColor: status.color,
                            }}
                          />
                        )}

                        {status.name}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* TICKET PREFIX */}

            <TextField
              label="Ticket Prefix"
              name="ticketPrefix"
              value={form.ticketPrefix}
              onChange={handleChange}
              fullWidth
              required
              disabled={saving}
              inputProps={{
                maxLength: 255,
              }}
              helperText="Example: PROJ, DEV, CMP"
            />

            {/* STATUS TYPE */}

            <TextField
              label="Status Type"
              name="statusType"
              value={form.statusType}
              onChange={handleChange}
              fullWidth
              disabled={saving}
              inputProps={{
                maxLength: 255,
              }}
              helperText="Default is recommended"
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || loadingFormData}
          >
            {saving ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1 }} />

                {selectedProject ? "Updating..." : "Creating..."}
              </>
            ) : selectedProject ? (
              "Update Project"
            ) : (
              "Create Project"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          MANAGE PROJECT USERS DIALOG
      ====================================================== */}

      <Dialog
        open={projectUsersDialogOpen}
        onClose={handleCloseProjectUsersDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Manage Project Members
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {selectedProject?.name}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* =================================================
              ADD USER
          ================================================== */}

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Add User
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
              }}
            >
              {/* USER */}

              <FormControl fullWidth size="small" required>
                <InputLabel>User</InputLabel>

                <Select
                  value={selectedUserId}
                  label="User"
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  disabled={
                    addingProjectUser || loadingProjectUsers || loadingFormData
                  }
                >
                  {getAvailableUsers().length === 0 ? (
                    <MenuItem disabled>
                      {loadingFormData
                        ? "Loading users..."
                        : "No users available"}
                    </MenuItem>
                  ) : (
                    getAvailableUsers().map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name || "Unnamed user"}

                        {user.email ? ` (${user.email})` : ""}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              {/* PROJECT ACCESS LEVEL */}

              <FormControl
                required
                sx={{ minWidth: { xs: "100%", sm: 220 } }}
                size="small"
              >
                <InputLabel>Project Access</InputLabel>
                <Select
                  value={selectedUserRole}
                  label="Project Access"
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedUserRole(value);
                    if (value !== "MEMBER")
                      setSelectedResponsibilityRole("DEVELOPER");
                  }}
                  disabled={addingProjectUser || loadingFormData}
                >
                  <MenuItem value="PROJECT_ADMIN">
                    Project Administrator
                  </MenuItem>
                  <MenuItem value="MEMBER">Member</MenuItem>
                  <MenuItem value="VIEWER">Viewer</MenuItem>
                </Select>
              </FormControl>

              {/* MEMBER RESPONSIBILITY */}

              {selectedUserRole === "MEMBER" && (
                <FormControl
                  required
                  sx={{ minWidth: { xs: "100%", sm: 220 } }}
                  size="small"
                >
                  <InputLabel>Responsibility</InputLabel>
                  <Select
                    value={selectedResponsibilityRole}
                    label="Responsibility"
                    onChange={(event) =>
                      setSelectedResponsibilityRole(event.target.value)
                    }
                    disabled={addingProjectUser || loadingFormData}
                  >
                    <MenuItem value="DEVELOPER">Developer</MenuItem>
                    <MenuItem value="TESTER">Tester / QA</MenuItem>
                    <MenuItem value="TEAM_LEAD">Team Lead</MenuItem>
                    <MenuItem value="SCRUM_MASTER">Scrum Master</MenuItem>
                    <MenuItem value="PRODUCT_OWNER">Product Owner</MenuItem>
                    <MenuItem value="BUSINESS_ANALYST">
                      Business Analyst
                    </MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* ADD */}

              <Button
                variant="contained"
                startIcon={
                  addingProjectUser ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <AddIcon />
                  )
                }
                onClick={handleAddProjectUser}
                disabled={
                  addingProjectUser ||
                  loadingProjectUsers ||
                  loadingFormData ||
                  !selectedUserId ||
                  !selectedUserRole
                }
                sx={{
                  minWidth: {
                    xs: "100%",
                    sm: 120,
                  },
                }}
              >
                {addingProjectUser ? "Adding..." : "Add"}
              </Button>
            </Box>
          </Paper>

          {/* =================================================
              CURRENT USERS
          ================================================== */}

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
            Assigned Members
          </Typography>

          {loadingProjectUsers ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 5,
              }}
            >
              <CircularProgress />
            </Box>
          ) : projectUsers.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: "center",
              }}
            >
              <GroupIcon
                sx={{
                  fontSize: 40,
                  color: "text.secondary",
                  mb: 1,
                }}
              />

              <Typography color="text.secondary">
                No users assigned to this project.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>User</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Email</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Access / Responsibility</strong>
                    </TableCell>

                    <TableCell align="right">
                      <strong>Action</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {projectUsers.map((projectUser) => (
                    <TableRow key={projectUser.id}>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {projectUser.userName || "-"}
                        </Typography>
                      </TableCell>

                      <TableCell>{projectUser.userEmail || "-"}</TableCell>

                      <TableCell>
                        <Chip
                          label={
                            projectUser.responsibilityRole
                              ? `${projectUser.role} • ${projectUser.responsibilityRole}`
                              : projectUser.role || "-"
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="Remove User">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() =>
                                handleRemoveProjectUser(projectUser)
                              }
                              disabled={removingProjectUser}
                              aria-label="Delete"
                            >
                              {removingProjectUser ? (
                                <CircularProgress size={20} />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button
            onClick={handleCloseProjectUsersDialog}
            disabled={addingProjectUser || removingProjectUser}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          DELETE PROJECT DIALOG
      ====================================================== */}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Project?</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{selectedProject?.name}</strong>?
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will soft-delete the project. You can restore it later.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1 }} />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          SUCCESS MESSAGE
      ====================================================== */}

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        message={success}
      />
    </Box>
  );
}

import Add from "@mui/icons-material/Add";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Close from "@mui/icons-material/Close";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Refresh from "@mui/icons-material/Refresh";
import Restore from "@mui/icons-material/Restore";
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
  FormControlLabel,
  IconButton,
  Paper,
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
import { useEffect, useMemo, useState } from "react";

import {
  createProjectStatus,
  deleteProjectStatus,
  getProjectStatuses,
  permanentlyDeleteProjectStatus,
  restoreProjectStatus,
  updateProjectStatus,
} from "../../api/projectStatusApi";

import { RADIUS, TEXT_FAINT } from "../../theme/colors";

export default function ProjectStatus() {
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [permanentDeletingId, setPermanentDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] =
    useState(false);

  const [selectedStatus, setSelectedStatus] = useState(null);

  const [form, setForm] = useState({
    name: "",
    color: "",
    isDefault: false,
  });

  const [formErrors, setFormErrors] = useState({});

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ---------------------------------------------------------
  // LOAD DATA
  // ---------------------------------------------------------

  const loadStatuses = async () => {
    try {
      setLoading(true);

      const data = await getProjectStatuses();

      setStatuses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load project statuses:", error);

      showSnackbar(
        getErrorMessage(error, "Failed to load project statuses"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  // ---------------------------------------------------------
  // SNACKBAR
  // ---------------------------------------------------------

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const closeSnackbar = () => {
    setSnackbar((previous) => ({
      ...previous,
      open: false,
    }));
  };

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  const getErrorMessage = (error, fallback) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.detail ||
      fallback
    );
  };

  const getColorValue = (color) => {
    if (!color) {
      return TEXT_FAINT;
    }

    return color;
  };

  // ---------------------------------------------------------
  // FILTER
  // ---------------------------------------------------------

  const filteredStatuses = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return statuses.filter((status) => {
      const matchesSearch =
        !searchValue ||
        String(status.id ?? "")
          .toLowerCase()
          .includes(searchValue) ||
        String(status.name ?? "")
          .toLowerCase()
          .includes(searchValue) ||
        String(status.color ?? "")
          .toLowerCase()
          .includes(searchValue);

      const isDeleted = Boolean(status.deletedAt);

      const matchesDeleted = showDeleted ? isDeleted : !isDeleted;

      return matchesSearch && matchesDeleted;
    });
  }, [statuses, search, showDeleted]);

  // ---------------------------------------------------------
  // OPEN ADD
  // ---------------------------------------------------------

  const handleAdd = () => {
    setEditingStatus(null);

    setForm({
      name: "",
      color: "",
      isDefault: false,
    });

    setFormErrors({});
    setDialogOpen(true);
  };

  // ---------------------------------------------------------
  // OPEN EDIT
  // ---------------------------------------------------------

  const handleEdit = (status) => {
    setEditingStatus(status);

    setForm({
      name: status.name || "",
      color: status.color || "",
      isDefault: Boolean(status.isDefault),
    });

    setFormErrors({});
    setDialogOpen(true);
  };

  // ---------------------------------------------------------
  // CLOSE FORM
  // ---------------------------------------------------------

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingStatus(null);
    setFormErrors({});
  };

  // ---------------------------------------------------------
  // FORM CHANGE
  // ---------------------------------------------------------

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  // ---------------------------------------------------------
  // VALIDATION
  // ---------------------------------------------------------

  const validateForm = () => {
    const errors = {};

    const name = form.name.trim();

    if (!name) {
      errors.name = "Status name is required";
    } else if (name.length > 255) {
      errors.name = "Status name must not exceed 255 characters";
    }

    if (form.color && form.color.length > 255) {
      errors.color = "Color must not exceed 255 characters";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // ---------------------------------------------------------
  // CREATE / UPDATE
  // ---------------------------------------------------------

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      color: form.color.trim() || null,
      isDefault: Boolean(form.isDefault),
    };

    try {
      setSaving(true);

      if (editingStatus) {
        await updateProjectStatus(editingStatus.id, payload);

        showSnackbar("Project status updated successfully");
      } else {
        await createProjectStatus(payload);

        showSnackbar("Project status created successfully");
      }

      setDialogOpen(false);
      setEditingStatus(null);

      await loadStatuses();
    } catch (error) {
      console.error("Failed to save project status:", error);

      showSnackbar(
        getErrorMessage(error, "Failed to save project status"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // SOFT DELETE
  // ---------------------------------------------------------

  const handleDeleteClick = (status) => {
    setSelectedStatus(status);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStatus) {
      return;
    }

    try {
      setDeletingId(selectedStatus.id);

      await deleteProjectStatus(selectedStatus.id);

      showSnackbar("Project status deleted successfully");

      setDeleteDialogOpen(false);
      setSelectedStatus(null);

      await loadStatuses();
    } catch (error) {
      console.error("Failed to delete project status:", error);

      showSnackbar(
        getErrorMessage(error, "Failed to delete project status"),
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ---------------------------------------------------------
  // RESTORE
  // ---------------------------------------------------------

  const handleRestore = async (status) => {
    try {
      setRestoringId(status.id);

      await restoreProjectStatus(status.id);

      showSnackbar("Project status restored successfully");

      await loadStatuses();
    } catch (error) {
      console.error("Failed to restore project status:", error);

      showSnackbar(
        getErrorMessage(error, "Failed to restore project status"),
        "error",
      );
    } finally {
      setRestoringId(null);
    }
  };

  // ---------------------------------------------------------
  // PERMANENT DELETE
  // ---------------------------------------------------------

  const handlePermanentDeleteClick = (status) => {
    setSelectedStatus(status);
    setPermanentDeleteDialogOpen(true);
  };

  const handlePermanentDeleteConfirm = async () => {
    if (!selectedStatus) {
      return;
    }

    try {
      setPermanentDeletingId(selectedStatus.id);

      await permanentlyDeleteProjectStatus(selectedStatus.id);

      showSnackbar("Project status permanently deleted");

      setPermanentDeleteDialogOpen(false);
      setSelectedStatus(null);

      await loadStatuses();
    } catch (error) {
      console.error("Failed to permanently delete project status:", error);

      showSnackbar(
        getErrorMessage(error, "Failed to permanently delete project status"),
        "error",
      );
    } finally {
      setPermanentDeletingId(null);
    }
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <Box className="app-page pm-fade-up">
      {/* HEADER */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          gap: 2,
          mb: 3,
          flexDirection: {
            xs: "column",
            sm: "row",
          },
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Project Status
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage project statuses used across the system.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton
              onClick={loadStatuses}
              disabled={loading}
              sx={{
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>

          <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
            Add Status
          </Button>
        </Box>
      </Box>

      {/* FILTERS */}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: RADIUS.card,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <TextField
            size="small"
            label="Search"
            placeholder="Search by name, color or ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{
              minWidth: {
                xs: "100%",
                sm: 300,
              },
            }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={showDeleted}
                onChange={(event) => setShowDeleted(event.target.checked)}
              />
            }
            label="Show Deleted"
          />

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: "auto" }}
          >
            {filteredStatuses.length} status
            {filteredStatuses.length !== 1 ? "es" : ""}
          </Typography>
        </Box>
      </Paper>

      {/* TABLE */}

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: RADIUS.card,
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>ID</strong>
                </TableCell>

                <TableCell>
                  <strong>Name</strong>
                </TableCell>

                <TableCell>
                  <strong>Color</strong>
                </TableCell>

                <TableCell>
                  <strong>Default</strong>
                </TableCell>

                <TableCell>
                  <strong>Status</strong>
                </TableCell>

                <TableCell align="right">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        py: 6,
                      }}
                    >
                      <CircularProgress size={30} />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredStatuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 6,
                      }}
                    >
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        color="text.secondary"
                      >
                        No project statuses found
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {showDeleted
                          ? "There are no deleted project statuses."
                          : "Create your first project status."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStatuses.map((status) => {
                  const isDeleted = Boolean(status.deletedAt);

                  return (
                    <TableRow
                      key={status.id}
                      hover
                      sx={{
                        opacity: isDeleted ? 0.65 : 1,
                      }}
                    >
                      <TableCell>{status.id}</TableCell>

                      <TableCell>
                        <Typography fontWeight={600}>{status.name}</Typography>
                      </TableCell>

                      <TableCell>
                        {status.color ? (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                backgroundColor: getColorValue(status.color),
                                border: "1px solid",
                                borderColor: "divider",
                              }}
                            />

                            <Typography variant="body2">
                              {status.color}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography color="text.secondary">—</Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {status.isDefault ? (
                          <Chip
                            icon={<CheckCircle />}
                            label="Default"
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Typography color="text.secondary">No</Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {isDeleted ? (
                          <Chip label="Deleted" size="small" color="error" />
                        ) : (
                          <Chip label="Active" size="small" color="success" />
                        )}
                      </TableCell>

                      <TableCell align="right">
                        {isDeleted ? (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 0.5,
                            }}
                          >
                            <Tooltip title="Restore">
                              <span>
                                <IconButton
                                  color="success"
                                  onClick={() => handleRestore(status)}
                                  disabled={
                                    restoringId === status.id ||
                                    permanentDeletingId === status.id
                                  }
                                >
                                  {restoringId === status.id ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <Restore />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Permanent Delete">
                              <span>
                                <IconButton
                                  color="error"
                                  onClick={() =>
                                    handlePermanentDeleteClick(status)
                                  }
                                  disabled={
                                    restoringId === status.id ||
                                    permanentDeletingId === status.id
                                  }
                                >
                                  {permanentDeletingId === status.id ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <Delete />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 0.5,
                            }}
                          >
                            <Tooltip title="Edit">
                              <IconButton
                                color="primary"
                                onClick={() => handleEdit(status)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete">
                              <span>
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteClick(status)}
                                  disabled={deletingId === status.id}
                                >
                                  {deletingId === status.id ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <Delete />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ADD / EDIT DIALOG */}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {editingStatus ? "Edit Project Status" : "Add Project Status"}

          <IconButton onClick={handleCloseDialog} disabled={saving}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
              pt: 1,
            }}
          >
            <TextField
              label="Status Name"
              required
              fullWidth
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              error={Boolean(formErrors.name)}
              helperText={formErrors.name || "Maximum 255 characters"}
              disabled={saving}
              autoFocus
            />

            <TextField
              label="Color"
              fullWidth
              value={form.color}
              onChange={(event) => handleChange("color", event.target.value)}
              error={Boolean(formErrors.color)}
              helperText={
                formErrors.color || "Example: #1976d2, red, rgb(25,118,210)"
              }
              disabled={saving}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.isDefault}
                  onChange={(event) =>
                    handleChange("isDefault", event.target.checked)
                  }
                  disabled={saving}
                />
              }
              label="Set as default status"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={
              saving ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            {saving ? "Saving..." : editingStatus ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SOFT DELETE CONFIRMATION */}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!deletingId) {
            setDeleteDialogOpen(false);
            setSelectedStatus(null);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Project Status?</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{selectedStatus?.name}</strong>?
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will soft delete the status. You can restore it later.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedStatus(null);
            }}
            disabled={Boolean(deletingId)}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={Boolean(deletingId)}
            startIcon={
              deletingId ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Delete />
              )
            }
          >
            {deletingId ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PERMANENT DELETE CONFIRMATION */}

      <Dialog
        open={permanentDeleteDialogOpen}
        onClose={() => {
          if (!permanentDeletingId) {
            setPermanentDeleteDialogOpen(false);
            setSelectedStatus(null);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Permanently Delete Project Status?</DialogTitle>

        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>

          <Typography>
            Permanently delete <strong>{selectedStatus?.name}</strong>?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setPermanentDeleteDialogOpen(false);
              setSelectedStatus(null);
            }}
            disabled={Boolean(permanentDeletingId)}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handlePermanentDeleteConfirm}
            disabled={Boolean(permanentDeletingId)}
            startIcon={
              permanentDeletingId ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Delete />
              )
            }
          >
            {permanentDeletingId ? "Deleting..." : "Permanent Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

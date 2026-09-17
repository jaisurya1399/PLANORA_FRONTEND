import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Refresh from "@mui/icons-material/Refresh";
import Restore from "@mui/icons-material/Restore";
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
  FormControlLabel,
  IconButton,
  Stack,
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

import {
  createTicketPriority,
  deleteTicketPriority,
  getTicketPriorities,
  reorderTicketPriorities,
  restoreTicketPriority,
  updateTicketPriority,
} from "../../api/ticketPriorityApi";

const initialForm = {
  name: "",
  color: "",
  isDefault: false,
};

export default function TicketPriorities() {
  const [priorities, setPriorities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState(null);

  const [form, setForm] = useState(initialForm);

  const loadPriorities = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTicketPriorities();

      setPriorities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load ticket priorities:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to load ticket priorities",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPriorities();
  }, []);

  const openCreateDialog = () => {
    setEditingPriority(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const openEditDialog = (priority) => {
    setEditingPriority(priority);

    setForm({
      name: priority.name || "",
      color: priority.color || "",
      isDefault: priority.isDefault || false,
    });

    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setEditingPriority(null);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Ticket priority name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        color: form.color.trim() || null,
        isDefault: form.isDefault,
      };

      if (editingPriority) {
        await updateTicketPriority(editingPriority.id, payload);

        setSuccess("Ticket priority updated successfully");
      } else {
        await createTicketPriority(payload);

        setSuccess("Ticket priority created successfully");
      }

      closeDialog();

      await loadPriorities();
    } catch (err) {
      console.error("Failed to save ticket priority:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to save ticket priority",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (priority) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${priority.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteTicketPriority(priority.id);

      setSuccess("Ticket priority deleted successfully");

      await loadPriorities();
    } catch (err) {
      console.error("Failed to delete ticket priority:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to delete ticket priority",
      );
    }
  };

  const handleRestore = async (priority) => {
    try {
      setError("");
      setSuccess("");

      await restoreTicketPriority(priority.id);

      setSuccess("Ticket priority restored successfully");

      await loadPriorities();
    } catch (err) {
      console.error("Failed to restore ticket priority:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to restore ticket priority",
      );
    }
  };

  const movePriority = async (priorityId, direction) => {
    const active = priorities.filter((x) => !x.deletedAt);
    const index = active.findIndex((x) => x.id === priorityId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= active.length) return;
    [active[index], active[next]] = [active[next], active[index]];
    try {
      await reorderTicketPriorities(active.map((x) => x.id));
      await loadPriorities();
      setSuccess("Priority order updated");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reorder priorities");
    }
  };

  return (
    <Box className="app-page pm-fade-up">
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Ticket Priorities
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Manage ticket priority master data.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadPriorities}>
              <Refresh />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Add Priority
          </Button>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {typeof error === "string" ? error : "Something went wrong"}
        </Alert>
      )}

      {/* Success */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box
              sx={{
                minHeight: 300,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={80}>
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
                      <strong>Order</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>

                    <TableCell align="centre">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {priorities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography
                          sx={{
                            py: 5,
                            color: "text.secondary",
                          }}
                        >
                          No ticket priorities found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    priorities.map((priority) => {
                      const deleted = Boolean(priority.deletedAt);

                      return (
                        <TableRow
                          key={priority.id}
                          hover
                          sx={{
                            opacity: deleted ? 0.6 : 1,
                          }}
                        >
                          <TableCell>{priority.id}</TableCell>

                          <TableCell>
                            <Typography fontWeight={500}>
                              {priority.name}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {priority.color ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "4px",
                                    backgroundColor: priority.color,
                                    border: "1px solid",
                                    borderColor: "divider",
                                  }}
                                />

                                <Typography variant="body2">
                                  {priority.color}
                                </Typography>
                              </Box>
                            ) : (
                              "-"
                            )}
                          </TableCell>

                          <TableCell>
                            {priority.isDefault ? (
                              <Chip
                                label="Default"
                                size="small"
                                color="primary"
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>

                          <TableCell>
                            <Stack direction="row" spacing={0.5}>
                              <Button
                                size="small"
                                onClick={() => movePriority(priority.id, -1)}
                                disabled={deleted}
                              >
                                ↑
                              </Button>
                              <Button
                                size="small"
                                onClick={() => movePriority(priority.id, 1)}
                                disabled={deleted}
                              >
                                ↓
                              </Button>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            {deleted ? (
                              <Chip
                                label="Deleted"
                                size="small"
                                color="error"
                              />
                            ) : (
                              <Chip
                                label="Active"
                                size="small"
                                color="success"
                              />
                            )}
                          </TableCell>

                          <TableCell align="right">
                            {!deleted ? (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton
                                    color="primary"
                                    onClick={() => openEditDialog(priority)}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete">
                                  <IconButton
                                    color="error"
                                    onClick={() => handleDelete(priority)}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <Tooltip title="Restore">
                                <IconButton
                                  color="success"
                                  onClick={() => handleRestore(priority)}
                                >
                                  <Restore />
                                </IconButton>
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
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingPriority ? "Edit Ticket Priority" : "Add Ticket Priority"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            required
            label="Priority Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            margin="normal"
            autoFocus
          />

          <TextField
            fullWidth
            label="Color"
            name="color"
            value={form.color}
            onChange={handleChange}
            margin="normal"
            placeholder="#d32f2f"
            helperText="Example: #d32f2f or red"
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.isDefault}
                onChange={handleChange}
                name="isDefault"
              />
            }
            label="Set as default priority"
            sx={{ mt: 1 }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <CircularProgress size={22} />
            ) : editingPriority ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

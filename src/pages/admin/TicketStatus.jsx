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
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";

import {
  createTicketStatus,
  deleteTicketStatus,
  getTicketStatuses,
  restoreTicketStatus,
  updateTicketStatus,
} from "../../api/ticketStatusApi";

const initialForm = {
  name: "",
  color: "",
  isDefault: false,
};

export default function TicketStatus() {
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingStatus, setEditingStatus] = useState(null);

  const [form, setForm] = useState(initialForm);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTicketStatuses();

      setStatuses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load ticket statuses:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to load ticket statuses",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const openCreateDialog = () => {
    setEditingStatus(null);
    setForm(initialForm);
    setError("");
    setDialogOpen(true);
  };

  const openEditDialog = (status) => {
    setEditingStatus(status);

    setForm({
      name: status.name || "",
      color: status.color || "",
      isDefault: status.isDefault || false,
    });

    setError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setEditingStatus(null);
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
      setError("Ticket status name is required");
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

      if (editingStatus) {
        await updateTicketStatus(editingStatus.id, payload);
        setSuccess("Ticket status updated successfully");
      } else {
        await createTicketStatus(payload);
        setSuccess("Ticket status created successfully");
      }

      closeDialog();

      await loadStatuses();
    } catch (err) {
      console.error("Failed to save ticket status:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to save ticket status",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (status) => {
    const confirmed = await requestConfirm(
      `Are you sure you want to delete "${status.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteTicketStatus(status.id);

      setSuccess("Ticket status deleted successfully");

      await loadStatuses();
    } catch (err) {
      console.error("Failed to delete ticket status:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to delete ticket status",
      );
    }
  };

  const handleRestore = async (status) => {
    try {
      setError("");
      setSuccess("");

      await restoreTicketStatus(status.id);

      setSuccess("Ticket status restored successfully");

      await loadStatuses();
    } catch (err) {
      console.error("Failed to restore ticket status:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to restore ticket status",
      );
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
            Ticket Status
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Manage ticket status master data.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadStatuses} aria-label="Refresh">
              <Refresh />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Add Status
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {typeof error === "string" ? error : "Something went wrong"}
        </Alert>
      )}

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
                    <TableCell width={80}>ID</TableCell>

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
                  {statuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography
                          sx={{
                            py: 5,
                            color: "text.secondary",
                          }}
                        >
                          No ticket statuses found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    statuses.map((status) => {
                      const deleted = Boolean(status.deletedAt);

                      return (
                        <TableRow
                          key={status.id}
                          hover
                          sx={{
                            opacity: deleted ? 0.6 : 1,
                          }}
                        >
                          <TableCell>{status.id}</TableCell>

                          <TableCell>
                            <Typography fontWeight={500}>
                              {status.name}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {status.color ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "4px",
                                    backgroundColor: status.color,
                                    border: "1px solid",
                                    borderColor: "divider",
                                  }}
                                />

                                <Typography variant="body2">
                                  {status.color}
                                </Typography>
                              </Box>
                            ) : (
                              "-"
                            )}
                          </TableCell>

                          <TableCell>
                            {status.isDefault ? (
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
                                    onClick={() => openEditDialog(status)}
                                    aria-label="Edit"
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete">
                                  <IconButton
                                    color="error"
                                    onClick={() => handleDelete(status)}
                                    aria-label="Delete"
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <Tooltip title="Restore">
                                <IconButton
                                  color="success"
                                  onClick={() => handleRestore(status)}
                                  aria-label="Restore"
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
          {editingStatus ? "Edit Ticket Status" : "Add Ticket Status"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            required
            label="Status Name"
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
            placeholder="#1976d2"
            helperText="Example: #1976d2 or red"
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.isDefault}
                onChange={handleChange}
                name="isDefault"
              />
            }
            label="Set as default status"
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
            ) : editingStatus ? (
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

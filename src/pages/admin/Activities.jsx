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
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";

import { useEffect, useState } from "react";

import {
  createActivity,
  deleteActivity,
  getActivities,
  restoreActivity,
  updateActivity,
} from "../../api/activityApi";

const emptyForm = {
  name: "",
  description: "",
  isDefault: false,
};

export default function Activities() {
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [openDialog, setOpenDialog] = useState(false);

  const [editingActivity, setEditingActivity] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getActivities();

      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load activities:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to load activities",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleOpenCreate = () => {
    setEditingActivity(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setOpenDialog(true);
  };

  const handleOpenEdit = (activity) => {
    setEditingActivity(activity);

    setForm({
      name: activity.name || "",
      description: activity.description || "",
      isDefault: activity.isDefault || false,
    });

    setError("");
    setSuccess("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (saving) return;

    setOpenDialog(false);
    setEditingActivity(null);
    setForm(emptyForm);
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
      setError("Activity name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        isDefault: form.isDefault,
      };

      if (editingActivity) {
        await updateActivity(editingActivity.id, payload);
        setSuccess("Activity updated successfully");
      } else {
        await createActivity(payload);
        setSuccess("Activity created successfully");
      }

      setOpenDialog(false);
      setEditingActivity(null);
      setForm(emptyForm);

      await loadActivities();
    } catch (err) {
      console.error("Failed to save activity:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to save activity",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (activity) => {
    const confirmed = await requestConfirm(
      `Are you sure you want to delete "${activity.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteActivity(activity.id);

      setSuccess("Activity deleted successfully");

      await loadActivities();
    } catch (err) {
      console.error("Failed to delete activity:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to delete activity",
      );
    }
  };

  const handleRestore = async (activity) => {
    try {
      setError("");
      setSuccess("");

      await restoreActivity(activity.id);

      setSuccess("Activity restored successfully");

      await loadActivities();
    } catch (err) {
      console.error("Failed to restore activity:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to restore activity",
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
            Activities
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Manage activity categories used in the project management system.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadActivities} aria-label="Refresh">
              <Refresh />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreate}
          >
            Add Activity
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
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 300,
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
                      <strong>Description</strong>
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
                  {activities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography
                          sx={{
                            py: 5,
                            color: "text.secondary",
                          }}
                        >
                          No activities found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activities.map((activity) => {
                      const deleted = Boolean(activity.deletedAt);

                      return (
                        <TableRow
                          key={activity.id}
                          hover
                          sx={{
                            opacity: deleted ? 0.6 : 1,
                          }}
                        >
                          <TableCell>{activity.id}</TableCell>

                          <TableCell>
                            <Typography fontWeight={500}>
                              {activity.name}
                            </Typography>
                          </TableCell>

                          <TableCell>{activity.description || "-"}</TableCell>

                          <TableCell>
                            {activity.isDefault ? (
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
                                    onClick={() => handleOpenEdit(activity)}
                                    aria-label="Edit"
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete">
                                  <IconButton
                                    color="error"
                                    onClick={() => handleDelete(activity)}
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
                                  onClick={() => handleRestore(activity)}
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
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingActivity ? "Edit Activity" : "Add Activity"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            required
            label="Activity Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            margin="normal"
            autoFocus
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            margin="normal"
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.isDefault}
                onChange={handleChange}
                name="isDefault"
              />
            }
            label="Set as default activity"
            sx={{ mt: 1 }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <CircularProgress size={22} />
            ) : editingActivity ? (
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

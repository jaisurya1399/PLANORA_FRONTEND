import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Refresh from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
  createPermission,
  deletePermission,
  getPermissions,
  updatePermission,
} from "../../api/permissionApi";

const initialForm = {
  name: "",
  guardName: "web",
};

export default function Permissions() {
  const [permissions, setPermissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);

  const [form, setForm] = useState(initialForm);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPermissions();

      setPermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load permissions:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to load permissions",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const openCreateDialog = () => {
    setEditingPermission(null);
    setForm({
      name: "",
      guardName: "web",
    });
    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const openEditDialog = (permission) => {
    setEditingPermission(permission);
    setForm({
      name: permission.name || "",
      guardName: permission.guardName || "web",
    });
    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setEditingPermission(null);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Permission name is required");
      return;
    }

    if (!form.guardName.trim()) {
      setError("Guard name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        guardName: form.guardName.trim(),
      };

      if (editingPermission) {
        await updatePermission(editingPermission.id, payload);
        setSuccess("Permission updated successfully");
      } else {
        await createPermission(payload);
        setSuccess("Permission created successfully");
      }

      closeDialog();
      await loadPermissions();
    } catch (err) {
      console.error("Failed to save permission:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to save permission",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (permission) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${permission.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deletePermission(permission.id);

      setSuccess("Permission deleted successfully");

      await loadPermissions();
    } catch (err) {
      console.error("Failed to delete permission:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to delete permission",
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
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system permissions and access controls.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh list">
            <IconButton
              onClick={loadPermissions}
              aria-label="Refresh permissions"
            >
              <Refresh />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Add Permission
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
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box
              sx={{
                minHeight: 260,
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
                    <TableCell width={150}>
                      <strong>ID</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Permission Name</strong>
                    </TableCell>

                    <TableCell align="center">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {permissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Box sx={{ py: 6, color: "text.secondary" }}>
                          <Typography variant="body1" fontWeight={500}>
                            No permissions found.
                          </Typography>
                          <Typography variant="body2">
                            Click “Add Permission” to create your first one.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    permissions.map((permission) => (
                      <TableRow key={permission.id} hover>
                        <TableCell>{permission.id}</TableCell>

                        <TableCell>
                          <Typography fontWeight={600}>
                            {permission.name}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              color="primary"
                              onClick={() => openEditDialog(permission)}
                              aria-label={`Edit ${permission.name}`}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(permission)}
                              aria-label={`Delete ${permission.name}`}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          {editingPermission ? "Edit Permission" : "Add Permission"}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            required
            label="Permission Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            margin="normal"
            autoFocus
            placeholder="e.g. project.view"
            helperText="Use a dotted format like module.action (e.g. project.view)."
          />

          <TextField
            fullWidth
            required
            label="Guard Name"
            name="guardName"
            value={form.guardName}
            onChange={handleChange}
            margin="normal"
            placeholder="web"
            helperText="Usually ‘web’ unless you have multiple guards."
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{ minWidth: 100 }}
          >
            {saving ? (
              <CircularProgress size={22} />
            ) : editingPermission ? (
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

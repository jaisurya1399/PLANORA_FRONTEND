import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Lock from "@mui/icons-material/Lock";
import Refresh from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";

import {
  createRole,
  deleteRole,
  getRoles,
  updateRole,
} from "../../api/roleApi";

import { getPermissions } from "../../api/permissionApi";

import {
  assignPermissionToRole,
  getPermissionsByRole,
  removePermissionFromRole,
} from "../../api/rolePermissionApi";

// ============================================================
// Initial Form
// ============================================================

const initialForm = {
  name: "",
};

export default function Roles() {
  // ============================================================
  // Roles
  // ============================================================

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // Create / Edit Role
  // ============================================================

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    ...initialForm,
  });

  const [saving, setSaving] = useState(false);

  // ============================================================
  // Permission Dialog
  // ============================================================

  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState(null);

  const [permissions, setPermissions] = useState([]);

  const [assignedPermissionIds, setAssignedPermissionIds] = useState([]);

  const [permissionLoading, setPermissionLoading] = useState(false);

  const [permissionUpdating, setPermissionUpdating] = useState(null);

  // ============================================================
  // Snackbar
  // ============================================================

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ============================================================
  // Show Message
  // ============================================================

  const showMessage = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // ============================================================
  // Error Message Helper
  // ============================================================

  const getErrorMessage = (error, fallbackMessage) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallbackMessage
    );
  };

  // ============================================================
  // Load Roles
  // ============================================================

  const loadRoles = async () => {
    try {
      setLoading(true);

      const data = await getRoles();

      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load roles:", error);

      showMessage(getErrorMessage(error, "Failed to load roles"), "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Initial Load
  // ============================================================

  useEffect(() => {
    loadRoles();
  }, []);

  // ============================================================
  // Open Create Dialog
  // ============================================================

  const handleOpenCreate = () => {
    setEditingId(null);

    setForm({
      ...initialForm,
    });

    setDialogOpen(true);
  };

  // ============================================================
  // Open Edit Dialog
  // ============================================================

  const handleOpenEdit = (role) => {
    setEditingId(role.id);

    setForm({
      name: role.name || "",
    });

    setDialogOpen(true);
  };

  // ============================================================
  // Close Create / Edit Dialog
  // ============================================================

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);

    setEditingId(null);

    setForm({
      ...initialForm,
    });
  };

  // ============================================================
  // Form Change
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // Create / Update Role
  // ============================================================

  const handleSubmit = async () => {
    const roleName = form.name.trim();

    if (!roleName) {
      showMessage("Role name is required", "error");

      return;
    }

    try {
      setSaving(true);

      // guardName is not shown in UI.
      // Backend receives web as default guard.
      const payload = {
        name: roleName,
        guardName: "web",
      };

      if (editingId !== null) {
        await updateRole(editingId, payload);

        showMessage("Role updated successfully");
      } else {
        await createRole(payload);

        showMessage("Role created successfully");
      }

      // Close dialog directly.
      // Do not call handleCloseDialog() here
      // because saving is still true.
      setDialogOpen(false);

      setEditingId(null);

      setForm({
        ...initialForm,
      });

      await loadRoles();
    } catch (error) {
      console.error("Failed to save role:", error);

      showMessage(getErrorMessage(error, "Failed to save role"), "error");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // Delete Role
  // ============================================================

  const handleDelete = async (id) => {
    const confirmed = await requestConfirm(
      "Are you sure you want to delete this role?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteRole(id);

      showMessage("Role deleted successfully");

      await loadRoles();
    } catch (error) {
      console.error("Failed to delete role:", error);

      showMessage(getErrorMessage(error, "Failed to delete role"), "error");
    }
  };

  // ============================================================
  // Open Permission Dialog
  // ============================================================

  const handleOpenPermissions = async (role) => {
    setSelectedRole(role);

    setPermissionDialogOpen(true);

    setPermissionLoading(true);

    setPermissions([]);

    setAssignedPermissionIds([]);

    try {
      // --------------------------------------------------------
      // Load all permissions
      // --------------------------------------------------------

      const allPermissions = await getPermissions();

      setPermissions(Array.isArray(allPermissions) ? allPermissions : []);

      // --------------------------------------------------------
      // Load permissions assigned to role
      // --------------------------------------------------------

      const assigned = await getPermissionsByRole(role.id);

      const assignedIds = Array.isArray(assigned)
        ? assigned
            .map((item) => Number(item.permissionId))
            .filter((id) => !Number.isNaN(id))
        : [];

      setAssignedPermissionIds(assignedIds);
    } catch (error) {
      console.error("Failed to load permissions:", error);

      showMessage(
        getErrorMessage(error, "Failed to load permissions"),
        "error",
      );

      setPermissionDialogOpen(false);

      setSelectedRole(null);
    } finally {
      setPermissionLoading(false);
    }
  };

  // ============================================================
  // Close Permission Dialog
  // ============================================================

  const handleClosePermissions = () => {
    if (permissionUpdating !== null) {
      return;
    }

    setPermissionDialogOpen(false);

    setSelectedRole(null);

    setPermissions([]);

    setAssignedPermissionIds([]);
  };

  // ============================================================
  // Assign / Remove Permission
  // ============================================================

  const handlePermissionChange = async (permission, checked) => {
    if (!selectedRole) {
      return;
    }

    const permissionId = Number(permission.id);

    const roleId = Number(selectedRole.id);

    if (Number.isNaN(permissionId) || Number.isNaN(roleId)) {
      showMessage("Invalid role or permission ID", "error");

      return;
    }

    setPermissionUpdating(permissionId);

    try {
      // --------------------------------------------------------
      // Assign Permission
      // --------------------------------------------------------

      if (checked) {
        await assignPermissionToRole(roleId, permissionId);

        setAssignedPermissionIds((previous) => {
          if (previous.includes(permissionId)) {
            return previous;
          }

          return [...previous, permissionId];
        });

        showMessage(`"${permission.name}" assigned successfully`);
      }

      // --------------------------------------------------------
      // Remove Permission
      // --------------------------------------------------------
      else {
        await removePermissionFromRole(roleId, permissionId);

        setAssignedPermissionIds((previous) =>
          previous.filter((id) => id !== permissionId),
        );

        showMessage(`"${permission.name}" removed successfully`);
      }
    } catch (error) {
      console.error("Failed to update role permission:", error);

      showMessage(
        getErrorMessage(
          error,
          checked
            ? "Failed to assign permission"
            : "Failed to remove permission",
        ),
        "error",
      );
    } finally {
      setPermissionUpdating(null);
    }
  };

  // ============================================================
  // Close Snackbar
  // ============================================================

  const handleCloseSnackbar = () => {
    setSnackbar((previous) => ({
      ...previous,
      open: false,
    }));
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <Box className="app-page pm-fade-up">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Roles
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Manage roles and their permissions
          </Typography>
        </Box>

        <Box display="flex" gap={1}>
          {/* Refresh */}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadRoles}
            disabled={loading}
          >
            Refresh
          </Button>

          {/* Add Role */}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreate}
          >
            Add Role
          </Button>
        </Box>
      </Box>

      {/* ======================================================
          ROLE TABLE
      ====================================================== */}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {/* ID */}
                <TableCell>
                  <strong>ID</strong>
                </TableCell>

                {/* Name */}
                <TableCell>
                  <strong>Name</strong>
                </TableCell>

                {/* Actions */}
                <TableCell align="center">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* Loading */}
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Box py={4}>
                      <CircularProgress />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                /* Empty */
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Box py={4}>
                      <Typography color="text.secondary">
                        No roles found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                /* Roles */
                roles.map((role) => (
                  <TableRow key={role.id} hover>
                    {/* ID */}
                    <TableCell>{role.id}</TableCell>

                    {/* Name */}
                    <TableCell>
                      <Typography fontWeight={500}>{role.name}</Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      {/* Permissions */}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Lock />}
                        onClick={() => handleOpenPermissions(role)}
                        sx={{
                          mr: 1,
                        }}
                      >
                        Permissions
                      </Button>

                      {/* Edit */}
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEdit(role)}
                        title="Edit Role"
                      >
                        <Edit />
                      </IconButton>

                      {/* Delete */}
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(role.id)}
                        title="Delete Role"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ======================================================
          CREATE / EDIT ROLE DIALOG
      ====================================================== */}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingId !== null ? "Edit Role" : "Create Role"}
        </DialogTitle>

        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {/* Role Name */}
            <TextField
              label="Role Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              required
              autoFocus
              placeholder="e.g. ADMIN"
              disabled={saving}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          {/* Cancel */}
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>

          {/* Create / Update */}
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <CircularProgress size={22} color="inherit" />
            ) : editingId !== null ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          PERMISSION MANAGEMENT DIALOG
      ====================================================== */}

      <Dialog
        open={permissionDialogOpen}
        onClose={handleClosePermissions}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Manage Permissions
          </Typography>

          {selectedRole && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Role: <strong>{selectedRole.name}</strong>
            </Typography>
          )}
        </DialogTitle>

        <DialogContent dividers>
          {/* Permission Loading */}
          {permissionLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={6}
            >
              <CircularProgress />
            </Box>
          ) : permissions.length === 0 ? (
            /* No Permissions */
            <Box py={5} textAlign="center">
              <Typography color="text.secondary">
                No permissions found.
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Permission Header */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  Available Permissions
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {assignedPermissionIds.length} assigned
                </Typography>
              </Box>

              <Divider />

              {/* Permission List */}
              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: "1fr",
                  sm: "1fr 1fr",
                  md: "1fr 1fr 1fr",
                }}
                gap={1}
                mt={2}
              >
                {permissions.map((permission) => {
                  const permissionId = Number(permission.id);

                  const checked = assignedPermissionIds.includes(permissionId);

                  const updating = permissionUpdating === permissionId;

                  return (
                    <Paper
                      key={permission.id}
                      variant="outlined"
                      sx={{
                        p: 1,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FormControlLabel
                        sx={{
                          width: "100%",
                          m: 0,
                        }}
                        control={
                          <Checkbox
                            checked={checked}
                            disabled={updating}
                            onChange={(event) =>
                              handlePermissionChange(
                                permission,
                                event.target.checked,
                              )
                            }
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {permission.name}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {permission.guardName || "web"}
                            </Typography>
                          </Box>
                        }
                      />

                      {updating && (
                        <CircularProgress
                          size={18}
                          sx={{
                            ml: "auto",
                            mr: 1,
                          }}
                        />
                      )}
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleClosePermissions}
            disabled={permissionUpdating !== null}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          SNACKBAR
      ====================================================== */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
          variant="filled"
          sx={{
            width: "100%",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

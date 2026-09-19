import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
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
import { Fragment, useEffect, useState } from "react";

import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../../api/userApi";

import { getRoles } from "../../api/roleApi";

import {
  assignUserRole,
  getUserRolesByUser,
  removeUserRole,
} from "../../api/userRoleApi";

export default function Users() {
  // =========================================================
  // STATE
  // =========================================================

  const [users, setUsers] = useState([]);

  // Page loading
  const [loading, setLoading] = useState(true);

  // Add / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Currently selected user for edit/delete
  const [selectedUser, setSelectedUser] = useState(null);

  // Add/Edit form
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Error and success messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Prevent duplicate Add/Update requests
  const [saving, setSaving] = useState(false);

  // Prevent duplicate Delete requests
  const [deleting, setDeleting] = useState(false);

  // =========================================================
  // ROLE ASSIGNMENT STATE
  //
  // Users can hold many roles (many-to-many via /user-roles).
  // Roles for a given user are only fetched once that user's
  // row is expanded, and cached in `userRolesByUserId` after.
  // =========================================================

  // All roles available to assign, loaded once.
  const [allRoles, setAllRoles] = useState([]);
  const [rolesError, setRolesError] = useState("");

  // Which user row is currently expanded to show role management.
  const [expandedUserId, setExpandedUserId] = useState(null);

  // userId -> array of UserRoleResponse ({ userId, roleId, roleName, ... })
  const [userRolesByUserId, setUserRolesByUserId] = useState({});

  // userId currently loading its role list
  const [loadingRolesForUserId, setLoadingRolesForUserId] = useState(null);

  // Per-row "assign a role" selection + in-flight state
  const [roleToAssign, setRoleToAssign] = useState(null);
  const [assigningRole, setAssigningRole] = useState(false);

  // Per-row error message (role assignment/removal)
  const [roleRowError, setRoleRowError] = useState("");

  // Confirmation dialog for removing a user's last remaining role
  const [removeRoleConfirm, setRemoveRoleConfirm] = useState(null); // { userId, roleId, roleName }
  const [removingRole, setRemovingRole] = useState(false);

  // =========================================================
  // LOAD USERS
  // =========================================================

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load users:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load users",
      );
    } finally {
      setLoading(false);
    }
  };

  // Load users when page opens
  useEffect(() => {
    loadUsers();
  }, []);

  // Load the full role list once, for the "assign a role" picker
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setRolesError("");

        const data = await getRoles();

        setAllRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load roles:", err);

        setRolesError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to load roles",
        );
      }
    };

    loadRoles();
  }, []);

  // =========================================================
  // ROLE ASSIGNMENT — LOAD / TOGGLE
  // =========================================================

  const loadRolesForUser = async (userId) => {
    try {
      setLoadingRolesForUserId(userId);
      setRoleRowError("");

      const data = await getUserRolesByUser(userId);

      setUserRolesByUserId((previous) => ({
        ...previous,
        [userId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error("Failed to load user roles:", err);

      setRoleRowError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load roles for this user",
      );
    } finally {
      setLoadingRolesForUserId(null);
    }
  };

  const handleToggleExpand = (userId) => {
    setRoleRowError("");
    setRoleToAssign(null);

    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(userId);

    // Fetch lazily — only once per user, cached afterwards.
    if (!userRolesByUserId[userId]) {
      loadRolesForUser(userId);
    }
  };

  // =========================================================
  // ROLE ASSIGNMENT — ASSIGN
  // =========================================================

  const handleAssignRole = async (userId) => {
    if (!roleToAssign || assigningRole) {
      return;
    }

    try {
      setAssigningRole(true);
      setRoleRowError("");

      await assignUserRole({
        userId,
        roleId: roleToAssign.id,
      });

      setRoleToAssign(null);

      // Refresh this user's role list from the backend.
      await loadRolesForUser(userId);

      setSuccess("Role assigned successfully");
    } catch (err) {
      console.error("Failed to assign role:", err);

      setRoleRowError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to assign role",
      );
    } finally {
      setAssigningRole(false);
    }
  };

  // =========================================================
  // ROLE ASSIGNMENT — REMOVE
  // =========================================================

  const handleRemoveRoleClick = (userId, role) => {
    const currentRoles = userRolesByUserId[userId] || [];

    // Removing this role would leave the user with zero roles —
    // ask for confirmation first.
    if (currentRoles.length <= 1) {
      setRemoveRoleConfirm({
        userId,
        roleId: role.roleId,
        roleName: role.roleName,
      });
      return;
    }

    performRemoveRole(userId, role.roleId);
  };

  const performRemoveRole = async (userId, roleId) => {
    try {
      setRemovingRole(true);
      setRoleRowError("");

      await removeUserRole(userId, roleId);

      await loadRolesForUser(userId);

      setSuccess("Role removed successfully");
      setRemoveRoleConfirm(null);
    } catch (err) {
      console.error("Failed to remove role:", err);

      setRoleRowError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to remove role",
      );
      setRemoveRoleConfirm(null);
    } finally {
      setRemovingRole(false);
    }
  };

  const handleConfirmRemoveRole = () => {
    if (!removeRoleConfirm) {
      return;
    }

    performRemoveRole(removeRoleConfirm.userId, removeRoleConfirm.roleId);
  };

  // =========================================================
  // OPEN ADD USER
  // =========================================================

  const handleAdd = () => {
    // Do not allow opening another form while saving
    if (saving) {
      return;
    }

    setSelectedUser(null);

    setForm({
      name: "",
      email: "",
      password: "",
    });

    setError("");

    setDialogOpen(true);
  };

  // =========================================================
  // OPEN EDIT USER
  // =========================================================

  const handleEdit = (user) => {
    if (saving) {
      return;
    }

    setSelectedUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
    });

    setError("");

    setDialogOpen(true);
  };

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // SAVE USER
  // ADD + UPDATE
  // =========================================================

  const handleSave = async () => {
    // Duplicate-click protection
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      // -------------------------------------------------------
      // VALIDATION
      // -------------------------------------------------------

      if (!form.name.trim()) {
        setError("Name is required");
        return;
      }

      if (!form.email.trim()) {
        setError("Email is required");
        return;
      }

      if (!selectedUser && !form.password.trim()) {
        setError("Password is required");
        return;
      }

      // -------------------------------------------------------
      // CREATE PAYLOAD
      // -------------------------------------------------------

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      // -------------------------------------------------------
      // UPDATE
      // -------------------------------------------------------

      if (selectedUser) {
        await updateUser(selectedUser.id, payload);

        setSuccess("User updated successfully");
      }

      // -------------------------------------------------------
      // CREATE
      // -------------------------------------------------------
      else {
        await createUser(payload);

        setSuccess("User created successfully");
      }

      // -------------------------------------------------------
      // RESET
      // -------------------------------------------------------

      setDialogOpen(false);
      setSelectedUser(null);

      setForm({
        name: "",
        email: "",
        password: "",
      });

      // Refresh table from backend
      await loadUsers();
    } catch (err) {
      console.error("Failed to save user:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to save user",
      );
    } finally {
      // Always enable button again
      setSaving(false);
    }
  };

  // =========================================================
  // OPEN DELETE CONFIRMATION
  // =========================================================

  const handleDeleteClick = (user) => {
    if (deleting) {
      return;
    }

    setSelectedUser(user);

    setError("");

    setDeleteDialogOpen(true);
  };

  // =========================================================
  // DELETE USER
  // =========================================================

  const handleDelete = async () => {
    // No selected user
    if (!selectedUser) {
      return;
    }

    // Duplicate-click protection
    if (deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteUser(selectedUser.id);

      setSuccess("User deleted successfully");

      setDeleteDialogOpen(false);
      setSelectedUser(null);

      // Refresh table
      await loadUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);

      setDeleteDialogOpen(false);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to delete user",
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // CLOSE ADD / EDIT DIALOG
  // =========================================================

  const handleCloseDialog = () => {
    // Do not close while request is running
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setSelectedUser(null);
    setError("");

    setForm({
      name: "",
      email: "",
      password: "",
    });
  };

  // =========================================================
  // CLOSE DELETE DIALOG
  // =========================================================

  const handleCloseDeleteDialog = () => {
    if (deleting) {
      return;
    }

    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Box className="app-page pm-fade-up">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Users
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Manage users from the backend.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
          }}
        >
          {/* Refresh */}

          <Tooltip title="Refresh">
            <span>
              <IconButton
                onClick={loadUsers}
                disabled={loading || saving || deleting}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                }}
                aria-label="Refresh"
              >
                {loading ? <CircularProgress size={22} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>

          {/* Add User */}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={saving || deleting}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* =====================================================
          PAGE ERROR
      ===================================================== */}

      {error && !dialogOpen && !deleteDialogOpen && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {rolesError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {rolesError}
        </Alert>
      )}

      {/* =====================================================
          USERS TABLE
      ===================================================== */}

      <Paper elevation={2}>
        {loading ? (
          <Box
            sx={{
              minHeight: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 48 }} />

                  <TableCell>
                    <strong>ID</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Email</strong>
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
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{
                        py: 5,
                      }}
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const isExpanded = expandedUserId === user.id;
                    const userRoles = userRolesByUserId[user.id];
                    const isLoadingRoles = loadingRolesForUserId === user.id;

                    // Roles not already assigned to this user
                    const assignedRoleIds = new Set(
                      (userRoles || []).map((role) => role.roleId),
                    );
                    const availableRoles = allRoles.filter(
                      (role) => !assignedRoleIds.has(role.id),
                    );

                    return (
                      <Fragment key={user.id}>
                        <TableRow hover>
                          {/* EXPAND */}

                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleExpand(user.id)}
                              aria-label="Open menu"
                            >
                              {isExpanded ? (
                                <KeyboardArrowUpIcon fontSize="small" />
                              ) : (
                                <KeyboardArrowDownIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>

                          {/* ID */}

                          <TableCell>{user.id}</TableCell>

                          {/* NAME */}

                          <TableCell>{user.name || "-"}</TableCell>

                          {/* EMAIL */}

                          <TableCell>{user.email || "-"}</TableCell>

                          <TableCell>
                            {user.active === false ? "Inactive" : "Active"}
                          </TableCell>

                          {/* ACTIONS */}

                          <TableCell align="centre">
                            {/* EDIT */}

                            <Tooltip title="Edit User">
                              <span>
                                <IconButton
                                  color="primary"
                                  onClick={() => handleEdit(user)}
                                  disabled={saving || deleting}
                                  aria-label="Edit"
                                >
                                  <EditIcon />
                                </IconButton>
                              </span>
                            </Tooltip>

                            {/* DELETE */}

                            <Tooltip title="Delete User">
                              <span>
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteClick(user)}
                                  disabled={saving || deleting}
                                  aria-label="Delete"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>

                        {/* =====================================
                            ROLE MANAGEMENT (expandable)
                        ===================================== */}

                        <TableRow>
                          <TableCell
                            colSpan={6}
                            sx={{
                              py: 0,
                              borderBottom: isExpanded ? undefined : "none",
                            }}
                          >
                            <Collapse in={isExpanded} unmountOnExit>
                              <Box sx={{ py: 2, px: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  color="text.secondary"
                                  sx={{ mb: 1.5 }}
                                >
                                  Roles
                                </Typography>

                                {isExpanded && roleRowError && (
                                  <Alert severity="error" sx={{ mb: 1.5 }}>
                                    {roleRowError}
                                  </Alert>
                                )}

                                {isLoadingRoles ? (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      py: 1,
                                    }}
                                  >
                                    <CircularProgress size={18} />
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Loading roles...
                                    </Typography>
                                  </Box>
                                ) : (
                                  <>
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      flexWrap="wrap"
                                      useFlexGap
                                      sx={{ mb: 2 }}
                                    >
                                      {(userRoles || []).length === 0 ? (
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          No roles assigned.
                                        </Typography>
                                      ) : (
                                        (userRoles || []).map((role) => (
                                          <Chip
                                            key={role.roleId}
                                            label={role.roleName}
                                            onDelete={() =>
                                              handleRemoveRoleClick(
                                                user.id,
                                                role,
                                              )
                                            }
                                            disabled={removingRole}
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                          />
                                        ))
                                      )}
                                    </Stack>

                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                    >
                                      <Autocomplete
                                        size="small"
                                        options={availableRoles}
                                        getOptionLabel={(role) =>
                                          role.name || ""
                                        }
                                        value={roleToAssign}
                                        onChange={(event, value) =>
                                          setRoleToAssign(value)
                                        }
                                        isOptionEqualToValue={(option, value) =>
                                          option.id === value.id
                                        }
                                        disabled={
                                          assigningRole ||
                                          availableRoles.length === 0
                                        }
                                        sx={{ width: 240 }}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            label={
                                              availableRoles.length === 0
                                                ? "All roles assigned"
                                                : "Add a role"
                                            }
                                          />
                                        )}
                                      />

                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        disabled={
                                          !roleToAssign || assigningRole
                                        }
                                        onClick={() =>
                                          handleAssignRole(user.id)
                                        }
                                      >
                                        {assigningRole ? (
                                          <CircularProgress size={16} />
                                        ) : (
                                          "Add"
                                        )}
                                      </Button>
                                    </Stack>
                                  </>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* =====================================================
          ADD / EDIT USER DIALOG
      ===================================================== */}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{selectedUser ? "Edit User" : "Add User"}</DialogTitle>

        <DialogContent>
          {/* Form error */}

          {error && (
            <Alert
              severity="error"
              sx={{
                mt: 1,
                mb: 1,
              }}
            >
              {error}
            </Alert>
          )}

          {/* NAME */}

          <TextField
            fullWidth
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            margin="normal"
            required
            disabled={saving}
          />

          {/* EMAIL */}

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            margin="normal"
            required
            disabled={saving}
          />

          {/* PASSWORD */}

          <TextField
            fullWidth
            label={
              selectedUser
                ? "Password (leave blank to keep current)"
                : "Password"
            }
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            margin="normal"
            required={!selectedUser}
            disabled={saving}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          {/* CANCEL */}

          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>

          {/* CREATE / UPDATE */}

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={
              saving ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            {saving
              ? selectedUser
                ? "Updating..."
                : "Creating..."
              : selectedUser
                ? "Update"
                : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete User</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{selectedUser?.name || selectedUser?.email}</strong>?
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          {/* CANCEL */}

          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            Cancel
          </Button>

          {/* DELETE */}

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          REMOVE LAST ROLE CONFIRMATION
      ===================================================== */}

      <Dialog
        open={Boolean(removeRoleConfirm)}
        onClose={() => (removingRole ? null : setRemoveRoleConfirm(null))}
      >
        <DialogTitle>Remove Role</DialogTitle>

        <DialogContent>
          <Typography>
            Removing <strong>{removeRoleConfirm?.roleName}</strong> will leave
            this user with no roles assigned. Are you sure you want to continue?
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button
            onClick={() => setRemoveRoleConfirm(null)}
            disabled={removingRole}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmRemoveRole}
            disabled={removingRole}
            startIcon={
              removingRole ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DeleteIcon />
              )
            }
          >
            {removingRole ? "Removing..." : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          SUCCESS MESSAGE
      ===================================================== */}

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        message={success}
      />
    </Box>
  );
}

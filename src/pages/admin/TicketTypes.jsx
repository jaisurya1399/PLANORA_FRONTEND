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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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
  BugReport,
  Build,
  Category,
  HelpOutline,
  Lightbulb,
  Search,
  SupportAgent,
  TaskAlt,
  Tune,
  Work,
} from "@mui/icons-material";

import {
  createTicketType,
  deleteTicketType,
  getTicketTypes,
  restoreTicketType,
  updateTicketType,
} from "../../api/ticketTypeApi";

import { PRIMARY } from "../../theme/colors";

/*
 * ============================================================
 * INITIAL FORM
 * ============================================================
 */

const initialForm = {
  name: "",
  color: PRIMARY,
  icon: "task",
};

/*
 * ============================================================
 * ICON OPTIONS
 * ============================================================
 */

const ICON_OPTIONS = [
  {
    value: "bug",
    label: "Bug",
    component: BugReport,
  },
  {
    value: "feature",
    label: "Feature",
    component: Lightbulb,
  },
  {
    value: "task",
    label: "Task",
    component: TaskAlt,
  },
  {
    value: "improvement",
    label: "Improvement",
    component: Tune,
  },
  {
    value: "support",
    label: "Support",
    component: SupportAgent,
  },
  {
    value: "maintenance",
    label: "Maintenance",
    component: Build,
  },
  {
    value: "documentation",
    label: "Documentation",
    component: Category,
  },
  {
    value: "investigation",
    label: "Investigation",
    component: Search,
  },
  {
    value: "enhancement",
    label: "Enhancement",
    component: Lightbulb,
  },
  {
    value: "technical-debt",
    label: "Technical Debt",
    component: Work,
  },
  {
    value: "support-request",
    label: "Support Request",
    component: HelpOutline,
  },
  {
    value: "other",
    label: "Other",
    component: Category,
  },
];

/*
 * ============================================================
 * COLOR OPTIONS
 * ============================================================
 */

const COLOR_OPTIONS = [
  {
    value: "#EF4444",
    label: "Red",
  },
  {
    value: PRIMARY,
    label: "Blue",
  },
  {
    value: "#22C55E",
    label: "Green",
  },
  {
    value: "#F59E0B",
    label: "Orange",
  },
  {
    value: "#8B5CF6",
    label: "Purple",
  },
  {
    value: "#06B6D4",
    label: "Cyan",
  },
  {
    value: "#14B8A6",
    label: "Teal",
  },
  {
    value: "#EC4899",
    label: "Pink",
  },
  {
    value: "#6B7280",
    label: "Gray",
  },
];

/*
 * ============================================================
 * ERROR HANDLER
 * ============================================================
 */

const getErrorMessage = (err, fallback) => {
  const responseData = err?.response?.data;

  if (!responseData) {
    return fallback;
  }

  if (responseData.errors && typeof responseData.errors === "object") {
    const validationErrors = Object.entries(responseData.errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(" | ");

    if (validationErrors) {
      return validationErrors;
    }
  }

  if (typeof responseData.message === "string") {
    return responseData.message;
  }

  if (typeof responseData.error === "string") {
    return responseData.error;
  }

  if (typeof responseData === "string") {
    return responseData;
  }

  return fallback;
};

/*
 * ============================================================
 * GET ICON COMPONENT
 * ============================================================
 */

const getIconComponent = (iconValue) => {
  const found = ICON_OPTIONS.find((option) => option.value === iconValue);

  return found?.component || Category;
};

/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function TicketTypes() {
  const [ticketTypes, setTicketTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [search, setSearch] = useState("");

  /*
   * ==========================================================
   * LOAD TICKET TYPES
   * ==========================================================
   */

  const loadTicketTypes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTicketTypes();

      setTicketTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load ticket types:", err);

      setError(getErrorMessage(err, "Failed to load ticket types"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketTypes();
  }, []);

  /*
   * ==========================================================
   * OPEN CREATE DIALOG
   * ==========================================================
   */

  const openCreateDialog = () => {
    setEditingType(null);

    setForm({
      ...initialForm,
    });

    setError("");
    setSuccess("");

    setDialogOpen(true);
  };

  /*
   * ==========================================================
   * OPEN EDIT DIALOG
   * ==========================================================
   */

  const openEditDialog = (ticketType) => {
    setEditingType(ticketType);

    setForm({
      name: ticketType.name || "",
      color: ticketType.color || PRIMARY,
      icon: ticketType.icon || "task",
    });

    setError("");
    setSuccess("");

    setDialogOpen(true);
  };

  /*
   * ==========================================================
   * CLOSE DIALOG
   * ==========================================================
   */

  const closeDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingType(null);

    setForm({
      ...initialForm,
    });
  };

  /*
   * ==========================================================
   * FORM CHANGE
   * ==========================================================
   */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * ==========================================================
   * VALIDATION
   * ==========================================================
   */

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Ticket type name is required";
    }

    if (!form.color.trim()) {
      return "Color is required";
    }

    if (!form.icon.trim()) {
      return "Icon is required";
    }

    return "";
  };

  /*
   * ==========================================================
   * CREATE / UPDATE
   * ==========================================================
   */

  const handleSubmit = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /*
       * EXACT BACKEND PAYLOAD
       *
       * No description field.
       */

      const payload = {
        name: form.name.trim(),
        color: form.color.trim(),
        icon: form.icon.trim(),
      };

      if (editingType) {
        await updateTicketType(editingType.id, payload);

        setSuccess("Ticket type updated successfully");
      } else {
        await createTicketType(payload);

        setSuccess("Ticket type created successfully");
      }

      setDialogOpen(false);
      setEditingType(null);

      setForm({
        ...initialForm,
      });

      await loadTicketTypes();
    } catch (err) {
      console.error("Failed to save ticket type:", err);

      setError(getErrorMessage(err, "Failed to save ticket type"));
    } finally {
      setSaving(false);
    }
  };

  /*
   * ==========================================================
   * DELETE
   * ==========================================================
   */

  const handleDelete = async (ticketType) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${ticketType.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteTicketType(ticketType.id);

      setSuccess("Ticket type deleted successfully");

      await loadTicketTypes();
    } catch (err) {
      console.error("Failed to delete ticket type:", err);

      setError(getErrorMessage(err, "Failed to delete ticket type"));
    }
  };

  /*
   * ==========================================================
   * RESTORE
   * ==========================================================
   */

  const handleRestore = async (ticketType) => {
    try {
      setError("");
      setSuccess("");

      await restoreTicketType(ticketType.id);

      setSuccess("Ticket type restored successfully");

      await loadTicketTypes();
    } catch (err) {
      console.error("Failed to restore ticket type:", err);

      setError(getErrorMessage(err, "Failed to restore ticket type"));
    }
  };

  /*
   * ==========================================================
   * SEARCH
   * ==========================================================
   */

  const filteredTicketTypes = ticketTypes.filter((ticketType) => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    return (
      ticketType.name?.toLowerCase().includes(searchValue) ||
      ticketType.icon?.toLowerCase().includes(searchValue) ||
      ticketType.color?.toLowerCase().includes(searchValue)
    );
  });

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <Box className="app-page pm-fade-up">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <Box
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
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Ticket Types
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Manage ticket type master data.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            width: {
              xs: "100%",
              sm: "auto",
            },
          }}
        >
          <Tooltip title="Refresh">
            <IconButton onClick={loadTicketTypes} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Add Type
          </Button>
        </Box>
      </Box>

      {/* =====================================================
          ALERTS
      ====================================================== */}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* =====================================================
          SEARCH
      ====================================================== */}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            label="Search Ticket Types"
            placeholder="Search by name, icon or color..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <Search
                  sx={{
                    mr: 1,
                    color: "text.secondary",
                  }}
                />
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* =====================================================
          TABLE
      ====================================================== */}

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
                    <TableCell width={70}>
                      <strong>ID</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Name</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Color</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Icon</strong>
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
                  {filteredTicketTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography
                          sx={{
                            py: 5,
                            color: "text.secondary",
                          }}
                        >
                          {search.trim()
                            ? "No matching ticket types found."
                            : "No ticket types found."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTicketTypes.map((ticketType) => {
                      const deleted = Boolean(ticketType.deletedAt);

                      const IconComponent = getIconComponent(ticketType.icon);

                      return (
                        <TableRow
                          key={ticketType.id}
                          hover
                          sx={{
                            opacity: deleted ? 0.6 : 1,
                          }}
                        >
                          {/* ID */}

                          <TableCell>{ticketType.id}</TableCell>

                          {/* NAME */}

                          <TableCell>
                            <Typography fontWeight={600}>
                              {ticketType.name}
                            </Typography>
                          </TableCell>

                          {/* COLOR */}

                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 1,
                                  backgroundColor:
                                    ticketType.color || "#6B7280",
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                              />

                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "monospace",
                                }}
                              >
                                {ticketType.color || "-"}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* ICON */}

                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <IconComponent
                                fontSize="small"
                                sx={{
                                  color: ticketType.color || "text.secondary",
                                }}
                              />

                              <Typography variant="body2">
                                {ticketType.icon || "-"}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* STATUS */}

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

                          {/* ACTIONS */}

                          <TableCell align="right">
                            {!deleted ? (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton
                                    color="primary"
                                    onClick={() => openEditDialog(ticketType)}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete">
                                  <IconButton
                                    color="error"
                                    onClick={() => handleDelete(ticketType)}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <Tooltip title="Restore">
                                <IconButton
                                  color="success"
                                  onClick={() => handleRestore(ticketType)}
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

      {/* =====================================================
          CREATE / EDIT DIALOG
      ====================================================== */}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingType ? "Edit Ticket Type" : "Add Ticket Type"}
        </DialogTitle>

        <DialogContent>
          {/* NAME */}

          <TextField
            fullWidth
            required
            label="Ticket Type Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            margin="normal"
            autoFocus
            disabled={saving}
          />

          {/* COLOR */}

          <FormControl fullWidth required margin="normal" disabled={saving}>
            <InputLabel id="ticket-type-color-label">Color</InputLabel>

            <Select
              labelId="ticket-type-color-label"
              label="Color"
              name="color"
              value={form.color}
              onChange={handleChange}
            >
              {COLOR_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: 1,
                        backgroundColor: option.value,
                      }}
                    />

                    <Typography>{option.label}</Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontFamily: "monospace",
                      }}
                    >
                      {option.value}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* CUSTOM COLOR */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mt: 1,
            }}
          >
            <Typography variant="body2">Custom Color</Typography>

            <input
              type="color"
              value={form.color || PRIMARY}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  color: event.target.value,
                }))
              }
              disabled={saving}
              style={{
                width: 45,
                height: 35,
                padding: 2,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            />

            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
              }}
            >
              {form.color}
            </Typography>
          </Box>

          {/* ICON */}

          <FormControl fullWidth required margin="normal" disabled={saving}>
            <InputLabel id="ticket-type-icon-label">Icon</InputLabel>

            <Select
              labelId="ticket-type-icon-label"
              label="Icon"
              name="icon"
              value={form.icon}
              onChange={handleChange}
            >
              {ICON_OPTIONS.map((option) => {
                const IconComponent = option.component;

                return (
                  <MenuItem key={option.value} value={option.value}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <IconComponent
                        sx={{
                          color: form.color || "primary.main",
                        }}
                      />

                      <Typography>{option.label}</Typography>

                      <Typography variant="caption" color="text.secondary">
                        ({option.value})
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* PREVIEW */}

          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.default",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={1}
            >
              Preview
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {(() => {
                const PreviewIcon = getIconComponent(form.icon);

                return (
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${form.color}20`,
                      color: form.color,
                    }}
                  >
                    <PreviewIcon fontSize="small" />
                  </Box>
                );
              })()}

              <Box>
                <Typography fontWeight={600}>
                  {form.name || "Ticket Type"}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {form.icon || "task"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <CircularProgress size={22} />
            ) : editingType ? (
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

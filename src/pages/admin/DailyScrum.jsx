import Add from "@mui/icons-material/Add";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import Close from "@mui/icons-material/Close";
import Edit from "@mui/icons-material/Edit";
import EventAvailable from "@mui/icons-material/EventAvailable";
import Refresh from "@mui/icons-material/Refresh";
import Save from "@mui/icons-material/Save";
import WarningAmber from "@mui/icons-material/WarningAmber";
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
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";

import {
  createDailyScrum,
  getDailyScrumsByProjectAndRange,
  updateDailyScrum,
} from "../../api/dailyScrumApi";

import { getProjectUsers } from "../../api/projectUserApi";

import {
  BORDER,
  CANVAS_BACKGROUND,
  PRIMARY_SUBTLE,
  RADIUS,
  STATUS_COLORS,
  SURFACE,
  TEXT_FAINT,
  TEXT_SECONDARY,
} from "../../theme/colors";

/* ============================================================
   DATE HELPERS
   ============================================================ */

const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getStartOfMonth = () => {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getEndOfMonth = () => {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};

/* ============================================================
   INITIAL FORM
   ============================================================ */

const initialForm = {
  id: null,
  userId: "",
  projectId: "",
  scrumDate: "",
  yesterdayWork: "",
  todayWork: "",
  blockers: "",
};

/* ============================================================
   DATE DISPLAY
   ============================================================ */

const formatDate = (dateString) => {
  if (!dateString) {
    return "—";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMonth = () => {
  return new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function DailyScrum() {
  const { getPrimaryProjectId, getProjectMembership } = useAuth();
  const projectId = getPrimaryProjectId();
  const activeMembership = projectId ? getProjectMembership(projectId) : null;
  const activeProject = projectId
    ? {
        id: Number(projectId),
        name:
          activeMembership?.projectName ||
          activeMembership?.project?.name ||
          `Project #${projectId}`,
      }
    : null;

  const [users, setUsers] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState("");

  const [scrums, setScrums] = useState([]);

  const [startDate, setStartDate] = useState(getDateString(getStartOfMonth()));

  const [endDate, setEndDate] = useState(getDateString(getEndOfMonth()));

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ============================================================
     LOAD INITIAL DATA
     ============================================================ */

  useEffect(() => {
    loadInitialData();
  }, [projectId]);

  const loadInitialData = async () => {
    if (!projectId) {
      setUsers([]);
      setSelectedUserId("");
      setError(
        "No project is selected. Please select a project from the sidebar.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      // IMPORTANT: Daily Scrum is project-scoped. Never load global users here.
      const response = await getProjectUsers(Number(projectId));
      const assignments = Array.isArray(response)
        ? response
        : response?.data || [];

      const developers = assignments
        .map((m) => ({
          id: m.userId ?? m.user?.id,
          name: m.userName ?? m.user?.name,
          fullName: m.userFullName ?? m.user?.fullName,
          email: m.userEmail ?? m.user?.email,
          role: String(m.role || "").toUpperCase(),
        }))
        .filter((u) => u.id != null && u.role === "DEVELOPER")
        .sort((a, b) =>
          (a.name || a.fullName || a.email || "")
            .trim()
            .localeCompare(
              (b.name || b.fullName || b.email || "").trim(),
              undefined,
              { sensitivity: "base" },
            ),
        );

      setUsers(developers);
      setScrums([]);
      setSelectedUserId((current) =>
        developers.some((u) => String(u.id) === String(current))
          ? current
          : developers.length
            ? String(developers[0].id)
            : "",
      );
    } catch (err) {
      console.error("Unable to load project Daily Scrum users:", err);
      setUsers([]);
      setSelectedUserId("");
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load developers for the selected project",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     LOAD SCRUMS
     ============================================================ */

  const loadScrums = async () => {
    if (!selectedUserId) {
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select both From date and To date");
      return;
    }

    if (startDate > endDate) {
      setError("From date cannot be greater than To date");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (!projectId) {
        setScrums([]);
        setError("No project is selected.");
        return;
      }

      // Use the project-scoped endpoint so Project Administrator/Team Lead can
      // retrieve scrum data for the selected project without calling the
      // user-self endpoint. Then show only the selected developer.
      const response = await getDailyScrumsByProjectAndRange(
        Number(projectId),
        startDate,
        endDate,
      );

      const data = Array.isArray(response) ? response : response?.data || [];
      setScrums(
        data.filter((scrum) => String(scrum.userId) === String(selectedUserId)),
      );
    } catch (err) {
      console.error("Unable to load scrum data:", err);

      setScrums([]);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load Daily Scrum data",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     LOAD WHEN FILTER CHANGES
     ============================================================ */

  useEffect(() => {
    if (selectedUserId) {
      loadScrums();
    }
  }, [selectedUserId, startDate, endDate, projectId]);

  /* ============================================================
     SELECTED USER
     ============================================================ */

  const selectedUser = users.find(
    (user) => String(user.id) === String(selectedUserId),
  );

  /* ============================================================
     SCRUM MAP
     ============================================================ */

  const scrumMap = useMemo(() => {
    const map = new Map();

    scrums.forEach((scrum) => {
      const scrumDate = String(scrum.scrumDate).substring(0, 10);

      const key = `${scrumDate}_${scrum.projectId}`;

      map.set(key, scrum);
    });

    return map;
  }, [scrums]);

  /* ============================================================
     GENERATE ROWS
     ============================================================ */

  const rows = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) {
      return [];
    }

    const result = [];

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    const current = new Date(start);

    while (current <= end) {
      const date = getDateString(current);

      if (activeProject) {
        const key = `${date}_${activeProject.id}`;

        result.push({
          date,
          project: activeProject,
          scrum: scrumMap.get(key) || null,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [startDate, endDate, activeProject, scrumMap]);

  /* ============================================================
     SUMMARY
     ============================================================ */

  const summary = useMemo(() => {
    const submitted = rows.filter((row) => row.scrum).length;

    const missing = rows.length - submitted;

    const blockers = rows.filter((row) => row.scrum?.blockers?.trim()).length;

    return {
      total: rows.length,
      submitted,
      missing,
      blockers,
    };
  }, [rows]);

  /* ============================================================
     ADD
     ============================================================ */

  const handleAdd = (
    date = getDateString(new Date()),
    targetProjectId = projectId,
  ) => {
    setForm({
      ...initialForm,
      userId: selectedUserId,
      projectId: String(targetProjectId || ""),
      scrumDate: date,
    });

    setDialogOpen(true);
  };

  /* ============================================================
     EDIT
     ============================================================ */

  const handleEdit = (scrum) => {
    setForm({
      id: scrum.id,
      userId: String(scrum.userId),
      projectId: String(scrum.projectId),
      scrumDate: String(scrum.scrumDate).substring(0, 10),
      yesterdayWork: scrum.yesterdayWork || "",
      todayWork: scrum.todayWork || "",
      blockers: scrum.blockers || "",
    });

    setDialogOpen(true);
  };

  /* ============================================================
     CLOSE DIALOG
     ============================================================ */

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setForm(initialForm);
  };

  /* ============================================================
     SAVE
     ============================================================ */

  const handleSave = async () => {
    if (!form.userId) {
      setError("Developer is required");
      return;
    }

    if (!form.projectId) {
      setError("Project is required");
      return;
    }

    if (!form.scrumDate) {
      setError("Date is required");
      return;
    }

    if (!form.yesterdayWork.trim()) {
      setError("Yesterday work is required");
      return;
    }

    if (!form.todayWork.trim()) {
      setError("Today work is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        userId: Number(form.userId),
        projectId: Number(form.projectId),
        scrumDate: form.scrumDate,
        yesterdayWork: form.yesterdayWork.trim(),
        todayWork: form.todayWork.trim(),
        blockers: form.blockers?.trim() || "",
      };

      if (form.id) {
        await updateDailyScrum(form.id, payload);

        setSuccess("Daily Scrum updated successfully");
      } else {
        await createDailyScrum(payload);

        setSuccess("Daily Scrum added successfully");
      }

      setDialogOpen(false);
      setForm(initialForm);

      await loadScrums();
    } catch (err) {
      console.error("Save Daily Scrum error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to save Daily Scrum",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     SUMMARY CARD
     ============================================================ */

  const SummaryCard = ({ title, value, subtitle, icon, iconBg }) => (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: {
          xs: "100%",
          sm: 180,
        },
        p: 2,
        borderRadius: RADIUS.card,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: SURFACE,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>

          <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
            {value}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: iconBg,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <Box className="app-page pm-fade-up" sx={{ minHeight: "100vh" }}>
      {/* ======================================================
          HEADER
         ====================================================== */}

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          md: "center",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                backgroundColor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: SURFACE,
              }}
            >
              <EventAvailable />
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={800}>
                Daily Scrum
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Developer-wise daily scrum management
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={loadScrums}
            disabled={loading || !selectedUserId}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleAdd()}
            disabled={!selectedUserId}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 2,
            }}
          >
            Create Daily Scrum
          </Button>
        </Stack>
      </Stack>

      {/* ======================================================
          DEVELOPER SECTION
         ====================================================== */}

      <Paper
        elevation={0}
        sx={{
          borderRadius: RADIUS.card,
          border: "1px solid",
          borderColor: "divider",
          mb: 2,
          overflow: "hidden",
          backgroundColor: SURFACE,
        }}
      >
        <Box sx={{ px: 2, pt: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Developers
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Select a developer to view their Daily Scrum
          </Typography>
        </Box>

        <Tabs
          value={selectedUserId}
          onChange={(_, value) => setSelectedUserId(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mt: 1,

            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 52,
            },
          }}
        >
          {users.map((user) => (
            <Tab
              key={user.id}
              value={String(user.id)}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "10%",
                      backgroundColor: "primary.main",
                      color: SURFACE,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </Box>

                  <span>{user.name || user.email || `User ${user.id}`}</span>
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* ======================================================
          FILTER
         ====================================================== */}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: RADIUS.card,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: SURFACE,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
          alignItems={{
            xs: "stretch",
            md: "flex-end",
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 220,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              SELECTED DEVELOPER
            </Typography>

            <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
              {selectedUser?.name || selectedUser?.email || "Select developer"}
            </Typography>
          </Box>

          <TextField
            type="date"
            label="From"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            size="small"
            sx={{
              minWidth: 180,
            }}
          />

          <TextField
            type="date"
            label="To"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            size="small"
            sx={{
              minWidth: 180,
            }}
          />

          <Button
            variant="contained"
            startIcon={<CalendarMonth />}
            onClick={loadScrums}
            disabled={loading}
            sx={{
              height: 40,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Load
          </Button>
        </Stack>
      </Paper>

      {/* ======================================================
          FILTER INFO
         ====================================================== */}

      {selectedUser && (
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.5,
            mb: 2,
            borderRadius: RADIUS.card,
            backgroundColor: PRIMARY_SUBTLE,
            border: `1px solid ${BORDER}`,
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography variant="body2" color="text.secondary">
              Showing scrum for{" "}
              <strong>{selectedUser.name || selectedUser.email}</strong>
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {formatDate(startDate)} — {formatDate(endDate)}
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* ======================================================
          SUMMARY CARDS
         ====================================================== */}

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <SummaryCard
          title="Total Entries"
          value={summary.total}
          subtitle={formatMonth()}
          icon={<CalendarMonth color="primary" />}
          iconBg={PRIMARY_SUBTLE}
        />

        <SummaryCard
          title="Submitted"
          value={summary.submitted}
          subtitle="Scrum completed"
          icon={<CheckCircleOutline color="success" />}
          iconBg={STATUS_COLORS.DONE.bg}
        />

        <SummaryCard
          title="Missing"
          value={summary.missing}
          subtitle="No scrum submitted"
          icon={<WarningAmber color="warning" />}
          iconBg="#fff7e8"
        />

        <SummaryCard
          title="Blockers"
          value={summary.blockers}
          subtitle="Entries with blockers"
          icon={<WarningAmber color="error" />}
          iconBg="#fff0f0"
        />
      </Stack>

      {/* ======================================================
          TABLE
         ====================================================== */}

      <Paper
        elevation={0}
        sx={{
          borderRadius: RADIUS.card,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          backgroundColor: SURFACE,
        }}
      >
        {/* TABLE HEADER */}

        <Box
          sx={{
            px: 2,
            py: 1.8,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Scrum Entries
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Daily work updates for the selected developer
          </Typography>
        </Box>

        <Box
          sx={{
            overflowX: "auto",
          }}
        >
          <Box
            component="table"
            sx={{
              width: "100%",
              minWidth: 950,
              borderCollapse: "separate",
              borderSpacing: 0,

              "& th": {
                backgroundColor: CANVAS_BACKGROUND,
                borderBottom: `1px solid ${BORDER}`,
                padding: "13px 14px",
                textAlign: "left",
                fontSize: "12px",
                fontWeight: 800,
                color: TEXT_SECONDARY,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              },

              "& td": {
                borderBottom: `1px solid ${BORDER}`,
                padding: "13px 14px",
                verticalAlign: "top",
              },

              "& tbody tr:hover td": {
                backgroundColor: CANVAS_BACKGROUND,
              },

              "& tbody tr:last-child td": {
                borderBottom: "none",
              },
            }}
          >
            <thead>
              <tr>
                <th>Date</th>
                {/* <th>Project</th> */}
                <th>Yesterday</th>
                <th>Today</th>
                <th>Blockers</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 60,
                    }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <CircularProgress />

                      <Typography variant="body2" color="text.secondary">
                        Loading Daily Scrum...
                      </Typography>
                    </Stack>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 60,
                    }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <CalendarMonth
                        sx={{
                          fontSize: 42,
                          color: TEXT_FAINT,
                        }}
                      />

                      <Typography fontWeight={600} color="text.secondary">
                        No Daily Scrum data found
                      </Typography>

                      <Typography variant="caption" color="text.disabled">
                        Try changing the developer or date range.
                      </Typography>
                    </Stack>
                  </td>
                </tr>
              ) : (
                rows.map(({ date, project, scrum }) => (
                  <tr key={`${date}-${project.id}`}>
                    {/* DATE */}

                    <td>
                      <Typography variant="body2" fontWeight={700}>
                        {formatDate(date)}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {date}
                      </Typography>
                    </td>

                    {/* PROJECT */}

                    {/* <td>
                      <Typography variant="body2" fontWeight={700}>
                        {project.name}
                      </Typography>
                    </td> */}

                    {/* YESTERDAY */}

                    <td>
                      {scrum ? (
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "pre-wrap",
                            minWidth: 220,
                            maxWidth: 300,
                            lineHeight: 1.5,
                          }}
                        >
                          {scrum.yesterdayWork}
                        </Typography>
                      ) : (
                        <Typography color="text.disabled" variant="body2">
                          —
                        </Typography>
                      )}
                    </td>

                    {/* TODAY */}

                    <td>
                      {scrum ? (
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "pre-wrap",
                            minWidth: 220,
                            maxWidth: 300,
                            lineHeight: 1.5,
                          }}
                        >
                          {scrum.todayWork}
                        </Typography>
                      ) : (
                        <Typography color="text.disabled" variant="body2">
                          —
                        </Typography>
                      )}
                    </td>

                    {/* BLOCKERS */}

                    <td>
                      {scrum?.blockers ? (
                        <Box
                          sx={{
                            px: 1.2,
                            py: 0.8,
                            borderRadius: 1.5,
                            backgroundColor: "#fff5f5",
                            border: "1px solid #ffe0e0",
                            minWidth: 160,
                            maxWidth: 240,
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="error.dark"
                            sx={{
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {scrum.blockers}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No blocker
                        </Typography>
                      )}
                    </td>

                    {/* STATUS */}

                    <td>
                      {scrum ? (
                        <Chip
                          icon={<CheckCircleOutline />}
                          label="Submitted"
                          color="success"
                          size="small"
                          sx={{
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Chip
                          icon={<WarningAmber />}
                          label="Missing"
                          color="warning"
                          size="small"
                          sx={{
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </td>

                    {/* ACTION */}

                    <td>
                      <Stack direction="row" spacing={0.5}>
                        {scrum ? (
                          <Tooltip title="Edit Daily Scrum">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(scrum)}
                              sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1.5,
                              }}
                              aria-label="Edit"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Create Daily Scrum">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleAdd(date, project.id)}
                              sx={{
                                border: "1px solid",
                                borderColor: "primary.main",
                                borderRadius: 1.5,
                              }}
                              aria-label="Add"
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Box>
        </Box>
      </Paper>

      {/* ======================================================
          ADD / EDIT DIALOG
         ====================================================== */}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: RADIUS.card,
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                {form.id ? "Edit Daily Scrum" : "Add Daily Scrum"}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.3 }}
              >
                Add the developer's daily work update
              </Typography>
            </Box>

            <IconButton
              onClick={handleCloseDialog}
              disabled={saving}
              aria-label="Close"
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* DEVELOPER + PROJECT */}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
            >
              <FormControl fullWidth>
                <InputLabel>Developer</InputLabel>

                <Select
                  value={form.userId}
                  label="Developer"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      userId: e.target.value,
                    }))
                  }
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.name || user.email || `User ${user.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ display: "none" }}>
                <InputLabel>Project</InputLabel>
                <Select
                  value={projectId ? String(projectId) : ""}
                  label="Project"
                  disabled
                >
                  {activeProject && (
                    <MenuItem value={String(activeProject.id)}>
                      {activeProject.name}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Stack>

            {/* DATE */}

            <TextField
              type="date"
              label="Daily Scrum Date"
              value={form.scrumDate}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  scrumDate: e.target.value,
                }))
              }
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />

            {/* YESTERDAY */}

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Yesterday's Work
              </Typography>

              <TextField
                placeholder="Describe what was completed yesterday..."
                value={form.yesterdayWork}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    yesterdayWork: e.target.value,
                  }))
                }
                multiline
                minRows={4}
                fullWidth
                required
              />
            </Box>

            {/* TODAY */}

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Today's Plan
              </Typography>

              <TextField
                placeholder="Describe what you plan to work on today..."
                value={form.todayWork}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    todayWork: e.target.value,
                  }))
                }
                multiline
                minRows={4}
                fullWidth
                required
              />
            </Box>

            {/* BLOCKERS */}

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Blockers
              </Typography>

              <TextField
                placeholder="Mention blockers, dependencies, or risks..."
                value={form.blockers}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    blockers: e.target.value,
                  }))
                }
                multiline
                minRows={3}
                fullWidth
              />
            </Box>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions
          sx={{
            px: 3,
            py: 2,
          }}
        >
          <Button
            onClick={handleCloseDialog}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
          >
            {saving ? "Saving..." : form.id ? "Update Scrum" : "Save Scrum"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================
          ERROR
         ====================================================== */}

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={() => setError("")}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="error"
          onClose={() => setError("")}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* ======================================================
          SUCCESS
         ====================================================== */}

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}

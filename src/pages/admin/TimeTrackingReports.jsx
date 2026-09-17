import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSprintTickets, getSprintsByProject } from "../../api/sprintApi";
import { getTimeTrackingReport } from "../../api/timeTrackingApi";
import { useAuth } from "../../context/AuthContext";

const hours = (v) => `${Number(v || 0).toFixed(2)}h`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function TimeTrackingReports() {
  const { getPrimaryProjectId, getProjectMembership } = useAuth();

  const projectId = getPrimaryProjectId();
  const membership = projectId ? getProjectMembership(projectId) : null;

  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [rows, setRows] = useState([]);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSprint = useMemo(
    () =>
      sprints.find((sprint) => Number(sprint.id) === Number(selectedSprintId)),
    [sprints, selectedSprintId],
  );

  const loadSprints = useCallback(async () => {
    if (!projectId) {
      setSprints([]);
      setSelectedSprintId("");
      return;
    }

    setLoadingSprints(true);
    setError("");

    try {
      const data = await getSprintsByProject(Number(projectId));
      const list = Array.isArray(data) ? data : [];

      // Newest/active sprint first, while preserving the backend list order.
      const sorted = [...list].sort((a, b) => {
        const aActive = String(a?.status || "").toUpperCase() === "ACTIVE";
        const bActive = String(b?.status || "").toUpperCase() === "ACTIVE";
        if (aActive !== bActive) return aActive ? -1 : 1;
        return Number(b?.id || 0) - Number(a?.id || 0);
      });

      setSprints(sorted);

      if (sorted.length) {
        setSelectedSprintId((current) => {
          const stillExists = sorted.some(
            (sprint) => Number(sprint.id) === Number(current),
          );
          return stillExists ? current : String(sorted[0].id);
        });
      } else {
        setSelectedSprintId("");
        setRows([]);
      }
    } catch (err) {
      setSprints([]);
      setSelectedSprintId("");
      setRows([]);
      setError(
        err?.response?.data?.message || "Unable to load project sprints.",
      );
    } finally {
      setLoadingSprints(false);
    }
  }, [projectId]);

  const loadReport = useCallback(async () => {
    if (!projectId || !selectedSprint) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Fetch the sprint's complete ticket list first. This ensures tickets
      // with zero logged hours are still visible in the report.
      // The final table is sorted by each ticket's `order` value.
      const [sprintTicketsData, reportData] = await Promise.all([
        getSprintTickets(Number(selectedSprint.id)),
        getTimeTrackingReport({
          projectId: Number(projectId),
          from: selectedSprint.startDate || undefined,
          to: selectedSprint.endDate || undefined,
        }),
      ]);

      const sprintTickets = Array.isArray(sprintTicketsData)
        ? sprintTicketsData
        : [];
      const reportRows = Array.isArray(reportData) ? reportData : [];

      // The existing report API returns one row per ticket/user. The screen is
      // sprint/ticket based, so aggregate logged time across all users for each
      // ticket and then merge it with every ticket in the selected sprint.
      const actualByTicket = new Map();
      const usersByTicket = new Map();

      reportRows.forEach((row) => {
        const ticketId = Number(row?.ticketId);
        if (!ticketId) return;

        const current = actualByTicket.get(ticketId) || 0;
        actualByTicket.set(ticketId, current + Number(row?.actualHours || 0));

        const userName = row?.userName || row?.userEmail;
        if (userName) {
          const names = usersByTicket.get(ticketId) || new Set();
          names.add(userName);
          usersByTicket.set(ticketId, names);
        }
      });

      // Keep the report in the same ticket order used by the sprint/board.
      // Primary sort: ticket.order (ascending). If order is missing/equal,
      // fall back to ticket id so the result remains stable.
      const orderedSprintTickets = [...sprintTickets].sort((a, b) => {
        const getTicketNumber = (ticket) => {
          const code = String(ticket?.code || "");
          const match = code.match(/(\d+)\s*$/);
          return match ? Number(match[1]) : Number(ticket?.id || 0);
        };

        return getTicketNumber(a) - getTicketNumber(b);
      });

      const mergedRows = orderedSprintTickets.map((ticket) => {
        const ticketId = Number(ticket?.id);
        const estimate = Number(ticket?.estimation || 0);
        const actual = Number(actualByTicket.get(ticketId) || 0);
        const remaining = Math.max(estimate - actual, 0);
        const variance = actual - estimate;
        const users = [...(usersByTicket.get(ticketId) || new Set())];

        return {
          ticketId,
          ticketCode: ticket?.code,
          ticketName: ticket?.name,
          userName: users.join(", "),
          estimatedHours: estimate,
          actualHours: actual,
          remainingEstimateHours: remaining,
          varianceHours: variance,
        };
      });

      setRows(mergedRows);
    } catch (err) {
      setRows([]);
      setError(
        err?.response?.data?.message || "Unable to load sprint time report.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedSprint]);

  useEffect(() => {
    loadSprints();
  }, [loadSprints]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (total, row) => ({
          estimate: total.estimate + Number(row.estimatedHours || 0),
          actual: total.actual + Number(row.actualHours || 0),
        }),
        { estimate: 0, actual: 0 },
      ),
    [rows],
  );

  const projectName =
    membership?.projectName ||
    membership?.project?.name ||
    `Project #${projectId}`;

  return (
    <Box className="app-page pm-fade-up">
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={1.5}
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Time Tracking Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Sprint-wise time report for {projectName}.
          </Typography>
        </Box>

        {selectedSprint && (
          <Chip
            label={`${selectedSprint.name} · ${String(selectedSprint.status || "").replaceAll("_", " ")}`}
            variant="outlined"
          />
        )}
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "#fff",
          boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-end"
          sx={{
            width: "100%",
          }}
        >
          {/* Sprint */}
          <Box
            sx={{
              width: { xs: "100%", sm: 420, md: 500 },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                mb: 0.8,
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              Sprint
            </Typography>

            <FormControl fullWidth size="medium">
              <Select
                value={selectedSprint?.id || ""}
                onChange={(e) => {
                  const sprint = sprints.find(
                    (item) => String(item.id) === String(e.target.value),
                  );
                  setSelectedSprintId(sprint || null);
                }}
                sx={{
                  height: 52,
                  borderRadius: 2,
                  backgroundColor: "#fff",
                }}
              >
                {sprints.map((sprint) => (
                  <MenuItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                    {sprint.active ? " (ACTIVE)" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Run Report */}
          <Button
            variant="contained"
            onClick={loadReport}
            disabled={!selectedSprint || loading}
            sx={{
              height: 52,
              minWidth: 160,
              px: 3,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              whiteSpace: "nowrap",
              boxShadow: "none",
            }}
          >
            {loading ? "Running..." : "Run Report"}
          </Button>
        </Stack>

        {/* Sprint Period */}
        {selectedSprint?.startDate && selectedSprint?.endDate && (
          <Box
            sx={{
              mt: 1.2,
              display: "flex",
              alignItems: "center",
              gap: 0.7,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
              }}
            >
              Sprint period:
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
              }}
            >
              {formatDate(selectedSprint.startDate)} —{" "}
              {formatDate(selectedSprint.endDate)}
            </Typography>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography color="text.secondary">Estimated</Typography>
          <Typography variant="h6">{hours(totals.estimate)}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography color="text.secondary">Actual</Typography>
          <Typography variant="h6">{hours(totals.actual)}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography color="text.secondary">Variance</Typography>
          <Typography variant="h6">
            {hours(totals.actual - totals.estimate)}
          </Typography>
        </Paper>
      </Stack>

      <Paper sx={{ overflowX: "auto" }}>
        {loading ? (
          <Box sx={{ minHeight: 240, display: "grid", placeItems: "center" }}>
            <Stack alignItems="center" spacing={1}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">
                Loading sprint time report...
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              "th,td": {
                p: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                textAlign: "left",
              },
            }}
          >
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Users</th>
                <th>Estimated</th>
                <th>Actual</th>
                <th>Remaining</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.ticketId}>
                  <td>
                    {row.ticketCode || `#${row.ticketId}`} —{" "}
                    {row.ticketName || "Untitled ticket"}
                  </td>
                  <td>{row.userName || "No time logged"}</td>
                  <td>{hours(row.estimatedHours)}</td>
                  <td>{hours(row.actualHours)}</td>
                  <td>{hours(row.remainingEstimateHours)}</td>
                  <td>{hours(row.varianceHours)}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6}>
                    {selectedSprint
                      ? "No tickets found in this sprint."
                      : "Select a sprint to view its tickets."}
                  </td>
                </tr>
              )}
            </tbody>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

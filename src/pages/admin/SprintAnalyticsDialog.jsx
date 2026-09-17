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
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  getSprintBurndown,
  getSprintCapacity,
  getSprintCommitment,
  getSprintHistory,
  getSprintReport,
  getSprintStatistics,
  getSprintVelocity,
  saveSprintCapacity,
} from "../../api/sprintApi";

const COLORS = {
  primary: "#4F46E5",
  primaryDark: "#3730A3",
  teal: "#0D9488",
  blue: "#2563EB",
  amber: "#D97706",
  red: "#DC2626",
  green: "#059669",
  border: "#E2E8F0",
  surface: "#FFFFFF",
  soft: "#F8FAFC",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

const n = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const fmt = (value) => n(value).toFixed(2).replace(/\.00$/, "");

const safeArray = (value) => (Array.isArray(value) ? value : []);

const COMPLETED_STATUSES = new Set(["RESOLVED", "CLOSED"]);

const normalizeStatus = (status) =>
  String(
    status?.name ??
      status?.value ??
      status?.status ??
      status?.key ??
      status?.label ??
      status ??
      "",
  )
    .trim()
    .toUpperCase();

const isCompletedIssue = (issue) => {
  const candidates = [
    issue?.status,
    issue?.statusName,
    issue?.statusKey,
    issue?.statusValue,
    issue?.statusLabel,
    issue?.workflowStatus,
    issue?.workflowState,
    issue?.state,
  ];

  return candidates.some((value) =>
    COMPLETED_STATUSES.has(normalizeStatus(value)),
  );
};

const issueEstimate = (issue) =>
  Number(
    issue?.estimation ??
      issue?.storyPoints ??
      issue?.storyPointEstimate ??
      issue?.story_point_estimate ??
      issue?.estimatedStoryPoints ??
      issue?.estimatedPoints ??
      issue?.estimatePoints ??
      issue?.points ??
      issue?.estimate ??
      0,
  ) || 0;

function Stat({ label, value, suffix = "", color = COLORS.primary, helper }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.75,
        height: "100%",
        borderRadius: 2.5,
        borderColor: COLORS.border,
        position: "relative",
        overflow: "hidden",
        background: COLORS.surface,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: 3,
          bgcolor: color,
        }}
      />
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{ color: COLORS.textSecondary }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={800}
        sx={{ color: COLORS.textPrimary, mt: 0.5 }}
      >
        {value === null || value === undefined ? "—" : fmt(value)}
        {suffix}
      </Typography>
      {helper && (
        <Typography
          variant="caption"
          sx={{ display: "block", color: COLORS.textSecondary, mt: 0.5 }}
        >
          {helper}
        </Typography>
      )}
    </Paper>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <Box>
      <Typography
        variant="h6"
        fontWeight={800}
        sx={{ color: COLORS.textPrimary }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{ color: COLORS.textSecondary, mt: 0.25 }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

function EmptyState({ children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 4,
        textAlign: "center",
        borderRadius: 2.5,
        borderColor: COLORS.border,
        bgcolor: COLORS.soft,
      }}
    >
      <Typography color={COLORS.textSecondary}>{children}</Typography>
    </Paper>
  );
}

function StatusChip({ status }) {
  const normalized = String(status || "").toUpperCase();
  const config = {
    DONE: { label: "Done", color: "success" },
    COMPLETED: { label: "Completed", color: "success" },
    RESOLVED: { label: "Resolved", color: "success" },
    CLOSED: { label: "Closed", color: "success" },
    CANCELLED: { label: "Cancelled", color: "default" },
    ACTIVE: { label: "Active", color: "primary" },
    PLANNED: { label: "Planned", color: "info" },
  }[normalized] || { label: status || "Unknown", color: "default" };

  return (
    <Chip
      size="small"
      label={config.label}
      color={config.color}
      variant="outlined"
    />
  );
}

function compareTicketCodes(a, b) {
  const codeA = String(
    a?.code || a?.ticketCode || a?.ticketId || a?.id || "",
  ).trim();
  const codeB = String(
    b?.code || b?.ticketCode || b?.ticketId || b?.id || "",
  ).trim();
  const ma = codeA.match(/^(.*?)(\d+)$/);
  const mb = codeB.match(/^(.*?)(\d+)$/);
  if (ma && mb) {
    const prefix = ma[1].localeCompare(mb[1], undefined, {
      sensitivity: "base",
    });
    if (prefix !== 0) return prefix;
    return Number(ma[2]) - Number(mb[2]);
  }
  return codeA.localeCompare(codeB, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function VelocityChart({ rows }) {
  const data = safeArray(rows);
  if (!data.length)
    return <EmptyState>No completed sprint data yet.</EmptyState>;

  const width = 780;
  const height = 310;
  const left = 52;
  const right = 24;
  const top = 28;
  const bottom = 54;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const max = Math.max(
    1,
    ...data.map((row) =>
      Math.max(n(row.committedEstimate), n(row.completedEstimate)),
    ),
  );

  const x = (index) =>
    left +
    (data.length === 1 ? innerW / 2 : (index * innerW) / (data.length - 1));

  const y = (value) => top + innerH - (n(value) * innerH) / max;

  const path = (key) =>
    data
      .map((row, index) => `${index ? "L" : "M"} ${x(index)} ${y(row[key])}`)
      .join(" ");

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        borderRadius: 2.5,
        borderColor: COLORS.border,
        overflowX: "auto",
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ minWidth: 600, display: "block" }}
        role="img"
        aria-label="Sprint velocity chart"
      >
        <line
          x1={left}
          y1={top}
          x2={left}
          y2={height - bottom}
          stroke={COLORS.border}
        />
        <line
          x1={left}
          y1={height - bottom}
          x2={width - right}
          y2={height - bottom}
          stroke={COLORS.border}
        />

        <path
          d={path("committedEstimate")}
          fill="none"
          stroke={COLORS.blue}
          strokeWidth="2"
          strokeDasharray="6 5"
          opacity="0.75"
        />
        <path
          d={path("completedEstimate")}
          fill="none"
          stroke={COLORS.teal}
          strokeWidth="3"
        />

        {data.map((row, index) => (
          <g key={row.sprintId || index}>
            <circle
              cx={x(index)}
              cy={y(row.completedEstimate)}
              r="5"
              fill={COLORS.teal}
              stroke="#fff"
              strokeWidth="2"
            />
            <text
              x={x(index)}
              y={height - 24}
              textAnchor="middle"
              fontSize="10"
              fill={COLORS.textSecondary}
            >
              {String(row.sprintName || "").slice(0, 14)}
            </text>
          </g>
        ))}
      </svg>

      <Stack direction="row" spacing={3} sx={{ px: 1, py: 0.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 22, borderTop: `2px dashed ${COLORS.blue}` }} />
          <Typography variant="caption" color={COLORS.textSecondary}>
            Committed
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{ width: 22, height: 3, bgcolor: COLORS.teal, borderRadius: 1 }}
          />
          <Typography variant="caption" color={COLORS.textSecondary}>
            Completed
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

function BurndownChart({ points }) {
  const rawData = safeArray(points);
  if (!rawData.length)
    return <EmptyState>No burndown data available.</EmptyState>;

  // Backend versions have used both `remaining` and `remainingEstimate`.
  // Normalize them so the chart always renders the actual remaining work.
  const data = rawData.map((point) => ({
    ...point,
    scopeEstimate: n(point.scopeEstimate ?? point.totalEstimate),
    remainingEstimate: n(
      point.remainingEstimate ?? point.remaining ?? point.remainingPoints,
    ),
  }));

  const width = 820;
  const height = 320;
  const left = 58;
  const right = 24;
  const top = 24;
  const bottom = 52;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const max = Math.max(1, ...data.map((p) => n(p.scopeEstimate)));

  const x = (index) =>
    left +
    (data.length === 1 ? innerW / 2 : (index * innerW) / (data.length - 1));

  const y = (value) => top + innerH - (n(value) * innerH) / max;

  const remainingPath = data
    .map(
      (point, index) =>
        `${index ? "L" : "M"} ${x(index)} ${y(point.remainingEstimate)}`,
    )
    .join(" ");

  const idealPath = data
    .map((point, index) => {
      const ideal =
        n(data[0].scopeEstimate) -
        (n(data[0].scopeEstimate) * index) / Math.max(1, data.length - 1);
      return `${index ? "L" : "M"} ${x(index)} ${y(ideal)}`;
    })
    .join(" ");

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        borderRadius: 2.5,
        borderColor: COLORS.border,
        overflowX: "auto",
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ minWidth: 620, display: "block" }}
        role="img"
        aria-label="Sprint burndown chart"
      >
        <line
          x1={left}
          y1={top}
          x2={left}
          y2={height - bottom}
          stroke={COLORS.border}
        />
        <line
          x1={left}
          y1={height - bottom}
          x2={width - right}
          y2={height - bottom}
          stroke={COLORS.border}
        />
        <path
          d={idealPath}
          fill="none"
          stroke={COLORS.textSecondary}
          strokeWidth="2"
          strokeDasharray="5 5"
          opacity="0.6"
        />
        <path
          d={remainingPath}
          fill="none"
          stroke={COLORS.primary}
          strokeWidth="3"
        />

        {data.map((point, index) => (
          <g key={point.date || index}>
            <circle
              cx={x(index)}
              cy={y(point.remainingEstimate)}
              r="4"
              fill={COLORS.primary}
              stroke="#fff"
              strokeWidth="1.5"
            />
            {index === 0 || index === data.length - 1 ? (
              <text
                x={x(index)}
                y={height - 23}
                textAnchor="middle"
                fontSize="10"
                fill={COLORS.textSecondary}
              >
                {point.date}
              </text>
            ) : null}
          </g>
        ))}
      </svg>

      <Stack direction="row" spacing={3} sx={{ px: 1, py: 0.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{ width: 22, borderTop: `2px dashed ${COLORS.textSecondary}` }}
          />
          <Typography variant="caption" color={COLORS.textSecondary}>
            Ideal
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 22,
              height: 3,
              bgcolor: COLORS.primary,
              borderRadius: 1,
            }}
          />
          <Typography variant="caption" color={COLORS.textSecondary}>
            Remaining
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

function CapacityStatus({ row }) {
  const status = String(row.capacityStatus || "").toUpperCase();
  const config = {
    HEALTHY: { label: "Healthy", color: "success" },
    HIGH: { label: "High", color: "warning" },
    OVERALLOCATED: { label: "Overallocated", color: "error" },
    NOT_CONFIGURED: { label: "Capacity not configured", color: "default" },
  }[status] || { label: "Unknown", color: "default" };

  return (
    <Chip
      size="small"
      label={config.label}
      color={config.color}
      variant="outlined"
    />
  );
}

export default function SprintAnalyticsDialog({
  open,
  projectId,
  sprint,
  onClose,
}) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [burndown, setBurndown] = useState(null);
  const [velocity, setVelocity] = useState(null);
  const [history, setHistory] = useState([]);
  const [report, setReport] = useState(null);
  const [commitment, setCommitment] = useState(null);
  const [capacity, setCapacity] = useState([]);
  const [savingUser, setSavingUser] = useState(null);

  useEffect(() => {
    if (!open || !projectId) return undefined;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setTab(0);
      setStatistics(null);
      setBurndown(null);
      setHistory([]);
      setVelocity(null);
      setReport(null);
      setCommitment(null);
      setCapacity([]);

      const requests = [
        getSprintHistory(projectId),
        getSprintVelocity(projectId),
        sprint?.id ? getSprintStatistics(sprint.id) : Promise.resolve(null),
        sprint?.id ? getSprintBurndown(sprint.id) : Promise.resolve(null),
        sprint?.id ? getSprintReport(sprint.id) : Promise.resolve(null),
        sprint?.id ? getSprintCommitment(sprint.id) : Promise.resolve(null),
        sprint?.id ? getSprintCapacity(sprint.id) : Promise.resolve([]),
      ];

      const results = await Promise.allSettled(requests);
      if (cancelled) return;

      const failures = [];
      const [
        historyResult,
        velocityResult,
        statisticsResult,
        burndownResult,
        reportResult,
        commitmentResult,
        capacityResult,
      ] = results;

      if (historyResult.status === "fulfilled") {
        setHistory(safeArray(historyResult.value));
      } else {
        failures.push("history");
      }

      if (velocityResult.status === "fulfilled") {
        setVelocity(velocityResult.value);
      } else {
        failures.push("velocity");
      }

      if (statisticsResult.status === "fulfilled") {
        setStatistics(statisticsResult.value);
      } else if (sprint?.id) {
        failures.push("statistics");
      }

      if (burndownResult.status === "fulfilled") {
        setBurndown(burndownResult.value);
      } else if (sprint?.id) {
        failures.push("burndown");
      }

      if (reportResult.status === "fulfilled") {
        setReport(reportResult.value);
      } else if (sprint?.id) {
        failures.push("report");
      }

      if (commitmentResult.status === "fulfilled") {
        setCommitment(commitmentResult.value);
      } else if (sprint?.id) {
        failures.push("commitment");
      }

      if (capacityResult.status === "fulfilled") {
        setCapacity(safeArray(capacityResult.value));
      } else if (sprint?.id) {
        failures.push("capacity");
      }

      if (failures.length) {
        setError(
          `Some analytics data could not be loaded: ${failures.join(", ")}.`,
        );
      }

      setLoading(false);
    };

    load().catch((e) => {
      if (!cancelled) {
        setLoading(false);
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to load sprint analytics.",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, projectId, sprint?.id]);

  const totals = useMemo(
    () =>
      safeArray(capacity).reduce(
        (acc, row) => ({
          points: acc.points + n(row.capacityPoints),
          hours: acc.hours + n(row.capacityHours),
          assigned: acc.assigned + n(row.assignedEstimate),
        }),
        { points: 0, hours: 0, assigned: 0 },
      ),
    [capacity],
  );

  const capacitySummary = useMemo(() => {
    const rows = safeArray(capacity);
    const configured = rows.filter((row) => n(row.capacityPoints) > 0);
    const overloaded = rows.filter(
      (row) => String(row.capacityStatus).toUpperCase() === "OVERALLOCATED",
    );
    const unconfiguredWithWork = rows.filter(
      (row) => n(row.capacityPoints) <= 0 && n(row.assignedEstimate) > 0,
    );

    const assigned = rows.reduce(
      (sum, row) => sum + n(row.assignedEstimate),
      0,
    );
    const capacityPoints = rows.reduce(
      (sum, row) => sum + n(row.capacityPoints),
      0,
    );

    const hasConfiguredCapacity = configured.length > 0;

    return {
      configured: configured.length,
      overloaded: overloaded.length,
      unconfiguredWithWork: unconfiguredWithWork.length,
      remaining: hasConfiguredCapacity ? capacityPoints - assigned : null,
    };
  }, [capacity]);

  const updateCapacity = (userId, field, value) => {
    setCapacity((previous) =>
      previous.map((row) =>
        row.userId === userId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const saveRow = async (row) => {
    try {
      setSavingUser(row.userId);
      setError("");

      const saved = await saveSprintCapacity(row.sprintId, {
        userId: row.userId,
        capacityPoints: Math.max(0, n(row.capacityPoints)),
      });

      setCapacity((previous) =>
        previous.map((item) => (item.userId === row.userId ? saved : item)),
      );
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Failed to save capacity.",
      );
    } finally {
      setSavingUser(null);
    }
  };

  const reportRows = [
    ...safeArray(report?.issues ?? report?.tickets ?? report?.items),
  ].sort(compareTicketCodes);

  const historyRows = safeArray(history);
  const velocityRows = safeArray(velocity?.sprints);
  const burndownPoints = safeArray(burndown?.points);

  const effectiveReport = useMemo(() => {
    if (!report || !reportRows.length) return report;

    const completedIssues = reportRows.filter(isCompletedIssue).length;
    if (completedIssues <= 0) return report;

    const totalIssues = reportRows.length;
    const totalEstimation = reportRows.reduce(
      (sum, issue) => sum + issueEstimate(issue),
      0,
    );
    const completedEstimate = reportRows
      .filter(isCompletedIssue)
      .reduce((sum, issue) => sum + issueEstimate(issue), 0);

    return {
      ...report,
      committedEstimate: Number(report.committedEstimate) || totalEstimation,
      completedEstimate,
      incompleteTickets: Math.max(0, totalIssues - completedIssues),
      completionPercent:
        totalIssues > 0 ? (completedIssues * 100) / totalIssues : 0,
    };
  }, [report, reportRows]);

  const effectiveStatistics = useMemo(() => {
    if (!statistics || !reportRows.length) return statistics;

    const completedIssues = reportRows.filter(isCompletedIssue).length;
    if (completedIssues <= 0 || Number(statistics.completedEstimation) > 0) {
      return statistics;
    }

    const totalEstimation = reportRows.reduce(
      (sum, issue) => sum + issueEstimate(issue),
      0,
    );
    const completedEstimation = reportRows
      .filter(isCompletedIssue)
      .reduce((sum, issue) => sum + issueEstimate(issue), 0);

    return {
      ...statistics,
      totalTickets: reportRows.length,
      completionPercent:
        reportRows.length > 0 ? (completedIssues * 100) / reportRows.length : 0,
      totalEstimation:
        totalEstimation > 0 ? totalEstimation : statistics.totalEstimation,
      completedEstimation:
        completedEstimation > 0
          ? completedEstimation
          : statistics.completedEstimation,
      remainingEstimation:
        totalEstimation > 0
          ? Math.max(0, totalEstimation - completedEstimation)
          : statistics.remainingEstimation,
    };
  }, [statistics, reportRows]);

  const effectiveBurndown = useMemo(() => {
    if (!burndown || !reportRows.length || !burndownPoints.length) {
      return burndown;
    }

    const totalEstimate = reportRows.reduce(
      (sum, issue) => sum + issueEstimate(issue),
      0,
    );
    if (totalEstimate <= 0) return burndown;

    const completedEstimate = reportRows
      .filter(isCompletedIssue)
      .reduce((sum, issue) => sum + issueEstimate(issue), 0);

    const points = [...burndownPoints];
    const last = points[points.length - 1];

    points[points.length - 1] = {
      ...last,
      scopeEstimate: Number(last.scopeEstimate) || totalEstimate,
      completedEstimate,
      remainingEstimate: Math.max(0, totalEstimate - completedEstimate),
      // The chart consumes `remaining`; keep both API naming conventions in sync.
      completed: completedEstimate,
      remaining: Math.max(0, totalEstimate - completedEstimate),
    };

    return { ...burndown, points };
  }, [burndown, reportRows, burndownPoints]);

  const effectiveCommitment = useMemo(() => {
    if (!commitment || !reportRows.length) return commitment;

    const totalEstimate = reportRows.reduce(
      (sum, issue) => sum + issueEstimate(issue),
      0,
    );
    const completedEstimate = reportRows
      .filter(isCompletedIssue)
      .reduce((sum, issue) => sum + issueEstimate(issue), 0);
    const committedEstimate =
      Number(commitment.committedEstimate) || totalEstimate;
    const completed = completedEstimate;

    return {
      ...commitment,
      committedEstimate,
      completedEstimate: completed,
      remainingCommittedEstimate: Math.max(0, committedEstimate - completed),
      completionPercent:
        committedEstimate > 0 ? (completed * 100) / committedEstimate : 0,
      currentTickets: commitment.currentTickets ?? reportRows.length,
    };
  }, [commitment, reportRows]);

  const completion =
    effectiveStatistics?.completionPercent ??
    effectiveReport?.completionPercent ??
    effectiveCommitment?.completionPercent ??
    0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "92vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ color: COLORS.textPrimary }}
        >
          Sprint Analytics
          {sprint?.name ? ` — ${sprint.name}` : ""}
        </Typography>
        {sprint && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mt: 0.75 }}
          >
            <StatusChip status={sprint.status} />
            {sprint.startDate && sprint.endDate && (
              <Typography variant="caption" color={COLORS.textSecondary}>
                {sprint.startDate} → {sprint.endDate}
              </Typography>
            )}
          </Stack>
        )}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: { xs: 1.5, md: 2.5 },
          borderColor: COLORS.border,
          bgcolor: "#FCFDFE",
        }}
      >
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 9 }}>
            <CircularProgress sx={{ color: COLORS.primary }} />
            <Typography sx={{ mt: 1.5 }} color={COLORS.textSecondary}>
              Loading sprint analytics…
            </Typography>
          </Stack>
        ) : (
          <>
            {error && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Tabs
              value={tab}
              onChange={(_, value) => setTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 2.5,
                borderBottom: `1px solid ${COLORS.border}`,
                "& .MuiTab-root": {
                  minHeight: 48,
                  textTransform: "none",
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                },
                "& .Mui-selected": {
                  color: `${COLORS.primary} !important`,
                },
                "& .MuiTabs-indicator": {
                  height: 3,
                  borderRadius: 2,
                  bgcolor: COLORS.primary,
                },
              }}
            >
              <Tab label="Overview" />
              <Tab label="Burndown" disabled={!sprint} />
              <Tab label="History" />
              <Tab label="Velocity" />
              <Tab label="Sprint Report" disabled={!sprint} />
              {/* <Tab label="Commitment" disabled={!sprint} /> */}
              <Tab label="Capacity Planning" disabled={!sprint} />
            </Tabs>

            {tab === 0 && (
              <Stack spacing={2.5}>
                <SectionTitle
                  title="Sprint Overview"
                  subtitle="A consolidated view of scope, progress and delivery."
                />

                {!sprint || !effectiveStatistics ? (
                  <EmptyState>
                    Select a sprint to view its analytics.
                  </EmptyState>
                ) : (
                  <>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label="Total Issues"
                          value={effectiveStatistics.totalTickets}
                          color={COLORS.primary}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label="Assigned Issues"
                          value={effectiveStatistics.assignedTickets}
                          color={COLORS.blue}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label="Unassigned Issues"
                          value={effectiveStatistics.backlogTickets}
                          color={COLORS.amber}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label="Completion"
                          value={completion}
                          suffix="%"
                          color={COLORS.teal}
                        />
                      </Grid>
                    </Grid>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} md={4}>
                        <Stat
                          label="Current Sprint Estimate"
                          value={effectiveStatistics.totalEstimation}
                          suffix=" sp"
                          color={COLORS.blue}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Stat
                          label="Completed Estimate"
                          value={effectiveStatistics.completedEstimation}
                          suffix=" sp"
                          color={COLORS.teal}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Stat
                          label="Remaining Estimate"
                          value={effectiveStatistics.remainingEstimation}
                          suffix=" sp"
                          color={COLORS.amber}
                        />
                      </Grid>
                    </Grid>

                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Typography fontWeight={800} color={COLORS.textPrimary}>
                          Sprint completion
                        </Typography>
                        <Typography fontWeight={800} color={COLORS.teal}>
                          {fmt(completion)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.max(0, n(completion)))}
                        sx={{
                          mt: 1.25,
                          height: 9,
                          borderRadius: 5,
                          bgcolor: `${COLORS.primary}18`,
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 5,
                            bgcolor: COLORS.teal,
                          },
                        }}
                      />
                    </Paper>
                  </>
                )}
              </Stack>
            )}

            {tab === 1 && (
              <Stack spacing={2.5}>
                <SectionTitle
                  title="Sprint Burndown"
                  subtitle="Remaining story points compared with an ideal linear burn."
                />
                {!burndown ? (
                  <EmptyState>No burndown data available.</EmptyState>
                ) : (
                  <>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6} md={4}>
                        <Stat
                          label="Sprint Scope"
                          value={effectiveBurndown.totalEstimate}
                          suffix=" sp"
                          color={COLORS.blue}
                        />
                      </Grid>
                      <Grid item xs={6} md={4}>
                        <Stat
                          label="Current Remaining"
                          value={
                            safeArray(effectiveBurndown?.points).length
                              ? safeArray(effectiveBurndown?.points)[
                                  safeArray(effectiveBurndown?.points).length -
                                    1
                                ].remainingEstimate
                              : effectiveBurndown.totalEstimate
                          }
                          suffix=" sp"
                          color={COLORS.primary}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Stat
                          label="Completed"
                          value={
                            safeArray(effectiveBurndown?.points).length
                              ? safeArray(effectiveBurndown?.points)[
                                  safeArray(effectiveBurndown?.points).length -
                                    1
                                ].completedEstimate
                              : 0
                          }
                          suffix=" sp"
                          color={COLORS.teal}
                        />
                      </Grid>
                    </Grid>
                    <BurndownChart
                      points={safeArray(effectiveBurndown?.points)}
                    />
                  </>
                )}
              </Stack>
            )}

            {tab === 2 && (
              <Stack spacing={2}>
                <SectionTitle
                  title="Sprint History"
                  subtitle="Completed and cancelled sprints for this project."
                />
                {!historyRows.length ? (
                  <EmptyState>
                    No completed or cancelled sprints yet.
                  </EmptyState>
                ) : (
                  historyRows.map((row) => (
                    <Paper
                      key={row.sprintId}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.5}
                        alignItems={{ md: "center" }}
                      >
                        <Box sx={{ flex: 1, minWidth: 180 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              fontWeight={800}
                              color={COLORS.textPrimary}
                            >
                              {row.sprintName}
                            </Typography>
                            <StatusChip status={row.status} />
                          </Stack>
                          <Typography
                            variant="caption"
                            color={COLORS.textSecondary}
                          >
                            {row.startDate || "—"} → {row.endDate || "—"}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          Committed{" "}
                          <b style={{ color: COLORS.blue }}>
                            {fmt(row.committedEstimate)} sp
                          </b>
                        </Typography>
                        <Typography variant="body2">
                          Completed{" "}
                          <b style={{ color: COLORS.teal }}>
                            {fmt(row.completedEstimate)} sp
                          </b>
                        </Typography>
                        <Typography variant="body2">
                          Completion <b>{fmt(row.completionPercent)}%</b>
                        </Typography>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            )}

            {tab === 3 && (
              <Stack spacing={2.5}>
                <SectionTitle
                  title="Sprint Velocity"
                  subtitle="Committed versus completed story points across completed sprints."
                />
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}>
                    <Stat
                      label="Average Velocity"
                      value={velocity?.averageVelocity}
                      suffix=" sp"
                      color={COLORS.primary}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Stat
                      label="Total Completed"
                      value={velocity?.totalCompletedEstimate}
                      suffix=" sp"
                      color={COLORS.teal}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Stat
                      label="Completed Sprints"
                      value={velocityRows.length}
                      color={COLORS.amber}
                    />
                  </Grid>
                </Grid>

                <VelocityChart rows={velocityRows} />

                {velocityRows.map((row) => (
                  <Paper
                    key={row.sprintId}
                    variant="outlined"
                    sx={{
                      p: 1.25,
                      borderRadius: 2.5,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                    >
                      <Typography fontWeight={800} color={COLORS.textPrimary}>
                        {row.sprintName}
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        <Typography variant="body2" color={COLORS.blue}>
                          Committed {fmt(row.committedEstimate)} sp
                        </Typography>
                        <Typography variant="body2" color={COLORS.teal}>
                          Done {fmt(row.completedEstimate)} sp
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}

            {tab === 4 && (
              <Stack spacing={2.5}>
                <SectionTitle
                  title="Sprint Report"
                  subtitle="Committed scope, completion and issue-level delivery."
                />
                {!effectiveReport ? (
                  <EmptyState>No sprint report available.</EmptyState>
                ) : (
                  <>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label={
                            effectiveReport.status === "COMPLETED"
                              ? "Committed"
                              : "Current Scope"
                          }
                          value={effectiveReport.committedEstimate}
                          suffix=" sp"
                          color={COLORS.blue}
                          helper={
                            effectiveReport.status === "COMPLETED"
                              ? "Scope committed at sprint start"
                              : "Current sprint ticket scope"
                          }
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label="Completed"
                          value={effectiveReport.completedEstimate}
                          suffix=" sp"
                          color={COLORS.teal}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label="Incomplete Issues"
                          value={effectiveReport.incompleteTickets}
                          color={COLORS.amber}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label="Completion"
                          value={effectiveReport.completionPercent}
                          suffix="%"
                          color={COLORS.primary}
                        />
                      </Grid>
                    </Grid>

                    <Paper
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5,
                        borderColor: COLORS.border,
                        overflow: "hidden",
                      }}
                    >
                      <Box sx={{ p: 1.5, bgcolor: COLORS.soft }}>
                        <Typography fontWeight={800} color={COLORS.textPrimary}>
                          Issues
                        </Typography>
                      </Box>
                      <Divider />
                      {reportRows.length ? (
                        reportRows.map((issue) => (
                          <Box
                            key={issue.ticketId}
                            sx={{
                              p: 1.5,
                              borderBottom: `1px solid ${COLORS.border}`,
                              "&:last-child": { borderBottom: 0 },
                            }}
                          >
                            <Stack
                              direction={{ xs: "column", md: "row" }}
                              spacing={1}
                              alignItems={{ md: "center" }}
                            >
                              <Typography
                                fontWeight={800}
                                sx={{ minWidth: 100, color: COLORS.primary }}
                              >
                                {issue.code || `#${issue.ticketId}`}
                              </Typography>
                              <Typography
                                sx={{ flex: 1, color: COLORS.textPrimary }}
                              >
                                {issue.name || "Issue"}
                              </Typography>
                              <Typography
                                variant="body2"
                                color={COLORS.textSecondary}
                              >
                                {fmt(issue.estimation)} sp
                              </Typography>
                              <StatusChip status={issue.status} />
                            </Stack>
                          </Box>
                        ))
                      ) : (
                        <Box sx={{ p: 3 }}>
                          <Typography color={COLORS.textSecondary}>
                            No sprint issues were found.
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </>
                )}
              </Stack>
            )}

            {/* {tab === 5 && (
              <Stack spacing={2.5}>
                <SectionTitle
                  title="Commitment vs Completion"
                  subtitle="How much of the sprint commitment has been delivered."
                />
                {!commitment ? (
                  <EmptyState>No commitment data available.</EmptyState>
                ) : (
                  <>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label="Committed"
                          value={effectiveCommitment.committedEstimate}
                          suffix=" sp"
                          color={COLORS.blue}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label="Completed"
                          value={effectiveCommitment.completedEstimate}
                          suffix=" sp"
                          color={COLORS.teal}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label="Commitment Remaining"
                          value={effectiveCommitment.remainingCommittedEstimate}
                          suffix=" sp"
                          color={COLORS.amber}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Stat
                          label="Completion"
                          value={effectiveCommitment.completionPercent}
                          suffix="%"
                          color={COLORS.primary}
                        />
                      </Grid>
                    </Grid>

                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between">
                        <Typography fontWeight={800} color={COLORS.textPrimary}>
                          Delivery progress
                        </Typography>
                        <Typography fontWeight={800} color={COLORS.primary}>
                          {fmt(effectiveCommitment.completionPercent)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          100,
                          Math.max(0, n(effectiveCommitment.completionPercent)),
                        )}
                        sx={{
                          mt: 1.25,
                          height: 10,
                          borderRadius: 5,
                          bgcolor: `${COLORS.primary}18`,
                          "& .MuiLinearProgress-bar": {
                            bgcolor: COLORS.primary,
                            borderRadius: 5,
                          },
                        }}
                      />
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ mt: 1.5 }}
                      >
                        <Typography
                          variant="body2"
                          color={COLORS.textSecondary}
                        >
                          Added scope:{" "}
                          <b>
                            {fmt(effectiveCommitment.scopeChangeEstimate)} sp
                          </b>
                        </Typography>
                        <Typography
                          variant="body2"
                          color={COLORS.textSecondary}
                        >
                          Current sprint issues:{" "}
                          <b>{effectiveCommitment.currentTickets}</b>
                        </Typography>
                      </Stack>
                    </Paper>
                  </>
                )}
              </Stack>
            )} */}

            {tab === 5 && (
              <Stack spacing={2.5}>
                <SectionTitle
                  title="Capacity Planning"
                  subtitle="Manual story-point capacity compared with automatically calculated working hours and assigned work."
                />

                <Grid container spacing={1.5}>
                  <Grid item xs={6} md={3}>
                    <Stat
                      label="Team Capacity"
                      value={totals.points}
                      suffix=" sp"
                      color={COLORS.primary}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Stat
                      label="Available Hours"
                      value={totals.hours}
                      suffix=" h"
                      color={COLORS.blue}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Stat
                      label="Assigned Work"
                      value={totals.assigned}
                      suffix=" sp"
                      color={COLORS.amber}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Stat
                      label="Remaining Capacity"
                      value={capacitySummary.remaining}
                      suffix={capacitySummary.remaining == null ? "" : " sp"}
                      color={
                        capacitySummary.remaining != null &&
                        capacitySummary.remaining < 0
                          ? COLORS.red
                          : COLORS.teal
                      }
                    />
                  </Grid>
                </Grid>

                {(capacitySummary.overloaded > 0 ||
                  capacitySummary.unconfiguredWithWork > 0) && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {capacitySummary.overloaded > 0 &&
                      `${capacitySummary.overloaded} member(s) are overallocated. `}
                    {capacitySummary.unconfiguredWithWork > 0 &&
                      `${capacitySummary.unconfiguredWithWork} member(s) have assigned work but no SP capacity configured.`}
                  </Alert>
                )}

                {!safeArray(capacity).length ? (
                  <EmptyState>
                    No project members are available for this sprint.
                  </EmptyState>
                ) : (
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      borderColor: COLORS.border,
                      overflowX: "auto",
                      background: COLORS.surface,
                    }}
                  >
                    <Table
                      size="small"
                      stickyHeader
                      sx={{
                        minWidth: 980,
                        "& .MuiTableCell-root": {
                          borderColor: COLORS.border,
                          verticalAlign: "middle",
                          py: 1.25,
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              bgcolor: COLORS.soft,
                              fontWeight: 800,
                              color: COLORS.textPrimary,
                              minWidth: 150,
                            }}
                          >
                            Team Member
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              bgcolor: COLORS.soft,
                              fontWeight: 800,
                              color: COLORS.textPrimary,
                              minWidth: 120,
                            }}
                          >
                            Capacity (SP)
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              bgcolor: COLORS.soft,
                              fontWeight: 800,
                              color: COLORS.textPrimary,
                              minWidth: 150,
                            }}
                          >
                            Available Hours
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              bgcolor: COLORS.soft,
                              fontWeight: 800,
                              color: COLORS.textPrimary,
                              minWidth: 130,
                            }}
                          >
                            Assigned
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              bgcolor: COLORS.soft,
                              fontWeight: 800,
                              color: COLORS.textPrimary,
                              minWidth: 130,
                            }}
                          >
                            Remaining
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              bgcolor: COLORS.soft,
                              fontWeight: 800,
                              color: COLORS.textPrimary,
                              minWidth: 150,
                            }}
                          >
                            Utilization
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              bgcolor: COLORS.soft,
                              fontWeight: 800,
                              color: COLORS.textPrimary,
                              minWidth: 180,
                            }}
                          >
                            Status
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              bgcolor: COLORS.soft,
                              fontWeight: 800,
                              color: COLORS.textPrimary,
                              minWidth: 100,
                            }}
                          >
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {safeArray(capacity).map((row) => {
                          const utilization = row.utilizationPercent;
                          const utilizationValue = n(utilization);
                          const isOver = utilizationValue > 100;
                          const isUnconfigured = n(row.capacityPoints) <= 0;
                          const remaining = isUnconfigured
                            ? null
                            : n(row.remainingCapacityPoints);

                          return (
                            <TableRow
                              key={row.userId}
                              hover
                              sx={{
                                "&:last-child td": { borderBottom: 0 },
                                bgcolor: isOver ? "#FFF7F7" : COLORS.surface,
                              }}
                            >
                              <TableCell>
                                <Stack spacing={0.35}>
                                  <Typography
                                    fontWeight={800}
                                    sx={{ color: COLORS.textPrimary }}
                                  >
                                    {row.userName || "Unknown user"}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: COLORS.textSecondary }}
                                  >
                                    {row.userEmail || "—"}
                                  </Typography>
                                </Stack>
                              </TableCell>

                              <TableCell align="right">
                                <TextField
                                  size="small"
                                  type="number"
                                  value={row.capacityPoints ?? 0}
                                  onChange={(event) =>
                                    updateCapacity(
                                      row.userId,
                                      "capacityPoints",
                                      event.target.value,
                                    )
                                  }
                                  sx={{
                                    width: 80,
                                    "& .MuiOutlinedInput-root": {
                                      borderRadius: 1.5,
                                    },
                                  }}
                                  inputProps={{
                                    min: 0,
                                    step: 0.5,
                                    "aria-label": `Capacity for ${
                                      row.userName || "team member"
                                    }`,
                                  }}
                                />
                              </TableCell>

                              <TableCell align="right">
                                <Typography
                                  fontWeight={800}
                                  sx={{ color: COLORS.textPrimary }}
                                >
                                  {fmt(row.capacityHours)} h
                                </Typography>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  sx={{ color: COLORS.textSecondary }}
                                >
                                  {n(row.workingDays)} working day(s)
                                </Typography>
                                {n(row.holidayDays) > 0 && (
                                  <Typography
                                    variant="caption"
                                    display="block"
                                    sx={{ color: COLORS.textSecondary }}
                                  >
                                    {n(row.holidayDays)} holiday day(s)
                                  </Typography>
                                )}
                              </TableCell>

                              <TableCell align="right">
                                <Typography
                                  fontWeight={800}
                                  sx={{ color: COLORS.textPrimary }}
                                >
                                  {fmt(row.assignedEstimate)} SP
                                </Typography>
                              </TableCell>

                              <TableCell align="right">
                                <Typography
                                  fontWeight={800}
                                  sx={{
                                    color:
                                      remaining !== null && remaining < 0
                                        ? COLORS.red
                                        : COLORS.teal,
                                  }}
                                >
                                  {remaining === null
                                    ? "—"
                                    : `${fmt(remaining)} SP`}
                                </Typography>
                              </TableCell>

                              <TableCell align="right">
                                <Stack
                                  alignItems="flex-end"
                                  spacing={0.6}
                                  sx={{ minWidth: 110 }}
                                >
                                  <Typography
                                    fontWeight={800}
                                    sx={{
                                      color: isOver
                                        ? COLORS.red
                                        : isUnconfigured
                                          ? COLORS.textSecondary
                                          : utilizationValue >= 80
                                            ? COLORS.amber
                                            : COLORS.teal,
                                    }}
                                  >
                                    {utilization == null
                                      ? "N/A"
                                      : `${fmt(utilization)}%`}
                                  </Typography>

                                  {utilization != null && (
                                    <Tooltip
                                      title={`${fmt(
                                        utilization,
                                      )}% of configured SP capacity`}
                                    >
                                      <LinearProgress
                                        variant="determinate"
                                        value={Math.min(
                                          100,
                                          Math.max(0, utilizationValue),
                                        )}
                                        sx={{
                                          width: 105,
                                          height: 6,
                                          borderRadius: 3,
                                          bgcolor: `${COLORS.primary}16`,
                                          "& .MuiLinearProgress-bar": {
                                            bgcolor: isOver
                                              ? COLORS.red
                                              : utilizationValue >= 80
                                                ? COLORS.amber
                                                : COLORS.teal,
                                            borderRadius: 3,
                                          },
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Stack>
                              </TableCell>

                              <TableCell align="center">
                                <CapacityStatus row={row} />
                              </TableCell>

                              <TableCell align="center">
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={savingUser === row.userId}
                                  onClick={() => saveRow(row)}
                                  sx={{
                                    minWidth: 82,
                                    bgcolor: COLORS.primary,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    boxShadow: "none",
                                    "&:hover": {
                                      bgcolor: COLORS.primaryDark,
                                      boxShadow: "none",
                                    },
                                  }}
                                >
                                  {savingUser === row.userId
                                    ? "Saving…"
                                    : "Save"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Stack>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, md: 3 },
          py: 1.5,
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            color: COLORS.textSecondary,
            fontWeight: 700,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

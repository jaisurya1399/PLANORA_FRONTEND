import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import {
  getEpicBurndown,
  getEpicProgress,
  getEpicReport,
} from "../../api/epicApi";

const number = (value) => Number(value || 0).toLocaleString();
const points = (value) => Number(value || 0).toFixed(2);
const pct = (value) => `${Number(value || 0).toFixed(1)}%`;

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

const safeIssueArray = (data) => {
  if (Array.isArray(data?.issues)) return data.issues;
  if (Array.isArray(data?.tickets)) return data.tickets;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const deriveEpicMetrics = (data) => {
  const issues = safeIssueArray(data);
  if (!issues.length) return data;

  const completedIssues = issues.filter(isCompletedIssue).length;
  if (completedIssues <= 0) return data;

  const totalIssues = issues.length;
  const totalEstimation = issues.reduce(
    (sum, issue) => sum + issueEstimate(issue),
    0,
  );
  const completedEstimation = issues
    .filter(isCompletedIssue)
    .reduce((sum, issue) => sum + issueEstimate(issue), 0);

  // Use issue-level status when the summary endpoint is stale or still
  // only recognizes DONE/COMPLETED.
  if (
    Number(data?.completedIssues) === completedIssues &&
    Number(data?.completedEstimation || 0) === completedEstimation
  ) {
    return data;
  }

  return {
    ...data,
    totalIssues,
    completedIssues,
    completionPercentage:
      totalIssues > 0 ? (completedIssues * 100) / totalIssues : 0,
    totalEstimation:
      totalEstimation > 0
        ? totalEstimation
        : Number(data?.totalEstimation || 0),
    completedEstimation:
      completedEstimation > 0
        ? completedEstimation
        : Number(data?.completedEstimation || 0),
    remainingEstimation:
      totalEstimation > 0
        ? Math.max(0, totalEstimation - completedEstimation)
        : Number(data?.remainingEstimation || 0),
    estimationCompletionPercentage:
      totalEstimation > 0
        ? (completedEstimation * 100) / totalEstimation
        : Number(data?.estimationCompletionPercentage || 0),
  };
};

const StatCard = ({ label, value, secondary }) => (
  <Paper variant="outlined" sx={{ p: 2, minWidth: 150, flex: 1 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h5" fontWeight={700} mt={0.5}>
      {value}
    </Typography>
    {secondary && (
      <Typography variant="caption" color="text.secondary">
        {secondary}
      </Typography>
    )}
  </Paper>
);

const BarList = ({ title, data }) => {
  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([, value]) => Number(value || 0)));

  return (
    <Box>
      <Typography fontWeight={700} mb={1.5}>
        {title}
      </Typography>
      <Stack spacing={1.2}>
        {entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No data available.
          </Typography>
        ) : (
          entries.map(([label, value]) => (
            <Box key={label}>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">{label}</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {value}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(Number(value || 0) / max) * 100}
                sx={{ height: 7, borderRadius: 5 }}
              />
            </Box>
          ))
        )}
      </Stack>
    </Box>
  );
};

const BurndownChart = ({ points: data }) => {
  const width = 900;
  const height = 330;
  const pad = { left: 55, right: 70, top: 25, bottom: 55 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;

  const chartData = (data || []).map((item) => ({
    ...item,
    idealRemaining: Number(
      item?.idealRemaining ?? item?.idealRemainingEstimate ?? item?.ideal ?? 0,
    ),
    remaining: Number(
      item?.remaining ?? item?.remainingEstimate ?? item?.remainingPoints ?? 0,
    ),
  }));

  const maxValue = Math.max(
    1,
    ...chartData.flatMap((item) => [item.idealRemaining, item.remaining]),
  );

  const x = (index) =>
    pad.left +
    (chartData.length <= 1
      ? innerWidth / 2
      : (index / (chartData.length - 1)) * innerWidth);

  const y = (value) =>
    pad.top + innerHeight - (Number(value || 0) / maxValue) * innerHeight;

  const makePath = (key) =>
    chartData
      .map(
        (item, index) =>
          `${index === 0 ? "M" : "L"} ${x(index)} ${y(item[key])}`,
      )
      .join(" ");

  if (!chartData.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No burndown data available.
      </Typography>
    );
  }

  const labels =
    chartData.length <= 7
      ? chartData
      : [
          chartData[0],
          chartData[Math.floor(chartData.length / 2)],
          chartData[chartData.length - 1],
        ];

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label="Epic burndown chart"
      >
        <line
          x1={pad.left}
          y1={pad.top}
          x2={pad.left}
          y2={height - pad.bottom}
          stroke="currentColor"
          opacity="0.25"
        />
        <line
          x1={pad.left}
          y1={height - pad.bottom}
          x2={width - pad.right}
          y2={height - pad.bottom}
          stroke="currentColor"
          opacity="0.25"
        />

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = maxValue * ratio;
          const yy = y(value);
          return (
            <g key={ratio}>
              <line
                x1={pad.left}
                y1={yy}
                x2={width - pad.right}
                y2={yy}
                stroke="currentColor"
                opacity="0.08"
              />
              <text
                x={pad.left - 8}
                y={yy + 4}
                textAnchor="end"
                fontSize="11"
                fill="currentColor"
              >
                {value.toFixed(0)}
              </text>
            </g>
          );
        })}

        <path
          d={makePath("idealRemaining")}
          fill="none"
          stroke="currentColor"
          strokeDasharray="6 5"
          opacity="0.45"
          strokeWidth="2"
        />
        <path
          d={makePath("remaining")}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />

        {chartData.map((item, index) => (
          <circle
            key={item.date}
            cx={x(index)}
            cy={y(item.remaining)}
            r="3.5"
            fill="currentColor"
          />
        ))}

        {labels.map((item) => {
          const index = chartData.findIndex(
            (point) => point.date === item.date,
          );
          const isFirst = index === 0;
          const isLast = index === chartData.length - 1;

          return (
            <text
              key={item.date}
              x={isLast ? width - pad.right : isFirst ? pad.left : x(index)}
              y={height - 25}
              textAnchor={isLast ? "end" : isFirst ? "start" : "middle"}
              fontSize="11"
              fill="currentColor"
            >
              {item.date}
            </text>
          );
        })}
      </svg>

      <Stack direction="row" spacing={2} justifyContent="center" mt={-1}>
        <Typography variant="caption">— Actual remaining</Typography>
        <Typography variant="caption">- - Ideal remaining</Typography>
      </Stack>
    </Box>
  );
};

const EpicAnalyticsDialog = ({ open, onClose, epic }) => {
  const [tab, setTab] = useState(0);
  const [progress, setProgress] = useState(null);
  const [burndown, setBurndown] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !epic?.id) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [progressData, burndownData, reportData] = await Promise.all([
          getEpicProgress(epic.id),
          getEpicBurndown(epic.id),
          getEpicReport(epic.id),
        ]);

        if (!cancelled) {
          setProgress(progressData);
          setBurndown(burndownData);
          setReport(deriveEpicMetrics(reportData));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message || "Failed to load Epic analytics",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [open, epic?.id]);

  const issues = useMemo(() => safeIssueArray(report), [report]);

  const effectiveProgress = useMemo(() => {
    if (!progress || !issues.length) return progress;

    const completedIssues = issues.filter(isCompletedIssue).length;
    if (completedIssues <= 0 || Number(progress.completedIssues) > 0) {
      return progress;
    }

    const totalIssues = issues.length;
    const totalEstimation = issues.reduce(
      (sum, issue) => sum + issueEstimate(issue),
      0,
    );
    const completedEstimation = issues
      .filter(isCompletedIssue)
      .reduce((sum, issue) => sum + issueEstimate(issue), 0);

    return {
      ...progress,
      totalIssues,
      completedIssues,
      completionPercentage:
        totalIssues > 0 ? (completedIssues * 100) / totalIssues : 0,
      totalEstimation:
        totalEstimation > 0 ? totalEstimation : progress.totalEstimation,
      completedEstimation:
        completedEstimation > 0
          ? completedEstimation
          : progress.completedEstimation,
      remainingEstimation:
        totalEstimation > 0
          ? Math.max(0, totalEstimation - completedEstimation)
          : progress.remainingEstimation,
      estimationCompletionPercentage:
        totalEstimation > 0
          ? (completedEstimation * 100) / totalEstimation
          : progress.estimationCompletionPercentage,
    };
  }, [progress, issues]);

  const effectiveBurndown = useMemo(() => {
    if (!burndown || !issues.length || !Array.isArray(burndown.points)) {
      return burndown;
    }

    const totalEstimation = issues.reduce(
      (sum, issue) => sum + issueEstimate(issue),
      0,
    );
    if (!burndown.points.length) return burndown;

    const fallbackTotal = Number(burndown.totalEstimation || 0);
    const effectiveTotal =
      totalEstimation > 0 ? totalEstimation : fallbackTotal;
    if (effectiveTotal <= 0) return burndown;

    const completedEstimation = issues
      .filter(isCompletedIssue)
      .reduce((sum, issue) => sum + issueEstimate(issue), 0);

    const points = [...burndown.points];
    const last = points[points.length - 1];
    points[points.length - 1] = {
      ...last,
      scopeEstimate: Number(last.scopeEstimate) || effectiveTotal,
      completedEstimate: completedEstimation,
      remainingEstimate: Math.max(0, effectiveTotal - completedEstimation),
      // Keep the chart field populated even when the backend uses remainingEstimate.
      completed: completedEstimation,
      remaining: Math.max(0, effectiveTotal - completedEstimation),
    };

    return { ...burndown, points };
  }, [burndown, issues]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={1}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {epic?.name || "Epic"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Epic Progress, Burndown and Report
            </Typography>
          </Box>
          {epic && (
            <Chip
              label={`${epic.startsAt || ""} → ${epic.endsAt || ""}`}
              variant="outlined"
            />
          )}
        </Stack>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Progress" />
        <Tab label="Burndown" />
        <Tab label="Report" />
      </Tabs>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {loading && <LinearProgress sx={{ mb: 3 }} />}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {tab === 0 && effectiveProgress && (
          <Stack spacing={3}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              flexWrap="wrap"
            >
              <StatCard
                label="Total Issues"
                value={number(effectiveProgress.totalIssues)}
              />
              <StatCard
                label="Completed"
                value={number(effectiveProgress.completedIssues)}
              />
              <StatCard
                label="In Progress"
                value={number(effectiveProgress.inProgressIssues)}
              />
              <StatCard
                label="To Do"
                value={number(effectiveProgress.todoIssues)}
              />
              <StatCard
                label="Remaining"
                value={number(
                  effectiveProgress.totalIssues -
                    effectiveProgress.completedIssues,
                )}
              />
            </Stack>

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography fontWeight={700}>Issue Completion</Typography>
                <Typography fontWeight={700}>
                  {pct(effectiveProgress.completionPercentage)}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(
                  100,
                  Math.max(0, effectiveProgress.completionPercentage || 0),
                )}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Paper>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <StatCard
                label="Total Estimation"
                value={points(effectiveProgress.totalEstimation)}
              />
              <StatCard
                label="Completed Estimation"
                value={points(effectiveProgress.completedEstimation)}
              />
              <StatCard
                label="Remaining Estimation"
                value={points(effectiveProgress.remainingEstimation)}
              />
              <StatCard
                label="Estimation Progress"
                value={pct(effectiveProgress.estimationCompletionPercentage)}
              />
            </Stack>
          </Stack>
        )}

        {tab === 1 && effectiveBurndown && (
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} mb={0.5}>
                Epic Burndown
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Remaining estimation by day against the ideal burndown.
              </Typography>
              <BurndownChart points={effectiveBurndown.points} />
            </Paper>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <StatCard
                label="Total Estimation"
                value={points(effectiveBurndown.totalEstimation)}
              />
              <StatCard
                label="Start"
                value={effectiveBurndown.startsAt || "-"}
              />
              <StatCard label="End" value={effectiveBurndown.endsAt || "-"} />
              <StatCard
                label="Data Points"
                value={number(effectiveBurndown.points?.length)}
              />
            </Stack>
          </Stack>
        )}

        {tab === 2 && report && (
          <Stack spacing={3}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              flexWrap="wrap"
            >
              <StatCard label="Issues" value={number(report.totalIssues)} />
              <StatCard
                label="Completed"
                value={number(report.completedIssues)}
              />
              <StatCard
                label="Completion"
                value={pct(report.completionPercentage)}
              />
              <StatCard
                label="Estimation Progress"
                value={pct(report.estimationCompletionPercentage)}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Paper variant="outlined" sx={{ p: 2.5, flex: 1 }}>
                <BarList
                  title="Status Distribution"
                  data={report.statusDistribution}
                />
              </Paper>
              <Paper variant="outlined" sx={{ p: 2.5, flex: 1 }}>
                <BarList
                  title="Priority Distribution"
                  data={report.priorityDistribution}
                />
              </Paper>
            </Stack>

            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              <Box sx={{ p: 2 }}>
                <Typography fontWeight={700}>
                  Epic Issues ({issues.length})
                </Typography>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell align="right">Estimation</TableCell>
                    <TableCell>Responsible</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow key={issue.id} hover>
                      <TableCell>{issue.code || `#${issue.id}`}</TableCell>
                      <TableCell>{issue.name}</TableCell>
                      <TableCell>{issue.status || "-"}</TableCell>
                      <TableCell>{issue.priority || "-"}</TableCell>
                      <TableCell align="right">
                        {points(issue.estimation)}
                      </TableCell>
                      <TableCell>{issue.responsibleName || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {issues.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No active tickets in this Epic.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EpicAnalyticsDialog;

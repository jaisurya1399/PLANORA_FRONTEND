import AddIcon from "@mui/icons-material/Add";
import BoltIcon from "@mui/icons-material/Bolt";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import RefreshIcon from "@mui/icons-material/Refresh";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";

import { useEffect, useMemo, useState } from "react";
import {
  createCustomDashboard,
  deleteCustomDashboard,
  getCustomDashboards,
  getMemberAnalytics,
  getProjectDashboardAnalytics,
  updateCustomDashboard,
} from "../../api/dashboardAnalyticsApi";
import { getProjectUsers } from "../../api/projectUserApi";
import { useAuth } from "../../context/AuthContext";

// ---- Design tokens -------------------------------------------------------
const COLORS = {
  primary: "#4F46E5", // indigo — brand / primary actions
  primaryDark: "#3730A3",
  teal: "#0D9488", // resolved / positive
  blue: "#2563EB", // created / neutral-positive
  amber: "#D97706", // velocity / attention
  slateBg: "#F8FAFC",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

// A small, deliberate qualitative palette used across every chart series so
// that the same metric always reads in the same color.
const SERIES_COLORS = [
  "#4F46E5", // indigo
  "#0D9488", // teal
  "#D97706", // amber
  "#DB2777", // pink
  "#2563EB", // blue
  "#7C3AED", // violet
];

const WIDGETS = [
  ["VELOCITY", "Velocity Chart"],
  ["SPRINT_REPORT", "Sprint Report"],
  ["CUMULATIVE_FLOW", "Cumulative Flow"],
  ["CONTROL_CHART", "Control Chart"],
  ["LEAD_CYCLE_TIME", "Lead / Cycle Time"],
  ["CREATED_RESOLVED", "Created vs Resolved"],
];

function MetricCard({ title, value, subtitle, icon, color }) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderColor: COLORS.border,
        height: "100%",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.15s ease",
        "&:hover": { boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)" },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: color,
        }}
      />
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: `${color}1A`,
            color,
            width: 44,
            height: 44,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            color={COLORS.textSecondary}
            variant="body2"
            fontWeight={600}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ color: COLORS.textPrimary, lineHeight: 1.2, mt: 0.25 }}
          >
            {value}
          </Typography>
          <Typography color={COLORS.textSecondary} variant="caption">
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function SimpleChart({
  title,
  data = [],
  series = [],
  xKey = "date",
  type = "line",
}) {
  const max = Math.max(
    1,
    ...data.flatMap((r) => series.map((s) => Number(r[s.key] || 0))),
  );
  const coloredSeries = series.map((s, i) => ({
    ...s,
    color: s.color || SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 2.5, borderColor: COLORS.border, height: "100%" }}
    >
      <CardContent>
        <Typography fontWeight={700} sx={{ color: COLORS.textPrimary }}>
          {title}
        </Typography>

        <Box
          sx={{
            height: 200,
            mt: 2,
            display: "flex",
            alignItems: "end",
            gap: 0.5,
            overflowX: "auto",
            px: 1,
            pb: 1,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          {data.length === 0 && (
            <Typography
              variant="body2"
              color={COLORS.textSecondary}
              sx={{ m: "auto" }}
            >
              No data for this range.
            </Typography>
          )}
          {data.map((r, i) => (
            <Box
              key={i}
              sx={{
                minWidth: type === "line" ? 16 : 28,
                flex: type === "line" ? 1 : "unset",
                height: "100%",
                display: "flex",
                alignItems: "end",
                gap: "3px",
              }}
              title={`${r[xKey]}: ${coloredSeries.map((s) => `${s.label}: ${r[s.key] || 0}`).join(", ")}`}
            >
              {coloredSeries.map((s) => (
                <Box
                  key={s.key}
                  sx={{
                    width: `${100 / coloredSeries.length}%`,
                    height: `${Math.max(2, (Number(r[s.key] || 0) / max) * 100)}%`,
                    borderRadius: "4px 4px 0 0",
                    background: s.color,
                    transition: "opacity 0.15s ease",
                    "&:hover": { opacity: 0.8 },
                  }}
                />
              ))}
            </Box>
          ))}
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1.5 }}>
          {coloredSeries.map((s) => (
            <Stack
              key={s.key}
              direction="row"
              alignItems="center"
              spacing={0.75}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: s.color,
                }}
              />
              <Typography variant="caption" color={COLORS.textSecondary}>
                {s.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DashboardAnalytics() {
  const { user, getPrimaryProjectId } = useAuth();
  const [projects, setProjects] = useState([]),
    [projectId, setProjectId] = useState(""),
    [memberId, setMemberId] = useState(""),
    [days, setDays] = useState(30),
    [data, setData] = useState(null),
    [dashboards, setDashboards] = useState([]),
    [selected, setSelected] = useState(null),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const [memberData, setMemberData] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    projectId: "",
    widgets: WIDGETS.map((w) => w[0]),
  });

  const load = async () => {
    try {
      setError("");
      if (projectId) {
        setData(await getProjectDashboardAnalytics(projectId, days));
        if (memberId) {
          setMemberData(await getMemberAnalytics(projectId, memberId, days));
        } else {
          setMemberData(null);
        }
      } else {
        setData(null);
        setMemberData(null);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load analytics.");
    }
  };
  const loadDashboards = async () => {
    try {
      setDashboards(await getCustomDashboards());
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load dashboards.");
    }
  };
  useEffect(() => {
    (async () => {
      try {
        const memberships = Array.isArray(user?.projectMemberships)
          ? user.projectMemberships
          : [];
        const activeId = getPrimaryProjectId();
        const list = memberships
          .filter(
            (m) => m?.projectId && Number(m.projectId) === Number(activeId),
          )
          .map((m) => ({
            id: Number(m.projectId),
            name: m.projectName || m.project?.name || `Project #${m.projectId}`,
          }));
        setProjects(list);
        if (list.length) setProjectId(String(list[0].id));
        await loadDashboards();
      } catch (e) {
        setError(e.response?.data?.message || "Unable to load projects.");
      }
    })();
  }, [user, getPrimaryProjectId]);
  useEffect(() => {
    if (!projectId) {
      setProjectMembers([]);
      setMemberId("");
      return;
    }
    (async () => {
      try {
        const result = await getProjectUsers(projectId);
        const members = Array.isArray(result)
          ? result
          : result?.content || result?.data || result?.items || [];
        setProjectMembers(members);
      } catch (e) {
        console.warn("Unable to load project members", e);
        setProjectMembers([]);
      }
    })();
  }, [projectId]);

  useEffect(() => {
    if (projectId) load();
  }, [projectId, memberId, days]);

  const summary = useMemo(() => {
    const t = data?.createdResolved || [];
    return {
      created: t.reduce((a, r) => a + (r.created || 0), 0),
      resolved: t.reduce((a, r) => a + (r.resolved || 0), 0),
      velocity: (data?.velocity || []).slice(-1)[0]?.completed || 0,
    };
  }, [data]);
  const openNew = () => {
    setSelected(null);
    setForm({
      name: "",
      projectId: projectId || "",
      widgets: WIDGETS.map((w) => w[0]),
    });
    setOpen(true);
  };
  const edit = (d) => {
    setSelected(d);
    setForm({
      name: d.name,
      projectId: d.projectId || "",
      widgets: d.widgets || [],
    });
    setOpen(true);
  };
  const save = async () => {
    const payload = {
      ...form,
      projectId: form.projectId ? Number(form.projectId) : null,
    };
    if (selected) await updateCustomDashboard(selected.id, payload);
    else await createCustomDashboard(payload);
    setOpen(false);
    await loadDashboards();
  };
  const remove = async (id) => {
    if (!(await requestConfirm("Delete this dashboard?"))) return;
    await deleteCustomDashboard(id);
    await loadDashboards();
    if (selected?.id === id) setSelected(null);
  };
  const openDashboard = (d) => {
    setSelected(d);
    setForm({
      name: d.name,
      projectId: d.projectId || "",
      widgets: d.widgets || [],
    });
    if (d.projectId) setProjectId(String(d.projectId));
  };

  return (
    <Box
      className="app-page pm-fade-up"
      sx={{ bgcolor: COLORS.slateBg, minHeight: "100%" }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ color: COLORS.textPrimary }}
          >
            Dashboards & Analytics
          </Typography>
          <Typography color={COLORS.textSecondary} sx={{ mt: 0.5 }}>
            Velocity, flow, control, lead/cycle time and delivery trends.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openNew}
          sx={{
            bgcolor: COLORS.primary,
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            px: 2.5,
            boxShadow: "none",
            "&:hover": { bgcolor: COLORS.primaryDark, boxShadow: "none" },
          }}
        >
          Custom Dashboard
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Card
        variant="outlined"
        sx={{
          mb: 3,
          borderRadius: 2.5,
          borderColor: COLORS.border,
        }}
      >
        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(180px, 1fr) minmax(180px, 1fr) 180px auto",
              },
              gap: 2,
              alignItems: "center",
            }}
          >
            {/* Project */}
            <FormControl
              fullWidth
              size="small"
              sx={{ minWidth: 0, display: "none" }}
            >
              <InputLabel id="project-select-label">Project</InputLabel>
              <Select
                labelId="project-select-label"
                value={projectId}
                label="Project"
                onChange={(e) => setProjectId(e.target.value)}
                sx={{ height: 40, borderRadius: 1.5 }}
              >
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Individual Member */}
            <FormControl fullWidth size="small" sx={{ minWidth: 0 }}>
              <InputLabel id="member-select-label">Member Analytics</InputLabel>
              <Select
                labelId="member-select-label"
                value={memberId}
                label="Member Analytics"
                onChange={(e) => setMemberId(e.target.value)}
                disabled={!projectId}
                sx={{ height: 40, borderRadius: 1.5 }}
              >
                <MenuItem value="">All Members</MenuItem>
                {projectMembers.map((m) => {
                  const user = m.user || m.member || m;
                  const id = user?.id ?? m?.userId ?? m?.memberId;
                  const name =
                    user?.name ??
                    m?.userName ??
                    m?.memberName ??
                    user?.email ??
                    `Member ${id}`;
                  return id ? (
                    <MenuItem key={id} value={id}>
                      {name}
                    </MenuItem>
                  ) : null;
                })}
              </Select>
            </FormControl>

            {/* Date Range */}
            <FormControl fullWidth size="small" sx={{ minWidth: 0 }}>
              <InputLabel id="range-select-label">Date Range</InputLabel>
              <Select
                labelId="range-select-label"
                value={days}
                label="Date Range"
                onChange={(e) => setDays(e.target.value)}
                sx={{ height: 40, borderRadius: 1.5 }}
              >
                <MenuItem value={14}>Last 14 days</MenuItem>
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={60}>Last 60 days</MenuItem>
                <MenuItem value={90}>Last 90 days</MenuItem>
              </Select>
            </FormControl>

            {/* Refresh */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={load}
              sx={{
                height: 40,
                minWidth: 80,
                maxWidth: 100,
                px: 2,
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                borderRadius: 1.5,
                "&:hover": {
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  bgcolor: `${COLORS.primary}0D`,
                },
              }}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Created"
            value={summary.created}
            subtitle={`last ${days} days`}
            icon={<TrendingUpIcon fontSize="small" />}
            color={COLORS.blue}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Resolved"
            value={summary.resolved}
            subtitle={`last ${days} days`}
            icon={<TaskAltIcon fontSize="small" />}
            color={COLORS.teal}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Latest completed velocity"
            value={summary.velocity}
            subtitle="estimation points"
            icon={<BoltIcon fontSize="small" />}
            color={COLORS.amber}
          />
        </Grid>
      </Grid>

      {memberData && (
        <Box sx={{ mb: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ color: COLORS.textPrimary }}
              >
                Individual Member Analytics
              </Typography>
              <Typography variant="body2" color={COLORS.textSecondary}>
                {memberData.member?.name || "Member"} · last {days} days
              </Typography>
            </Box>
            <Chip label="Member View" sx={{ fontWeight: 700 }} />
          </Stack>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              ["Assigned", memberData.summary?.assigned ?? 0, COLORS.blue],
              ["Completed", memberData.summary?.completed ?? 0, COLORS.teal],
              ["Overdue", memberData.summary?.overdue ?? 0, COLORS.amber],
              [
                "Completion",
                `${memberData.summary?.completionRate ?? 0}%`,
                COLORS.primary,
              ],
            ].map(([title, value, color]) => (
              <Grid item xs={12} sm={6} md={3} key={title}>
                <MetricCard
                  title={title}
                  value={value}
                  subtitle="individual performance"
                  icon={<TaskAltIcon fontSize="small" />}
                  color={color}
                />
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SimpleChart
                title="Member Work Trend"
                data={memberData.createdCompletedTrend || []}
                series={[
                  { key: "created", label: "Created" },
                  { key: "completed", label: "Completed" },
                ]}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SimpleChart
                title="Sprint Performance"
                data={memberData.sprintPerformance || []}
                xKey="sprint"
                series={[
                  { key: "assigned", label: "Assigned" },
                  { key: "completed", label: "Completed" },
                ]}
                type="bar"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SimpleChart
                title="Status Distribution"
                data={memberData.statusDistribution || []}
                xKey="status"
                series={[{ key: "count", label: "Tickets" }]}
                type="bar"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SimpleChart
                title="Lead Time"
                data={memberData.leadCycleTime || []}
                xKey="ticket"
                series={[{ key: "leadHours", label: "Lead hours" }]}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {!projectId ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Select a project to load analytics.
        </Alert>
      ) : (
        data && (
          <Grid container spacing={2}>
            {(selected?.widgets || WIDGETS.map((w) => w[0])).map((type) => {
              const cfg = WIDGETS.find((w) => w[0] === type);
              if (!cfg) return null;
              if (type === "VELOCITY")
                return (
                  <Grid item xs={12} md={6} key={type}>
                    <SimpleChart
                      title={cfg[1]}
                      data={data.velocity}
                      xKey="sprint"
                      series={[
                        { key: "committed", label: "Committed" },
                        { key: "completed", label: "Completed" },
                      ]}
                      type="bar"
                    />
                  </Grid>
                );
              if (type === "SPRINT_REPORT")
                return (
                  <Grid item xs={12} md={6} key={type}>
                    <SimpleChart
                      title={cfg[1]}
                      data={data.sprintReport}
                      xKey="sprint"
                      series={[
                        { key: "estimated", label: "Estimated" },
                        { key: "completed", label: "Completed" },
                      ]}
                      type="bar"
                    />
                  </Grid>
                );
              if (type === "CUMULATIVE_FLOW")
                return (
                  <Grid item xs={12} key={type}>
                    <SimpleChart
                      title={cfg[1]}
                      data={data.cumulativeFlow}
                      series={Object.keys(data.cumulativeFlow[0] || {})
                        .filter((k) => k !== "date")
                        .map((k) => ({
                          key: k,
                          label: k.replaceAll("_", " "),
                        }))}
                    />
                  </Grid>
                );
              if (type === "CONTROL_CHART")
                return (
                  <Grid item xs={12} md={6} key={type}>
                    <SimpleChart
                      title={cfg[1]}
                      data={data.controlChart}
                      xKey="ticket"
                      series={[{ key: "cycleHours", label: "Cycle hours" }]}
                    />
                  </Grid>
                );
              if (type === "LEAD_CYCLE_TIME")
                return (
                  <Grid item xs={12} md={6} key={type}>
                    <SimpleChart
                      title={cfg[1]}
                      data={data.leadCycleTime}
                      xKey="ticket"
                      series={[
                        { key: "leadHours", label: "Lead hours" },
                        { key: "cycleHours", label: "Cycle hours" },
                      ]}
                    />
                  </Grid>
                );
              return (
                <Grid item xs={12} key={type}>
                  <SimpleChart
                    title={cfg[1]}
                    data={data.createdResolved}
                    series={[
                      { key: "created", label: "Created" },
                      { key: "resolved", label: "Resolved" },
                    ]}
                  />
                </Grid>
              );
            })}
          </Grid>
        )
      )}

      <Card
        variant="outlined"
        sx={{ mt: 3, borderRadius: 2.5, borderColor: COLORS.border }}
      >
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <DashboardCustomizeIcon sx={{ color: COLORS.primary }} />
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: COLORS.textPrimary }}
              >
                My Custom Dashboards
              </Typography>
            </Stack>
            <Button
              startIcon={<AddIcon />}
              onClick={openNew}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: COLORS.primary,
              }}
            >
              New
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
            {dashboards.map((d) => (
              <Chip
                key={d.id}
                label={d.name}
                onClick={() => openDashboard(d)}
                onDelete={() => remove(d.id)}
                sx={{
                  fontWeight: 600,
                  bgcolor:
                    selected?.id === d.id
                      ? `${COLORS.primary}1A`
                      : "transparent",
                  color:
                    selected?.id === d.id ? COLORS.primary : COLORS.textPrimary,
                  border: `1px solid ${
                    selected?.id === d.id ? COLORS.primary : COLORS.border
                  }`,
                }}
              />
            ))}
            {dashboards.length === 0 && (
              <Typography color={COLORS.textSecondary}>
                No custom dashboards yet.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selected ? "Edit" : "Create"} Custom Dashboard
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth sx={{ display: "none" }}>
              <InputLabel>Project</InputLabel>
              <Select
                value={form.projectId}
                label="Project"
                onChange={(e) =>
                  setForm({ ...form, projectId: e.target.value })
                }
              >
                <MenuItem value="">None</MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ mb: 1, color: COLORS.textPrimary }}
              >
                Widgets
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                {WIDGETS.map(([key, label], i) => {
                  const active = form.widgets.includes(key);
                  const c = SERIES_COLORS[i % SERIES_COLORS.length];
                  return (
                    <Chip
                      key={key}
                      label={label}
                      onClick={() =>
                        setForm({
                          ...form,
                          widgets: active
                            ? form.widgets.filter((x) => x !== key)
                            : [...form.widgets, key],
                        })
                      }
                      sx={{
                        fontWeight: 600,
                        bgcolor: active ? c : "transparent",
                        color: active ? "#fff" : COLORS.textPrimary,
                        border: `1px solid ${active ? c : COLORS.border}`,
                        "&:hover": {
                          bgcolor: active ? c : `${c}14`,
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setOpen(false)}
            sx={{ textTransform: "none", color: COLORS.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={!form.name.trim()}
            sx={{
              bgcolor: COLORS.primary,
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              boxShadow: "none",
              "&:hover": { bgcolor: COLORS.primaryDark, boxShadow: "none" },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

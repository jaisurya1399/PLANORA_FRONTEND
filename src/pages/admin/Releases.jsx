import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Refresh from "@mui/icons-material/Refresh";
import RocketLaunch from "@mui/icons-material/RocketLaunch";
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
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";
import {
  assignTicketToRelease,
  createRelease,
  deleteRelease,
  getReleaseBurndown,
  getReleaseProgress,
  getReleaseTickets,
  getReleases,
  removeTicketFromRelease,
  updateRelease,
  updateReleaseStatus,
} from "../../api/releaseApi";
import { getTicketsByProject } from "../../api/ticketApi";
import { useAuth } from "../../context/AuthContext";

const STATUSES = ["PLANNED", "IN_PROGRESS", "RELEASED", "CANCELLED"];
const labels = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  RELEASED: "Released",
  CANCELLED: "Cancelled",
};
const empty = {
  version: "",
  name: "",
  description: "",
  releaseNotes: "",
  startDate: "",
  releaseDate: "",
  status: "PLANNED",
};
const fmt = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString() : "No date";

export default function Releases() {
  const { getPrimaryProjectId, getProjectMembership } = useAuth();
  const primaryProjectId = getPrimaryProjectId();
  const activeMembership = primaryProjectId
    ? getProjectMembership(primaryProjectId)
    : null;
  const activeProject = primaryProjectId
    ? {
        id: Number(primaryProjectId),
        name:
          activeMembership?.projectName ||
          activeMembership?.project?.name ||
          `Project #${primaryProjectId}`,
      }
    : null;
  const [projectId, setProjectId] = useState(
      primaryProjectId ? String(primaryProjectId) : "",
    ),
    [releases, setReleases] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [open, setOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [form, setForm] = useState(empty),
    [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null),
    [progress, setProgress] = useState(null),
    [burndown, setBurndown] = useState(null),
    [releaseTickets, setReleaseTickets] = useState([]),
    [projectTickets, setProjectTickets] = useState([]),
    [selectedTicketIds, setSelectedTicketIds] = useState([]),
    [detailLoading, setDetailLoading] = useState(false),
    [savingTickets, setSavingTickets] = useState(false);
  const load = async (id = projectId) => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      setReleases(await getReleases(id));
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load releases");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const id = getPrimaryProjectId();
    setProjectId(id ? String(id) : "");
  }, [getPrimaryProjectId]);
  useEffect(() => {
    if (projectId) load(projectId);
  }, [projectId]);
  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      version: r.version || "",
      name: r.name || "",
      description: r.description || "",
      releaseNotes: r.releaseNotes || "",
      startDate: r.startDate || "",
      releaseDate: r.releaseDate || "",
      status: r.status || "PLANNED",
    });
    setOpen(true);
  };
  const save = async () => {
    try {
      setSaving(true);
      editing
        ? await updateRelease(projectId, editing.id, form)
        : await createRelease(projectId, form);
      setOpen(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save release");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.version}?`)) return;
    try {
      await deleteRelease(projectId, r.id);
      if (selected?.id === r.id) setSelected(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete release");
    }
  };
  const showDetails = async (r) => {
    setSelected(r);
    try {
      setDetailLoading(true);
      const [p, b, t, all] = await Promise.all([
        getReleaseProgress(projectId, r.id),
        getReleaseBurndown(projectId, r.id),
        getReleaseTickets(projectId, r.id),
        getTicketsByProject(Number(projectId)),
      ]);
      setProgress(p);
      setBurndown(b);
      setReleaseTickets(Array.isArray(t) ? t : []);
      setProjectTickets(Array.isArray(all) ? all : []);
      setSelectedTicketIds((Array.isArray(t) ? t : []).map((x) => x.id));
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load release analytics");
    } finally {
      setDetailLoading(false);
    }
  };
  const changeStatus = async (r, status) => {
    try {
      await updateReleaseStatus(projectId, r.id, status);
      await load();
      if (selected?.id === r.id) showDetails({ ...r, status });
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update status");
    }
  };
  const max = useMemo(
    () =>
      Math.max(
        1,
        ...(burndown?.points || []).map((p) => Number(p.idealRemaining || 0)),
      ),
    [burndown],
  );
  return (
    <Box className="app-page pm-fade-up">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        mb={2}
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Releases / Versions
          </Typography>
          <Typography color="text.secondary">
            Manage versions, release notes, progress and release burndown.
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <FormControl size="small" sx={{ minWidth: 220, display: "none" }}>
            <InputLabel>Project</InputLabel>
            <Select
              value={projectId}
              label="Project"
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!activeProject}
            >
              {activeProject && (
                <MenuItem value={String(activeProject.id)}>
                  {activeProject.name}
                </MenuItem>
              )}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => load()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreate}
            disabled={!projectId}
          >
            Release
          </Button>
        </Stack>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Box textAlign="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {releases.map((r) => (
            <Grid item xs={12} md={6} lg={4} key={r.id}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="start"
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {r.version}
                      </Typography>
                      <Typography fontWeight={600}>{r.name}</Typography>
                    </Box>
                    <Chip label={labels[r.status] || r.status} size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {r.description || "No description"}
                  </Typography>
                  <Box mt={2}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption">
                        Version Progress
                      </Typography>
                      <Typography variant="caption" fontWeight={700}>
                        {r.progressPercent}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={r.progressPercent || 0}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Stack direction="row" justifyContent="space-between" mt={1}>
                    <Typography variant="caption">
                      {r.completedTickets}/{r.totalTickets} tickets
                    </Typography>
                    <Typography variant="caption">
                      Release: {fmt(r.releaseDate)}
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Stack direction="row" gap={1}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => showDetails(r)}
                      startIcon={<RocketLaunch />}
                    >
                      Analytics
                    </Button>
                    <IconButton size="small" onClick={() => openEdit(r)}>
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => remove(r)}
                    >
                      <Delete />
                    </IconButton>
                    <FormControl
                      size="small"
                      sx={{ ml: "auto", minWidth: 130 }}
                    >
                      <Select
                        value={r.status}
                        onChange={(e) => changeStatus(r, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <MenuItem key={s} value={s}>
                            {labels[s]}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {selected && (
        <Dialog open fullWidth maxWidth="md" onClose={() => setSelected(null)}>
          <DialogTitle>
            {selected.version} — {selected.name}
            <IconButton
              onClick={() => setSelected(null)}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {detailLoading ? (
              <Box textAlign="center" py={5}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Version Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {progress?.completedTickets || 0} completed /{" "}
                    {progress?.totalTickets || 0} total tickets ·{" "}
                    {progress?.completedEstimation || 0} completed estimation /{" "}
                    {progress?.totalEstimation || 0}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress?.progressPercent || 0}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography textAlign="right" variant="caption">
                    {progress?.progressPercent || 0}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    Release Tickets
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack
                        spacing={1}
                        maxHeight={240}
                        sx={{ overflowY: "auto" }}
                      >
                        {projectTickets.length ? (
                          projectTickets.map((t) => (
                            <Stack
                              key={t.id}
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <input
                                type="checkbox"
                                checked={selectedTicketIds.includes(t.id)}
                                onChange={(e) =>
                                  setSelectedTicketIds((ids) =>
                                    e.target.checked
                                      ? [...new Set([...ids, t.id])]
                                      : ids.filter((id) => id !== t.id),
                                  )
                                }
                              />
                              <Typography variant="body2" sx={{ flex: 1 }}>
                                {t.code} — {t.name}
                              </Typography>
                              <Chip
                                size="small"
                                label={t.statusName || t.status || "Unknown"}
                              />
                            </Stack>
                          ))
                        ) : (
                          <Typography color="text.secondary">
                            No tickets in this project.
                          </Typography>
                        )}
                      </Stack>
                      <Button
                        sx={{ mt: 2 }}
                        variant="outlined"
                        disabled={savingTickets || !selected}
                        onClick={async () => {
                          try {
                            setSavingTickets(true);
                            const current = releaseTickets.map((t) => t.id);
                            for (const id of selectedTicketIds.filter(
                              (x) => !current.includes(x),
                            ))
                              await assignTicketToRelease(
                                projectId,
                                selected.id,
                                id,
                              );
                            for (const id of current.filter(
                              (x) => !selectedTicketIds.includes(x),
                            ))
                              await removeTicketFromRelease(
                                projectId,
                                selected.id,
                                id,
                              );
                            await showDetails(selected);
                            await load();
                          } catch (e) {
                            setError(
                              e.response?.data?.message ||
                                "Failed to update release tickets",
                            );
                          } finally {
                            setSavingTickets(false);
                          }
                        }}
                      >
                        {savingTickets ? "Saving…" : "Save Ticket Assignment"}
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    Release Notes
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography whiteSpace="pre-wrap">
                        {selected.releaseNotes || "No release notes added."}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    Release Burndown
                  </Typography>
                  {(burndown?.points || []).length ? (
                    <Stack spacing={0.75}>
                      {burndown.points.map((p, i) => (
                        <Box key={p.date}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption">
                              {fmt(p.date)}
                            </Typography>
                            <Typography variant="caption">
                              Actual {p.remaining} · Ideal {p.idealRemaining}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={Math.max(
                              0,
                              Math.min(
                                100,
                                (Number(p.remaining || 0) / max) * 100,
                              ),
                            )}
                            sx={{ height: 6 }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">
                      No burndown data yet.
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mt={1}
                  >
                    Actual remaining is calculated from ticket estimation and
                    completion dates; tickets without historical resolution
                    dates may not reproduce past status changes.
                  </Typography>
                </Box>
              </Stack>
            )}
          </DialogContent>
        </Dialog>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editing ? "Edit Release" : "Create Release"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Version"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              required
              placeholder="v1.0.0"
            />
            <TextField
              label="Release Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Stack direction="row" gap={2}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
              <TextField
                fullWidth
                type="date"
                label="Release Date"
                InputLabelProps={{ shrink: true }}
                value={form.releaseDate}
                onChange={(e) =>
                  setForm({ ...form, releaseDate: e.target.value })
                }
              />
            </Stack>
            <FormControl>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.status}
                label="Status"
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {labels[s]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <TextField
              label="Release Notes"
              multiline
              minRows={6}
              value={form.releaseNotes}
              onChange={(e) =>
                setForm({ ...form, releaseNotes: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? (
              <CircularProgress size={20} />
            ) : (
              `${editing ? "Update" : "Create"} Release`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

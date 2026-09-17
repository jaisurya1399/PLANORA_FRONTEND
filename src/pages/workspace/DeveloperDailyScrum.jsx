import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import {
  createDailyScrum,
  getDailyScrumsByProjectAndRange,
  getDailyScrumsByUser,
  updateDailyScrum,
} from "../../api/dailyScrumApi";
import { getDeveloperDashboard } from "../../api/dashboardApi";
import { useAuth } from "../../context/AuthContext";
import {
  BORDER,
  PRIMARY,
  PRIMARY_SUBTLE,
  RADIUS,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../../theme/colors";

const today = () => new Date().toISOString().slice(0, 10);

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

export default function DailyScrum() {
  const { user, isSystemAdmin, getProjectMembership } = useAuth();
  const userId = user?.userId ?? user?.id;

  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [teamEntries, setTeamEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showTeamView, setShowTeamView] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    projectId: "",
    scrumDate: today(),
    yesterdayWork: "",
    todayWork: "",
    blockers: "",
  });

  const getMembership = (projectId) => {
    if (isSystemAdmin?.()) {
      return { role: "PROJECT_ADMIN", responsibilityRole: null };
    }
    return getProjectMembership?.(projectId) || null;
  };

  const canManageTeam = (projectId) => {
    const membership = getMembership(projectId);
    if (!membership) return false;

    const access = normalizeRole(membership.role);

    return access === "PROJECT_ADMIN" || access === "TEAM_LEAD";
  };

  const canEditTeamEntry = (projectId) => {
    const membership = getMembership(projectId);
    return !!membership && normalizeRole(membership.role) === "PROJECT_ADMIN";
  };

  const manageableProjects = useMemo(
    () => projects.filter((project) => canManageTeam(project.id)),
    [projects],
  );

  const selectedProject = useMemo(
    () =>
      projects.find((project) => Number(project.id) === Number(form.projectId)),
    [projects, form.projectId],
  );

  const load = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError("");
      const [dashboard, scrums] = await Promise.all([
        getDeveloperDashboard(),
        getDailyScrumsByUser(userId),
      ]);

      const nextProjects = Array.isArray(dashboard?.projects)
        ? dashboard.projects
        : [];

      setProjects(nextProjects);
      setEntries(Array.isArray(scrums) ? scrums : []);

      setForm((prev) => {
        if (prev.projectId) return prev;
        const firstProject = nextProjects[0];
        return { ...prev, projectId: firstProject?.id || "" };
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load daily scrums.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const alreadySubmittedToday = useMemo(
    () =>
      entries.some(
        (item) =>
          String(item.scrumDate || "").slice(0, 10) === today() &&
          String(item.projectId) === String(form.projectId),
      ),
    [entries, form.projectId],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "projectId") {
      setShowTeamView(false);
      setTeamEntries([]);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm((prev) => ({
      ...prev,
      scrumDate: today(),
      yesterdayWork: "",
      todayWork: "",
      blockers: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!userId) {
      setError("Your user session is missing.");
      return;
    }
    if (!form.projectId) {
      setError("Please select a project.");
      return;
    }
    if (!form.yesterdayWork.trim() || !form.todayWork.trim()) {
      setError("Yesterday and today updates are required.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        userId: Number(form.targetUserId || userId),
        projectId: Number(form.projectId),
        scrumDate: form.scrumDate || today(),
        yesterdayWork: form.yesterdayWork.trim(),
        todayWork: form.todayWork.trim(),
        blockers: form.blockers.trim(),
      };

      if (editingId) {
        await updateDailyScrum(editingId, payload);
      } else {
        await createDailyScrum(payload);
      }

      resetForm();
      setSuccess(editingId ? "Daily scrum updated." : "Daily scrum submitted.");
      await load();

      if (showTeamView && form.projectId) {
        await loadTeamScrums(form.projectId, false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save daily scrum.");
    } finally {
      setSaving(false);
    }
  };

  const startOwnEdit = (entry) => {
    if (Number(entry.userId) !== Number(userId)) return;

    setEditingId(entry.id);
    setShowTeamView(false);
    setForm({
      projectId: entry.projectId || "",
      scrumDate: String(entry.scrumDate || "").slice(0, 10) || today(),
      yesterdayWork: entry.yesterdayWork || "",
      todayWork: entry.todayWork || "",
      blockers: entry.blockers || "",
      targetUserId: Number(userId),
    });
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startTeamEdit = (entry) => {
    if (!canEditTeamEntry(entry.projectId)) return;

    setEditingId(entry.id);
    setShowTeamView(false);
    setForm({
      projectId: entry.projectId || "",
      scrumDate: String(entry.scrumDate || "").slice(0, 10) || today(),
      yesterdayWork: entry.yesterdayWork || "",
      todayWork: entry.todayWork || "",
      blockers: entry.blockers || "",
      targetUserId: entry.userId,
    });
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadTeamScrums = async (
    projectId = form.projectId,
    openView = true,
  ) => {
    if (!projectId || !canManageTeam(projectId)) return;

    try {
      setTeamLoading(true);
      setError("");
      const end = today();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const start = startDate.toISOString().slice(0, 10);

      const data = await getDailyScrumsByProjectAndRange(
        Number(projectId),
        start,
        end,
      );

      setTeamEntries(Array.isArray(data) ? data : []);
      if (openView) setShowTeamView(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load team scrum history for this project.",
      );
    } finally {
      setTeamLoading(false);
    }
  };

  const myHistory = [...entries].sort((a, b) =>
    String(b.scrumDate || "").localeCompare(String(a.scrumDate || "")),
  );

  const teamHistory = [...teamEntries].sort((a, b) =>
    String(b.scrumDate || "").localeCompare(String(a.scrumDate || "")),
  );

  return (
    <Box className="app-page pm-fade-up">
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 28, fontWeight: 800, color: TEXT_PRIMARY }}>
          Daily Scrum
        </Typography>
        <Typography sx={{ mt: 0.5, color: TEXT_SECONDARY, fontSize: 14 }}>
          Keep your daily progress visible and blockers actionable.
        </Typography>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      ) : null}

      <Card
        elevation={0}
        sx={{
          border: `1px solid ${BORDER}`,
          borderRadius: `${RADIUS.card}px`,
          maxWidth: 900,
        }}
      >
        <CardContent sx={{ p: 3 }} component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: PRIMARY_SUBTLE,
                color: PRIMARY,
              }}
            >
              <GroupsOutlinedIcon />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
                {editingId ? "Update Scrum" : "Today's Update"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: TEXT_SECONDARY }}>
                {editingId
                  ? "Update the selected daily scrum entry."
                  : "Submit your own daily progress, plan, and blockers."}
              </Typography>
            </Box>
            {selectedProject ? (
              <Chip
                size="small"
                label={selectedProject.name}
                variant="outlined"
              />
            ) : null}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                select
                label="Project"
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
                fullWidth
                required
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="What did you work on yesterday?"
                name="yesterdayWork"
                value={form.yesterdayWork}
                onChange={handleChange}
                multiline
                minRows={3}
                fullWidth
                required
              />

              <TextField
                label="What will you work on today?"
                name="todayWork"
                value={form.todayWork}
                onChange={handleChange}
                multiline
                minRows={3}
                fullWidth
                required
              />

              <TextField
                label="Any blockers?"
                name="blockers"
                value={form.blockers}
                onChange={handleChange}
                multiline
                minRows={3}
                fullWidth
                placeholder="Mention any blockers or dependencies..."
              />

              {alreadySubmittedToday && !editingId ? (
                <Alert severity="info">
                  You already submitted an update for this project today. Use
                  the history below to edit your own entry.
                </Alert>
              ) : null}

              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                {editingId ? (
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    disabled={saving}
                    sx={{ textTransform: "none", borderRadius: 1.5, px: 2.5 }}
                  >
                    Cancel
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving || (alreadySubmittedToday && !editingId)}
                  sx={{ textTransform: "none", borderRadius: 1.5, px: 3 }}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Scrum"
                      : "Submit Update"}
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card
        elevation={0}
        sx={{
          mt: 3,
          border: `1px solid ${BORDER}`,
          borderRadius: `${RADIUS.card}px`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
                {showTeamView ? "Team Scrum" : "My Scrum History"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: TEXT_SECONDARY, mt: 0.4 }}>
                {showTeamView
                  ? "Project-level Scrum visibility for authorized leads and project admins."
                  : "Review your previous updates. You can edit your own entries."}
              </Typography>
            </Box>

            {manageableProjects.length > 0 ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  size="small"
                  label="Team project"
                  value={form.projectId}
                  onChange={handleChange}
                  sx={{ minWidth: 190 }}
                >
                  {manageableProjects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant={showTeamView ? "outlined" : "contained"}
                  onClick={
                    showTeamView
                      ? () => setShowTeamView(false)
                      : () => loadTeamScrums(form.projectId)
                  }
                  disabled={teamLoading || !form.projectId}
                  sx={{
                    textTransform: "none",
                    borderRadius: 1.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {teamLoading
                    ? "Loading..."
                    : showTeamView
                      ? "My View"
                      : "Team Scrum"}
                </Button>
              </Stack>
            ) : null}
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          {!showTeamView ? (
            myHistory.length ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell>Yesterday</TableCell>
                      <TableCell>Today</TableCell>
                      <TableCell>Blockers</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myHistory.map((entry) => (
                      <TableRow key={entry.id} hover>
                        <TableCell>
                          {String(entry.scrumDate || "").slice(0, 10)}
                        </TableCell>
                        <TableCell>
                          {entry.projectName ||
                            entry.project?.name ||
                            entry.projectId}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 240 }}>
                          {entry.yesterdayWork}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 240 }}>
                          {entry.todayWork}
                        </TableCell>
                        <TableCell>
                          {entry.blockers ? (
                            <Chip
                              size="small"
                              label="Blocked"
                              color="warning"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="None"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => startOwnEdit(entry)}
                            sx={{ textTransform: "none" }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography sx={{ color: TEXT_SECONDARY, py: 3 }}>
                No daily scrum history found.
              </Typography>
            )
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell>Yesterday</TableCell>
                    <TableCell>Today</TableCell>
                    <TableCell>Blockers</TableCell>
                    {canEditTeamEntry(form.projectId) ? (
                      <TableCell align="right">Action</TableCell>
                    ) : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamHistory.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        {String(entry.scrumDate || "").slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        {entry.userName || entry.user?.name || entry.userId}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        {entry.yesterdayWork}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        {entry.todayWork}
                      </TableCell>
                      <TableCell>
                        {entry.blockers ? (
                          <Chip
                            size="small"
                            label={entry.blockers}
                            color="warning"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="No blockers"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      {canEditTeamEntry(form.projectId) ? (
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => startTeamEdit(entry)}
                            sx={{ textTransform: "none" }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!teamHistory.length ? (
                <Typography sx={{ color: TEXT_SECONDARY, py: 3 }}>
                  No team scrum updates found for the last 30 days.
                </Typography>
              ) : null}
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

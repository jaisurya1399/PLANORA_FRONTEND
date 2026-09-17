import GroupsIcon from "@mui/icons-material/Groups";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";
import { getDailyScrumsByDateRange } from "../../api/dailyScrumApi";
import { getScrumMeetings, saveScrumMeeting } from "../../api/scrumMeetingApi";
import { useAuth } from "../../context/AuthContext";
export default function ScrumDashboard() {
  const { user, getPrimaryProjectId } = useAuth();
  const [projects, setProjects] = useState([]),
    [scrums, setScrums] = useState([]),
    [meetings, setMeetings] = useState([]),
    [projectId, setProjectId] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [form, setForm] = useState({
      meetingTitle: "Daily Scrum",
      meetingUrl: "",
      meetingTime: "10:00",
      active: true,
    });
  const today = new Date().toISOString().slice(0, 10);
  const load = async () => {
    try {
      setLoading(true);
      const activeId = getPrimaryProjectId();
      const memberships = Array.isArray(user?.projectMemberships)
        ? user.projectMemberships
        : [];
      const membership = memberships.find(
        (m) => Number(m?.projectId) === Number(activeId),
      );
      const activeProject =
        activeId && membership
          ? [
              {
                id: Number(activeId),
                name:
                  membership.projectName ||
                  membership.project?.name ||
                  `Project #${activeId}`,
              },
            ]
          : [];
      const [s, m] = await Promise.all([
        getDailyScrumsByDateRange(today, today),
        getScrumMeetings(),
      ]);
      setProjects(activeProject);
      setProjectId(activeId ? String(activeId) : "");
      setScrums(Array.isArray(s) ? s : s?.data || []);
      setMeetings(Array.isArray(m) ? m : m?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load Scrum dashboard");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const selectedMeeting = useMemo(
    () => meetings.find((m) => String(m.projectId) === String(projectId)),
    [meetings, projectId],
  );
  useEffect(() => {
    if (selectedMeeting)
      setForm({
        meetingTitle: selectedMeeting.meetingTitle,
        meetingUrl: selectedMeeting.meetingUrl,
        meetingTime: selectedMeeting.meetingTime,
        active: selectedMeeting.active,
      });
  }, [selectedMeeting]);
  const submitted = new Set(scrums.map((s) => String(s.userId)));
  const save = async () => {
    if (!projectId || !form.meetingUrl.trim()) return;
    await saveScrumMeeting({ ...form, projectId: Number(projectId) });
    await load();
  };
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  return (
    <Box className="app-page pm-fade-up">
      <Typography variant="h4" fontWeight={800}>
        Scrum Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Today’s stand-up status and meeting access.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Updates submitted</Typography>
              <Typography variant="h3" fontWeight={800}>
                {submitted.size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Projects</Typography>
              <Typography variant="h3" fontWeight={800}>
                {projects.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Meeting configured</Typography>
              <Typography variant="h3" fontWeight={800}>
                {meetings.filter((m) => m.active).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <GroupsIcon />
            <Typography variant="h6" fontWeight={700}>
              Meeting Integration
            </Typography>
          </Stack>
          <Stack spacing={2}>
            <TextField
              select
              label="Project"
              sx={{ display: "none" }}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              fullWidth
            >
              <MenuItem value="">Select project</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Meeting title"
              value={form.meetingTitle}
              onChange={(e) =>
                setForm({ ...form, meetingTitle: e.target.value })
              }
            />
            <TextField
              label="Meeting URL"
              placeholder="https://..."
              value={form.meetingUrl}
              onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
            />
            <TextField
              label="Meeting time"
              value={form.meetingTime}
              onChange={(e) =>
                setForm({ ...form, meetingTime: e.target.value })
              }
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={save}
                disabled={!projectId || !form.meetingUrl}
              >
                Save meeting
              </Button>
              {selectedMeeting?.active && (
                <Button
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  href={selectedMeeting.meetingUrl}
                  target="_blank"
                >
                  Join meeting
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

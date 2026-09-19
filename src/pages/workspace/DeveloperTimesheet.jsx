import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { getDeveloperDashboard } from "../../api/dashboardApi";
import { createTimeSheet, getTimeSheetsByUser } from "../../api/timeSheetApi";
import { createTimeSheetCell } from "../../api/timeSheetCellApi";
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

export default function Timesheet() {
  const { user } = useAuth();
  const userId = user?.userId ?? user?.id;

  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    date: today(),
    hours: "",
    projectId: "",
    task: "",
    description: "",
  });

  const load = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError("");
      const [dashboard, sheets] = await Promise.all([
        getDeveloperDashboard(),
        getTimeSheetsByUser(userId),
      ]);
      setProjects(Array.isArray(dashboard?.projects) ? dashboard.projects : []);
      setEntries(Array.isArray(sheets) ? sheets : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load timesheets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!userId) {
      setError("Your user session is missing.");
      return;
    }
    if (!form.projectId || !form.task.trim() || !form.hours) {
      setError("Project, task, and hours are required.");
      return;
    }

    try {
      setSaving(true);
      const sheet = await createTimeSheet({
        userId: Number(userId),
        projectId: Number(form.projectId),
        task: form.task.trim(),
      });

      await createTimeSheetCell({
        timeSheetId: sheet.id,
        value: Number(form.hours),
        comment: form.description.trim(),
        date: form.date,
        isTrip: false,
      });

      setForm({
        date: today(),
        hours: "",
        projectId: form.projectId,
        task: "",
        description: "",
      });
      setSuccess("Timesheet saved.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save timesheet.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="app-page pm-fade-up">
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 28, fontWeight: 800, color: TEXT_PRIMARY }}>
          Timesheet
        </Typography>
        <Typography sx={{ mt: 0.5, color: TEXT_SECONDARY, fontSize: 14 }}>
          Track the time you spend working on projects and tickets.
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
              <AccessTimeOutlinedIcon />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
                Log Time
              </Typography>
              <Typography sx={{ fontSize: 12, color: TEXT_SECONDARY }}>
                Add your working hours.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
                <TextField
                  label="Hours"
                  name="hours"
                  type="number"
                  value={form.hours}
                  onChange={handleChange}
                  placeholder="e.g. 8"
                  fullWidth
                  required
                  inputProps={{ min: 0.01, step: 0.25 }}
                />
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
                  label="Task"
                  name="task"
                  value={form.task}
                  onChange={handleChange}
                  placeholder="What did you work on?"
                  fullWidth
                  required
                />
                <TextField
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  multiline
                  minRows={3}
                  fullWidth
                  sx={{ gridColumn: { md: "1 / -1" } }}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  sx={{ textTransform: "none", borderRadius: 1.5, px: 3 }}
                >
                  {saving ? "Saving..." : "Save Timesheet"}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {entries.length > 0 ? (
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${BORDER}`,
            borderRadius: `${RADIUS.card}px`,
            maxWidth: 900,
            mt: 3,
          }}
        >
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>
              Recent entries
            </Typography>
            <Stack spacing={1}>
              {entries.slice(0, 8).map((item) => (
                <Typography
                  key={item.id}
                  variant="body2"
                  color="text.secondary"
                >
                  {item.task} {item.projectName ? `· ${item.projectName}` : ""}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}

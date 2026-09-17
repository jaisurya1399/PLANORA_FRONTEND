import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { getProjects } from "../../api/projectApi";
import { createTimeSheet, getTimeSheets } from "../../api/timeSheetApi";
import { getUsers } from "../../api/userApi";

export default function Timesheet() {
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    userId: "",
    projectId: "",
    task: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [sheets, projectList, userList] = await Promise.all([
        getTimeSheets(),
        getProjects(),
        getUsers(),
      ]);
      setEntries(Array.isArray(sheets) ? sheets : []);
      setProjects(Array.isArray(projectList) ? projectList : []);
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load timesheets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!form.userId || !form.task.trim()) {
      setError("User and task are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await createTimeSheet({
        userId: Number(form.userId),
        projectId: form.projectId ? Number(form.projectId) : null,
        task: form.task.trim(),
      });
      setOpen(false);
      setForm({ userId: "", projectId: "", task: "" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create timesheet.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="app-page pm-fade-up">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Timesheet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage timesheet entries
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Entry
        </Button>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Timesheet Entries
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : entries.length === 0 ? (
            <Typography color="text.secondary">
              No timesheet entries yet.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {entries.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <Typography fontWeight={600}>{item.task}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.userName || `User #${item.userId}`}
                    {item.projectName ? ` · ${item.projectName}` : ""}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add timesheet</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="User"
              value={form.userId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, userId: event.target.value }))
              }
              fullWidth
            >
              {users.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} ({item.email})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Project"
              value={form.projectId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, projectId: event.target.value }))
              }
              fullWidth
            >
              {projects.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Task"
              value={form.task}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, task: event.target.value }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

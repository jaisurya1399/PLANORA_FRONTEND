import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProjectWorkingHours,
  saveProjectWorkingHours,
} from "../../api/memberAvailabilityApi";
import { getProjectSettings, updateProject } from "../../api/projectApi";
import { getActiveProjectStatuses } from "../../api/projectStatusApi";
import { useAuth } from "../../context/AuthContext";

export default function ProjectSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSystemAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [hours, setHours] = useState("8");
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [form, setForm] = useState({
    name: "",
    description: "",
    ownerId: "",
    statusId: "",
    ticketPrefix: "",
    statusType: "default",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      getProjectSettings(id),
      getProjectWorkingHours(id),
      isSystemAdmin() ? getActiveProjectStatuses() : Promise.resolve([]),
    ])
      .then(([p, wh, st]) => {
        setProject(p);
        setStatuses(st || []);
        setForm({
          name: p.name || "",
          description: p.description || "",
          ownerId: p.ownerId || "",
          statusId: p.statusId || "",
          ticketPrefix: p.ticketPrefix || "",
          statusType: p.statusType || "default",
        });
        const today = wh?.find?.((x) => x.effectiveFrom === effectiveFrom);
        setHours(
          String(today?.workingHours ?? wh?.at?.(-1)?.workingHours ?? 8),
        );
      })
      .catch((err) =>
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load project settings.",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const saveProject = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateProject(id, {
        ...form,
        ownerId: Number(form.ownerId),
        statusId: Number(form.statusId),
      });
      setProject(updated);
      setSuccess("Project settings updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update project settings.",
      );
    } finally {
      setSaving(false);
    }
  };
  const saveHours = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await saveProjectWorkingHours(id, {
        effectiveFrom,
        workingHours: Number(hours),
      });
      setSuccess("Working hours updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update working hours.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  return (
    <Box className="app-page pm-fade-up">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      <Typography variant="h4" fontWeight={800}>
        {project?.name} — Settings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Project-level configuration. Only the system ADMIN or this project's
        PROJECT_ADMIN should be able to change these settings.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                General Settings
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label="Owner"
                  value={project?.ownerName || ""}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Project Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  multiline
                  minRows={4}
                  fullWidth
                />
                <TextField
                  label="Ticket Prefix"
                  value={form.ticketPrefix}
                  onChange={(e) =>
                    setForm({ ...form, ticketPrefix: e.target.value })
                  }
                  fullWidth
                />
                {isSystemAdmin() ? (
                  <TextField
                    select
                    label="Status"
                    value={form.statusId}
                    onChange={(e) =>
                      setForm({ ...form, statusId: e.target.value })
                    }
                    fullWidth
                    SelectProps={{ native: true }}
                  >
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    label="Status"
                    value={project?.statusName || ""}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                )}
                <TextField
                  label="Status Type"
                  value={form.statusType}
                  onChange={(e) =>
                    setForm({ ...form, statusType: e.target.value })
                  }
                  fullWidth
                />
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveProject}
                  disabled={saving}
                >
                  Save General Settings
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                Working Hours
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Used by sprint capacity and member availability calculations.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <TextField
                  label="Effective From"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Hours / Day"
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  inputProps={{ min: 0, max: 24, step: 0.25 }}
                />
                <Button
                  variant="outlined"
                  onClick={saveHours}
                  disabled={saving}
                >
                  Save Working Hours
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

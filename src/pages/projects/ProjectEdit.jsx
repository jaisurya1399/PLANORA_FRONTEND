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
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getWorkspaceBase } from "../../utils/navigation";

// Adjust these API imports if your project uses different filenames.
import { getProjectById, updateProject } from "../../api/projectApi";

export default function ProjectEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const shellBase = getWorkspaceBase(location.pathname);
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    status: "",
    projectType: "",
  });

  useEffect(() => {
    let mounted = true;

    const loadProject = async () => {
      if (!id) {
        setError("Project ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getProjectById(id);
        const project = response?.data ?? response;

        if (!mounted) return;

        setForm({
          name: project?.name ?? "",
          key: project?.key ?? "",
          description: project?.description ?? "",
          status: project?.status ?? "",
          projectType: project?.projectType ?? "",
        });
      } catch (err) {
        if (!mounted) return;

        console.error("Failed to load project:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load project.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProject();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (!form.key.trim()) {
      setError("Project key is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updateProject(id, {
        ...form,
        name: form.name.trim(),
        key: form.key.trim().toUpperCase(),
        description: form.description.trim(),
      });

      setSuccess("Project updated successfully.");

      setTimeout(() => {
        navigate(`${shellBase}/projects/${id}`);
      }, 700);
    } catch (err) {
      console.error("Failed to update project:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update project.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading project...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box className="app-page pm-fade-up">
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Edit Project
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Update the project information and configuration.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`${shellBase}/projects/${id}`)}
          >
            Back to Project
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && <Alert severity="success">{success}</Alert>}

        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" fontWeight={650}>
                    Project Details
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Basic information used throughout the workspace.
                  </Typography>
                </Box>

                <Divider />

                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      required
                      label="Project Name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter project name"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      required
                      label="Project Key"
                      name="key"
                      value={form.key}
                      onChange={handleChange}
                      inputProps={{
                        style: {
                          textTransform: "uppercase",
                        },
                      }}
                      helperText="Short unique project identifier"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Project Type"
                      name="projectType"
                      value={form.projectType}
                      onChange={handleChange}
                      placeholder="Software, Business, Service..."
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Status"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      placeholder="Active, Planned, Archived..."
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={5}
                      label="Description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe the purpose and scope of this project..."
                    />
                  </Grid>
                </Grid>

                <Divider />

                <Stack
                  direction={{ xs: "column-reverse", sm: "row" }}
                  justifyContent="flex-end"
                  spacing={1.5}
                >
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`${shellBase}/projects/${id}`)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      saving ? <CircularProgress size={18} /> : <SaveIcon />
                    }
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

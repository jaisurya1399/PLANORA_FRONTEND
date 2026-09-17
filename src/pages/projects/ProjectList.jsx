import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import ProjectTable from "../../components/projects/ProjectTable";

import { useLocation, useNavigate } from "react-router-dom";
import { getWorkspaceBase } from "../../utils/navigation";

import {
  deleteProject,
  getProjects,
  restoreProject,
} from "../../api/projectApi";

export default function ProjectList() {
  const navigate = useNavigate();
  const location = useLocation();
  const shellBase = getWorkspaceBase(location.pathname);

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getProjects();

      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (project) => {
    const confirmed = window.confirm(`Delete project "${project.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject(project.id);

      await loadProjects();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete project.");
    }
  };

  const handleRestore = async (project) => {
    try {
      await restoreProject(project.id);

      await loadProjects();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to restore project.");
    }
  };

  return (
    <Box className="app-page pm-fade-up">
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          sm: "center",
        }}
        spacing={2}
        sx={{
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Projects
          </Typography>

          <Typography color="text.secondary">Manage all projects</Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadProjects}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`${shellBase}/projects/create`)}
          >
            New Project
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
          }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 8,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <ProjectTable
          projects={projects}
          onView={(project) => navigate(`${shellBase}/projects/${project.id}`)}
          onEdit={(project) =>
            navigate(`${shellBase}/projects/${project.id}/edit`)
          }
          onDelete={handleDelete}
          onRestore={handleRestore}
        />
      )}
    </Box>
  );
}

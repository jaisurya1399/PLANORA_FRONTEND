import { Box, Breadcrumbs, Typography } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ProjectForm from "../../components/projects/ProjectForm";
import { getWorkspaceBase } from "../../utils/navigation";

import { createProject } from "../../api/projectApi";

export default function ProjectCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const shellBase = getWorkspaceBase(location.pathname);

  const handleSubmit = async (data) => {
    const project = await createProject(data);
    navigate(`${shellBase}/projects/${project.id}`);
  };

  return (
    <Box className="app-page pm-fade-up">
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          onClick={() => navigate(`${shellBase}/projects`)}
        >
          Projects
        </Link>

        <Typography>Create</Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={800} sx={{ mb: 3 }}>
        Create Project
      </Typography>

      <ProjectForm onSubmit={handleSubmit} />
    </Box>
  );
}

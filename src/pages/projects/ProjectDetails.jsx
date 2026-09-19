import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";
import ProjectUserDialog from "../../components/projects/ProjectUserDialog";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import { getCurrentProjectAccess, getProjectById } from "../../api/projectApi";
import { useAuth } from "../../context/AuthContext";

import {
  createProjectUser,
  deleteProjectUser,
  getProjectUsers,
  updateProjectUser,
} from "../../api/projectUserApi";

export default function ProjectDetails() {
  const { id } = useParams();

  const navigate = useNavigate();
  const location = useLocation();
  const shellBase = location.pathname.startsWith("/admin")
    ? "/admin"
    : location.pathname.startsWith("/member/projectadmin")
      ? "/member/projectadmin"
      : location.pathname.startsWith("/member/teamlead")
        ? "/member/teamlead"
        : location.pathname.startsWith("/member/viewer")
          ? "/member/viewer"
          : "/member/developer";

  const { isSystemAdmin, isProjectAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [access, setAccess] = useState(null);

  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [memberDialog, setMemberDialog] = useState({
    open: false,
    assignment: null,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [projectData, memberData, accessData] = await Promise.all([
        getProjectById(id),
        getProjectUsers(id),
        getCurrentProjectAccess(id),
      ]);

      setProject(projectData);

      setMembers(Array.isArray(memberData) ? memberData : []);
      setAccess(accessData || null);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load project.");
    } finally {
      setLoading(false);
    }
  };

  const saveMember = async (data) => {
    try {
      if (memberDialog.assignment) {
        await updateProjectUser(memberDialog.assignment.id, data);
      } else {
        await createProjectUser(data);
      }

      setMemberDialog({
        open: false,
        assignment: null,
      });

      await loadData();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to save project member.",
      );
    }
  };

  const removeMember = async (member) => {
    const confirmed = await requestConfirm(
      `Remove ${member.userName} from this project?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProjectUser(member.id);

      await loadData();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to remove project member.",
      );
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return <Alert severity="error">{error || "Project not found."}</Alert>;
  }

  return (
    <Box className="app-page pm-fade-up">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`${shellBase}/projects`)}
        sx={{ mb: 2 }}
      >
        Back to Projects
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          sm: "center",
        }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {project.name}
          </Typography>

          <Typography color="text.secondary">Project #{project.id}</Typography>
          <Chip
            size="small"
            sx={{ mt: 1 }}
            label={`Role: ${access?.role ? access.role.replaceAll("_", " ") : "—"}`}
          />
        </Box>

        {isProjectAdmin(id) ? (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`${shellBase}/projects/${id}/edit`)}
          >
            Edit Project
          </Button>
        ) : null}
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Project Information
              </Typography>

              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {project.description || "No description available."}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <InfoRow label="Owner" value={project.ownerName || "—"} />

                <InfoRow
                  label="Owner Email"
                  value={project.ownerEmail || "—"}
                />

                <InfoRow
                  label="Ticket Prefix"
                  value={project.ticketPrefix || "—"}
                />

                <InfoRow
                  label="Status Type"
                  value={project.statusType || "—"}
                />

                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography
                    sx={{
                      width: 130,
                      fontWeight: 600,
                    }}
                  >
                    Status
                  </Typography>

                  <Chip
                    label={project.statusName || "—"}
                    sx={{
                      backgroundColor: project.statusColor || undefined,
                    }}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                Project Summary
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Members
              </Typography>

              <Typography variant="h3" fontWeight={800}>
                {members.length}
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Created
              </Typography>

              <Typography>
                {project.createdAt
                  ? new Date(project.createdAt).toLocaleString()
                  : "—"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
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
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Project Members
              </Typography>

              <Typography color="text.secondary">
                Users assigned to this project
              </Typography>
            </Box>

            {isProjectAdmin(id) ? (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() =>
                  setMemberDialog({
                    open: true,
                    assignment: null,
                  })
                }
              >
                Add Project Member
              </Button>
            ) : null}
          </Stack>

          <Box
            sx={{
              mt: 3,
              overflow: "auto",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>

                  <TableCell>Email</TableCell>

                  <TableCell>Role</TableCell>

                  <TableCell>Assigned</TableCell>

                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>{member.userName || "—"}</TableCell>

                    <TableCell>{member.userEmail || "—"}</TableCell>

                    <TableCell>
                      <Chip size="small" label={member.role || "—"} />
                    </TableCell>

                    <TableCell>
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString()
                        : "—"}
                    </TableCell>

                    <TableCell align="right">
                      {isProjectAdmin(id) && (
                        <>
                          <IconButton
                            onClick={() =>
                              setMemberDialog({
                                open: true,
                                assignment: member,
                              })
                            }
                            aria-label="Edit"
                          >
                            <EditIcon />
                          </IconButton>

                          <IconButton
                            color="error"
                            onClick={() => removeMember(member)}
                            aria-label="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No users assigned to this project.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <ProjectUserDialog
        open={memberDialog.open}
        projectId={id}
        assignment={memberDialog.assignment}
        allowProjectAdmin={isProjectAdmin(id) || isSystemAdmin()}
        onClose={() =>
          setMemberDialog({
            open: false,
            assignment: null,
          })
        }
        onSave={saveMember}
      />
    </Box>
  );
}

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" spacing={2}>
      <Typography
        sx={{
          width: 130,
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography>{value}</Typography>
    </Stack>
  );
}

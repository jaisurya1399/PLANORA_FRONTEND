import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
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
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProjects } from "../../api/projectApi";
import {
  createProjectFromTemplate,
  createProjectTemplate,
  deleteProjectTemplate,
  getProjectTemplates,
} from "../../api/projectTemplateApi";

export default function ProjectTemplates() {
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceBase = location.pathname.startsWith("/member/projectadmin")
    ? "/member/projectadmin"
    : "/admin";
  const [templates, setTemplates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    sourceProjectId: "",
  });
  const [createForm, setCreateForm] = useState({ name: "", ticketPrefix: "" });
  const [busy, setBusy] = useState(false);
  const load = () =>
    Promise.all([getProjectTemplates(), getProjects()])
      .then(([t, p]) => {
        setTemplates(t || []);
        setProjects(p || []);
      })
      .catch((e) =>
        setError(
          e.response?.data?.message || e.message || "Failed to load templates.",
        ),
      )
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const saveTemplate = async () => {
    setBusy(true);
    try {
      await createProjectTemplate({
        ...form,
        sourceProjectId: Number(form.sourceProjectId),
      });
      setDialog(false);
      setForm({ name: "", description: "", sourceProjectId: "" });
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to create template.",
      );
    } finally {
      setBusy(false);
    }
  };
  const createProject = async () => {
    setBusy(true);
    try {
      await createProjectFromTemplate(createDialog.id, { ...createForm });
      setCreateDialog(null);
      setCreateForm({ name: "", ticketPrefix: "" });
      navigate(`${workspaceBase}/projects`);
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to create project.",
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id) => {
    if (!(await requestConfirm("Delete this project template?"))) return;
    try {
      await deleteProjectTemplate(id);
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to delete template.",
      );
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
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Project Templates
          </Typography>
          <Typography color="text.secondary">
            Create reusable project configurations. Templates do not copy
            tickets, comments, attachments, or audit history.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog(true)}
        >
          Save Project as Template
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      <Stack spacing={2}>
        {templates.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                No project templates available.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          templates.map((t) => (
            <Card key={t.id}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {t.name}
                    </Typography>
                    <Typography color="text.secondary" sx={{ my: 1 }}>
                      {t.description || "No description"}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip size="small" label={`Prefix: ${t.ticketPrefix}`} />
                      <Chip
                        size="small"
                        label={`Status: ${t.statusName || "—"}`}
                      />
                      <Chip
                        size="small"
                        label={`Created by: ${t.createdByName || "—"}`}
                      />
                    </Stack>
                  </Box>
                  <Stack direction="row">
                    <IconButton
                      onClick={() => {
                        setCreateDialog(t);
                        setCreateForm({
                          name: `${t.name} Project`,
                          ticketPrefix: `${t.ticketPrefix}_COPY`,
                        });
                      }}
                      title="Create project"
                    >
                      <ContentCopyIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => remove(t.id)}
                      title="Delete template"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
      <Dialog
        open={dialog}
        onClose={() => !busy && setDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Save Project as Template</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Template Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <TextField
              select
              label="Source Project"
              value={form.sourceProjectId}
              onChange={(e) =>
                setForm({ ...form, sourceProjectId: e.target.value })
              }
              SelectProps={{ native: true }}
              required
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </TextField>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveTemplate}
            disabled={busy || !form.name || !form.sourceProjectId}
          >
            Create Template
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!createDialog}
        onClose={() => !busy && setCreateDialog(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create Project from Template</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Project Name"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
            />
            <TextField
              label="Ticket Prefix"
              value={createForm.ticketPrefix}
              onChange={(e) =>
                setCreateForm({ ...createForm, ticketPrefix: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createProject}
            disabled={busy || !createForm.name || !createForm.ticketPrefix}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

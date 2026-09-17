import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import { getActiveProjects } from "../../api/projectApi";
import { getTicketStatuses } from "../../api/ticketStatusApi";
import { getTicketTypes } from "../../api/ticketTypeApi";
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflows,
} from "../../api/workflowApi";
export default function WorkflowConfiguration() {
  const [rows, setRows] = useState([]),
    [projects, setProjects] = useState([]),
    [statuses, setStatuses] = useState([]),
    [types, setTypes] = useState([]),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState({
    projectId: "",
    ticketTypeId: "",
    fromStatusId: "",
    toStatusId: "",
    requiredPermission: "ticket.update",
    conditionJson: "",
    validatorJson: "",
    postFunctionJson: "",
  });
  const load = async () => {
    try {
      setRows(await getWorkflows());
      setProjects(await getActiveProjects());
      setStatuses(await getTicketStatuses());
      setTypes(await getTicketTypes());
    } catch (e) {
      setError(
        e.response?.data?.message || "Unable to load workflow configuration",
      );
    }
  };
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    try {
      await createWorkflow({
        ...form,
        projectId: form.projectId ? Number(form.projectId) : null,
        ticketTypeId: form.ticketTypeId ? Number(form.ticketTypeId) : null,
        fromStatusId: Number(form.fromStatusId),
        toStatusId: Number(form.toStatusId),
      });
      setOpen(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to save workflow");
    }
  };
  return (
    <Box className="app-page pm-fade-up">
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Workflow Configuration</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Transition Rule
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack spacing={1}>
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography fontWeight={700}>
                    {r.fromStatusName} → {r.toStatusName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {r.projectName || "Global"} ·{" "}
                    {r.ticketTypeName || "All issue types"} ·{" "}
                    {r.requiredPermission}
                  </Typography>
                </Box>
                <Button
                  color="error"
                  onClick={async () => {
                    await deleteWorkflow(r.id);
                    load();
                  }}
                >
                  Delete
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Workflow Rule</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label="Project"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Issue Type"
              value={form.ticketTypeId}
              onChange={(e) =>
                setForm({ ...form, ticketTypeId: e.target.value })
              }
            >
              {types.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="From Status"
              value={form.fromStatusId}
              onChange={(e) =>
                setForm({ ...form, fromStatusId: e.target.value })
              }
            >
              {statuses.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="To Status"
              value={form.toStatusId}
              onChange={(e) => setForm({ ...form, toStatusId: e.target.value })}
            >
              {statuses.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Required permission"
              value={form.requiredPermission}
              onChange={(e) =>
                setForm({ ...form, requiredPermission: e.target.value })
              }
            />
            <TextField
              label='Conditions JSON e.g. {"requireAssignee":true}'
              value={form.conditionJson}
              onChange={(e) =>
                setForm({ ...form, conditionJson: e.target.value })
              }
            />
            <TextField
              label='Validators JSON e.g. {"requireDescription":true}'
              value={form.validatorJson}
              onChange={(e) =>
                setForm({ ...form, validatorJson: e.target.value })
              }
            />
            <TextField
              label="Post-functions JSON"
              value={form.postFunctionJson}
              onChange={(e) =>
                setForm({ ...form, postFunctionJson: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

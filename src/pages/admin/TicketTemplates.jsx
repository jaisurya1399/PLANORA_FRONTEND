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
import { getTicketPriorities } from "../../api/ticketPriorityApi";
import { getTicketStatuses } from "../../api/ticketStatusApi";
import {
  applyTicketTemplate,
  createTicketTemplate,
  deleteTicketTemplate,
  getTicketTemplates,
} from "../../api/ticketTemplateApi";
import { getTicketTypes } from "../../api/ticketTypeApi";
import { useAuth } from "../../context/AuthContext";
export default function TicketTemplates() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]),
    [projects, setProjects] = useState([]),
    [types, setTypes] = useState([]),
    [statuses, setStatuses] = useState([]),
    [priorities, setPriorities] = useState([]),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const [f, setF] = useState({
    projectId: "",
    ticketTypeId: "",
    statusId: "",
    priorityId: "",
    name: "",
    content: "",
    estimation: 0,
    customFieldsJson: "",
  });
  const load = async () => {
    try {
      const [a, b, c, d, e] = await Promise.all([
        getTicketTemplates(),
        getActiveProjects(),
        getTicketTypes(),
        getTicketStatuses(),
        getTicketPriorities(),
      ]);
      setRows(a);
      setProjects(b);
      setTypes(c);
      setStatuses(d);
      setPriorities(e);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load templates");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    try {
      await createTicketTemplate({
        ...f,
        projectId: Number(f.projectId),
        ticketTypeId: Number(f.ticketTypeId),
        statusId: Number(f.statusId),
        priorityId: Number(f.priorityId),
        estimation: Number(f.estimation),
      });
      setOpen(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to create template");
    }
  };
  return (
    <Box className="app-page pm-fade-up">
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Issue Templates</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          New Template
        </Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack spacing={1}>
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography fontWeight={700}>{r.name}</Typography>
                  <Typography variant="body2">
                    {r.projectName} · {r.ticketTypeName} · {r.priorityName}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    onClick={async () => {
                      try {
                        await applyTicketTemplate(r.id, {
                          ownerId: Number(user?.id || user?.userId),
                        });
                      } catch (e) {
                        setError(
                          e.response?.data?.message ||
                            "Unable to create from template",
                        );
                      }
                    }}
                  >
                    Use
                  </Button>
                  <Button
                    color="error"
                    onClick={async () => {
                      await deleteTicketTemplate(r.id);
                      load();
                    }}
                  >
                    Disable
                  </Button>
                </Stack>
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
        <DialogTitle>Create Issue Template</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label="Project"
              value={f.projectId}
              onChange={(e) => setF({ ...f, projectId: e.target.value })}
            >
              {projects.map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Issue Type"
              value={f.ticketTypeId}
              onChange={(e) => setF({ ...f, ticketTypeId: e.target.value })}
            >
              {types.map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              value={f.statusId}
              onChange={(e) => setF({ ...f, statusId: e.target.value })}
            >
              {statuses.map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Priority"
              value={f.priorityId}
              onChange={(e) => setF({ ...f, priorityId: e.target.value })}
            >
              {priorities.map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Name template"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
            <TextField
              multiline
              minRows={4}
              label="Content template"
              value={f.content}
              onChange={(e) => setF({ ...f, content: e.target.value })}
            />
            <TextField
              type="number"
              label="Estimation"
              value={f.estimation}
              onChange={(e) => setF({ ...f, estimation: e.target.value })}
            />
            <TextField
              multiline
              label="Default custom fields JSON"
              value={f.customFieldsJson}
              onChange={(e) => setF({ ...f, customFieldsJson: e.target.value })}
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

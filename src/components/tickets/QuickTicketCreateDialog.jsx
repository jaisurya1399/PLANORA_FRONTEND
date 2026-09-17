import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";

import { useEffect, useState } from "react";
import { createTicket } from "../../api/ticketApi";
import { getActiveTicketPriorities } from "../../api/ticketPriorityApi";
import { getActiveTicketStatuses } from "../../api/ticketStatusApi";
import { getActiveTicketTypes } from "../../api/ticketTypeApi";
export default function QuickTicketCreateDialog({
  open,
  onClose,
  projectId,
  ownerId,
  onCreated,
}) {
  const [t, setT] = useState([]),
    [s, setS] = useState([]),
    [p, setP] = useState([]),
    [f, setF] = useState({
      name: "",
      content: "",
      typeId: "",
      statusId: "",
      priorityId: "",
      estimation: 0,
    });
  useEffect(() => {
    if (open)
      Promise.all([
        getActiveTicketTypes(),
        getActiveTicketStatuses(),
        getActiveTicketPriorities(),
      ]).then(([a, b, c]) => {
        setT(a);
        setS(b);
        setP(c);
        setF((x) => ({
          ...x,
          typeId: x.typeId || a[0]?.id || "",
          statusId: x.statusId || b[0]?.id || "",
          priorityId: x.priorityId || c[0]?.id || "",
        }));
      });
  }, [open]);
  const save = async () => {
    const r = await createTicket({
      name: f.name,
      content: f.content || f.name,
      ownerId: Number(ownerId),
      projectId: Number(projectId),
      typeId: Number(f.typeId),
      statusId: Number(f.statusId),
      priorityId: Number(f.priorityId),
      estimation: Number(f.estimation || 0),
    });
    onCreated?.(r);
    onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Quick Create Issue</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            required
            label="Title"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
          <TextField
            multiline
            minRows={3}
            label="Description"
            value={f.content}
            onChange={(e) => setF({ ...f, content: e.target.value })}
          />
          <TextField
            select
            label="Issue Type"
            value={f.typeId}
            onChange={(e) => setF({ ...f, typeId: e.target.value })}
          >
            {t.map((x) => (
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
            {s.map((x) => (
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
            {p.map((x) => (
              <MenuItem key={x.id} value={x.id}>
                {x.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            label="Estimation"
            value={f.estimation}
            onChange={(e) => setF({ ...f, estimation: e.target.value })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!f.name.trim() || !f.typeId || !f.statusId || !f.priorityId}
          onClick={save}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

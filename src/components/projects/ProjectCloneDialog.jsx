import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
} from "@mui/material";

import { useEffect, useState } from "react";
import { cloneProject } from "../../api/projectApi";

export default function ProjectCloneDialog({
  open,
  project,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState({
    name: "",
    ticketPrefix: "",
    copyMembers: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open && project)
      setForm({
        name: `${project.name} Copy`,
        ticketPrefix: `${project.ticketPrefix}_COPY`,
        copyMembers: false,
      });
  }, [open, project]);
  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const result = await cloneProject(project.id, form);
      onSuccess?.(result);
      onClose?.();
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to clone project.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Clone Project</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="New Project Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <TextField
            label="New Ticket Prefix"
            value={form.ticketPrefix}
            onChange={(e) => setForm({ ...form, ticketPrefix: e.target.value })}
            required
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.copyMembers}
                onChange={(e) =>
                  setForm({ ...form, copyMembers: e.target.checked })
                }
              />
            }
            label="Copy project members and their project responsibilities"
          />
          <small>{error}</small>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={saving || !form.name.trim() || !form.ticketPrefix.trim()}
        >
          Clone
        </Button>
      </DialogActions>
    </Dialog>
  );
}

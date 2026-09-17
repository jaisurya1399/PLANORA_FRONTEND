import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

import { useEffect, useState } from "react";
import { createProjectTemplate } from "../../api/projectTemplateApi";

export default function ProjectTemplateDialog({
  open,
  project,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open && project)
      setForm({
        name: `${project.name} Template`,
        description: project.description || "",
      });
  }, [open, project]);
  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await createProjectTemplate({
        name: form.name,
        description: form.description,
        sourceProjectId: Number(project.id),
      });
      onSuccess?.();
      onClose?.();
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          "Failed to create project template.",
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
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            multiline
            minRows={3}
          />
          {error && <div style={{ color: "#d32f2f" }}>{error}</div>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={saving || !form.name.trim()}
        >
          Save Template
        </Button>
      </DialogActions>
    </Dialog>
  );
}

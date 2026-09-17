import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

export default function ProjectStatusDialog({ open, status, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    color: "",
    isDefault: false,
  });

  useEffect(() => {
    if (status) {
      setForm({
        name: status.name || "",
        color: status.color || "",
        isDefault: status.isDefault || false,
      });
    } else {
      setForm({
        name: "",
        color: "",
        isDefault: false,
      });
    }
  }, [status, open]);

  const submit = async () => {
    await onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {status ? "Edit Project Status" : "Create Project Status"}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            required
            fullWidth
          />

          <TextField
            label="Color"
            value={form.color}
            onChange={(e) =>
              setForm({
                ...form,
                color: e.target.value,
              })
            }
            fullWidth
            placeholder="#4F46E5"
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.isDefault}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isDefault: e.target.checked,
                  })
                }
              />
            }
            label="Default status"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          onClick={submit}
          disabled={!form.name.trim()}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

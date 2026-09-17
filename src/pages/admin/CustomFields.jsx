import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";
import {
  createCustomField,
  deleteCustomField,
  getCustomFields,
  updateCustomField,
} from "../../api/customFieldApi";
const TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DATE",
  "DATETIME",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
  "URL",
];
const empty = {
  key: "",
  name: "",
  type: "TEXT",
  description: "",
  optionsJson: "",
  requiredByDefault: false,
  active: true,
};
export default function CustomFields() {
  const [rows, setRows] = useState([]),
    [form, setForm] = useState(empty),
    [editing, setEditing] = useState(null),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const load = async () => {
    try {
      setRows(await getCustomFields());
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load custom fields");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    try {
      setError("");
      if (editing) await updateCustomField(editing, form);
      else await createCustomField(form);
      setOpen(false);
      setEditing(null);
      setForm(empty);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to save custom field");
    }
  };
  const edit = (r) => {
    setEditing(r.id);
    setForm({ ...r });
    setOpen(true);
  };
  return (
    <Box className="app-page pm-fade-up">
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h5">Custom Fields</Typography>
          <Typography color="text.secondary">
            Define reusable fields for project issue types.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditing(null);
            setForm(empty);
            setOpen(true);
          }}
        >
          Create Field
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Key</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Required</TableCell>
            <TableCell>Status</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>
                <Chip label={r.key} />
              </TableCell>
              <TableCell>{r.type}</TableCell>
              <TableCell>{r.requiredByDefault ? "Yes" : "No"}</TableCell>
              <TableCell>{r.active ? "Active" : "Inactive"}</TableCell>
              <TableCell>
                <Button
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => edit(r)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<Delete />}
                  onClick={async () => {
                    await deleteCustomField(r.id);
                    load();
                  }}
                >
                  Disable
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editing ? "Edit" : "Create"} Custom Field</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Key"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              helperText="Stable key used in ticket customFields"
            />
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <FormControl>
              <InputLabel>Type</InputLabel>
              <Select
                value={form.type}
                label="Type"
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            {["SELECT", "MULTI_SELECT"].includes(form.type) && (
              <TextField
                label="Options JSON"
                value={form.optionsJson || ""}
                onChange={(e) =>
                  setForm({ ...form, optionsJson: e.target.value })
                }
                helperText='Example: ["Backend","Frontend","QA"]'
              />
            )}
            <Stack direction="row" alignItems="center">
              <Switch
                checked={!!form.requiredByDefault}
                onChange={(e) =>
                  setForm({ ...form, requiredByDefault: e.target.checked })
                }
              />
              Required by default
            </Stack>
            <Stack direction="row" alignItems="center">
              <Switch
                checked={form.active !== false}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active
            </Stack>
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

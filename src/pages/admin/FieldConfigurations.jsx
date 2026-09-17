import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";
import { getActiveCustomFields } from "../../api/customFieldApi";
import {
  createFieldConfiguration,
  deleteFieldConfiguration,
  getFieldConfigurations,
} from "../../api/fieldConfigurationApi";
import { getProjects } from "../../api/projectApi";
import { getTicketTypes } from "../../api/ticketTypeApi";
export default function FieldConfigurations() {
  const [rows, setRows] = useState([]),
    [fields, setFields] = useState([]),
    [projects, setProjects] = useState([]),
    [types, setTypes] = useState([]),
    [form, setForm] = useState({
      fieldId: "",
      projectId: "",
      ticketTypeId: "",
      visible: true,
      required: false,
      displayOrder: 0,
    }),
    [error, setError] = useState("");
  const load = async () => {
    try {
      const [r, f, p, t] = await Promise.all([
        getFieldConfigurations(),
        getActiveCustomFields(),
        getProjects(),
        getTicketTypes(),
      ]);
      setRows(r);
      setFields(f);
      setProjects(p);
      setTypes(t);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load configuration");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    try {
      await createFieldConfiguration({
        ...form,
        fieldId: Number(form.fieldId),
        projectId: form.projectId ? Number(form.projectId) : null,
        ticketTypeId: form.ticketTypeId ? Number(form.ticketTypeId) : null,
        displayOrder: Number(form.displayOrder || 0),
      });
      setForm({
        fieldId: "",
        projectId: "",
        ticketTypeId: "",
        visible: true,
        required: false,
        displayOrder: 0,
      });
      load();
    } catch (e) {
      setError(
        e?.response?.data?.message || "Unable to create field configuration",
      );
    }
  };
  const name = (id, a) =>
    a.find((x) => Number(x.id) === Number(id))?.name || "Global";
  return (
    <Box className="app-page pm-fade-up">
      <Typography variant="h5">Field Configuration</Typography>
      <Typography color="text.secondary" mb={2}>
        Control visibility and required state by project and issue type.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3}>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Field</InputLabel>
          <Select
            value={form.fieldId}
            label="Field"
            onChange={(e) => setForm({ ...form, fieldId: e.target.value })}
          >
            {fields.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Project</InputLabel>
          <Select
            value={form.projectId}
            label="Project"
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          >
            <MenuItem value="">Global</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Issue Type</InputLabel>
          <Select
            value={form.ticketTypeId}
            label="Issue Type"
            onChange={(e) => setForm({ ...form, ticketTypeId: e.target.value })}
          >
            <MenuItem value="">All Types</MenuItem>
            {types.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          type="number"
          label="Order"
          value={form.displayOrder}
          onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
        />
        <Stack direction="row" alignItems="center">
          <Checkbox
            checked={form.visible}
            onChange={(e) => setForm({ ...form, visible: e.target.checked })}
          />
          Visible
        </Stack>
        <Stack direction="row" alignItems="center">
          <Checkbox
            checked={form.required}
            onChange={(e) => setForm({ ...form, required: e.target.checked })}
          />
          Required
        </Stack>
        <Button variant="contained" onClick={save} disabled={!form.fieldId}>
          Add
        </Button>
      </Stack>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Field</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Visible</TableCell>
            <TableCell>Required</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.fieldName}</TableCell>
              <TableCell>
                {r.projectId ? name(r.projectId, projects) : "Global"}
              </TableCell>
              <TableCell>
                {r.ticketTypeId ? name(r.ticketTypeId, types) : "All Types"}
              </TableCell>
              <TableCell>{String(r.visible)}</TableCell>
              <TableCell>{String(r.required)}</TableCell>
              <TableCell>
                <Button
                  color="error"
                  onClick={async () => {
                    await deleteFieldConfiguration(r.id);
                    load();
                  }}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

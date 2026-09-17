import {
  Alert,
  Box,
  Button,
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
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";
import { getActiveCustomFields } from "../../api/customFieldApi";
import { getProjects } from "../../api/projectApi";
import {
  addScreenField,
  createScreenConfiguration,
  deleteScreenConfiguration,
  getScreenConfigurations,
  removeScreenField,
} from "../../api/screenConfigurationApi";
import { getTicketTypes } from "../../api/ticketTypeApi";
export default function ScreenConfigurations() {
  const [rows, setRows] = useState([]),
    [fields, setFields] = useState([]),
    [projects, setProjects] = useState([]),
    [types, setTypes] = useState([]),
    [form, setForm] = useState({ name: "", projectId: "", ticketTypeId: "" }),
    [add, setAdd] = useState({ screenId: "", fieldId: "" }),
    [error, setError] = useState("");
  const load = async () => {
    try {
      const [r, f, p, t] = await Promise.all([
        getScreenConfigurations(),
        getActiveCustomFields(),
        getProjects(),
        getTicketTypes(),
      ]);
      setRows(r);
      setFields(f);
      setProjects(p);
      setTypes(t);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load screens");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const create = async () => {
    try {
      await createScreenConfiguration({
        ...form,
        projectId: form.projectId ? Number(form.projectId) : null,
        ticketTypeId: form.ticketTypeId ? Number(form.ticketTypeId) : null,
      });
      setForm({ name: "", projectId: "", ticketTypeId: "" });
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to create screen");
    }
  };
  const fieldName = (id) =>
    fields.find((f) => Number(f.id) === Number(id))?.name || "Field";
  return (
    <Box className="app-page pm-fade-up">
      <Typography variant="h5">Screen Configuration</Typography>
      <Typography color="text.secondary" mb={2}>
        Define which configured fields appear on create/edit screens.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3}>
        <input
          aria-label="Screen name"
          placeholder="Screen name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
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
        <Button
          variant="contained"
          onClick={create}
          disabled={!form.name.trim()}
        >
          Create Screen
        </Button>
      </Stack>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Screen</TableCell>
            <TableCell>Scope</TableCell>
            <TableCell>Fields</TableCell>
            <TableCell>Add Field</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>
                {r.projectId
                  ? projects.find((p) => p.id === r.projectId)?.name ||
                    "Project"
                  : "Global"}
                {r.ticketTypeId
                  ? ` / ${types.find((t) => t.id === r.ticketTypeId)?.name || "Type"}`
                  : " / All Types"}
              </TableCell>
              <TableCell>
                {r.fields?.map((f) => (
                  <Button
                    key={f.fieldId}
                    size="small"
                    onClick={async () => {
                      await removeScreenField(r.id, f.fieldId);
                      load();
                    }}
                  >
                    {f.fieldName} ×
                  </Button>
                ))}
              </TableCell>
              <TableCell>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select
                    value={add.screenId === String(r.id) ? add.fieldId : ""}
                    displayEmpty
                    onChange={async (e) => {
                      const v = e.target.value;
                      setAdd({ screenId: String(r.id), fieldId: v });
                      if (v) {
                        await addScreenField(r.id, {
                          fieldId: Number(v),
                          displayOrder: r.fields?.length || 0,
                          visible: true,
                        });
                        setAdd({ screenId: "", fieldId: "" });
                        load();
                      }
                    }}
                  >
                    <MenuItem value="">Select field</MenuItem>
                    {fields
                      .filter(
                        (f) =>
                          !(r.fields || []).some(
                            (x) => Number(x.fieldId) === Number(f.id),
                          ),
                      )
                      .map((f) => (
                        <MenuItem key={f.id} value={f.id}>
                          {f.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell>
                <Button
                  color="error"
                  onClick={async () => {
                    await deleteScreenConfiguration(r.id);
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

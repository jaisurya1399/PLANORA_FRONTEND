import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

import { getActiveProjectStatuses } from "../../api/projectStatusApi";

import { getUsers } from "../../api/userApi";

const initialForm = {
  name: "",
  description: "",
  ownerId: "",
  statusId: "",
  ticketPrefix: "",
  statusType: "",
  projectAdminIds: [],
};

export default function ProjectForm({
  initialValues,
  onSubmit,
  loading = false,
}) {
  const [form, setForm] = useState(initialValues || initialForm);

  const [statuses, setStatuses] = useState([]);

  const [users, setUsers] = useState([]);

  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValues) {
      setForm({
        ...initialForm,
        ...initialValues,
        ownerId: initialValues.ownerId ?? "",
        statusId: initialValues.statusId ?? "",
        projectAdminIds: initialValues.projectAdminIds ?? [],
      });
    }
  }, [initialValues]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [statusData, userData] = await Promise.all([
        getActiveProjectStatuses(),

        getUsers(),
      ]);

      setStatuses(Array.isArray(statusData) ? statusData : []);

      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      console.error("Failed to load project options", error);
    }
  };

  const handleChange = (field) => (event) => {
    setForm({
      ...form,
      [field]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Project name is required.");

      return;
    }

    if (!form.ownerId) {
      setError("Owner is required.");

      return;
    }

    if (!form.projectAdminIds?.length || form.projectAdminIds.length > 2) {
      setError("Select 1 or 2 Project Administrators.");
      return;
    }

    if (
      !form.projectAdminIds.some((id) => Number(id) === Number(form.ownerId))
    ) {
      setError(
        "Project Owner must also be selected as a Project Administrator.",
      );
      return;
    }

    if (!form.statusId) {
      setError("Project status is required.");

      return;
    }

    if (!form.ticketPrefix.trim()) {
      setError("Ticket prefix is required.");

      return;
    }

    const payload = {
      name: form.name.trim(),

      description: form.description?.trim() || "",

      ownerId: Number(form.ownerId),

      projectAdminIds: form.projectAdminIds.map(Number),

      statusId: Number(form.statusId),

      ticketPrefix: form.ticketPrefix.trim(),

      statusType: form.statusType?.trim() || "",
    };

    await onSubmit(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Project Name"
          value={form.name}
          onChange={handleChange("name")}
          required
          fullWidth
          inputProps={{
            maxLength: 255,
          }}
        />

        <TextField
          label="Description"
          value={form.description}
          onChange={handleChange("description")}
          multiline
          minRows={4}
          fullWidth
        />

        <FormControl fullWidth required>
          <InputLabel>Owner</InputLabel>

          <Select
            value={form.ownerId}
            label="Owner"
            onChange={handleChange("ownerId")}
          >
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name || user.email || `User #${user.id}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth required>
          <InputLabel>Project Administrators</InputLabel>
          <Select
            multiple
            value={form.projectAdminIds}
            label="Project Administrators"
            onChange={(event) =>
              setForm({ ...form, projectAdminIds: event.target.value })
            }
            renderValue={(selected) =>
              selected
                .map((id) => {
                  const user = users.find(
                    (item) => Number(item.id) === Number(id),
                  );
                  return user?.name || user?.email || `User #${id}`;
                })
                .join(", ")
            }
          >
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                <Checkbox
                  checked={form.projectAdminIds.some(
                    (id) => Number(id) === Number(user.id),
                  )}
                />
                <ListItemText
                  primary={user.name || user.email || `User #${user.id}`}
                  secondary={user.email}
                />
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Choose 1–2 administrators. The selected Owner must be included.
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth required>
          <InputLabel>Status</InputLabel>

          <Select
            value={form.statusId}
            label="Status"
            onChange={handleChange("statusId")}
          >
            {statuses.map((status) => (
              <MenuItem key={status.id} value={status.id}>
                {status.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Ticket Prefix"
          value={form.ticketPrefix}
          onChange={handleChange("ticketPrefix")}
          required
          fullWidth
          helperText="Example: PROJ"
          inputProps={{
            maxLength: 255,
          }}
        />

        <TextField
          label="Status Type"
          value={form.statusType}
          onChange={handleChange("statusType")}
          fullWidth
          inputProps={{
            maxLength: 255,
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Saving..." : "Save Project"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

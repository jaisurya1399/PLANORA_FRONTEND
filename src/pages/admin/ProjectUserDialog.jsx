import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";

import { useEffect, useState } from "react";
import { getUsers } from "../../api/userApi";

export default function ProjectUserDialog({
  open,
  projectId,
  assignment,
  onClose,
  onSave,
}) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    userId: "",
    role: "DEVELOPER",
    responsibilityRole: "",
  });

  useEffect(() => {
    if (!open) return;
    getUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error);
    if (assignment) {
      setForm({
        userId: assignment.userId || "",
        role: assignment.role || "DEVELOPER",
        responsibilityRole: "",
      });
    } else {
      setForm({ userId: "", role: "DEVELOPER", responsibilityRole: "" });
    }
  }, [open, assignment]);

  const handleRoleChange = (role) =>
    setForm((current) => ({
      ...current,
      role,
      responsibilityRole: "",
    }));

  const handleSave = async () => {
    await onSave({
      userId: Number(form.userId),
      projectId: Number(projectId),
      role: form.role,
      responsibilityRole: null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {assignment ? "Edit Project Member" : "Assign User"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel>User</InputLabel>
            <Select
              value={form.userId}
              label="User"
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name || user.email || `User ${user.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Project Access</InputLabel>
            <Select
              value={form.role}
              label="Project Access"
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              <MenuItem value="PROJECT_ADMIN">Project Administrator</MenuItem>
              <MenuItem value="TEAM_LEAD">Team Lead</MenuItem>
              <MenuItem value="DEVELOPER">Developer</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!form.userId || !form.role || false}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

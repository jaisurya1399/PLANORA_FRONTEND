import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";

import { useEffect, useState } from "react";
import { getUsers } from "../../api/userApi";
import {
  addUserToGroup,
  createUserGroup,
  deleteUserGroup,
  getUserGroups,
  removeUserFromGroup,
  updateUserGroup,
} from "../../api/userGroupApi";
import MemberAvatar from "../../components/common/MemberAvatar";
export default function UserGroups() {
  const [groups, setGroups] = useState([]),
    [users, setUsers] = useState([]),
    [open, setOpen] = useState(false),
    [memberOpen, setMemberOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [selected, setSelected] = useState(null),
    [form, setForm] = useState({ name: "", description: "" }),
    [userId, setUserId] = useState(""),
    [error, setError] = useState("");
  const load = async () => {
    try {
      setError("");
      setGroups(await getUserGroups());
      setUsers(await getUsers());
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to load user groups",
      );
    }
  };
  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    try {
      if (editing) await updateUserGroup(editing.id, form);
      else await createUserGroup(form);
      setOpen(false);
      setEditing(null);
      setForm({ name: "", description: "" });
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to save group",
      );
    }
  };
  const remove = async (id) => {
    if (!(await requestConfirm("Delete this user group?"))) return;
    try {
      await deleteUserGroup(id);
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to delete group",
      );
    }
  };
  const add = async () => {
    try {
      if (!userId) return;
      await addUserToGroup(selected.id, Number(userId));
      setMemberOpen(false);
      setUserId("");
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to add member",
      );
    }
  };
  const removeMember = async (g, u) => {
    try {
      await removeUserFromGroup(g.id, u.id);
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to remove member",
      );
    }
  };
  return (
    <Box className="app-page pm-fade-up">
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            User Groups
          </Typography>
          <Typography color="text.secondary">
            Create groups and manage their members.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(null);
            setForm({ name: "", description: "" });
            setOpen(true);
          }}
        >
          Create Group
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack spacing={2}>
        {groups.map((g) => (
          <Card key={g.id} variant="outlined">
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Typography fontWeight={800}>{g.name}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {g.description || "No description"}
                  </Typography>
                </Box>
                <Box>
                  <IconButton
                    onClick={() => {
                      setEditing(g);
                      setForm({
                        name: g.name,
                        description: g.description || "",
                      });
                      setOpen(true);
                    }}
                    aria-label="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => remove(g.id)} aria-label="Delete">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                sx={{ mt: 2, gap: 1 }}
              >
                {g.members?.map((u) => (
                  <Chip
                    key={u.id}
                    avatar={
                      <MemberAvatar
                        userId={u.id}
                        name={u.name || u.email}
                        hasProfileImage={u.hasProfileImage}
                      />
                    }
                    label={u.name}
                    onDelete={() => removeMember(g, u)}
                  />
                ))}
                <Chip
                  icon={<PersonAddIcon />}
                  label="Add member"
                  variant="outlined"
                  onClick={() => {
                    setSelected(g);
                    setMemberOpen(true);
                  }}
                />
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
        <DialogTitle>{editing ? "Edit Group" : "Create Group"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label="Group name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={!form.name.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={memberOpen}
        onClose={() => setMemberOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add member to {selected?.name}</DialogTitle>
        <DialogContent>
          <TextField
            select
            SelectProps={{ native: true }}
            fullWidth
            label="User"
            margin="normal"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">Select user</option>
            {users
              .filter(
                (u) => !(selected?.members || []).some((m) => m.id === u.id),
              )
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={add} disabled={!userId}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

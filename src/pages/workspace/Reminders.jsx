import AddAlarmIcon from "@mui/icons-material/AddAlarm";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";
import {
  cancelReminder,
  createReminder,
  getReminders,
} from "../../api/reminderApi";

const localValue = () => {
  const d = new Date(Date.now() + 30 * 60000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export default function Reminders() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    remindAt: localValue(),
  });
  const [error, setError] = useState("");
  const load = async () => setItems(await getReminders());
  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || e.message));
  }, []);
  const save = async () => {
    try {
      await createReminder({
        ...form,
        remindAt: new Date(form.remindAt).toISOString().slice(0, 19),
      });
      setOpen(false);
      setForm({ title: "", description: "", remindAt: localValue() });
      load();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
  };
  return (
    <Box className="app-page pm-fade-up">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <AddAlarmIcon />
          <Typography variant="h5" fontWeight={700}>
            My Reminders
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddAlarmIcon />}
          onClick={() => setOpen(true)}
        >
          Set Reminder
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Card>
        <CardContent>
          <List>
            {items.length === 0 ? (
              <Typography color="text.secondary">No reminders yet.</Typography>
            ) : (
              items.map((r) => (
                <ListItem
                  key={r.id}
                  divider
                  secondaryAction={
                    r.status === "PENDING" ? (
                      <Button
                        color="error"
                        onClick={async () => {
                          await cancelReminder(r.id);
                          load();
                        }}
                      >
                        Cancel
                      </Button>
                    ) : null
                  }
                >
                  <ListItemText
                    primary={r.title}
                    secondary={`${new Date(r.remindAt).toLocaleString()} • ${r.status}${r.description ? ` • ${r.description}` : ""}`}
                  />
                </ListItem>
              ))
            )}
          </List>
        </CardContent>
      </Card>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Set Reminder</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <TextField
              label="Remind at"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={form.remindAt}
              onChange={(e) => setForm({ ...form, remindAt: e.target.value })}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={!form.title || !form.remindAt}
          >
            Save Reminder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";
import { getTicketHours, logTicketHours } from "../../api/ticketApi";
import {
  getActiveTimer,
  getTimeTrackingSummary,
  startTimer,
  stopTimer,
} from "../../api/timeTrackingApi";
import { BORDER, RADIUS } from "../../theme/colors";

const formatHours = (value) => {
  const minutes = Math.round(Number(value || 0) * 60);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export default function TicketTimeLogged({ ticketId }) {
  const [hours, setHours] = useState([]);
  const [summary, setSummary] = useState(null);
  const [timer, setTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timerDescription, setTimerDescription] = useState("");
  const [form, setForm] = useState({ hours: "", minutes: "", description: "" });

  const load = async () => {
    try {
      setLoading(true);
      const [logged, tracking, active] = await Promise.all([
        getTicketHours(ticketId),
        getTimeTrackingSummary(ticketId),
        getActiveTimer(),
      ]);
      setHours(Array.isArray(logged) ? logged : logged?.content || []);
      setSummary(tracking);
      setTimer(active?.ticketId === Number(ticketId) ? active : null);
      if (active?.ticketId === Number(ticketId))
        setElapsed(active.elapsedSeconds || 0);
    } catch (e) {
      console.error("Failed to load time tracking", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) load();
  }, [ticketId]);

  useEffect(() => {
    if (!timer) return undefined;
    const id = setInterval(() => {
      const started = new Date(timer.startedAt).getTime();
      setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [timer]);

  const timerText = useMemo(() => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [elapsed]);

  const handleStart = async () => {
    try {
      const active = await startTimer(ticketId, timerDescription);
      setTimer(active);
      setElapsed(active.elapsedSeconds || 0);
    } catch (e) {
      console.error("Failed to start timer", e);
    }
  };

  const handleStop = async () => {
    try {
      await stopTimer();
      setTimer(null);
      setElapsed(0);
      await load();
    } catch (e) {
      console.error("Failed to stop timer", e);
    }
  };

  const handleSave = async () => {
    if (!form.hours && !form.minutes) return;
    try {
      setSaving(true);
      await logTicketHours(ticketId, {
        hours: Number(form.hours || 0),
        minutes: Number(form.minutes || 0),
        description: form.description,
      });
      setForm({ hours: "", minutes: "", description: "" });
      setOpen(false);
      await load();
    } catch (e) {
      console.error("Failed to log time", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${BORDER}`,
          borderRadius: `${RADIUS.card}px`,
          p: 3,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
          mb={3}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Time Tracking
            </Typography>
            {loading ? (
              <CircularProgress size={18} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Estimated: {formatHours(summary?.estimatedHours)} • Actual:{" "}
                {formatHours(summary?.actualHours)} • Remaining:{" "}
                {formatHours(summary?.remainingEstimateHours)}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {!timer ? (
              <>
                <TextField
                  size="small"
                  label="Timer note"
                  value={timerDescription}
                  onChange={(e) => setTimerDescription(e.target.value)}
                />
                <Button
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStart}
                >
                  Start
                </Button>
              </>
            ) : (
              <Button
                color="error"
                variant="contained"
                startIcon={<StopIcon />}
                onClick={handleStop}
              >
                Stop {timerText}
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
            >
              Log Time
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: "action.hover" }}
        >
          <Typography variant="body2">
            <b>Estimate vs Actual:</b> {formatHours(summary?.estimatedHours)} vs{" "}
            {formatHours(summary?.actualHours)}
          </Typography>
          <Typography variant="body2">
            <b>Variance:</b>{" "}
            {formatHours(Math.abs(Number(summary?.varianceHours || 0)))}{" "}
            {Number(summary?.varianceHours || 0) > 0
              ? "over estimate"
              : "under estimate"}
          </Typography>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : hours.length === 0 ? (
          <Typography color="text.secondary">No time logged yet.</Typography>
        ) : (
          hours.map((item, index) => (
            <Box
              key={item.id || index}
              sx={{
                display: "flex",
                gap: 2,
                py: 2,
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <AccessTimeIcon color="primary" />
              <Box flex={1}>
                <Typography fontWeight={600}>
                  {formatHours(item.value)}
                </Typography>
                {item.comment && (
                  <Typography variant="body2" color="text.secondary">
                    {item.comment}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {item.userName || "User"}
                  {item.createdAt &&
                    ` • ${new Date(item.createdAt).toLocaleString()}`}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </Paper>

      <Dialog
        open={open}
        onClose={() => !saving && setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Log Time</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={2} mt={1}>
            <TextField
              fullWidth
              label="Hours"
              type="number"
              inputProps={{ min: 0 }}
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
            />
            <TextField
              fullWidth
              label="Minutes"
              type="number"
              inputProps={{ min: 0, max: 59 }}
              value={form.minutes}
              onChange={(e) => setForm({ ...form, minutes: e.target.value })}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Description"
            sx={{ mt: 2 }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || (!form.hours && !form.minutes)}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

import HistoryIcon from "@mui/icons-material/History";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";
import { getBoardHistory } from "../../api/boardApi";

const HISTORY_WINDOW_DAYS = 30;

function formatChangedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EmptyState() {
  return (
    <Box
      sx={{
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        color: "text.secondary",
      }}
    >
      <InboxOutlinedIcon sx={{ fontSize: 32, opacity: 0.5 }} />
      <Typography variant="body2" color="text.secondary">
        No status transitions in the last {HISTORY_WINDOW_DAYS} days.
      </Typography>
    </Box>
  );
}

function LoadingState() {
  return (
    <Box
      sx={{
        minHeight: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary">
          Loading history...
        </Typography>
      </Stack>
    </Box>
  );
}

function HistoryRow({ entry }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: 2,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 0.75, sm: 1.5 }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Typography variant="body2" fontWeight={700} sx={{ minWidth: 90 }}>
            {entry.ticket?.code || `Ticket #${entry.ticket?.id ?? "—"}`}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              variant="outlined"
              label={entry.fromStatus?.name || "Created"}
            />
            <TrendingFlatIcon
              fontSize="small"
              sx={{ color: "text.disabled" }}
            />
            <Chip
              size="small"
              label={entry.toStatus?.name || "—"}
              sx={{ fontWeight: 600 }}
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexShrink: 0 }}
        >
          {formatChangedAt(entry.changedAt)}
        </Typography>
      </Stack>
    </Paper>
  );
}

export default function BoardHistoryDialog({ open, onClose, projectId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !projectId) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    getBoardHistory(projectId, HISTORY_WINDOW_DAYS)
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (cancelled) return;
        setRows([]);
        setError(
          e?.response?.data?.message || "Failed to load status history.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              flexShrink: 0,
            }}
          >
            <HistoryIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              Board Status History
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ticket status changes over the last {HISTORY_WINDOW_DAYS} days
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "grey.50" }}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <Box sx={{ py: 2 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <Stack spacing={1}>
            {rows.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

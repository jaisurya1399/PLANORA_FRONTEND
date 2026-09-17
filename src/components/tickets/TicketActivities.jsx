import HistoryIcon from "@mui/icons-material/History";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { ticketApi } from "../../api/ticketApi";

export default function TicketActivity({ ticketId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadActivity() {
    if (!ticketId) return;

    try {
      setLoading(true);
      setError("");

      const result = await ticketApi.getAuditEvents(ticketId);

      setEvents(
        Array.isArray(result)
          ? result
          : result?.content || result?.data || result?.events || [],
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivity();
  }, [ticketId]);

  function getActor(event) {
    return (
      event.actorName ||
      event.actor?.name ||
      event.userName ||
      event.user?.name ||
      "System"
    );
  }

  function getAction(event) {
    return event.action || event.eventType || event.type || "UPDATED";
  }

  function getDate(event) {
    const value = event.createdAt || event.timestamp || event.occurredAt;

    if (!value) return "";

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
  }

  function getField(event) {
    return event.fieldName || event.field || event.metadata?.fieldName;
  }

  function getOldValue(event) {
    return event.oldValue ?? event.previousValue ?? event.metadata?.oldValue;
  }

  function getNewValue(event) {
    return event.newValue ?? event.currentValue ?? event.metadata?.newValue;
  }

  function getDescription(event) {
    if (event.description) {
      return event.description;
    }

    const field = getField(event);
    const oldValue = getOldValue(event);
    const newValue = getNewValue(event);

    if (field) {
      return (
        <>
          changed <b>{field}</b>{" "}
          {oldValue !== undefined && oldValue !== null && (
            <>
              from <b>{String(oldValue)}</b>
            </>
          )}{" "}
          {newValue !== undefined && newValue !== null && (
            <>
              to <b>{String(newValue)}</b>
            </>
          )}
        </>
      );
    }

    return "updated the ticket";
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <HistoryIcon />

        <Typography variant="h6" fontWeight={700}>
          Activity
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={5}>
          No activity recorded.
        </Typography>
      ) : (
        <Stack>
          {events.map((event, index) => {
            const id = event.id || event.eventId || index;

            return (
              <Box key={id}>
                <Stack direction="row" spacing={2} sx={{ py: 2 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      mt: 1,
                      bgcolor: "primary.main",
                      flexShrink: 0,
                    }}
                  />

                  <Box flex={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Typography fontWeight={700}>
                        {getActor(event)}
                      </Typography>

                      <Chip size="small" label={getAction(event)} />

                      <Typography variant="caption" color="text.secondary">
                        {getDate(event)}
                      </Typography>
                    </Stack>

                    <Typography sx={{ mt: 0.5 }} color="text.secondary">
                      {getDescription(event)}
                    </Typography>
                  </Box>
                </Stack>

                {index < events.length - 1 && <Divider />}
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

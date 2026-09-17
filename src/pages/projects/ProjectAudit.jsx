import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectAuditEvents, getProjectById } from "../../api/projectApi";

export default function ProjectAudit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const back = () => navigate(-1);

  useEffect(() => {
    Promise.all([getProjectById(id), getProjectAuditEvents(id)])
      .then(([p, e]) => {
        setProject(p);
        setEvents(Array.isArray(e) ? e : []);
      })
      .catch((err) =>
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load project audit.",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box className="app-page pm-fade-up">
      <Button startIcon={<ArrowBackIcon />} onClick={back} sx={{ mb: 2 }}>
        Back
      </Button>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <HistoryIcon />
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Project Audit
          </Typography>
          <Typography color="text.secondary">
            {project?.name || `Project #${id}`}
          </Typography>
        </Box>
      </Stack>
      {events.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              No audit events recorded for this project yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Box>
                    <Typography fontWeight={700}>{event.eventType}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.entityType} #{event.entityId} · by{" "}
                      {event.actorName || "System"}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={
                      event.createdAt
                        ? new Date(event.createdAt).toLocaleString()
                        : "—"
                    }
                  />
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {formatChanges(event.changesJson)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function formatChanges(value) {
  try {
    return JSON.stringify(JSON.parse(value || "{}"), null, 2);
  } catch {
    return value || "{}";
  }
}

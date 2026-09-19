import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMyResolvedTickets,
  getMyTickets,
  getMyTicketsAll,
} from "../../api/ticketApi";

export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("active");
  const [error, setError] = useState("");

  // ============================================================
  // LOAD MY TICKETS
  // ============================================================

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        view === "all"
          ? await getMyTicketsAll()
          : view === "resolved"
            ? await getMyResolvedTickets()
            : await getMyTickets();

      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("MY TICKETS API ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load assigned tickets.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadTickets();
  }, [view]);

  // ============================================================
  // OPEN TICKET DETAILS
  // ============================================================

  const handleTicketClick = (ticketId) => {
    if (!ticketId) {
      console.error("Ticket ID is missing.");
      return;
    }

    navigate(`/member/developer/tickets/${encodeURIComponent(ticketId)}`);
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <Box className="app-page pm-fade-up">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <AssignmentIcon />
            My Tickets
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tickets assigned to you
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadTickets}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Tabs
          value={view}
          onChange={(_, value) => setView(value)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab value="active" label="Active" />
          <Tab value="all" label="All Tickets" />
          {/* <Tab value="resolved" label="Resolved" /> */}
        </Tabs>
      </Box>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ======================================================
          NO TICKETS
      ====================================================== */}

      {!error && tickets.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <AssignmentIcon
            sx={{
              fontSize: 55,
              color: "text.secondary",
              mb: 1,
            }}
          />

          <Typography variant="h6" fontWeight={600}>
            {view === "active"
              ? "No active tickets"
              : view === "resolved"
                ? "No resolved tickets"
                : "No tickets found"}
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {view === "active"
              ? "You currently don't have any active tickets assigned to you."
              : view === "resolved"
                ? "You don't have any resolved tickets in your history."
                : "No tickets are available for your account."}
          </Typography>
        </Paper>
      )}

      {/* ======================================================
          TICKET LIST
      ====================================================== */}

      {!error &&
        tickets.map((ticket) => (
          <Paper
            key={ticket.id}
            onClick={() => handleTicketClick(ticket.id)}
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              cursor: "pointer",
              transition: "all 0.2s ease",

              "&:hover": {
                boxShadow: 4,
                transform: "translateY(-2px)",
                borderColor: "primary.main",
              },
            }}
          >
            {/* =================================================
                TOP
            ================================================= */}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {ticket.code || `TICKET-${ticket.id}`}
                </Typography>

                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                  {ticket.name || "Untitled Ticket"}
                </Typography>
              </Box>

              <ArrowForwardIcon color="action" sx={{ flexShrink: 0 }} />
            </Box>

            {/* =================================================
                PROJECT
            ================================================= */}

            <Typography variant="body2" sx={{ mt: 2 }}>
              <strong>Project:</strong> {ticket.projectName || "-"}
            </Typography>

            {ticket.dueDate && (
              <Chip
                size="small"
                sx={{ mt: 1.5 }}
                color={
                  new Date(ticket.dueDate).getTime() < Date.now() &&
                  ticket.statusCategory !== "DONE" &&
                  ticket.statusCategory !== "CANCELLED"
                    ? "error"
                    : "default"
                }
                label={`Due: ${new Date(ticket.dueDate).toLocaleString()}`}
              />
            )}

            {/* =================================================
                STATUS
            ================================================= */}

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Status:</strong> {ticket.statusName || "-"}
            </Typography>

            {/* =================================================
                PRIORITY
            ================================================= */}

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Priority:</strong> {ticket.priorityName || "-"}
            </Typography>
          </Paper>
        ))}
    </Box>
  );
}

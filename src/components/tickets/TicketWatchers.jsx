import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import {
  getTicketSubscribersByTicket,
  subscribeToTicket,
  unsubscribeFromTicket,
} from "../../api/ticketSubscriberApi";
import { useToast } from "../../context/ToastContext";
import MemberAvatar from "../common/MemberAvatar";
import {
  PRIMARY,
  PRIMARY_SUBTLE,
  TEXT_FAINT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../../theme/colors";

// ============================================================
// Ticket Watchers
// ============================================================
//
// Compact watch/unwatch toggle + watcher count + popover list,
// used in the ticket detail header area.
//
// ============================================================

export default function TicketWatchers({ ticketId, currentUserId }) {
  const [watchers, setWatchers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [toggling, setToggling] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);

  const toast = useToast();

  const normalizeList = (data) => {
    if (Array.isArray(data)) return data;

    return data?.content || data?.data || [];
  };

  const isWatching = watchers.some(
    (item) => Number(item.userId) === Number(currentUserId),
  );

  async function loadWatchers() {
    if (!ticketId) return;

    try {
      setLoading(true);

      const data = await getTicketSubscribersByTicket(ticketId);

      setWatchers(normalizeList(data));
    } catch (err) {
      console.error("LOAD WATCHERS ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWatchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function handleToggleWatch() {
    if (!ticketId) return;

    if (!currentUserId) {
      toast?.error?.("Logged-in user ID not found. Please login again.");

      return;
    }

    try {
      setToggling(true);

      if (isWatching) {
        await unsubscribeFromTicket(ticketId, currentUserId);

        toast?.success?.("You stopped watching this ticket.");
      } else {
        await subscribeToTicket({
          ticketId: Number(ticketId),
          userId: Number(currentUserId),
        });

        toast?.success?.("You are now watching this ticket.");
      }

      await loadWatchers();
    } catch (err) {
      console.error("TOGGLE WATCH ERROR:", err);

      toast?.error?.(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update watch status.",
      );
    } finally {
      setToggling(false);
    }
  }

  function getInitials(name) {
    if (!name) return "U";

    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  const openPopover = Boolean(anchorEl);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.3,
      }}
    >
      <IconButton
        size="small"
        onClick={handleToggleWatch}
        disabled={toggling || !ticketId}
        title={isWatching ? "Stop watching" : "Watch this ticket"}
        sx={{
          color: isWatching ? PRIMARY : TEXT_FAINT,

          "&:hover": {
            backgroundColor: PRIMARY_SUBTLE,
          },
        }}
      >
        {toggling ? (
          <CircularProgress size={15} />
        ) : isWatching ? (
          <VisibilityIcon fontSize="small" />
        ) : (
          <VisibilityOutlinedIcon fontSize="small" />
        )}
      </IconButton>

      <Typography
        component="button"
        type="button"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          fontSize: 12,
          color: TEXT_SECONDARY,
          border: "none",
          background: "none",
          cursor: "pointer",
          p: 0,
          fontFamily: "inherit",
        }}
      >
        {watchers.length} {watchers.length === 1 ? "watcher" : "watchers"}
      </Typography>

      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 1.5, minWidth: 210, maxWidth: 280 }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              mb: 1,
            }}
          >
            Watchers
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={1}>
              <CircularProgress size={18} />
            </Box>
          ) : watchers.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: TEXT_FAINT }}>
              No watchers yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {watchers.map((watcher) => (
                <Stack
                  key={watcher.id}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <MemberAvatar
                    userId={watcher.userId}
                    name={watcher.userName || watcher.userEmail}
                    hasProfileImage={watcher.hasProfileImage}
                    sx={{
                      width: 22,
                      height: 22,
                      fontSize: 11,
                      backgroundColor: "#20b9a6",
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: 12,
                      color: TEXT_PRIMARY,
                    }}
                  >
                    {watcher.userName ||
                      watcher.userEmail ||
                      `User #${watcher.userId}`}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      </Popover>
    </Box>
  );
}

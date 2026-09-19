import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

import {
  Badge,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";

const NotificationBell = ({ onNotificationClick }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const STORAGE_KEY = "planora.notifications.v1";

  const open = Boolean(anchorEl);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) {
        setNotifications(stored.slice(0, 50));
        setUnreadCount(stored.filter((item) => !item.readAt).length);
      }
    } catch {
      // Ignore corrupt local notification cache.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(notifications.slice(0, 50)),
      );
    } catch {
      // Storage may be unavailable in private/restricted browsing modes.
    }
  }, [notifications]);

  /**
   * Receive notifications directly from FCM.
   *
   * No API call.
   */
  useEffect(() => {
    const handleFcmNotification = (event) => {
      const incoming = event?.detail;

      if (!incoming) {
        return;
      }

      const data = incoming.data || {};

      const notification = {
        id:
          data.notificationId ||
          incoming.id ||
          `${Date.now()}-${Math.random()}`,

        title: incoming.title || data.title || "Planora",

        message:
          incoming.body ||
          incoming.message ||
          data.message ||
          data.body ||
          "New notification",

        type: incoming.type || data.type || "notification",

        ticketId: data.ticketId || incoming.ticketId || null,

        ticketCode: data.ticketCode || incoming.ticketCode || null,

        readAt: null,

        createdAt:
          incoming.createdAt || data.createdAt || new Date().toISOString(),
      };

      setNotifications((previous) => {
        const exists = previous.some(
          (item) => String(item.id) === String(notification.id),
        );

        if (exists) {
          return previous;
        }

        return [notification, ...previous].slice(0, 50);
      });

      setUnreadCount((previous) => previous + 1);
    };

    window.addEventListener("fcm-notification", handleFcmNotification);

    return () => {
      window.removeEventListener("fcm-notification", handleFcmNotification);
    };
  }, []);

  /**
   * Open notification menu.
   *
   * No API call.
   */
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  /**
   * Mark notification as read locally.
   *
   * No backend API call.
   */
  const handleNotificationClick = (notification) => {
    setNotifications((previous) =>
      previous.map((item) =>
        String(item.id) === String(notification.id)
          ? {
              ...item,
              readAt: new Date().toISOString(),
            }
          : item,
      ),
    );

    if (!notification.readAt) {
      setUnreadCount((previous) => Math.max(previous - 1, 0));
    }

    handleClose();

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getMessage = (notification) => {
    return notification.message || notification.title || "New notification";
  };

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        aria-label="notifications"
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: 520,
            mt: 1,
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontWeight={700}>Notifications</Typography>

          {unreadCount > 0 && (
            <Typography variant="caption" color="primary">
              {unreadCount} unread
            </Typography>
          )}
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <Box
            sx={{
              py: 5,
              textAlign: "center",
            }}
          >
            <NotificationsNoneIcon
              sx={{
                fontSize: 45,
                color: "text.secondary",
              }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No notifications
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  alignItems: "flex-start",
                  backgroundColor: notification.readAt
                    ? "transparent"
                    : "action.hover",
                  borderLeft: notification.readAt
                    ? "3px solid transparent"
                    : "3px solid",
                  borderColor: notification.readAt
                    ? "transparent"
                    : "primary.main",
                }}
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={notification.readAt ? 400 : 700}
                    >
                      {getMessage(notification)}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          display: "block",
                          textTransform: "capitalize",
                        }}
                      >
                        {String(notification.type || "").replaceAll("_", " ")}
                      </Typography>

                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatDate(notification.createdAt)}
                      </Typography>
                    </>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}

        <Divider />

        <MenuItem
          onClick={() => {
            handleClose();

            if (onNotificationClick) {
              onNotificationClick(null);
            }
          }}
          sx={{
            justifyContent: "center",
            fontWeight: 600,
          }}
        >
          View all notifications
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationBell;

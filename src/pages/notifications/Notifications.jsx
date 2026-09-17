import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import {
  getNotificationPreferences,
  saveNotificationPreference,
} from "../../api/notificationPreferenceApi";

import { useAuth } from "../../context/AuthContext";

import notificationService from "../../services/notificationService";

export default function Notifications() {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);

  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [preferences, setPreferences] = useState([]);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // ==========================================================
  // USER ID
  // ==========================================================

  const userId = user?.userId ?? user?.id;

  const notifiableType = "User";

  // ==========================================================
  // LOAD NOTIFICATIONS
  // ==========================================================

  const loadNotifications = async () => {
    if (!userId) {
      setError("User information is not available.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      let data = [];

      if (filter === "unread") {
        data = await notificationService.getUnreadNotifications(
          notifiableType,
          userId,
        );
      } else if (filter === "read") {
        data = await notificationService.getReadNotifications(
          notifiableType,
          userId,
        );
      } else {
        data = await notificationService.getUserNotifications(
          notifiableType,
          userId,
        );
      }

      setNotifications(data || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);

      setError(
        error?.response?.data?.message || "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadNotifications();
  }, [userId, filter]);

  const loadPreferences = async () => {
    if (!userId) return;
    try {
      setPreferences(await getNotificationPreferences(userId));
      setPreferencesOpen(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load notification preferences.",
      );
    }
  };

  const updatePreference = async (preference, field) => {
    const updated = { ...preference, [field]: !preference[field] };
    try {
      const saved = await saveNotificationPreference(userId, {
        eventType: updated.eventType,
        inAppEnabled: updated.inAppEnabled,
        emailEnabled: updated.emailEnabled,
      });
      setPreferences((prev) =>
        prev.map((item) => (item.eventType === saved.eventType ? saved : item)),
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update preference.");
    }
  };

  // ==========================================================
  // PARSE DATA
  // ==========================================================

  const parseData = (data) => {
    if (!data) {
      return {};
    }

    try {
      return JSON.parse(data);
    } catch {
      return {
        message: data,
      };
    }
  };

  // ==========================================================
  // TITLE
  // ==========================================================

  const getTitle = (notification) => {
    const data = parseData(notification.data);

    return data.title || notification.type || "Notification";
  };

  // ==========================================================
  // MESSAGE
  // ==========================================================

  const getMessage = (notification) => {
    const data = parseData(notification.data);

    return data.message || data.description || "";
  };

  // ==========================================================
  // DATE
  // ==========================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================================
  // MARK READ
  // ==========================================================

  const markAsRead = async (id) => {
    try {
      const updated = await notificationService.markAsRead(id);

      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // ==========================================================
  // MARK UNREAD
  // ==========================================================

  const markAsUnread = async (id) => {
    try {
      const updated = await notificationService.markAsUnread(id);

      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      );
    } catch (error) {
      console.error("Failed to mark notification as unread:", error);
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const deleteNotification = async (id) => {
    try {
      await notificationService.delete(id);

      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // ==========================================================
  // DELETE ALL
  // ==========================================================

  const deleteAll = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all notifications?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await notificationService.deleteByUser(notifiableType, userId);

      setNotifications([]);
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box className="app-page pm-fade-up">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          sm: "center",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Notifications
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Stay updated with your latest activities
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<SettingsOutlinedIcon />}
            onClick={loadPreferences}
          >
            Preferences
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={loadNotifications} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {notifications.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={deleteAll}
            >
              Clear All
            </Button>
          )}
        </Stack>
      </Stack>

      {/* ====================================================
          FILTER
      ==================================================== */}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography fontWeight={600}>Notification List</Typography>

            <Select
              size="small"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              sx={{
                minWidth: 130,
              }}
            >
              <MenuItem value="all">All</MenuItem>

              <MenuItem value="unread">Unread</MenuItem>

              <MenuItem value="read">Read</MenuItem>
            </Select>
          </Stack>
        </CardContent>
      </Card>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ====================================================
          LOADING
      ==================================================== */}

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 8,
          }}
        >
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        /* ==================================================
           EMPTY
        ================================================== */

        <Card>
          <Box
            sx={{
              py: 8,
              textAlign: "center",
            }}
          >
            <NotificationsNoneIcon
              sx={{
                fontSize: 65,
                color: "text.secondary",
              }}
            />

            <Typography variant="h6" sx={{ mt: 1 }}>
              No notifications
            </Typography>

            <Typography variant="body2" color="text.secondary">
              You're all caught up!
            </Typography>
          </Box>
        </Card>
      ) : (
        /* ==================================================
           LIST
        ================================================== */

        <Stack spacing={1.5}>
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              sx={{
                borderLeft: notification.readAt
                  ? "4px solid transparent"
                  : "4px solid",
                borderColor: notification.readAt
                  ? "transparent"
                  : "primary.main",
                backgroundColor: notification.readAt
                  ? "background.paper"
                  : "action.hover",
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  {/* Notification Icon */}

                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      minWidth: 42,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: notification.readAt
                        ? "action.selected"
                        : "primary.main",
                      color: notification.readAt
                        ? "text.secondary"
                        : "primary.contrastText",
                    }}
                  >
                    <NotificationsNoneIcon />
                  </Box>

                  {/* Content */}

                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Typography fontWeight={notification.readAt ? 500 : 700}>
                        {getTitle(notification)}
                      </Typography>

                      {!notification.readAt && (
                        <Chip label="New" size="small" color="primary" />
                      )}
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.5,
                      }}
                    >
                      {getMessage(notification)}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mt: 1 }}
                    >
                      <Chip
                        label={notification.type}
                        size="small"
                        variant="outlined"
                      />

                      <Typography variant="caption" color="text.secondary">
                        {formatDate(notification.createdAt)}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Actions */}

                  <Stack direction="row" spacing={0.5}>
                    {!notification.readAt ? (
                      <Tooltip title="Mark as read">
                        <IconButton
                          size="small"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <MarkEmailReadIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Mark as unread">
                        <IconButton
                          size="small"
                          onClick={() => markAsUnread(notification.id)}
                        >
                          <MarkEmailUnreadIcon />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
      {preferencesOpen && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700}>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose in-app and email delivery per event.
            </Typography>
            <Stack divider={<Divider flexItem />} spacing={1}>
              {preferences.map((item) => (
                <Stack
                  key={item.eventType}
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  sx={{ py: 1 }}
                >
                  <Typography fontWeight={600}>
                    {item.eventType.replaceAll("_", " ")}
                  </Typography>
                  <Stack direction="row">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={item.inAppEnabled}
                          onChange={() =>
                            updatePreference(item, "inAppEnabled")
                          }
                        />
                      }
                      label="In-app"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={item.emailEnabled}
                          onChange={() =>
                            updatePreference(item, "emailEnabled")
                          }
                        />
                      }
                      label="Email"
                    />
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

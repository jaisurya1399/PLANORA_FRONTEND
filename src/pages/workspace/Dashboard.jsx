import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { getDeveloperDashboard } from "../../api/dashboardApi";
import MetricCard from "../../components/common/MetricCard";
import { STATUS_COLORS } from "../../theme/colors";

function statusChip(status) {
  const key = (status || "").toUpperCase().replace(/\s+/g, "_");
  return STATUS_COLORS[key] || STATUS_COLORS.DRAFT;
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState({
    myProjects: 0,
    myTasks: 0,
    pendingTasks: 0,
    hoursThisWeek: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getDeveloperDashboard();
      setDashboard({
        myProjects: data?.myProjects ?? 0,
        myTasks: data?.myTasks ?? 0,
        pendingTasks: data?.pendingTasks ?? 0,
        hoursThisWeek: data?.hoursThisWeek ?? 0,
        recentActivity: Array.isArray(data?.recentActivity)
          ? data.recentActivity
          : [],
      });
    } catch (err) {
      console.error("DEVELOPER DASHBOARD API ERROR:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const stats = [
    {
      title: "My projects",
      value: dashboard.myProjects,
      icon: <FolderOutlinedIcon />,
      tone: "primary",
      path: "/member/developer/projects",
    },
    {
      title: "My tasks",
      value: dashboard.myTasks,
      icon: <AssignmentOutlinedIcon />,
      tone: "success",
      path: "/member/developer/tasks",
    },
    {
      title: "Pending tasks",
      value: dashboard.pendingTasks,
      icon: <HourglassBottomRoundedIcon />,
      tone: "warning",
    },
    {
      title: "Hours this week",
      value: `${dashboard.hoursThisWeek}h`,
      icon: <AccessTimeOutlinedIcon />,
      tone: "neutral",
      path: "/member/developer/timesheet",
    },
  ];

  return (
    <Box className="app-page pm-fade-up">
      <Box className="page-header">
        <Box>
          {/* <span className="pm-eyebrow">Your workspace</span> */}
          <Typography
            variant="h1"
            className="pm-gradient-title"
            sx={{ display: "inline-block", mt: 0.5 }}
          >
            {getGreeting()}
          </Typography>
          <Typography className="page-subtitle">
            Here's an overview of your work today.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} className="pm-stagger">
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
            <MetricCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Recent activity
          </Typography>

          {dashboard.recentActivity.length === 0 ? (
            <Box
              sx={{
                py: 5,
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              <AssignmentOutlinedIcon
                sx={{ fontSize: 32, opacity: 0.4, mb: 1 }}
              />
              <Typography fontSize={14}>
                No recent activity yet. New ticket updates will show up here.
              </Typography>
            </Box>
          ) : (
            <Stack sx={{ position: "relative", pl: 3 }}>
              <Box
                sx={{
                  position: "absolute",
                  left: 7,
                  top: 6,
                  bottom: 6,
                  width: "2px",
                  bgcolor: "var(--pm-border)",
                }}
              />
              {dashboard.recentActivity.map((activity, i) => {
                const chip = statusChip(activity.newStatus);
                return (
                  <Box
                    key={activity.id ?? i}
                    sx={{
                      position: "relative",
                      pb: i === dashboard.recentActivity.length - 1 ? 0 : 2.5,
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: -24,
                        top: 4,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        bgcolor: chip.text,
                        border: "2px solid var(--pm-surface-solid)",
                      }}
                    />
                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        border: "1px solid var(--pm-border)",
                        background: "var(--pm-surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{ fontSize: 14, fontWeight: 700 }}
                          noWrap
                        >
                          {activity.ticketName || "Ticket"}
                        </Typography>
                        {activity.createdAt && (
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: "text.secondary",
                              mt: 0.25,
                            }}
                          >
                            {new Date(activity.createdAt).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          flexShrink: 0,
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            px: 1,
                            py: 0.35,
                            borderRadius: 999,
                            bgcolor: "#F1F5F9",
                            color: "#475569",
                          }}
                        >
                          {activity.oldStatus || "—"}
                        </Box>
                        <Typography
                          sx={{ color: "text.secondary", fontSize: 12 }}
                        >
                          →
                        </Typography>
                        <Box
                          component="span"
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            px: 1,
                            py: 0.35,
                            borderRadius: 999,
                            bgcolor: chip.bg,
                            color: chip.text,
                          }}
                        >
                          {activity.newStatus || "—"}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

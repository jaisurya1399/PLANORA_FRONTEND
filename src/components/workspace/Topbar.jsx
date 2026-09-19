import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import CommandSearch from "../common/CommandSearch";
import ThemeSwitcher from "../common/ThemeSwitcher";
import NotificationBell from "../notifications/NotificationBell";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PlanoraLogo from "../../PlanoraLogo";
import { BORDER, PRIMARY, SURFACE_SUBTLE, TOPBAR } from "../../theme/colors";
import { getWorkspaceBase } from "../../utils/navigation";
import MemberAvatar from "../common/MemberAvatar";

const SEARCH_LABELS = [
  ["Dashboard", ""],
  ["My Projects", "/projects"],
  ["My Tickets", "/tickets"],
  ["Board", "/board"],
  ["Daily Scrum", "/daily-scrum"],
  ["AI Project Manager", "/ai-pm"],
  ["Reminders", "/reminders"],
  ["Notifications", "/notifications"],
  ["Timesheet", "/timesheet"],
  ["Availability", "/availability"],
  ["Profile", "/profile"],
];

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceBase = getWorkspaceBase(location.pathname);
  const searchItems = SEARCH_LABELS.map(([label, suffix]) => ({
    label,
    path: `${workspaceBase}${suffix}`,
    group: "Workspace",
  })).filter(
    (item) =>
      !location.pathname.startsWith("/member/viewer") ||
      ["Dashboard", "My Projects", "Profile"].includes(item.label),
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [createAnchor, setCreateAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const userName = user?.name || user?.username || "Team Member";
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const notificationClick = (notification) => {
    if (!notification) return navigate(`${workspaceBase}/notifications`);
    try {
      const d =
        typeof notification.data === "string"
          ? JSON.parse(notification.data)
          : notification.data;
      if (d?.ticketId)
        return navigate(`${workspaceBase}/tickets/${d.ticketId}`);
      if (d?.taskId) return navigate(`${workspaceBase}/tickets`);
      if (d?.projectId) return navigate(`${workspaceBase}/projects`);
    } catch {
      // Malformed notification payload — fall through to the default route.
    }
    navigate(`${workspaceBase}/notifications`);
  };
  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: TOPBAR.background,
          backdropFilter: "blur(14px)",
          boxShadow:
            "0 1px 0 rgba(16,24,40,.02), 0 6px 24px rgba(16,24,40,.025)",
          color: TOPBAR.textPrimary,
          borderBottom: `1px solid ${BORDER}`,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${TOPBAR.height}px !important`,
            px: { xs: 1, sm: 2, md: 2.5 },
            gap: 1,
          }}
        >
          <IconButton
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            sx={{ display: { xs: "flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              pr: 1.5,
              mr: 0.5,
              borderRight: "1px solid rgba(16,24,40,.08)",
            }}
          >
            <PlanoraLogo size={30} showText={false} />
          </Box>
          <Box sx={{ display: { xs: "none", lg: "block" }, minWidth: 150 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
              Team Workspace
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Plan, collaborate and deliver
            </Typography>
          </Box>
          <Button
            onClick={() => setSearchOpen(true)}
            startIcon={<SearchRoundedIcon fontSize="small" />}
            sx={{
              flex: 1,
              minWidth: { xs: 0, sm: 220, md: 300 },
              maxWidth: 560,
              mx: { xs: 0, md: "auto" },
              justifyContent: "flex-start",
              textTransform: "none",
              color: "text.secondary",
              bgcolor: SURFACE_SUBTLE,
              border: `1px solid ${BORDER}`,
              borderRadius: 2.5,
              minHeight: 40,
              px: 1.5,
              "&:hover": { bgcolor: SURFACE_SUBTLE },
            }}
          >
            Search projects, tickets and people...
          </Button>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}
          >
            <ThemeSwitcher />
            <NotificationBell
              userId={user?.userId ?? user?.id}
              notifiableType="User"
              onNotificationClick={notificationClick}
            />
            <IconButton
              onClick={(e) => setUserAnchor(e.currentTarget)}
              aria-label="Open profile menu"
            >
              <MemberAvatar
                userId={user?.userId ?? user?.id}
                name={userName}
                hasProfileImage={user?.hasProfileImage}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: PRIMARY,
                  fontSize: 13,
                  fontWeight: 750,
                }}
              />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={createAnchor}
        open={Boolean(createAnchor)}
        onClose={() => setCreateAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setCreateAnchor(null);
            navigate(`${workspaceBase}/projects/create`);
          }}
        >
          Create project
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateAnchor(null);
            navigate(`${workspaceBase}/tickets`);
          }}
        >
          Create ticket
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={userAnchor}
        open={Boolean(userAnchor)}
        onClose={() => setUserAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setUserAnchor(null);
            navigate(`${workspaceBase}/profile`);
          }}
        >
          <PersonOutlineRoundedIcon sx={{ mr: 1.25, fontSize: 19 }} />
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            setUserAnchor(null);
            logout();
          }}
        >
          <LogoutIcon
            sx={{ mr: 1.25, fontSize: 19, color: "text.secondary" }}
          />
          Sign out
        </MenuItem>
      </Menu>
      <CommandSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={searchItems}
      />
    </>
  );
}

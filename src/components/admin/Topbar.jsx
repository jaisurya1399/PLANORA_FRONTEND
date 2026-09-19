import AddRoundedIcon from "@mui/icons-material/AddRounded";
import KeyboardCommandKeyRoundedIcon from "@mui/icons-material/KeyboardCommandKeyRounded";
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
  Tooltip,
  Typography,
} from "@mui/material";
import CommandSearch from "../common/CommandSearch";
import ThemeSwitcher from "../common/ThemeSwitcher";
import NotificationBell from "../notifications/NotificationBell";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PlanoraLogo from "../../PlanoraLogo";
import { BORDER, PRIMARY, SURFACE_SUBTLE, TOPBAR } from "../../theme/colors";
import MemberAvatar from "../common/MemberAvatar";

export default function Topbar({ onMenuClick = () => {} }) {
  const {
    user,
    logout,
    isSystemAdmin,
    getPrimaryProjectId,
    getProjectMembership,
  } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [createAnchor, setCreateAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const name = user?.name || "Admin";

  // Must match the actually-registered route prefix, same as
  // components/admin/Sidebar.jsx. Hardcoding "/admin/..." here bounced
  // every Topbar action through the LegacyAdminRedirect catch-all in
  // App.jsx, remounting the whole layout on every click.
  const activeProjectId = getPrimaryProjectId();
  const activeMembership = activeProjectId
    ? getProjectMembership(activeProjectId)
    : null;
  const activeProjectRole = String(
    activeMembership?.role || "DEVELOPER",
  ).toUpperCase();
  const memberRolePrefix =
    activeProjectRole === "PROJECT_ADMIN"
      ? "/member/projectadmin"
      : activeProjectRole === "TEAM_LEAD"
        ? "/member/teamlead"
        : activeProjectRole === "VIEWER"
          ? "/member/viewer"
          : "/member/developer";
  const basePrefix = isSystemAdmin() ? "/systemadmin" : memberRolePrefix;

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification) return navigate(`${basePrefix}/notifications`);
    try {
      const data = JSON.parse(notification.data || "{}");
      if (data.ticketId || data.taskId)
        return navigate(`${basePrefix}/tickets`);
      if (data.projectId) return navigate(`${basePrefix}/projects`);
    } catch {
      // Malformed notification payload — fall through to the default route.
    }
    navigate(`${basePrefix}/notifications`);
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
            "0 1px 0 rgba(16,24,40,.04), 0 14px 34px rgba(16,24,40,.045)",
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
              Admin Workspace
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Plan, manage and deliver
            </Typography>
          </Box>
          <Button
            onClick={() => setSearchOpen(true)}
            startIcon={<SearchRoundedIcon fontSize="small" />}
            endIcon={
              <Box
                sx={{
                  display: { xs: "none", md: "flex" },
                  alignItems: "center",
                  gap: 0.25,
                  ml: 1,
                  color: "text.disabled",
                }}
              >
                <KeyboardCommandKeyRoundedIcon sx={{ fontSize: 13 }} />
                <Typography variant="caption">K</Typography>
              </Box>
            }
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
              "&:hover": { bgcolor: SURFACE_SUBTLE, borderColor: BORDER },
            }}
          >
            Search projects, tickets, people...
          </Button>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}
          >
            <Button
              onClick={(e) => setCreateAnchor(e.currentTarget)}
              variant="contained"
              startIcon={<AddRoundedIcon />}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                minHeight: 40,
                px: 1.5,
              }}
            >
              Create
            </Button>
            <ThemeSwitcher />
            <NotificationBell
              userId={user?.userId ?? user?.id}
              notifiableType="User"
              onNotificationClick={handleNotificationClick}
            />
            <Tooltip title={name}>
              <IconButton
                onClick={(e) => setUserAnchor(e.currentTarget)}
                aria-label="Open profile menu"
              >
                <MemberAvatar
                  userId={user?.userId ?? user?.id}
                  name={name}
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
            </Tooltip>
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
            navigate(`${basePrefix}/projects/create`);
          }}
        >
          Create project
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateAnchor(null);
            navigate(`${basePrefix}/tickets`);
          }}
        >
          Create ticket
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateAnchor(null);
            navigate(`${basePrefix}/users`);
          }}
        >
          Add user
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
            navigate(`${basePrefix}/users`);
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
      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

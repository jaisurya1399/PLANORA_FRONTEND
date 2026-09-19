import {
  AccessTimeOutlined,
  AssessmentOutlined,
  AssignmentOutlined,
  AutoAwesomeOutlined,
  DashboardOutlined,
  EventAvailableOutlined,
  FolderOutlined,
  GroupsOutlined,
  NotificationsNoneOutlined,
  PersonOutline,
  ViewKanbanOutlined,
} from "@mui/icons-material";
import Close from "@mui/icons-material/Close";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PlanoraLogo from "../../PlanoraLogo";
import { MOTION, PRIORITY_COLORS, RADIUS, SIDEBAR } from "../../theme/colors";

export const DRAWER_WIDTH = SIDEBAR.width;

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/developer", icon: DashboardOutlined },
      {
        label: "My Projects",
        path: "/developer/projects",
        icon: FolderOutlined,
      },
      {
        label: "My Tickets",
        path: "/developer/tickets",
        icon: AssignmentOutlined,
      },
      {
        label: "Board",
        path: "/developer/board",
        icon: ViewKanbanOutlined,
      },
      {
        label: "Daily Scrum",
        path: "/developer/daily-scrum",
        icon: GroupsOutlined,
      },
      {
        label: "Reports & Analytics",
        path: "/developer/time-tracking",
        icon: AssessmentOutlined,
        // Sprint Analytics is not available to Developers.
        // Viewers keep the separate read-only Reports page.
        roles: ["VIEWER"],
      },
    ],
  },
  {
    title: "Team",
    roles: ["PROJECT_ADMIN", "TEAM_LEAD"],
    items: [
      {
        label: "Sprint Analytics",
        path: "/developer/time-tracking",
        icon: AssessmentOutlined,
        roles: ["PROJECT_ADMIN", "TEAM_LEAD"],
      },
    ],
  },
  {
    title: "General",
    items: [
      {
        label: "Notifications",
        path: "/developer/notifications",
        icon: NotificationsNoneOutlined,
      },
      {
        label: "Team Chat & Meetings",
        path: "/developer/communication",
        icon: GroupsOutlined,
      },
      {
        label: "AI Project Manager",
        path: "/developer/ai-pm",
        icon: AutoAwesomeOutlined,
        roles: ["PROJECT_ADMIN", "TEAM_LEAD"],
      },
    ],
  },
  {
    title: "Time",
    items: [
      {
        label: "Timesheet",
        path: "/developer/timesheet",
        icon: AccessTimeOutlined,
      },
      {
        label: "Availability",
        path: "/developer/availability",
        icon: EventAvailableOutlined,
      },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", path: "/developer/profile", icon: PersonOutline },
    ],
  },
];

const roleLabel = (role) =>
  String(role || "Developer")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const {
    logout,
    user,
    isSystemAdmin,
    getPrimaryProjectId,
    setActiveProjectId,
    getProjectMembership,
    hasActionPermission,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const memberships = useMemo(
    () => (user?.projectMemberships || []).filter((m) => m?.projectId),
    [user?.projectMemberships],
  );

  const activeProjectId = getPrimaryProjectId();
  const activeMembership = activeProjectId
    ? getProjectMembership(activeProjectId)
    : null;
  const activeRole = activeMembership?.role || "DEVELOPER";

  const memberPrefix = `/member/${
    String(activeRole).toUpperCase() === "PROJECT_ADMIN"
      ? "projectadmin"
      : String(activeRole).toUpperCase() === "TEAM_LEAD"
        ? "teamlead"
        : String(activeRole).toUpperCase() === "VIEWER"
          ? "viewer"
          : "developer"
  }`;

  const resolvePath = (path) => {
    if (String(activeRole).toUpperCase() === "VIEWER") {
      if (path === "/developer") return "/member/viewer";
      if (path === "/developer/projects") return "/member/viewer/projects";
      if (path === "/developer/time-tracking") return "/member/viewer/reports";
      if (path === "/developer/communication")
        return "/member/viewer/communication";
      if (path === "/developer/profile") return "/member/viewer/profile";
      return null;
    }
    return path.replace(/^\/developer(?=\/|$)/, memberPrefix);
  };

  const visibleSections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items
          .map((item) => ({ ...item, path: resolvePath(item.path) }))
          .filter((item) => item.path)
          .filter((item) => {
            if (String(activeRole).toUpperCase() === "VIEWER") {
              const allowedViewerLabels = new Set([
                "Dashboard",
                "My Projects",
                "Reports & Analytics",
                "Team Chat & Meetings",
                "Profile",
              ]);
              if (!allowedViewerLabels.has(item.label)) return false;
            }
            if (
              item.roles &&
              !item.roles.includes(String(activeRole).toUpperCase())
            )
              return false;
            return (
              !item.permission ||
              hasActionPermission(activeProjectId, item.permission)
            );
          }),
      })).filter((section) => section.items.length),
    [activeProjectId, activeRole, hasActionPermission],
  );

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: SIDEBAR.background,
        color: SIDEBAR.itemText,
      }}
    >
      <Box
        sx={{
          minHeight: 82,
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1.1,
          borderBottom: `1px solid ${SIDEBAR.border}`,
        }}
      >
        <Box
          sx={{
            p: 0.5,
            borderRadius: 2.5,
            background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(200,161,90,.18)",
          }}
        >
          <PlanoraLogo size={34} dark showText={false} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            noWrap
            sx={{ fontSize: 15, fontWeight: 800, color: "#FFF" }}
          >
            Planora
          </Typography>
          <Typography noWrap sx={{ fontSize: 11, color: "#94A3B8" }}>
            {isSystemAdmin() ? "System Administrator" : roleLabel(activeRole)}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ display: { xs: "flex", md: "none" }, color: "#94A3B8" }}
          aria-label="Close"
        >
          <Close />
        </IconButton>
      </Box>

      {!isSystemAdmin() && memberships.length > 0 && (
        <Box
          sx={{
            px: 1.5,
            py: 1.25,
            borderBottom: `1px solid ${SIDEBAR.border}`,
          }}
        >
          <Typography
            sx={{
              px: 0.5,
              mb: 0.5,
              fontSize: 10.5,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              color: SIDEBAR.sectionHeader,
            }}
          >
            Current Project
          </Typography>
          <Select
            fullWidth
            size="small"
            value={activeProjectId ?? ""}
            onChange={(e) => {
              const nextId = setActiveProjectId(e.target.value);
              const membership = getProjectMembership(nextId);
              const nextRole = String(
                membership?.role || "DEVELOPER",
              ).toUpperCase();
              const nextPath =
                nextRole === "PROJECT_ADMIN"
                  ? "/member/projectadmin"
                  : nextRole === "TEAM_LEAD"
                    ? "/member/teamlead"
                    : nextRole === "VIEWER"
                      ? "/member/viewer"
                      : "/member/developer";
              navigate(nextPath);
              onClose();
            }}
            sx={{
              color: SIDEBAR.selectorText,
              backgroundColor: "#f8fafc",
              ".MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,.16)",
              },
              "& .MuiSvgIcon-root": { color: "#CBD5E1" },
            }}
          >
            {memberships.map((m) => (
              <MenuItem key={m.projectId} value={m.projectId}>
                {m.projectName || m.project?.name || `Project #${m.projectId}`}{" "}
                — {roleLabel(m.role)}
              </MenuItem>
            ))}
          </Select>
        </Box>
      )}

      <Box
        component="nav"
        aria-label="Project navigation"
        sx={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",
          scrollbarGutter: "stable",
          px: 1.25,
          py: 1.5,
        }}
      >
        {visibleSections.map((section) => (
          <Box key={section.title} sx={{ mb: 1.8 }}>
            <Typography
              sx={{
                px: 1.5,
                mb: 0.75,
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                color: SIDEBAR.sectionHeader,
              }}
            >
              {section.title}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/developer" &&
                    location.pathname.startsWith(`${item.path}/`));

                return (
                  <ListItemButton
                    key={item.path}
                    selected={isActive}
                    component="button"
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={(event) => {
                      onClose?.();
                      // Internal project navigation must stay inside the SPA.
                      if (
                        event.button === 0 &&
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey
                      ) {
                        event.preventDefault();
                        navigate(item.path);
                      }
                    }}
                    sx={{
                      position: "relative",
                      minHeight: 42,
                      mb: 0.35,
                      pl: 1.75,
                      pr: 1.5,
                      borderRadius: `${RADIUS.button}px`,
                      color: SIDEBAR.itemText,
                      textDecoration: "none",
                      transition: `background-color ${MOTION.fast} ${MOTION.easing}, color ${MOTION.fast} ${MOTION.easing}`,
                      "& .MuiListItemIcon-root": {
                        minWidth: 36,
                        color: "#94A3B8",
                      },
                      "&:hover": { bgcolor: SIDEBAR.itemHoverBg },
                      "&.Mui-selected": {
                        color: SIDEBAR.itemSelectedText,
                        background: SIDEBAR.itemSelectedBg,
                        fontWeight: 650,
                      },
                      "&.Mui-selected:hover": {
                        background: SIDEBAR.itemSelectedBg,
                      },
                      "&.Mui-selected .MuiListItemIcon-root": {
                        color: SIDEBAR.itemSelectedText,
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Box sx={{ p: 1.25, borderTop: `1px solid ${SIDEBAR.border}` }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: `${RADIUS.button}px`,
            color: PRIORITY_COLORS.HIGHEST,
            "&:hover": { bgcolor: "rgba(205,19,23,.08)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>
            <LogoutOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            border: "none",
            borderRight: `1px solid ${SIDEBAR.border}`,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

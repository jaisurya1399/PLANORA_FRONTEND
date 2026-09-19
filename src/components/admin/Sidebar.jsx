import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import ViewKanbanRoundedIcon from "@mui/icons-material/ViewKanbanRounded";
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PlanoraLogo from "../../PlanoraLogo";
import { BORDER, MOTION, SIDEBAR } from "../../theme/colors";

export const DRAWER_WIDTH = 252;

const SECTIONS = [
  {
    title: "Work",
    icon: DashboardRoundedIcon,
    items: [
      ["Overview", "/admin", DashboardRoundedIcon],
      ["Projects", "/admin/projects", FolderRoundedIcon, "project.view"],
      // ["Create Project", "/admin/projects/create", FolderRoundedIcon, "project.create"],
      ["Tickets", "/admin/tickets", ConfirmationNumberRoundedIcon],
      [
        "Backlog",
        "/admin/backlog",
        ConfirmationNumberRoundedIcon,
        "ticket.view",
      ],
      ["Board", "/admin/board", ViewKanbanRoundedIcon, "ticket.view"],
    ],
  },
  {
    title: "Planning",
    icon: MapRoundedIcon,
    items: [
      ["Epics", "/admin/epics", FlagRoundedIcon, "epic.view"],
      ["Roadmap", "/admin/roadmap", MapRoundedIcon],
      ["Milestones", "/admin/milestones", FlagRoundedIcon],
      ["Releases & Versions", "/admin/releases", FlagRoundedIcon],
      ["Daily Scrum", "/admin/daily-scrum", GroupsRoundedIcon],
    ],
  },
  {
    title: "Insights",
    icon: InsightsRoundedIcon,
    items: [
      [
        "Dashboards & Analytics",
        "/admin/dashboard-analytics",
        InsightsRoundedIcon,
      ],
      [
        "Sprint Analytics",
        "/admin/time-tracking",
        AssessmentRoundedIcon,
        "sprint.analytics.view",
      ],
      [
        "Enterprise Reports",
        "/admin/enterprise-reports",
        AssessmentRoundedIcon,
      ],
      [
        "Enterprise Management",
        "/admin/enterprise-management",
        AssessmentRoundedIcon,
      ],
      ["Activities", "/admin/activities", TimelineRoundedIcon],
      // [
      //   "AI Project Manager",
      //   "/admin/ai-pm",
      //   AutoAwesomeRoundedIcon,
      //   "project.view",
      // ],
    ],
  },
  {
    title: "People",
    icon: GroupsRoundedIcon,
    items: [
      ["Users", "/admin/users", GroupsRoundedIcon, "user.view"],
      [
        "Project Teams",
        "/admin/project-teams",
        GroupsRoundedIcon,
        "project_team.view",
      ],
      ["Reminders", "/admin/reminders", NotificationsNoneRoundedIcon],
      ["Team Chat & Meetings", "/admin/communication", GroupsRoundedIcon],
    ],
  },
  {
    title: "Administration",
    icon: SettingsRoundedIcon,
    items: [
      ["Project Status", "/admin/project-status", TuneRoundedIcon],
      ["Ticket Status", "/admin/ticket-status", TuneRoundedIcon],
      [
        "Ticket Types",
        "/admin/ticket-types",
        TuneRoundedIcon,
        "ticket_type.view",
      ],
      [
        "Custom Fields",
        "/admin/custom-fields",
        TuneRoundedIcon,
        "custom_field.view",
      ],
      [
        "Field Configuration",
        "/admin/field-configurations",
        TuneRoundedIcon,
        "field_configuration.view",
      ],
      [
        "Screen Configuration",
        "/admin/screen-configurations",
        TuneRoundedIcon,
        "screen_configuration.view",
      ],
      // [
      //   "Workflow Configuration",
      //   "/admin/workflow",
      //   TuneRoundedIcon,
      //   "workflow.view",
      // ],
      [
        "Ticket Templates",
        "/admin/ticket-templates",
        TuneRoundedIcon,
        "ticket_template.view",
      ],
      [
        "Ticket Priorities",
        "/admin/ticket-priorities",
        TuneRoundedIcon,
        "ticket_priority.view",
      ],
      ["Security", "/admin/security", SecurityRoundedIcon],
      ["Roles", "/admin/roles", AdminPanelSettingsRoundedIcon, "role.view"],
      [
        "Permissions",
        "/admin/permissions",
        SecurityRoundedIcon,
        "permission.view",
      ],
      // [
      //   "Project Security",
      //   "/admin/project-security",
      //   SecurityRoundedIcon,
      //   "permission_scheme.view",
      // ],
      ["Notifications", "/admin/notifications", NotificationsNoneRoundedIcon],
    ],
  },
  {
    title: "Time",
    icon: AccessTimeRoundedIcon,
    items: [
      [
        "Timesheet Dashboard",
        "/admin/timesheet-dashboard",
        DashboardRoundedIcon,
      ],
      ["Timesheet", "/admin/timesheet", AccessTimeRoundedIcon],
      ["Timesheet Export", "/admin/timesheet-export", AccessTimeRoundedIcon],
      [
        "Member Availability",
        "/admin/member-availability",
        EventAvailableRoundedIcon,
      ],
    ],
  },
];

function Item({ item, active, onClose, navigate }) {
  const [label, path, Icon] = item;
  return (
    <ListItemButton
      component="button"
      selected={active}
      type="button"
      onClick={(event) => {
        onClose?.();
        // Force all internal sidebar navigation through React Router.
        // This prevents the browser from performing a document navigation.
        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          navigate(path);
        }
      }}
      aria-current={active ? "page" : undefined}
      sx={{
        minHeight: 42,
        mb: 0.35,
        px: 1.5,
        borderRadius: 1.5,
        position: "relative",
        color: active ? "#FFFFFF" : SIDEBAR.itemText,
        transition: `background-color ${MOTION.fast} ${MOTION.easing}, transform ${MOTION.fast} ${MOTION.easingOut}`,
        "&:hover": {
          bgcolor: active ? "rgba(99,102,241,.22)" : SIDEBAR.itemHoverBg,
          transform: "translateX(1px)",
        },
        "&.Mui-selected": {
          background: SIDEBAR.itemSelectedBg,
          color: "#FFFFFF",
          fontWeight: 700,
        },
        "&.Mui-selected::before": {
          content: '""',
          position: "absolute",
          left: 3,
          top: 8,
          bottom: 8,
          width: 3,
          borderRadius: 3,
          background: "linear-gradient(180deg, #8B8DF0 0%, #8B5CF6 100%)",
        },
      }}
    >
      <Box
        sx={{ width: 28, display: "grid", placeItems: "center", flexShrink: 0 }}
      >
        <Icon sx={{ fontSize: 19 }} />
      </Box>
      <Typography
        noWrap
        sx={{ ml: 1, fontSize: 13.5, fontWeight: active ? 700 : 500 }}
      >
        {label}
      </Typography>
    </ListItemButton>
  );
}

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const {
    logout,
    hasActionPermission,
    isSystemAdmin,
    getPrimaryProjectId,
    getProjectMembership,
    setActiveProjectId,
    user,
  } = useAuth();

  const activeProjectId = getPrimaryProjectId();
  const activeMembership = activeProjectId
    ? getProjectMembership(activeProjectId)
    : null;
  const activeProjectRole = String(
    activeMembership?.role || "DEVELOPER",
  ).toUpperCase();

  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState({});

  const memberRolePrefix =
    activeProjectRole === "PROJECT_ADMIN"
      ? "/member/projectadmin"
      : activeProjectRole === "TEAM_LEAD"
        ? "/member/teamlead"
        : activeProjectRole === "VIEWER"
          ? "/member/viewer"
          : "/member/developer";

  // IMPORTANT: this must match the actually-registered route prefix
  // ("/systemadmin/*" in App.jsx), not the legacy "/admin/*" path. The old
  // "/admin" value forced every click through the LegacyAdminRedirect
  // catch-all, which unmounted and remounted the whole admin layout
  // (Sidebar + Topbar) on every single navigation — visible as a full
  // "page reload" even though it was really just React tearing the tree
  // down and rebuilding it.
  const basePrefix = isSystemAdmin() ? "/systemadmin" : memberRolePrefix;

  const visibleSections = useMemo(() => {
    const canonicalPath = (path) =>
      path === "/admin"
        ? basePrefix
        : path.replace(/^\/admin(?=\/)/, basePrefix);

    const systemPaths = new Set([
      "/admin",
      "/admin/projects",
      "/admin/projects/create",
      "/admin/enterprise-reports",
      "/admin/enterprise-management",
      "/admin/activities",
      "/admin/users",
      "/admin/roles",
      "/admin/permissions",
      "/admin/security",
    ]);

    const globalOnly = new Set([
      "/admin/projects",
      "/admin/enterprise-reports",
      "/admin/enterprise-management",
      "/admin/users",
      "/admin/roles",
      "/admin/permissions",
      "/admin/security",
    ]);

    const teamLeadBlocked = new Set([
      "/admin/project-status",
      "/admin/ticket-status",
      "/admin/ticket-types",
      "/admin/custom-fields",
      "/admin/field-configurations",
      "/admin/screen-configurations",
      "/admin/workflow",
      "/admin/ticket-templates",
      "/admin/project-teams",
      "/admin/project-security",
      "/admin/ticket-priorities",
      "/admin/notifications",
      "/admin/activities",
    ]);

    const permissionByPath = {
      "/admin": "PROJECT_VIEW",
      "/admin/projects": "PROJECT_VIEW",
      "/admin/tickets": "TICKET_VIEW",
      "/admin/backlog": "BACKLOG_MANAGE",
      "/admin/board": "TICKET_VIEW",
      "/admin/epics": "PROJECT_VIEW",
      "/admin/roadmap": "PROJECT_VIEW",
      "/admin/milestones": "PROJECT_VIEW",
      "/admin/releases": "PROJECT_VIEW",
      "/admin/daily-scrum": "PROJECT_VIEW",
      "/admin/member-availability": "PROJECT_VIEW",
      "/admin/scrum-dashboard": "SPRINT_ANALYTICS_VIEW",
      "/admin/dashboard-analytics": "PROJECT_REPORT_VIEW",
      "/admin/time-tracking": "SPRINT_ANALYTICS_VIEW",
      "/admin/ai-pm": "PROJECT_VIEW",
      "/admin/reminders": "PROJECT_VIEW",
      "/admin/communication": "PROJECT_VIEW",
      "/admin/project-status": "PROJECT_SETTINGS_MANAGE",
      "/admin/ticket-status": "TICKET_STATUS_MANAGE",
      "/admin/ticket-types": "TICKET_TYPE_MANAGE",
      "/admin/custom-fields": "PROJECT_SETTINGS_MANAGE",
      "/admin/field-configurations": "PROJECT_SETTINGS_MANAGE",
      "/admin/screen-configurations": "PROJECT_SETTINGS_MANAGE",
      "/admin/workflow": "PROJECT_WORKFLOW_MANAGE",
      "/admin/ticket-templates": "PROJECT_SETTINGS_MANAGE",
      "/admin/project-teams": "PROJECT_MEMBER_MANAGE",
      "/admin/project-security": "PROJECT_SETTINGS_MANAGE",
      "/admin/ticket-priorities": "TICKET_PRIORITY_MANAGE",
      "/admin/notifications": "NOTIFICATION_MANAGE",
      "/admin/timesheet-dashboard": "WORKLOG_CREATE",
      "/admin/timesheet": "WORKLOG_CREATE",
      "/admin/timesheet-export": "WORKLOG_CREATE",
    };

    return SECTIONS.map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          const originalPath = item[1];
          let label = item[0];
          // if (
          //   originalPath === "/admin/activities" &&
          //   activeProjectRole === "PROJECT_ADMIN"
          // ) {
          //   label = "Project Audit";
          // }
          if (originalPath === "/admin/activities" && isSystemAdmin()) {
            label = "Activity Master";
          }
          return [
            label,
            canonicalPath(originalPath),
            item[2],
            item[3],
            originalPath,
          ];
        })
        .filter((item) => {
          const originalPath = item[4];

          if (isSystemAdmin()) {
            return systemPaths.has(originalPath);
          }

          if (globalOnly.has(originalPath)) return false;
          if (
            activeProjectRole === "TEAM_LEAD" &&
            teamLeadBlocked.has(originalPath)
          )
            return false;
          if (originalPath === "/admin/activities")
            return activeProjectRole === "PROJECT_ADMIN";
          if (originalPath === "/admin/projects/create") return false;

          // Sprint Analytics is a project-level analytics feature.
          // It is available only to Project Administrator and Team Lead.
          if (
            originalPath === "/admin/time-tracking" &&
            !["PROJECT_ADMIN", "TEAM_LEAD"].includes(activeProjectRole)
          ) {
            return false;
          }

          const required = permissionByPath[originalPath];
          return !required || hasActionPermission(activeProjectId, required);
        })
        .map(([label, path, Icon, permission]) => [
          label,
          path,
          Icon,
          permission,
        ]),
    })).filter((section) => section.items.length);
  }, [
    activeProjectId,
    activeProjectRole,
    hasActionPermission,
    isSystemAdmin,
    basePrefix,
  ]);

  useEffect(() => {
    const active = {};
    visibleSections.forEach((section) => {
      if (
        section.items.some(
          (item) =>
            location.pathname === item[1] ||
            location.pathname.startsWith(`${item[1]}/`),
        )
      )
        active[section.title] = true;
    });
    setOpen((prev) => ({ ...prev, ...active }));
  }, [location.pathname, visibleSections]);

  const role = isSystemAdmin()
    ? "System Administrator"
    : activeProjectRole === "PROJECT_ADMIN"
      ? "Project Administrator"
      : activeProjectRole === "TEAM_LEAD"
        ? "Team Lead"
        : activeProjectRole === "VIEWER"
          ? "Viewer"
          : "Developer"
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
  const content = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: SIDEBAR.background,
      }}
    >
      <Box
        sx={{
          height: 72,
          px: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
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
            sx={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF" }}
          >
            Planora
          </Typography>
          <Typography noWrap sx={{ fontSize: 11, color: "#AAB5D0" }}>
            {role}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          aria-label="Close navigation"
          sx={{ display: { xs: "flex", md: "none" } }}
        >
          <MenuOpenRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
      {!isSystemAdmin() && (user?.projectMemberships || []).length > 0 && (
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
              const nextPrefix =
                nextRole === "PROJECT_ADMIN"
                  ? "/member/projectadmin"
                  : nextRole === "TEAM_LEAD"
                    ? "/member/teamlead"
                    : nextRole === "VIEWER"
                      ? "/member/viewer"
                      : "/member/developer";
              navigate(nextPrefix);
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
            {(user?.projectMemberships || [])
              .filter((m) => m?.projectId)
              .map((m) => (
                <MenuItem key={m.projectId} value={m.projectId}>
                  {m.projectName || `Project #${m.projectId}`}—{" "}
                  {String(m.role || "").replace(/_/g, " ")}
                </MenuItem>
              ))}
          </Select>
        </Box>
      )}

      <Box
        component="nav"
        aria-label="Admin navigation"
        sx={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",
          scrollbarGutter: "stable",
          px: 1,
          py: 1.25,
        }}
      >
        {visibleSections.map((section) => {
          const active = section.items.some(
            (item) =>
              location.pathname === item[1] ||
              location.pathname.startsWith(`${item[1]}/`),
          );
          const expanded =
            open[section.title] ?? (active || section.title === "Work");
          const SectionIcon = section.icon;
          return (
            <Box key={section.title} sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() =>
                  setOpen((p) => ({ ...p, [section.title]: !expanded }))
                }
                aria-expanded={expanded}
                sx={{
                  minHeight: 38,
                  px: 1.25,
                  borderRadius: 1.5,
                  color: active ? "#FFFFFF" : SIDEBAR.itemText,
                  "&:hover": { bgcolor: SIDEBAR.itemHoverBg },
                }}
              >
                <Box sx={{ width: 28, display: "grid", placeItems: "center" }}>
                  <SectionIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography
                  sx={{
                    ml: 1,
                    flex: 1,
                    fontSize: 11.5,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  {section.title}
                </Typography>
                <ExpandMoreRoundedIcon
                  sx={{
                    fontSize: 18,
                    transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: `transform ${MOTION.fast} ${MOTION.easing}`,
                  }}
                />
              </ListItemButton>
              <Collapse in={expanded} timeout={180}>
                <List disablePadding sx={{ mt: 0.25 }}>
                  {section.items.map((item) => (
                    <Item
                      key={item[1]}
                      item={item}
                      active={
                        location.pathname === item[1] ||
                        location.pathname.startsWith(`${item[1]}/`)
                      }
                      onClose={onClose}
                      navigate={navigate}
                    />
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>
      <Divider sx={{ borderColor: SIDEBAR.border }} />
      <Box sx={{ p: 1 }}>
        <ListItemButton
          onClick={() => {
            onClose();
            logout();
          }}
          sx={{
            minHeight: 42,
            borderRadius: 1.5,
            color: SIDEBAR.itemText,
            "&:hover": { bgcolor: SIDEBAR.itemHoverBg },
          }}
        >
          <Box sx={{ width: 28, display: "grid", placeItems: "center" }}>
            <LogoutRoundedIcon fontSize="small" />
          </Box>
          <Typography sx={{ ml: 1, fontSize: 13.5, fontWeight: 650 }}>
            Sign out
          </Typography>
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            border: 0,
            borderRight: `1px solid ${BORDER}`,
            boxShadow: "8px 0 30px rgba(16,24,40,.025)",
            boxSizing: "border-box",
          },
        }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: Math.min(DRAWER_WIDTH, 320),
            border: 0,
            boxSizing: "border-box",
          },
        }}
      >
        {content}
      </Drawer>
    </>
  );
}

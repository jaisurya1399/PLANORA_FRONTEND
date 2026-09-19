import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HistoryIcon from "@mui/icons-material/History";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import TimelineIcon from "@mui/icons-material/Timeline";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getBoardColumns,
  getBoardConfig,
  updateBoardColumns,
  updateBoardConfig,
} from "../../api/boardApi";
import { getSprintsByProject } from "../../api/sprintApi";
import { getProjectBoard, transitionTicket } from "../../api/ticketApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { RADIUS, TEXT_FAINT } from "../../theme/colors";
import BoardHistoryDialog from "./BoardHistoryDialog";
import KanbanBoardConfigDialog from "./KanbanBoardConfigDialog";
import KanbanCumulativeFlowDialog from "./KanbanCumulativeFlowDialog";

const LANE_ICONS = {
  ASSIGNEE: GroupsOutlinedIcon,
  EPIC: AccountTreeOutlinedIcon,
  PRIORITY: FlagOutlinedIcon,
};

const TICKET_SCOPE = {
  INVOLVED: "INVOLVED",
  OWNER: "OWNER",
  ALL: "ALL",
};

/* -----------------------------------------------------------------------
   Helper: Convert named colors to hex
----------------------------------------------------------------------- */

const NAMED_COLORS = {
  Blue: "#1976d2",
  Red: "#d32f2f",
  Green: "#2e7d32",
  Yellow: "#ed6c02",
  Orange: "#ed6c02",
  Purple: "#9c27b0",
  Pink: "#e91e63",
  Cyan: "#00bcd4",
  Grey: "#9e9e9e",
  Gray: "#9e9e9e",
  Brown: "#795548",
  Indigo: "#3f51b5",
  LightBlue: "#03a9f4",
  LightGreen: "#8bc34a",
  Lime: "#cddc39",
  Teal: "#009688",
  Amber: "#ffc107",
  DeepOrange: "#ff5722",
  DeepPurple: "#673ab7",
  Black: "#000000",
  White: "#ffffff",
};

function resolveColor(color) {
  if (!color) return undefined;
  if (
    color.startsWith("#") ||
    color.startsWith("rgb") ||
    color.startsWith("hsl")
  ) {
    return color;
  }
  return NAMED_COLORS[color] || color;
}

/* -----------------------------------------------------------------------
   Small presentational helpers
----------------------------------------------------------------------- */

function StatusDot({ color, size = 10 }) {
  const resolvedColor = resolveColor(color);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: resolvedColor || "text.secondary",
        flexShrink: 0,
      }}
    />
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <Box
      sx={{
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        textAlign: "center",
        px: 3,
        py: 4,
        color: "text.secondary",
        backgroundColor: alpha("#000", 0.02),
        borderRadius: `${RADIUS.card}px`,
        border: `1px dashed ${alpha("#000", 0.08)}`,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: alpha("#000", 0.04),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon sx={{ fontSize: 28, opacity: 0.6 }} />
      </Box>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

/* -----------------------------------------------------------------------
   Ticket card - Improved design
----------------------------------------------------------------------- */

function TicketCard({ ticket, onClick, onDragStart, onDragEnd, showEpic }) {
  const theme = useTheme();
  const initials = (ticket.responsibleName || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  const priorityColor = resolveColor(ticket.priorityColor);
  const typeColor = resolveColor(ticket.typeColor);

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, ticket)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(ticket.id)}
      elevation={0}
      sx={{
        cursor: "grab",
        border: `1px solid ${alpha("#000", 0.08)}`,
        borderRadius: `${RADIUS.card}px`,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: "background.paper",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px ${alpha("#000", 0.12)}`,
          borderColor: alpha(theme.palette.primary.main, 0.3),
        },
        "&:active": { cursor: "grabbing", transform: "translateY(-2px)" },
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Priority indicator bar */}
      {priorityColor && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: priorityColor,
            borderRadius: `${RADIUS.card}px ${RADIUS.card}px 0 0`,
          }}
        />
      )}

      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
          sx={{ mb: 1.25 }}
        >
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{
              color: "primary.main",
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              px: 1,
              py: 0.3,
              borderRadius: `${RADIUS.chip}px`,
            }}
          >
            {ticket.code || `#${ticket.id}`}
          </Typography>
          {ticket.priorityName && (
            <Chip
              size="small"
              label={ticket.priorityName}
              variant="outlined"
              sx={{
                fontSize: ".65rem",
                height: 20,
                fontWeight: 600,
                color: priorityColor || undefined,
                borderColor: priorityColor || undefined,
                backgroundColor: priorityColor
                  ? alpha(priorityColor, 0.08)
                  : undefined,
              }}
            />
          )}
        </Stack>

        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            lineHeight: 1.4,
            mb: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            color: "text.primary",
          }}
        >
          {ticket.name}
        </Typography>

        {showEpic && ticket.epicName && (
          <Chip
            size="small"
            label={`Epic: ${ticket.epicName}`}
            variant="outlined"
            sx={{
              mb: 1.5,
              maxWidth: "100%",
              fontSize: ".65rem",
              height: 22,
            }}
          />
        )}

        <Divider sx={{ my: 1.25, borderColor: alpha("#000", 0.06) }} />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            {ticket.typeName && (
              <Tooltip title={ticket.typeName}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: `${RADIUS.chip}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    backgroundColor: typeColor || TEXT_FAINT,
                  }}
                >
                  {ticket.typeIcon
                    ? String(ticket.typeIcon).slice(0, 1).toUpperCase()
                    : ticket.typeName.charAt(0).toUpperCase()}
                </Box>
              </Tooltip>
            )}
            {Number(ticket.estimation || 0) > 0 && (
              <Chip
                size="small"
                variant="outlined"
                label={`${ticket.estimation} sp`}
                sx={{
                  height: 22,
                  fontSize: ".65rem",
                  fontWeight: 600,
                  color: "text.secondary",
                }}
              />
            )}
          </Stack>

          <Tooltip title={ticket.responsibleName || "Unassigned"}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                backgroundColor: ticket.responsibleName
                  ? "primary.main"
                  : TEXT_FAINT,
                border: `2px solid ${alpha("#fff", 0.5)}`,
              }}
            >
              {ticket.responsibleName ? initials : "?"}
            </Box>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* -----------------------------------------------------------------------
   Board column - Improved design
----------------------------------------------------------------------- */

function BoardColumn({
  column,
  tickets,
  onTicketClick,
  onDragStart,
  onDragEnd,
  onDrop,
}) {
  const theme = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const limit = Number(column.wipLimit || 0);
  const isOverLimit = limit > 0 && tickets.length >= limit;
  const accentColor =
    resolveColor(column.statusColor) || theme.palette.text.secondary;

  return (
    <Paper
      elevation={0}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        // Only clear when the pointer leaves the actual column.
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setDragOver(false);
        }
      }}
      onDrop={(e) => {
        setDragOver(false);
        onDrop(e, column);
      }}
      sx={{
        minHeight: 520,
        display: "flex",
        flexDirection: "column",
        border: `2px solid ${dragOver ? theme.palette.primary.main : alpha("#000", 0.08)}`,
        borderRadius: `${RADIUS.card}px`,
        backgroundColor: dragOver
          ? alpha(theme.palette.primary.main, 0.04)
          : alpha("#fff", 0.5),
        boxShadow: dragOver
          ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
          : `0 2px 8px ${alpha("#000", 0.04)}`,
        overflow: "hidden",
        transition: "all 0.2s ease",
        transform: dragOver ? "scale(1.02)" : "scale(1)",
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          px: 2,
          py: 1.75,
          borderBottom: `1px solid ${alpha("#000", 0.06)}`,
          borderTop: `4px solid ${accentColor}`,
          backgroundColor: alpha("#fff", 0.8),
          backdropFilter: "blur(8px)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <StatusDot color={column.statusColor} size={12} />
            <Typography
              variant="subtitle1"
              fontWeight={700}
              noWrap
              title={column.displayName || column.statusName}
              sx={{ fontSize: "0.95rem", letterSpacing: 0.3 }}
            >
              {column.displayName || column.statusName}
            </Typography>
          </Stack>

          <Chip
            label={limit > 0 ? `${tickets.length} / ${limit}` : tickets.length}
            size="small"
            color={isOverLimit ? "error" : "default"}
            sx={{
              fontWeight: 700,
              minWidth: 52,
              flexShrink: 0,
              fontSize: ".7rem",
              height: 24,
            }}
          />
        </Stack>

        {isOverLimit && (
          <Typography
            variant="caption"
            color="error"
            sx={{ display: "block", mt: 0.75, fontWeight: 600 }}
          >
            ⚠️ WIP limit reached
          </Typography>
        )}
      </Box>

      {/* Tickets area */}
      <Box
        sx={{
          p: 1.5,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          backgroundColor: alpha("#000", 0.01),
        }}
      >
        {tickets.length === 0 ? (
          <EmptyState
            icon={InboxOutlinedIcon}
            message="No tickets in this column"
          />
        ) : (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={onTicketClick}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              showEpic={column.showEpic}
            />
          ))
        )}
      </Box>
    </Paper>
  );
}

/* -----------------------------------------------------------------------
   Header + toolbar - Improved design
----------------------------------------------------------------------- */

function BoardHeader({
  onConfigure,
  onCumulativeFlow,
  onHistory,
  onRefresh,
  refreshing,
  disabled,
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2.5,
        p: 2.5,
        backgroundColor: alpha(theme.palette.primary.main, 0.03),
        borderRadius: `${RADIUS.card}px`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      {/* Left: Title Section */}
      <Stack direction="row" spacing={2.5} alignItems="center">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 52,
            height: 52,
            borderRadius: `${RADIUS.card}px`,
            background: "var(--pm-btn-gradient)",
            color: "#fff",
            flexShrink: 0,
            boxShadow: `0 4px 12px ${alpha("#000", 0.15)}`,
            transform: "rotate(-3deg)",
          }}
        >
          <ViewKanbanIcon sx={{ fontSize: 28 }} />
        </Box>
        <Box>
          <Typography
            variant="h4"
            className="pm-gradient-title"
            sx={{
              display: "inline-block",
              fontWeight: 800,
              lineHeight: 1.1,
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
            }}
          >
            Kanban Board
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            Manage workflow, WIP limits, swimlanes and board configuration
          </Typography>
        </Box>
      </Stack>

      {/* Right: Action Buttons */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Tooltip title="Board configuration">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SettingsIcon />}
              onClick={onConfigure}
              disabled={disabled}
              sx={{
                borderRadius: `${RADIUS.button}px`,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Configure
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Cumulative flow">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TimelineIcon />}
              onClick={onCumulativeFlow}
              disabled={disabled}
              sx={{
                borderRadius: `${RADIUS.button}px`,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Cumulative Flow
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Status change history">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={<HistoryIcon />}
              onClick={onHistory}
              disabled={disabled}
              sx={{
                borderRadius: `${RADIUS.button}px`,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              History
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Refresh board">
          <span>
            <Button
              variant="contained"
              size="small"
              startIcon={
                refreshing ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <RefreshIcon />
                )
              }
              onClick={onRefresh}
              disabled={disabled || refreshing}
              sx={{
                borderRadius: `${RADIUS.button}px`,
                textTransform: "none",
                fontWeight: 600,
                px: 2,
              }}
            >
              Refresh
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
}

function LabeledSelect({ icon: Icon, label, value, onChange, children, sx }) {
  const theme = useTheme();

  return (
    <Stack spacing={1} sx={{ flex: 1, minWidth: 240, ...sx }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 700,
          letterSpacing: 0.5,
          pl: 0.5,
          textTransform: "uppercase",
          fontSize: ".65rem",
        }}
      >
        {label}
      </Typography>
      <Select
        size="small"
        value={value}
        onChange={onChange}
        displayEmpty
        input={
          <OutlinedInput
            startAdornment={
              <InputAdornment position="start">
                <Icon fontSize="small" color="action" />
              </InputAdornment>
            }
            sx={{
              borderRadius: `${RADIUS.input}px`,
              backgroundColor: alpha("#fff", 0.8),
              "& fieldset": {
                borderColor: alpha("#000", 0.12),
              },
              "&:hover fieldset": {
                borderColor: alpha(theme.palette.primary.main, 0.3),
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
                borderWidth: 2,
              },
            }}
          />
        }
        sx={{
          borderRadius: `${RADIUS.input}px`,
          backgroundColor: "background.paper",
          "& .MuiSelect-select": {
            py: 1.25,
            fontWeight: 500,
          },
        }}
      >
        {children}
      </Select>
    </Stack>
  );
}

function BoardToolbar({
  projects,
  selectedProjectId,
  onProjectChange,
  ticketScope,
  onScopeChange,
}) {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: `${RADIUS.card}px`,
        backgroundColor: alpha("#fff", 0.6),
        backdropFilter: "blur(12px)",
        border: `1px solid ${alpha("#000", 0.06)}`,
        boxShadow: `0 2px 12px ${alpha("#000", 0.04)}`,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2.5}
        alignItems="flex-end"
      >
        <LabeledSelect
          icon={FolderOpenOutlinedIcon}
          label="Project"
          sx={{ display: "none" }}
          value={selectedProjectId}
          onChange={onProjectChange}
        >
          {projects.map((p) => (
            <MenuItem key={p.id} value={String(p.id)}>
              {p.name}
            </MenuItem>
          ))}
        </LabeledSelect>

        <LabeledSelect
          icon={FilterAltOutlinedIcon}
          label="Ticket View"
          value={ticketScope}
          onChange={onScopeChange}
        >
          <MenuItem value={TICKET_SCOPE.INVOLVED}>Assigned to me</MenuItem>
          <MenuItem value={TICKET_SCOPE.OWNER}>Owned by me</MenuItem>
          <MenuItem value={TICKET_SCOPE.ALL}>All Tickets</MenuItem>
        </LabeledSelect>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "success.main",
              boxShadow: `0 0 12px ${alpha(theme.palette.success.main, 0.4)}`,
            }}
          />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Live Board
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

/* -----------------------------------------------------------------------
   Main page
----------------------------------------------------------------------- */

export default function Board() {
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceBase = location.pathname.startsWith("/member/projectadmin")
    ? "/member/projectadmin"
    : location.pathname.startsWith("/member/teamlead")
      ? "/member/teamlead"
      : location.pathname.startsWith("/member/viewer")
        ? "/member/viewer"
        : "/admin";
  const toast = useToast();
  const { user, getPrimaryProjectId } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [columns, setColumns] = useState([]);
  const [config, setConfig] = useState(null);
  const [columnConfig, setColumnConfig] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [ticketScope, setTicketScope] = useState(TICKET_SCOPE.ALL);

  const [configOpen, setConfigOpen] = useState(false);
  const [cfdOpen, setCfdOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Prevent a click event from firing after a drag operation.
  const isDraggingRef = useRef(false);

  const currentUserId = Number(
    user?.id ?? user?.userId ?? user?.sub ?? user?._id ?? user?.employeeId,
  );

  useEffect(() => {
    (async () => {
      try {
        const memberships = Array.isArray(user?.projectMemberships)
          ? user.projectMemberships
          : [];
        const activeId = getPrimaryProjectId();
        const list = memberships
          .filter(
            (m) => m?.projectId && Number(m.projectId) === Number(activeId),
          )
          .map((m) => ({
            id: Number(m.projectId),
            name: m.projectName || m.project?.name || `Project #${m.projectId}`,
          }));
        setProjects(list);
        if (list.length) setSelectedProjectId(String(list[0].id));
        else setLoading(false);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load projects.");
        setLoading(false);
      }
    })();
  }, [user, getPrimaryProjectId]);

  const loadBoard = useCallback(async (projectId, isRefresh = false) => {
    if (!projectId) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const [boardData, sprints, cfg, cols] = await Promise.all([
        getProjectBoard(projectId),
        getSprintsByProject(projectId),
        getBoardConfig(projectId),
        getBoardColumns(projectId),
      ]);

      const sprintList = Array.isArray(sprints) ? sprints : [];
      setActiveSprint(sprintList.find((s) => s.status === "ACTIVE") || null);
      setConfig(cfg);
      setColumnConfig(Array.isArray(cols) ? cols : []);

      const configMap = new Map(
        (Array.isArray(cols) ? cols : []).map((c) => [Number(c.statusId), c]),
      );

      const list = (Array.isArray(boardData) ? boardData : [])
        .map((c) => ({
          ...c,
          ...(configMap.get(Number(c.statusId)) || {}),
          showEpic: cfg?.showEpic !== false,
        }))
        .filter((c) => c.enabled !== false)
        .sort(
          (a, b) =>
            (a.displayOrder ?? a.order ?? 0) - (b.displayOrder ?? b.order ?? 0),
        );

      setColumns(list);
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message || e?.message || "Failed to load board.",
      );
      setColumns([]);
      setColumnConfig([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) loadBoard(selectedProjectId);
  }, [selectedProjectId, loadBoard]);

  const displayColumns = useMemo(() => {
    const sortTickets = (tickets = []) =>
      [...tickets].sort((a, b) => Number(a.id) - Number(b.id));

    if (config?.activeSprintOnly !== false && activeSprint) {
      return columns.map((c) => ({
        ...c,
        tickets: sortTickets(
          (c.tickets || []).filter(
            (t) => Number(t.sprintId) === Number(activeSprint.id),
          ),
        ),
      }));
    }

    return columns.map((c) => ({
      ...c,
      tickets: sortTickets(c.tickets || []),
    }));
  }, [columns, activeSprint, config]);
  const filteredColumns = useMemo(() => {
    if (
      ticketScope === TICKET_SCOPE.ALL ||
      !currentUserId ||
      Number.isNaN(currentUserId)
    ) {
      return displayColumns;
    }

    return displayColumns.map((column) => ({
      ...column,
      tickets: (column.tickets || []).filter((ticket) => {
        const ownerId = Number(ticket?.ownerId ?? ticket?.owner?.id);
        const responsibleId = Number(
          ticket?.responsibleId ??
            ticket?.assigneeId ??
            ticket?.responsible?.id ??
            ticket?.assignee?.id,
        );

        if (ticketScope === TICKET_SCOPE.OWNER) {
          return ownerId === currentUserId;
        }

        return responsibleId === currentUserId;
      }),
    }));
  }, [displayColumns, ticketScope, currentUserId]);

  const totalTicketCount = useMemo(
    () => filteredColumns.reduce((sum, c) => sum + (c.tickets?.length || 0), 0),
    [filteredColumns],
  );

  const lanes = useMemo(() => {
    const type = config?.swimlaneType || "NONE";
    if (type === "NONE") {
      return [{ key: "__all__", label: null, columns: filteredColumns }];
    }

    const getKey = (t) => {
      if (type === "ASSIGNEE")
        return t.responsibleId ? String(t.responsibleId) : "__unassigned__";
      if (type === "EPIC") return t.epicId ? String(t.epicId) : "__no_epic__";
      return t.priorityId ? String(t.priorityId) : "__no_priority__";
    };
    const getLabel = (t) => {
      if (type === "ASSIGNEE") return t.responsibleName || "Unassigned";
      if (type === "EPIC") return t.epicName || "No Epic";
      return t.priorityName || "No Priority";
    };

    const groups = new Map();
    filteredColumns.forEach((col) =>
      (col.tickets || []).forEach((t) => {
        const k = getKey(t);
        if (!groups.has(k)) groups.set(k, { key: k, label: getLabel(t) });
      }),
    );

    return [...groups.values()].map((g) => ({
      ...g,
      columns: filteredColumns.map((c) => ({
        ...c,
        tickets: (c.tickets || []).filter((t) => getKey(t) === g.key),
      })),
    }));
  }, [config, filteredColumns]);

  const handleDragStart = useCallback((e, ticket) => {
    if (!ticket?.id || ticket?.statusId == null) {
      e.preventDefault();
      return;
    }

    isDraggingRef.current = true;

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        ticketId: Number(ticket.id),
        fromStatusId: Number(ticket.statusId),
      }),
    );

    // Required by some browsers for reliable HTML5 drag/drop.
    try {
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          ticketId: Number(ticket.id),
          fromStatusId: Number(ticket.statusId),
        }),
      );
    } catch {
      // Ignore clipboard/dataTransfer fallback errors.
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    // Delay reset so the click generated immediately after drag is ignored.
    window.setTimeout(() => {
      isDraggingRef.current = false;
    }, 0);
  }, []);

  const handleTicketClick = useCallback(
    (ticketId) => {
      if (isDraggingRef.current) return;
      navigate(`${workspaceBase}/tickets/${ticketId}`);
    },
    [navigate, workspaceBase],
  );

  const handleDrop = useCallback(
    async (e, target) => {
      e.preventDefault();
      e.stopPropagation();

      if (!target?.statusId) return;

      let payload = {};
      const raw =
        e.dataTransfer.getData("application/json") ||
        e.dataTransfer.getData("text/plain") ||
        "";

      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }

      const ticketId = Number(payload?.ticketId);
      const fromStatusId = Number(payload?.fromStatusId);
      const targetStatusId = Number(target.statusId);

      if (
        !Number.isFinite(ticketId) ||
        !Number.isFinite(fromStatusId) ||
        !Number.isFinite(targetStatusId)
      ) {
        return;
      }

      // Dropping into the same status is a no-op.
      if (fromStatusId === targetStatusId) {
        isDraggingRef.current = false;
        return;
      }

      const sourceColumn = columns.find(
        (c) => Number(c.statusId) === fromStatusId,
      );
      const targetColumn = columns.find(
        (c) => Number(c.statusId) === targetStatusId,
      );

      const movedTicket =
        sourceColumn?.tickets?.find((t) => Number(t.id) === ticketId) ||
        columns
          .flatMap((c) => c.tickets || [])
          .find((t) => Number(t.id) === ticketId);

      if (!movedTicket) {
        isDraggingRef.current = false;
        toast.error("Ticket could not be found on the board.");
        return;
      }

      const limit = Number(target.wipLimit || 0);
      const targetCount = targetColumn?.tickets?.length || 0;

      if (config?.enforceWip && limit > 0 && targetCount >= limit) {
        isDraggingRef.current = false;
        toast.error(
          `WIP limit reached for ${
            target.displayName || target.statusName
          } (${limit}).`,
        );
        return;
      }

      // Keep an immutable snapshot for rollback.
      const previous = columns.map((column) => ({
        ...column,
        tickets: [...(column.tickets || [])],
      }));

      const updatedColumns = previous.map((column) => {
        const statusId = Number(column.statusId);

        // Remove ticket from its actual source column.
        if (statusId === fromStatusId) {
          return {
            ...column,
            tickets: (column.tickets || []).filter(
              (ticket) => Number(ticket.id) !== ticketId,
            ),
          };
        }

        // Add ticket to target column.
        if (statusId === targetStatusId) {
          const alreadyExists = (column.tickets || []).some(
            (ticket) => Number(ticket.id) === ticketId,
          );

          if (alreadyExists) return column;

          return {
            ...column,
            tickets: [
              ...(column.tickets || []),
              {
                ...movedTicket,
                statusId: targetStatusId,
                statusName: target.statusName,
                statusColor: target.statusColor,
                statusCategory: target.category,
              },
            ],
          };
        }

        return column;
      });

      // Always keep board tickets numerically sorted after a move.
      const sortTickets = (tickets = []) =>
        [...tickets].sort((a, b) => {
          const aId = Number(a?.id);
          const bId = Number(b?.id);

          if (!Number.isFinite(aId) && !Number.isFinite(bId)) return 0;
          if (!Number.isFinite(aId)) return 1;
          if (!Number.isFinite(bId)) return -1;

          return aId - bId;
        });

      const sortedColumns = updatedColumns.map((column) => ({
        ...column,
        tickets: sortTickets(column.tickets || []),
      }));

      setColumns(sortedColumns);

      try {
        await transitionTicket(ticketId, targetStatusId);

        toast.success(
          `Ticket ${movedTicket.code || `#${ticketId}`} moved to ${
            target.displayName || target.statusName
          }.`,
        );
      } catch (err) {
        setColumns(previous);

        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to move ticket. The board has been reverted.",
        );
      } finally {
        window.setTimeout(() => {
          isDraggingRef.current = false;
        }, 0);
      }
    },
    [columns, config, toast],
  );

  const saveConfiguration = async (form, rows) => {
    const [cfg, cols] = await Promise.all([
      updateBoardConfig(Number(selectedProjectId), form),
      updateBoardColumns(Number(selectedProjectId), rows),
    ]);
    setConfig(cfg);
    setColumnConfig(cols);
    setConfigOpen(false);
    await loadBoard(selectedProjectId, true);
    toast.success("Board configuration saved.");
  };

  const selectedProject = projects.find(
    (p) => Number(p.id) === Number(selectedProjectId),
  );
  const showActiveSprintBanner =
    activeSprint && config?.activeSprintOnly !== false;

  return (
    <Box className="app-page pm-fade-up" sx={{ minHeight: "100vh" }}>
      <BoardHeader
        onConfigure={() => setConfigOpen(true)}
        onCumulativeFlow={() => setCfdOpen(true)}
        onHistory={() => setHistoryOpen(true)}
        onRefresh={() => loadBoard(selectedProjectId, true)}
        refreshing={refreshing}
        disabled={!selectedProjectId}
      />

      <BoardToolbar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={(e) => setSelectedProjectId(e.target.value)}
        ticketScope={ticketScope}
        onScopeChange={(e) => setTicketScope(e.target.value)}
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: `${RADIUS.card}px` }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => loadBoard(selectedProjectId)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!selectedProjectId && !loading ? (
        <Card variant="outlined">
          <CardContent>
            <EmptyState
              icon={FolderOpenOutlinedIcon}
              message="No projects available"
            />
          </CardContent>
        </Card>
      ) : loading ? (
        <Box
          sx={{
            minHeight: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={40} />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              Loading board...
            </Typography>
          </Stack>
        </Box>
      ) : (
        <Box>
          {showActiveSprintBanner ? (
            <Alert
              severity="success"
              icon={<ViewKanbanIcon fontSize="inherit" />}
              sx={{ mb: 3, borderRadius: `${RADIUS.card}px` }}
              action={
                <Button
                  size="small"
                  color="inherit"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(`${workspaceBase}/backlog`)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  View in backlog
                </Button>
              }
            >
              Showing active sprint <strong>{activeSprint.name}</strong>
            </Alert>
          ) : (
            <Alert
              severity="info"
              icon={<InfoOutlinedIcon fontSize="inherit" />}
              sx={{ mb: 3, borderRadius: `${RADIUS.card}px` }}
            >
              Showing all board tickets. Enable active-sprint-only in board
              configuration if required.
            </Alert>
          )}

          {/* Stats bar */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              borderRadius: `${RADIUS.card}px`,
              backgroundColor: alpha("#fff", 0.5),
              border: `1px solid ${alpha("#000", 0.06)}`,
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ flexWrap: "wrap", gap: 1 }}
              alignItems="center"
            >
              <Chip
                label={`Total: ${totalTicketCount}`}
                variant="filled"
                sx={{
                  fontWeight: 700,
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                }}
              />
              {filteredColumns.map((c) => (
                <Chip
                  key={c.statusId}
                  icon={<StatusDot color={c.statusColor} size={8} />}
                  label={`${c.displayName || c.statusName}: ${c.tickets?.length || 0}${
                    c.wipLimit ? `/${c.wipLimit}` : ""
                  }`}
                  variant="outlined"
                  sx={{
                    borderColor: resolveColor(c.statusColor) || undefined,
                    color: resolveColor(c.statusColor) || undefined,
                    fontWeight: 600,
                    "& .MuiChip-icon": { ml: 0.5 },
                  }}
                />
              ))}
            </Stack>
          </Paper>

          {filteredColumns.length === 0 ? (
            <Card variant="outlined">
              <CardContent>
                <EmptyState
                  icon={ViewKanbanIcon}
                  message="This project has no board columns configured"
                />
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={3.5}>
              {lanes.map((lane) => {
                const LaneIcon = LANE_ICONS[config?.swimlaneType] || null;
                return (
                  <Box key={lane.key}>
                    {lane.label && (
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ mb: 1.5 }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: `${RADIUS.chip}px`,
                            backgroundColor: alpha("#000", 0.04),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {LaneIcon && (
                            <LaneIcon fontSize="medium" color="action" />
                          )}
                        </Box>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{ fontSize: "1.1rem" }}
                        >
                          {lane.label}
                        </Typography>
                      </Stack>
                    )}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: `repeat(${Math.min(filteredColumns.length, 4)}, minmax(280px, 1fr))`,
                        },
                        gap: 2.5,
                        overflowX: "auto",
                        pb: 1,
                      }}
                    >
                      {lane.columns.map((c) => (
                        <BoardColumn
                          key={`${lane.key}-${c.statusId}`}
                          column={c}
                          tickets={c.tickets || []}
                          onTicketClick={(id) =>
                            navigate(`${workspaceBase}/tickets/${id}`)
                          }
                          onDragStart={handleDragStart}
                          onDrop={handleDrop}
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}

          {selectedProject && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 3, display: "block", fontWeight: 500 }}
            >
              Project: {selectedProject.name} · Swimlanes:{" "}
              {config?.swimlaneType || "NONE"} · WIP enforcement:{" "}
              {config?.enforceWip ? "On" : "Off"}
            </Typography>
          )}
        </Box>
      )}

      <KanbanBoardConfigDialog
        open={configOpen}
        config={config}
        columns={columnConfig}
        onClose={() => setConfigOpen(false)}
        onSave={saveConfiguration}
      />
      <KanbanCumulativeFlowDialog
        open={cfdOpen}
        projectId={Number(selectedProjectId)}
        columns={displayColumns}
        onClose={() => setCfdOpen(false)}
      />
      <BoardHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        projectId={selectedProjectId}
      />
    </Box>
  );
}

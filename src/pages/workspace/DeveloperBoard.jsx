import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getSprintsByProject } from "../../api/sprintApi";
import { getProjectBoard, transitionTicket } from "../../api/ticketApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  BORDER,
  ELEVATION_SHADOW,
  RADIUS,
  TEXT_FAINT,
  TEXT_SECONDARY,
} from "../../theme/colors";

// Ticket scope options
const TICKET_SCOPE = {
  INVOLVED: "INVOLVED",
  OWNER: "OWNER",
  ALL: "ALL",
};

/* -----------------------------------------------------------------------
   Color resolution helper - converts named colors to hex
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
  // Already valid format
  if (
    color.startsWith("#") ||
    color.startsWith("rgb") ||
    color.startsWith("hsl")
  ) {
    return color;
  }
  // Named color
  return NAMED_COLORS[color] || color;
}

function safeAlpha(color, opacity) {
  const fallback = "#9E9E9E";
  if (!color) return alpha(fallback, opacity);
  try {
    return alpha(color, opacity);
  } catch {
    try {
      const resolved = resolveColor(color);
      return alpha(resolved, opacity);
    } catch {
      return alpha(fallback, opacity);
    }
  }
}

/* -----------------------------------------------------------------------
   Small presentational helpers
----------------------------------------------------------------------- */

function StatusDot({ color, size = 9 }) {
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

function EmptyState({ icon: Icon, title, description, minHeight = 150 }) {
  return (
    <Box
      sx={{
        minHeight,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
        textAlign: "center",
        px: 2,
      }}
    >
      <Icon
        sx={{
          fontSize: title ? 34 : 26,
          opacity: 0.4,
          color: "text.secondary",
        }}
      />
      {title && (
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
}

function formatDueDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const isOverdue = date.getTime() < now.getTime();
  const label = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return { label, isOverdue };
}

function sortTicketsAscending(tickets) {
  return [...tickets].sort((a, b) => Number(a?.id ?? 0) - Number(b?.id ?? 0));
}

/* -----------------------------------------------------------------------
   Ticket card
----------------------------------------------------------------------- */

function TicketCard({ ticket, onClick, onDragStart, canMove }) {
  const initials = (ticket.responsibleName || "?")
    .trim()
    .charAt(0)
    .toUpperCase();
  const priorityColor = resolveColor(ticket.priorityColor) || TEXT_FAINT;
  const typeColor = resolveColor(ticket.typeColor) || TEXT_FAINT;
  const due = formatDueDate(ticket.dueDate);

  return (
    <Card
      draggable={canMove}
      onDragStart={canMove ? (event) => onDragStart(event, ticket) : undefined}
      onClick={() => onClick(ticket.id)}
      elevation={0}
      sx={{
        position: "relative",
        cursor: canMove ? "grab" : "pointer",
        border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${priorityColor}`,
        borderRadius: `${RADIUS.card}px`,
        transition:
          "transform .15s ease, box-shadow .15s ease, border-color .15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: ELEVATION_SHADOW,
          borderColor: "primary.main",
          borderLeftColor: priorityColor,
        },
        "&:active": { cursor: canMove ? "grabbing" : "pointer" },
      }}
    >
      <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Typography variant="caption" fontWeight={800} color="primary.main">
            {ticket.code || `#${ticket.id}`}
          </Typography>
          {ticket.priorityName && (
            <Chip
              size="small"
              label={ticket.priorityName}
              sx={{
                height: 22,
                fontSize: ".68rem",
                fontWeight: 700,
                border: "none",
                color: priorityColor,
                bgcolor: safeAlpha(priorityColor, 0.14),
              }}
            />
          )}
        </Stack>

        <Typography
          variant="body2"
          fontWeight={650}
          sx={{
            lineHeight: 1.4,
            mb: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {ticket.name || "Untitled ticket"}
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: due ? 1 : 0 }}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            {ticket.typeName && (
              <Tooltip title={ticket.typeName}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#fff",
                    backgroundColor: typeColor,
                  }}
                >
                  {ticket.typeIcon
                    ? String(ticket.typeIcon).slice(0, 1).toUpperCase()
                    : ticket.typeName.slice(0, 1).toUpperCase()}
                </Box>
              </Tooltip>
            )}
            {Number(ticket.estimation || 0) > 0 && (
              <Chip
                size="small"
                variant="outlined"
                label={`${ticket.estimation} SP`}
                sx={{ height: 21, fontSize: ".65rem", borderColor: BORDER }}
              />
            )}
          </Stack>

          <Tooltip title={ticket.responsibleName || "Unassigned"}>
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                color: "#fff",
                bgcolor: ticket.responsibleName ? "primary.main" : TEXT_FAINT,
              }}
            >
              {ticket.responsibleName ? initials : "?"}
            </Box>
          </Tooltip>
        </Stack>

        {due && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <EventOutlinedIcon
              sx={{
                fontSize: 14,
                color: due.isOverdue ? "error.main" : "text.disabled",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: due.isOverdue ? "error.main" : "text.secondary",
                fontWeight: due.isOverdue ? 700 : 400,
              }}
            >
              {due.isOverdue ? `Overdue · ${due.label}` : `Due ${due.label}`}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

/* -----------------------------------------------------------------------
   Board column
----------------------------------------------------------------------- */

function BoardColumn({
  column,
  onTicketClick,
  onDragStart,
  onDrop,
  canBoardMove,
  canMoveTicket,
}) {
  const [dragOver, setDragOver] = useState(false);
  const tickets = column.tickets || [];
  const accentColor = resolveColor(column.statusColor) || "text.secondary";

  return (
    <Paper
      elevation={0}
      onDragOver={
        canBoardMove
          ? (event) => {
              event.preventDefault();
              setDragOver(true);
            }
          : undefined
      }
      onDragLeave={canBoardMove ? () => setDragOver(false) : undefined}
      onDrop={
        canBoardMove
          ? (event) => {
              setDragOver(false);
              onDrop(event, column);
            }
          : undefined
      }
      sx={{
        flex: "1 1 300px",
        minWidth: 280,
        maxWidth: 400,
        minHeight: 500,
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: dragOver ? "primary.main" : "divider",
        borderRadius: `${RADIUS.card}px`,
        bgcolor: dragOver ? alpha("#1976d2", 0.04) : "background.default",
        boxShadow: dragOver ? ELEVATION_SHADOW : "none",
        overflow: "hidden",
        transition:
          "border-color .15s ease, background-color .15s ease, box-shadow .15s ease",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          background: `linear-gradient(180deg, ${safeAlpha(accentColor, 0.1)} 0%, transparent 100%)`,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: accentColor,
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <StatusDot color={column.statusColor} />
            <Typography
              variant="subtitle1"
              fontWeight={750}
              noWrap
              title={column.displayName || column.statusName}
            >
              {column.displayName || column.statusName || "Status"}
            </Typography>
          </Stack>
          <Chip
            label={tickets.length}
            size="small"
            sx={{
              fontWeight: 750,
              minWidth: 36,
              flexShrink: 0,
              bgcolor: safeAlpha(accentColor, 0.16),
              color: accentColor,
            }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          p: 1.5,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
        }}
      >
        {tickets.length === 0 ? (
          <EmptyState
            icon={InboxOutlinedIcon}
            description="No tickets in this status."
          />
        ) : (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={onTicketClick}
              onDragStart={onDragStart}
              canMove={canMoveTicket(ticket)}
            />
          ))
        )}
      </Box>
    </Paper>
  );
}

/* -----------------------------------------------------------------------
   Header + toolbar
----------------------------------------------------------------------- */

function BoardHeader({
  membership,
  canBoardEdit,
  isDeveloper,
  refreshing,
  onRefresh,
  disabled,
}) {
  return (
    <Stack
      direction={{ xs: "column", lg: "row" }}
      alignItems={{ xs: "stretch", lg: "center" }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            background: "var(--pm-btn-gradient)",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <ViewKanbanOutlinedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography
            variant="h5"
            className="pm-gradient-title"
            sx={{ display: "inline-block", fontWeight: 800, lineHeight: 1.2 }}
          >
            Board
          </Typography>
          <Typography variant="body2" color={TEXT_SECONDARY}>
            Work with your project tickets across the workflow.
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        alignItems="center"
      >
        {membership?.role && (
          <Chip
            size="small"
            variant="outlined"
            sx={{
              borderColor: BORDER,
              color: "text.secondary",
              fontWeight: 600,
            }}
            label={membership.role.replaceAll("_", " ")}
          />
        )}
        {!canBoardEdit && (
          <Chip
            size="small"
            icon={<LockOutlinedIcon sx={{ fontSize: "14px !important" }} />}
            label="Read only"
            sx={{
              bgcolor: alpha("#9E9E9E", 0.16),
              color: "text.secondary",
              fontWeight: 600,
            }}
          />
        )}
        {isDeveloper && (
          <Chip
            size="small"
            label="Edit: assigned tickets only"
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              fontWeight: 600,
            }}
          />
        )}
        <Tooltip title="Refresh board">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={
                refreshing ? (
                  <CircularProgress size={15} />
                ) : (
                  <RefreshIcon fontSize="small" />
                )
              }
              onClick={onRefresh}
              disabled={disabled || refreshing}
              sx={{ textTransform: "none" }}
            >
              Refresh
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
}

function LabeledSelect({
  icon: Icon,
  label,
  value,
  onChange,
  children,
  maxWidth,
}) {
  return (
    <Stack
      spacing={0.5}
      sx={{ flex: 1, minWidth: 220, maxWidth: { md: maxWidth } }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, letterSpacing: 0.3, pl: 0.25 }}
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
          />
        }
      >
        {children}
      </Select>
    </Stack>
  );
}

function BoardToolbar({
  ticketScope,
  onScopeChange,
  totalTickets,
  activeSprint,
  projectName,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2.5,
        p: 2,
        border: `1px solid ${BORDER}`,
        borderRadius: `${RADIUS.card}px`,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "flex-end" }}
      >
        {projectName && (
          <Chip
            label={`Project: ${projectName}`}
            sx={{
              alignSelf: { xs: "stretch", md: "center" },
              bgcolor: "action.hover",
              color: "text.primary",
              fontWeight: 600,
              height: 38,
            }}
          />
        )}

        <LabeledSelect
          icon={FilterAltOutlinedIcon}
          label="Ticket view"
          value={ticketScope}
          onChange={onScopeChange}
          maxWidth={300}
        >
          <MenuItem value={TICKET_SCOPE.INVOLVED}>Assigned to me</MenuItem>
          <MenuItem value={TICKET_SCOPE.OWNER}>Owned by me</MenuItem>
          <MenuItem value={TICKET_SCOPE.ALL}>All Tickets</MenuItem>
        </LabeledSelect>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ pb: { md: 0.25 } }}
        >
          <Chip
            label={`${totalTickets} tickets`}
            sx={{
              bgcolor: "action.hover",
              color: "text.primary",
              fontWeight: 600,
            }}
          />
          {activeSprint && (
            <Chip
              label={`Sprint: ${activeSprint.name}`}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
                fontWeight: 600,
              }}
            />
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

/* -----------------------------------------------------------------------
   Main page
----------------------------------------------------------------------- */

export default function DeveloperBoard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isSystemAdmin, getProjectMembership, getPrimaryProjectId } =
    useAuth();

  const [selectedProjectId, setSelectedProjectId] = useState(() =>
    String(getPrimaryProjectId() || ""),
  );
  const [columns, setColumns] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [ticketScope, setTicketScope] = useState(TICKET_SCOPE.INVOLVED);

  const membership = useMemo(
    () => (selectedProjectId ? getProjectMembership(selectedProjectId) : null),
    [selectedProjectId, getProjectMembership],
  );

  const canBoardEdit =
    isSystemAdmin() ||
    membership?.role === "PROJECT_ADMIN" ||
    membership?.role === "TEAM_LEAD" ||
    membership?.role === "DEVELOPER";

  const isDeveloper = !isSystemAdmin() && membership?.role === "DEVELOPER";

  const currentUserId = Number(
    user?.id ?? user?.userId ?? user?.sub ?? user?._id ?? user?.employeeId,
  );

  const canMoveTicket = useCallback(
    (ticket) => {
      if (!canBoardEdit) return false;
      if (ticketScope === TICKET_SCOPE.ALL) return false;
      if (!isDeveloper) return true;
      return Number(ticket?.responsibleId) === currentUserId;
    },
    [canBoardEdit, isDeveloper, currentUserId, ticketScope],
  );

  const loadProjects = useCallback(async () => {
    const activeId = getPrimaryProjectId();

    if (!activeId) {
      setSelectedProjectId("");
      setProjects([]);
      setLoading(false);
      return;
    }

    const membership = getProjectMembership(activeId);
    const project = {
      id: Number(activeId),
      name:
        membership?.projectName ||
        membership?.project?.name ||
        `Project #${activeId}`,
    };

    setProjects([project]);
    setSelectedProjectId(String(activeId));
  }, [getPrimaryProjectId, getProjectMembership]);

  const loadBoard = useCallback(async (projectId, refresh = false) => {
    if (!projectId) return;

    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const [boardData, sprintData] = await Promise.all([
        getProjectBoard(Number(projectId)),
        getSprintsByProject(Number(projectId)),
      ]);

      const sprintList = Array.isArray(sprintData) ? sprintData : [];
      const active = sprintList.find(
        (sprint) => String(sprint.status).toUpperCase() === "ACTIVE",
      );
      setActiveSprint(active || null);
      setColumns(Array.isArray(boardData) ? boardData : []);
    } catch (err) {
      console.error("Developer board load error:", err);
      setColumns([]);
      setError(
        err?.response?.data?.message || "Unable to load the project board.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProjectId) loadBoard(selectedProjectId);
  }, [selectedProjectId, loadBoard]);

  const sprintScopedColumns = useMemo(() => {
    const base = !activeSprint
      ? columns
      : columns.map((column) => ({
          ...column,
          tickets: (column.tickets || []).filter(
            (ticket) => Number(ticket.sprintId) === Number(activeSprint.id),
          ),
        }));

    return base.map((column) => ({
      ...column,
      tickets: sortTicketsAscending(column.tickets || []),
    }));
  }, [columns, activeSprint]);

  const displayColumns = useMemo(() => {
    if (
      ticketScope === TICKET_SCOPE.ALL ||
      !currentUserId ||
      Number.isNaN(currentUserId)
    ) {
      return sprintScopedColumns;
    }

    return sprintScopedColumns.map((column) => ({
      ...column,
      tickets: (column.tickets || []).filter((ticket) => {
        if (ticketScope === TICKET_SCOPE.OWNER) {
          const ownerId = Number(ticket?.ownerId ?? ticket?.owner?.id);
          return ownerId === currentUserId;
        }

        const responsibleId = Number(
          ticket?.responsibleId ??
            ticket?.assigneeId ??
            ticket?.responsible?.id ??
            ticket?.assignee?.id,
        );
        return responsibleId === currentUserId;
      }),
    }));
  }, [sprintScopedColumns, ticketScope, currentUserId]);

  const totalTickets = useMemo(
    () =>
      displayColumns.reduce(
        (sum, column) => sum + (column.tickets?.length || 0),
        0,
      ),
    [displayColumns],
  );

  const canBoardMove = canBoardEdit && ticketScope !== TICKET_SCOPE.ALL;

  const handleDragStart = (event, ticket) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ ticketId: ticket.id, fromStatusId: ticket.statusId }),
    );
  };

  const handleDrop = async (event, targetColumn) => {
    event.preventDefault();
    if (!canBoardMove) return;

    let payload;
    try {
      payload = JSON.parse(event.dataTransfer.getData("text/plain") || "{}");
    } catch {
      return;
    }

    const { ticketId, fromStatusId } = payload;
    if (!ticketId || Number(fromStatusId) === Number(targetColumn.statusId))
      return;

    const previous = columns;
    const moved = previous
      .flatMap((column) => column.tickets || [])
      .find((ticket) => Number(ticket.id) === Number(ticketId));

    if (!moved) return;

    if (!canMoveTicket(moved)) {
      toast.error("You can move only tickets assigned to you.");
      return;
    }

    setColumns((current) =>
      current.map((column) => {
        if (Number(column.statusId) === Number(fromStatusId)) {
          return {
            ...column,
            tickets: (column.tickets || []).filter(
              (ticket) => Number(ticket.id) !== Number(ticketId),
            ),
          };
        }

        if (Number(column.statusId) === Number(targetColumn.statusId)) {
          return {
            ...column,
            tickets: [
              ...(column.tickets || []),
              {
                ...moved,
                statusId: targetColumn.statusId,
                statusName: targetColumn.statusName,
                statusColor: targetColumn.statusColor,
              },
            ],
          };
        }

        return column;
      }),
    );

    try {
      await transitionTicket(ticketId, targetColumn.statusId);
      toast.success("Ticket status updated.");
    } catch (err) {
      setColumns(previous);
      toast.error(
        err?.response?.data?.message ||
          "Unable to move the ticket. Changes were reverted.",
      );
    }
  };

  const selectedProject = projects.find(
    (project) => Number(project.id) === Number(selectedProjectId),
  );

  return (
    <Box className="app-page pm-fade-up" sx={{ minWidth: 0 }}>
      <BoardHeader
        membership={membership}
        canBoardEdit={canBoardEdit}
        isDeveloper={isDeveloper}
        refreshing={refreshing}
        onRefresh={() => loadBoard(selectedProjectId, true)}
        disabled={!selectedProjectId}
      />

      <BoardToolbar
        projectName={selectedProject?.name}
        ticketScope={ticketScope}
        onScopeChange={(event) => setTicketScope(event.target.value)}
        totalTickets={totalTickets}
        activeSprint={activeSprint}
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => loadBoard(selectedProjectId)}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!selectedProjectId && !loading ? (
        <Card elevation={0} sx={{ border: `1px solid ${BORDER}` }}>
          <CardContent sx={{ py: 6 }}>
            <EmptyState
              icon={ViewKanbanOutlinedIcon}
              title="No projects available"
              description="You need project access before you can use a board."
              minHeight={0}
            />
          </CardContent>
        </Card>
      ) : loading ? (
        <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}>
          <Stack spacing={1.5} alignItems="center">
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading {selectedProject?.name || "project"} board...
            </Typography>
          </Stack>
        </Box>
      ) : (
        <Box>
          {activeSprint && (
            <Alert
              severity="info"
              icon={<ViewKanbanOutlinedIcon fontSize="inherit" />}
              sx={{ mb: 2 }}
              action={
                <Button
                  size="small"
                  color="inherit"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/member/developer/tickets")}
                >
                  My Tickets
                </Button>
              }
            >
              Showing tickets from the active sprint:{" "}
              <strong>{activeSprint.name}</strong>
            </Alert>
          )}

          <Box
            sx={{
              display: "flex",
              gap: 2,
              overflowX: "auto",
              pb: 2,
              alignItems: "stretch",
              "&::-webkit-scrollbar": { height: 8 },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: alpha("#000", 0.15),
                borderRadius: 4,
              },
            }}
          >
            {displayColumns.length ? (
              displayColumns.map((column) => (
                <BoardColumn
                  key={column.statusId || column.id || column.statusName}
                  column={column}
                  onTicketClick={(ticketId) =>
                    navigate(`/member/developer/tickets/${ticketId}`)
                  }
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  canBoardMove={canBoardMove}
                  canMoveTicket={canMoveTicket}
                />
              ))
            ) : (
              <Card
                elevation={0}
                sx={{ width: "100%", border: `1px solid ${BORDER}` }}
              >
                <CardContent sx={{ py: 6 }}>
                  <EmptyState
                    icon={ViewKanbanOutlinedIcon}
                    title="No board columns available"
                    description="This project does not have an active board configuration yet."
                    minHeight={0}
                  />
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

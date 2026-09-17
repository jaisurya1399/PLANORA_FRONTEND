import AddIcon from "@mui/icons-material/Add";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import InboxIcon from "@mui/icons-material/Inbox";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QuickTicketCreateDialog from "../../components/tickets/QuickTicketCreateDialog";
import SprintAnalyticsDialog from "./SprintAnalyticsDialog";

import {
  addTicketToSprint,
  completeSprint,
  completeSprintWithCarryOver,
  createSprint,
  deleteSprint,
  getSprintBurndown,
  getSprintsByProject,
  moveTicketToBacklog,
  startSprint,
  updateSprint,
} from "../../api/sprintApi";
import {
  bulkUpdateTickets,
  getActiveTicketsByProject,
} from "../../api/ticketApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  ELEVATION_SHADOW,
  PRIMARY,
  RADIUS,
  TEXT_FAINT,
} from "../../theme/colors";

// ============================================================
// HELPERS
// ============================================================

const emptySprintForm = {
  name: "",
  goal: "",
  startDate: "",
  endDate: "",
};

const formatDate = (value) => {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateRange = (start, end) => {
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);

  if (!startLabel && !endLabel) return "No dates set";
  if (startLabel && !endLabel) return `From ${startLabel}`;
  if (!startLabel && endLabel) return `Until ${endLabel}`;

  return `${startLabel} → ${endLabel}`;
};

const sumEstimation = (list = []) =>
  list.reduce((total, ticket) => total + Number(ticket?.estimation || 0), 0);

// Natural ascending ticket order: CCARES-2 comes before CCARES-10.
const compareTicketsAscending = (a, b) => {
  const aCode = String(a?.code ?? a?.ticketCode ?? a?.id ?? "");
  const bCode = String(b?.code ?? b?.ticketCode ?? b?.id ?? "");

  const codeCompare = aCode.localeCompare(bCode, undefined, {
    numeric: true,
    sensitivity: "base",
  });

  if (codeCompare !== 0) return codeCompare;

  return Number(a?.id ?? 0) - Number(b?.id ?? 0);
};

const isDoneCategory = (category) =>
  category === "DONE" ||
  category === "Cancelled" ||
  category === "Closed" ||
  category === "Resolved";

const todayIso = () => new Date().toISOString().slice(0, 10);

const addDaysIso = (isoDate, days) => {
  const date = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date();

  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
};

const STATUS_LABELS = {
  PLANNED: { label: "Planned", color: "default" },
  ACTIVE: { label: "Active", color: "success" },
  COMPLETED: { label: "Completed", color: "primary" },
  Cancelled: { label: "Cancelled", color: "error" },
};

// ============================================================
// TICKET ROW (draggable)
// ============================================================

function TicketRow({
  ticket,
  onDragStart,
  onOpen,
  selectable = false,
  selected = false,
  onSelect,
}) {
  const initials = (ticket.responsibleName || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <Card
      variant="outlined"
      draggable
      onDragStart={(event) => {
        event.currentTarget.style.opacity = "0.55";
        onDragStart(event, ticket);
      }}
      onDragEnd={(event) => {
        event.currentTarget.style.opacity = "1";
      }}
      onClick={() => onOpen(ticket.id)}
      sx={{
        cursor: "grab",
        borderRadius: `${RADIUS.card}px`,
        borderColor: selected ? "primary.main" : "divider",
        backgroundColor: selected ? "primary.50" : "background.paper",
        boxShadow: selected ? ELEVATION_SHADOW : "none",
        transition:
          "border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
        "&:hover": { borderColor: "primary.main", boxShadow: ELEVATION_SHADOW },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ px: 1.25, py: 1 }}
      >
        {selectable && (
          <Checkbox
            size="small"
            checked={selected}
            onChange={(e) => onSelect?.(ticket.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <DragIndicatorIcon fontSize="small" sx={{ color: "text.disabled" }} />

        <Typography
          variant="caption"
          fontWeight={700}
          color="primary.main"
          sx={{ minWidth: 64 }}
          noWrap
        >
          {ticket.code || `#${ticket.id}`}
        </Typography>

        {ticket.typeName && (
          <Tooltip title={ticket.typeName}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: `${RADIUS.chip}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                color: "#fff",
                backgroundColor: ticket.typeColor || TEXT_FAINT,
              }}
            >
              {ticket.typeIcon
                ? String(ticket.typeIcon).slice(0, 1).toUpperCase()
                : ticket.typeName.charAt(0).toUpperCase()}
            </Box>
          </Tooltip>
        )}

        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}
          noWrap
        >
          {ticket.name}
        </Typography>

        {ticket.priorityName && (
          <Chip
            size="small"
            label={ticket.priorityName}
            sx={{
              height: 22,
              fontSize: "0.68rem",
              fontWeight: 600,
              color: ticket.priorityColor || undefined,
              borderColor: ticket.priorityColor || undefined,
            }}
            variant="outlined"
          />
        )}

        <Chip
          size="small"
          label={ticket.statusName || "—"}
          sx={{
            height: 22,
            fontSize: "0.68rem",
            backgroundColor: ticket.statusColor
              ? `${ticket.statusColor}22`
              : undefined,
            color: ticket.statusColor || undefined,
          }}
        />

        {ticket.dueDate && (
          <Chip
            size="small"
            variant="outlined"
            color={
              ticket.dueDate &&
              new Date(ticket.dueDate).getTime() < Date.now() &&
              ticket.statusName !== "DONE" &&
              ticket.statusName !== "Cancelled" &&
              ticket.statusName !== "Closed" &&
              ticket.statusName !== "Resolved"
                ? "error"
                : "default"
            }
            label={`Due ${new Date(ticket.dueDate).toLocaleDateString()}`}
            sx={{ height: 22, fontSize: "0.68rem" }}
          />
        )}

        {Number(ticket.estimation || 0) > 0 && (
          <Chip
            size="small"
            variant="outlined"
            label={`${ticket.estimation} sp`}
            sx={{ height: 22, fontSize: "0.68rem" }}
          />
        )}

        <Tooltip title={ticket.responsibleName || "Unassigned"}>
          <Box
            sx={{
              width: 24,
              height: 24,
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
              flexShrink: 0,
            }}
          >
            {ticket.responsibleName ? initials : "?"}
          </Box>
        </Tooltip>
      </Stack>
    </Card>
  );
}

// ============================================================
// BURNDOWN CHART DIALOG
// ============================================================

function BurndownDialog({ open, sprintId, sprintName, onClose }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !sprintId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getSprintBurndown(sprintId);

        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load burndown data.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, sprintId]);

  const chart = useMemo(() => {
    const points = Array.isArray(data?.points) ? data.points : [];

    if (points.length === 0) return null;

    const width = 640;
    const height = 320;
    const padding = { top: 20, right: 24, bottom: 40, left: 48 };

    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const total = Number(data.totalEstimate || 0);
    const maxY = Math.max(
      total,
      ...points.map((p) => Number(p.remainingEstimate || 0)),
      1,
    );

    const n = points.length;

    const xFor = (index) =>
      padding.left + (n <= 1 ? 0 : (innerW * index) / (n - 1));

    const yFor = (value) =>
      padding.top + innerH - (innerH * Number(value || 0)) / maxY;

    const idealPath = `M ${xFor(0)} ${yFor(total)} L ${xFor(n - 1)} ${yFor(0)}`;

    const actualPath = points
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.remainingEstimate)}`,
      )
      .join(" ");

    return {
      width,
      height,
      padding,
      points,
      xFor,
      yFor,
      idealPath,
      actualPath,
      maxY,
    };
  }, [data]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Burndown — {sprintName}</DialogTitle>

      <DialogContent>
        {loading && (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && !chart && (
          <Typography color="text.secondary" sx={{ py: 4 }} textAlign="center">
            No burndown data available for this sprint yet.
          </Typography>
        )}

        {!loading && !error && chart && (
          <Box>
            <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{ width: 18, height: 3, backgroundColor: TEXT_FAINT }}
                />
                <Typography variant="caption">Ideal burndown</Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{ width: 18, height: 3, backgroundColor: "primary.main" }}
                />
                <Typography variant="caption">Actual remaining</Typography>
              </Stack>
            </Stack>

            <Box sx={{ overflowX: "auto" }}>
              <svg
                width="100%"
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                style={{ minWidth: 480 }}
              >
                {/* axes */}
                <line
                  x1={chart.padding.left}
                  y1={chart.padding.top}
                  x2={chart.padding.left}
                  y2={chart.height - chart.padding.bottom}
                  stroke="currentColor"
                  strokeOpacity={0.25}
                />
                <line
                  x1={chart.padding.left}
                  y1={chart.height - chart.padding.bottom}
                  x2={chart.width - chart.padding.right}
                  y2={chart.height - chart.padding.bottom}
                  stroke="currentColor"
                  strokeOpacity={0.25}
                />

                <text
                  x={chart.padding.left - 8}
                  y={chart.padding.top + 4}
                  fontSize="10"
                  textAnchor="end"
                  fill="currentColor"
                >
                  {chart.maxY}
                </text>
                <text
                  x={chart.padding.left - 8}
                  y={chart.height - chart.padding.bottom}
                  fontSize="10"
                  textAnchor="end"
                  fill="currentColor"
                >
                  0
                </text>

                <path
                  d={chart.idealPath}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.5}
                  strokeDasharray="6 4"
                  strokeWidth={2}
                />

                <path
                  d={chart.actualPath}
                  fill="none"
                  stroke={PRIMARY}
                  strokeWidth={2.5}
                />

                {chart.points.map((p, i) => (
                  <circle
                    key={p.date || i}
                    cx={chart.xFor(i)}
                    cy={chart.yFor(p.remainingEstimate)}
                    r={3}
                    fill={PRIMARY}
                  >
                    <title>
                      {p.date}: {p.remainingEstimate} remaining
                    </title>
                  </circle>
                ))}

                {chart.points.map((p, i) => {
                  if (chart.points.length > 10 && i % 2 !== 0) return null;

                  return (
                    <text
                      key={`label-${p.date || i}`}
                      x={chart.xFor(i)}
                      y={chart.height - chart.padding.bottom + 16}
                      fontSize="9"
                      textAnchor="middle"
                      fill="currentColor"
                      opacity={0.7}
                    >
                      {p.date ? p.date.slice(5) : ""}
                    </text>
                  );
                })}
              </svg>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================
// CREATE / EDIT SPRINT DIALOG
// ============================================================

function SprintFormDialog({
  open,
  mode,
  form,
  onChange,
  onClose,
  onSave,
  saving,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === "edit" ? "Edit sprint" : "Create sprint"}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} mt={1}>
          <TextField
            name="name"
            label="Sprint name"
            value={form.name}
            onChange={onChange}
            fullWidth
            required
            autoFocus
          />

          <TextField
            name="goal"
            label="Sprint goal"
            value={form.goal}
            onChange={onChange}
            fullWidth
            multiline
            minRows={3}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              name="startDate"
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              name="endDate"
              label="End date"
              type="date"
              value={form.endDate}
              onChange={onChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>

        <Button variant="contained" onClick={onSave} disabled={saving}>
          {saving
            ? "Saving..."
            : mode === "edit"
              ? "Save changes"
              : "Create sprint"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================
// START SPRINT DIALOG
// ============================================================

function StartSprintDialog({ open, sprint, onClose, onConfirm, saving }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (open && sprint) {
      setStartDate(sprint.startDate || todayIso());
      setEndDate(
        sprint.endDate || addDaysIso(sprint.startDate || todayIso(), 14),
      );
    }
  }, [open, sprint]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Start "{sprint?.name}"</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} mt={1}>
          <Typography variant="body2" color="text.secondary">
            Confirm or adjust the sprint dates before starting.
          </Typography>

          <TextField
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="End date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<PlayArrowIcon />}
          onClick={() => onConfirm({ startDate, endDate })}
          disabled={saving}
        >
          {saving ? "Starting..." : "Start sprint"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================
// COMPLETE SPRINT DIALOG (incomplete tickets present)
// ============================================================

function CompleteSprintDialog({
  open,
  sprint,
  incompleteCount,
  otherSprints,
  onClose,
  onConfirm,
  saving,
}) {
  const [mode, setMode] = useState("backlog");
  const [targetSprintId, setTargetSprintId] = useState("");

  useEffect(() => {
    if (open) {
      setMode("backlog");
      setTargetSprintId(otherSprints[0] ? String(otherSprints[0].id) : "");
    }
  }, [open, otherSprints]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Complete "{sprint?.name}"</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Alert severity="warning">
            {incompleteCount} ticket{incompleteCount === 1 ? "" : "s"} in this
            sprint {incompleteCount === 1 ? "is" : "are"} not done. Where should
            they go?
          </Alert>

          <RadioGroup value={mode} onChange={(e) => setMode(e.target.value)}>
            <FormControlLabel
              value="backlog"
              control={<Radio />}
              label="Move to project backlog"
            />

            <FormControlLabel
              value="sprint"
              control={<Radio />}
              disabled={otherSprints.length === 0}
              label="Move to another sprint"
            />
          </RadioGroup>

          {mode === "sprint" && (
            <FormControl fullWidth size="small">
              <InputLabel>Target sprint</InputLabel>

              <Select
                label="Target sprint"
                value={targetSprintId}
                onChange={(e) => setTargetSprintId(e.target.value)}
              >
                {otherSprints.map((s) => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>

        <Button
          variant="contained"
          startIcon={<StopCircleIcon />}
          onClick={() =>
            onConfirm({
              carryOverSprintId:
                mode === "sprint" && targetSprintId
                  ? Number(targetSprintId)
                  : null,
              moveIncompleteToBacklog: mode === "backlog",
            })
          }
          disabled={saving}
        >
          {saving ? "Completing..." : "Complete sprint"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================
// SPRINT SECTION
// ============================================================

function SprintSection({
  sprint,
  tickets,
  expanded,
  onToggle,
  onDropTicket,
  onDragStart,
  onOpenTicket,
  onStart,
  onComplete,
  onEdit,
  onDelete,
  onViewBurndown,
  onViewAnalytics,
  selectedTicketIds = [],
  onSelectTicket,
  onSelectAllTickets,
}) {
  const [dragOver, setDragOver] = useState(false);

  const statusMeta = STATUS_LABELS[sprint.status] || STATUS_LABELS.PLANNED;
  const points = sumEstimation(tickets);

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: `${RADIUS.card}px`,
        borderColor: dragOver ? "primary.main" : "divider",
        backgroundColor: dragOver ? "action.hover" : "background.paper",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <IconButton size="small" onClick={onToggle}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>

        <Checkbox
          size="small"
          checked={
            tickets.length > 0 &&
            tickets.every((ticket) => selectedTicketIds.includes(ticket.id))
          }
          indeterminate={
            tickets.some((ticket) => selectedTicketIds.includes(ticket.id)) &&
            !tickets.every((ticket) => selectedTicketIds.includes(ticket.id))
          }
          onChange={(event) =>
            onSelectAllTickets?.(
              tickets.map((ticket) => ticket.id),
              event.target.checked,
            )
          }
          onClick={(event) => event.stopPropagation()}
          disabled={tickets.length === 0}
        />

        <Typography variant="subtitle1" fontWeight={700}>
          {sprint.name}
        </Typography>

        <Chip
          size="small"
          label={statusMeta.label}
          color={statusMeta.color}
          sx={{ fontWeight: 600 }}
        />

        <Typography variant="body2" color="text.secondary">
          {formatDateRange(sprint.startDate, sprint.endDate)}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          · {tickets.length} ticket{tickets.length === 1 ? "" : "s"} · {points}{" "}
          sp
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={0.5}>
          {sprint.status === "PLANNED" && (
            <Tooltip title="Start sprint">
              <IconButton size="small" color="success" onClick={onStart}>
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {sprint.status === "ACTIVE" && (
            <>
              <Tooltip title="View burndown">
                <IconButton size="small" onClick={onViewBurndown}>
                  <ShowChartIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Sprint analytics">
                <IconButton size="small" onClick={onViewAnalytics}>
                  <AssessmentIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Complete sprint">
                <IconButton size="small" color="primary" onClick={onComplete}>
                  <StopCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}

          <Tooltip title="Edit sprint">
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete sprint">
            <IconButton size="small" color="error" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />

        <Box
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            setDragOver(false);
            onDropTicket(e, sprint.id);
          }}
          sx={{
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            minHeight: 64,
          }}
        >
          {sprint.goal && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.5, fontStyle: "italic" }}
            >
              Goal: {sprint.goal}
            </Typography>
          )}

          {tickets.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 2 }}
            >
              Drag one or multiple selected tickets here to add them to this
              sprint.
            </Typography>
          ) : (
            tickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                onDragStart={onDragStart}
                onOpen={onOpenTicket}
                selectable
                selected={selectedTicketIds.includes(ticket.id)}
                onSelect={onSelectTicket}
              />
            ))
          )}
        </Box>
      </Collapse>
    </Card>
  );
}

// ============================================================
// BACKLOG PAGE
// ============================================================

export default function Backlog() {
  const { user, getPrimaryProjectId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceBase = location.pathname.startsWith("/member/projectadmin")
    ? "/member/projectadmin"
    : location.pathname.startsWith("/member/teamlead")
      ? "/member/teamlead"
      : "/member/developer";
  const toast = useToast();

  // --------------------------------------------------------
  // DATA
  // --------------------------------------------------------

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [backlogSearch, setBacklogSearch] = useState("");
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [backlogEpic, setBacklogEpic] = useState("all");

  const [sprints, setSprints] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedSprintIds, setExpandedSprintIds] = useState([]);
  const [backlogExpanded, setBacklogExpanded] = useState(true);
  const [pastExpanded, setPastExpanded] = useState(false);

  // --------------------------------------------------------
  // DIALOG STATE
  // --------------------------------------------------------

  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [sprintDialogMode, setSprintDialogMode] = useState("create");
  const [sprintForm, setSprintForm] = useState(emptySprintForm);
  const [activeSprintForEdit, setActiveSprintForEdit] = useState(null);
  const [savingSprint, setSavingSprint] = useState(false);

  const [startDialogSprint, setStartDialogSprint] = useState(null);
  const [startingSprint, setStartingSprint] = useState(false);

  const [completeDialogSprint, setCompleteDialogSprint] = useState(null);
  const [completingSprint, setCompletingSprint] = useState(false);

  const [burndownSprint, setBurndownSprint] = useState(null);
  const [analyticsSprint, setAnalyticsSprint] = useState(null);

  // --------------------------------------------------------
  // LOAD PROJECTS
  // --------------------------------------------------------

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

        if (list.length > 0) {
          setSelectedProjectId(String(list[0].id));
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load projects.");
        setLoading(false);
      }
    })();
  }, [user, getPrimaryProjectId]);

  // --------------------------------------------------------
  // LOAD SPRINTS + TICKETS FOR SELECTED PROJECT
  // --------------------------------------------------------

  const loadProjectData = useCallback(async (projectId) => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError("");

      const [sprintData, ticketData] = await Promise.all([
        getSprintsByProject(projectId),
        getActiveTicketsByProject(projectId),
      ]);

      const sprintList = Array.isArray(sprintData) ? sprintData : [];
      const ticketList = Array.isArray(ticketData) ? ticketData : [];

      setSprints(sprintList);
      setTickets(ticketList);

      setExpandedSprintIds(
        sprintList
          .filter((s) => s.status === "ACTIVE" || s.status === "PLANNED")
          .map((s) => s.id),
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load sprint/backlog data.",
      );
      setSprints([]);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
    }
  }, [selectedProjectId, loadProjectData]);

  // --------------------------------------------------------
  // DERIVED GROUPS
  // --------------------------------------------------------

  const ticketsBySprint = useMemo(() => {
    const map = new Map();

    tickets.forEach((ticket) => {
      const key = ticket.sprintId || null;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ticket);
    });

    // Keep every ticket list in natural ascending order.
    map.forEach((ticketList, key) => {
      map.set(key, [...ticketList].sort(compareTicketsAscending));
    });

    return map;
  }, [tickets]);

  const activeSprints = useMemo(
    () => sprints.filter((s) => s.status === "ACTIVE"),
    [sprints],
  );

  const plannedSprints = useMemo(
    () =>
      sprints
        .filter((s) => s.status === "PLANNED")
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || "")),
    [sprints],
  );

  const pastSprints = useMemo(
    () =>
      sprints
        .filter((s) => s.status === "COMPLETED" || s.status === "Cancelled")
        .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")),
    [sprints],
  );

  const backlogTickets = useMemo(
    () => ticketsBySprint.get(null) || [],
    [ticketsBySprint],
  );

  const orderedOpenSprints = useMemo(
    () => [...activeSprints, ...plannedSprints],
    [activeSprints, plannedSprints],
  );

  // --------------------------------------------------------
  // SPRINT FORM DIALOG
  // --------------------------------------------------------

  const openCreateSprint = () => {
    setSprintDialogMode("create");
    setActiveSprintForEdit(null);
    setSprintForm(emptySprintForm);
    setSprintDialogOpen(true);
  };

  const openEditSprint = (sprint) => {
    setSprintDialogMode("edit");
    setActiveSprintForEdit(sprint);
    setSprintForm({
      name: sprint.name || "",
      goal: sprint.goal || "",
      startDate: sprint.startDate || "",
      endDate: sprint.endDate || "",
    });
    setSprintDialogOpen(true);
  };

  const closeSprintDialog = () => {
    if (savingSprint) return;
    setSprintDialogOpen(false);
  };

  const handleSprintFormChange = (event) => {
    const { name, value } = event.target;
    setSprintForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveSprint = async () => {
    if (!sprintForm.name.trim()) {
      toast.error("Sprint name is required.");
      return;
    }

    if (
      sprintForm.startDate &&
      sprintForm.endDate &&
      sprintForm.endDate < sprintForm.startDate
    ) {
      toast.error("End date must be on or after start date.");
      return;
    }

    const payload = {
      name: sprintForm.name.trim(),
      goal: sprintForm.goal?.trim() || null,
      projectId: Number(selectedProjectId),
      startDate: sprintForm.startDate || null,
      endDate: sprintForm.endDate || null,
    };

    try {
      setSavingSprint(true);

      if (sprintDialogMode === "edit" && activeSprintForEdit) {
        await updateSprint(activeSprintForEdit.id, payload);
        toast.success("Sprint updated.");
      } else {
        await createSprint(payload);
        toast.success("Sprint created.");
      }

      setSprintDialogOpen(false);
      await loadProjectData(selectedProjectId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save sprint.");
    } finally {
      setSavingSprint(false);
    }
  };

  const handleDeleteSprint = async (sprint) => {
    const confirmed = window.confirm(
      `Delete sprint "${sprint.name}"? Tickets in it will return to the backlog.`,
    );

    if (!confirmed) return;

    try {
      await deleteSprint(sprint.id);
      toast.success("Sprint deleted.");
      await loadProjectData(selectedProjectId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete sprint.");
    }
  };

  // --------------------------------------------------------
  // START SPRINT
  // --------------------------------------------------------

  const handleConfirmStart = async ({ startDate, endDate }) => {
    if (!startDialogSprint) return;

    try {
      setStartingSprint(true);

      const datesChanged =
        startDate !== (startDialogSprint.startDate || "") ||
        endDate !== (startDialogSprint.endDate || "");

      if (datesChanged) {
        await updateSprint(startDialogSprint.id, {
          name: startDialogSprint.name,
          goal: startDialogSprint.goal || null,
          projectId: Number(selectedProjectId),
          startDate: startDate || null,
          endDate: endDate || null,
        });
      }

      await startSprint(startDialogSprint.id);

      toast.success(`Sprint "${startDialogSprint.name}" started.`);
      setStartDialogSprint(null);
      await loadProjectData(selectedProjectId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start sprint.");
    } finally {
      setStartingSprint(false);
    }
  };

  // --------------------------------------------------------
  // COMPLETE SPRINT
  // --------------------------------------------------------

  const handleCompleteClick = (sprint) => {
    const sprintTickets = ticketsBySprint.get(sprint.id) || [];
    const incomplete = sprintTickets.filter(
      (t) => !isDoneCategory(t.statusName),
    );

    if (incomplete.length === 0) {
      completeSprintDirect(sprint);
      return;
    }

    setCompleteDialogSprint(sprint);
  };

  const completeSprintDirect = async (sprint) => {
    const confirmed = window.confirm(`Complete sprint "${sprint.name}"?`);
    if (!confirmed) return;

    try {
      await completeSprint(sprint.id);
      toast.success(`Sprint "${sprint.name}" completed.`);
      await loadProjectData(selectedProjectId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to complete sprint.");
    }
  };

  const handleConfirmComplete = async ({
    carryOverSprintId,
    moveIncompleteToBacklog,
  }) => {
    if (!completeDialogSprint) return;

    try {
      setCompletingSprint(true);

      await completeSprintWithCarryOver(completeDialogSprint.id, {
        carryOverSprintId: carryOverSprintId || null,
        moveIncompleteToBacklog: !carryOverSprintId && moveIncompleteToBacklog,
      });

      toast.success(`Sprint "${completeDialogSprint.name}" completed.`);
      setCompleteDialogSprint(null);
      await loadProjectData(selectedProjectId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to complete sprint.");
    } finally {
      setCompletingSprint(false);
    }
  };

  // --------------------------------------------------------
  // DRAG AND DROP
  // --------------------------------------------------------

  const handleDragStart = (event, ticket) => {
    event.dataTransfer.effectAllowed = "move";

    // Drag the complete selection when the dragged ticket is selected.
    // Otherwise, drag only the ticket under the pointer.
    const dragIds = selectedTicketIds.includes(ticket.id)
      ? selectedTicketIds
      : [ticket.id];

    const dragTickets = tickets.filter((t) => dragIds.includes(t.id));

    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        ticketIds: dragIds,
        tickets: dragTickets.map((t) => ({
          id: t.id,
          sprintId: t.sprintId || null,
        })),
      }),
    );
  };

  const handleDropOnSprint = async (event, targetSprintId) => {
    event.preventDefault();

    let payload;
    try {
      payload = JSON.parse(event.dataTransfer.getData("text/plain") || "{}");
    } catch {
      return;
    }

    // Backward-compatible with the previous single-ticket payload.
    const draggedTickets =
      Array.isArray(payload.tickets) && payload.tickets.length
        ? payload.tickets
        : payload.ticketId
          ? [{ id: payload.ticketId, sprintId: payload.fromSprintId || null }]
          : [];

    if (!draggedTickets.length) return;

    const ticketsToMove = draggedTickets.filter(
      (item) => (item.sprintId || null) !== (targetSprintId || null),
    );

    if (!ticketsToMove.length) {
      toast.info("Selected tickets are already in this location.");
      return;
    }

    const previousTickets = tickets;

    // Optimistic update: move all selected tickets immediately.
    setTickets((prev) =>
      prev.map((t) =>
        ticketsToMove.some((item) => item.id === t.id)
          ? { ...t, sprintId: targetSprintId }
          : t,
      ),
    );

    try {
      await Promise.all(
        ticketsToMove.map((item) =>
          targetSprintId
            ? addTicketToSprint(targetSprintId, item.id)
            : moveTicketToBacklog(item.id),
        ),
      );

      setSelectedTicketIds((prev) =>
        prev.filter((id) => !ticketsToMove.some((item) => item.id === id)),
      );

      toast.success(
        `${ticketsToMove.length} ticket${ticketsToMove.length === 1 ? "" : "s"} moved successfully.`,
      );
    } catch (err) {
      setTickets(previousTickets);
      toast.error(
        err?.response?.data?.message ||
          "Some tickets could not be moved. Changes were reverted.",
      );
    }
  };

  // --------------------------------------------------------
  // MISC HANDLERS
  // --------------------------------------------------------

  const toggleSprintExpanded = (sprintId) => {
    setExpandedSprintIds((prev) =>
      prev.includes(sprintId)
        ? prev.filter((id) => id !== sprintId)
        : [...prev, sprintId],
    );
  };

  const handleOpenTicket = (ticketId) => {
    navigate(`${workspaceBase}/tickets/${ticketId}`);
  };

  const backlogEpics = useMemo(
    () =>
      Array.from(
        new Map(
          backlogTickets
            .filter((t) => t.epicId)
            .map((t) => [t.epicId, t.epicName || `Epic #${t.epicId}`]),
        ).entries(),
      ).map(([id, name]) => ({ id, name })),
    [backlogTickets],
  );
  const visibleBacklogTickets = useMemo(
    () =>
      backlogTickets.filter((t) => {
        const q = backlogSearch.trim().toLowerCase();
        const matchesSearch =
          !q ||
          [t.code, t.name, t.responsibleName, t.priorityName, t.typeName]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q));
        const matchesEpic =
          backlogEpic === "all" || String(t.epicId) === String(backlogEpic);
        return matchesSearch && matchesEpic;
      }),
    [backlogTickets, backlogSearch, backlogEpic],
  );

  const selectedProject = projects.find(
    (p) => Number(p.id) === Number(selectedProjectId),
  );

  const handleTicketSelection = useCallback((ticketId, checked) => {
    setSelectedTicketIds((prev) =>
      checked
        ? [...new Set([...prev, ticketId])]
        : prev.filter((id) => id !== ticketId),
    );
  }, []);

  const handleSelectAllTickets = useCallback((ticketIds, checked) => {
    setSelectedTicketIds((prev) => {
      if (checked) return [...new Set([...prev, ...ticketIds])];
      return prev.filter((id) => !ticketIds.includes(id));
    });
  }, []);

  const selectAllVisibleTickets = () => {
    const visibleIds = [
      ...visibleBacklogTickets,
      ...orderedOpenSprints.flatMap(
        (sprint) => ticketsBySprint.get(sprint.id) || [],
      ),
    ].map((ticket) => ticket.id);

    setSelectedTicketIds(visibleIds);
  };

  const bulkMoveSelectedToBacklog = async () => {
    if (!selectedTicketIds.length || !selectedProjectId) return;
    try {
      await bulkUpdateTickets(selectedTicketIds, {
        projectId: Number(selectedProjectId),
        moveToBacklog: true,
      });
      setSelectedTicketIds([]);
      await loadProjectData(selectedProjectId);
      toast.success("Selected tickets moved to backlog.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Bulk update failed.");
    }
  };

  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------

  return (
    <Box className="app-page pm-fade-up">
      {/* HEADER */}

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Backlog
          </Typography>

          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Plan sprints and manage the project backlog.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setQuickCreateOpen(true)}
            disabled={!selectedProjectId}
          >
            Quick issue
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateSprint}
            disabled={!selectedProjectId}
          >
            Create sprint
          </Button>
        </Stack>
      </Stack>

      {/* PROJECT PICKER */}

      {/* <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth sx={{ display: "none" }}>
            <InputLabel>Project</InputLabel>

            <Select
              value={selectedProjectId}
              label="Project"
              onChange={(event) => setSelectedProjectId(event.target.value)}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={String(project.id)}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card> */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Search backlog"
              value={backlogSearch}
              onChange={(e) => setBacklogSearch(e.target.value)}
              placeholder="Key, title, assignee, priority..."
            />
            <FormControl sx={{ minWidth: 240 }}>
              <InputLabel>Epic</InputLabel>
              <Select
                label="Epic"
                value={backlogEpic}
                onChange={(e) => setBacklogEpic(e.target.value)}
              >
                <MenuItem value="all">All epics</MenuItem>
                {backlogEpics.map((e) => (
                  <MenuItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!selectedProjectId && !loading && (
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center">
              No projects available.
            </Typography>
          </CardContent>
        </Card>
      )}

      {loading && selectedProjectId && (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      )}

      {!loading && selectedProjectId && (
        <Box>
          {selectedProject && (
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Project: {selectedProject.name}
            </Typography>
          )}

          {/* OPEN SPRINTS */}

          {orderedOpenSprints.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No sprints yet for this project.{" "}
              <Button size="small" onClick={openCreateSprint}>
                Create your first sprint
              </Button>
            </Alert>
          )}

          {orderedOpenSprints.map((sprint) => (
            <SprintSection
              key={sprint.id}
              sprint={sprint}
              tickets={ticketsBySprint.get(sprint.id) || []}
              expanded={expandedSprintIds.includes(sprint.id)}
              onToggle={() => toggleSprintExpanded(sprint.id)}
              onDropTicket={handleDropOnSprint}
              onDragStart={handleDragStart}
              onOpenTicket={handleOpenTicket}
              onStart={() => setStartDialogSprint(sprint)}
              onComplete={() => handleCompleteClick(sprint)}
              onEdit={() => openEditSprint(sprint)}
              onDelete={() => handleDeleteSprint(sprint)}
              onViewBurndown={() => setBurndownSprint(sprint)}
              onViewAnalytics={() => setAnalyticsSprint(sprint)}
              selectedTicketIds={selectedTicketIds}
              onSelectTicket={handleTicketSelection}
              onSelectAllTickets={handleSelectAllTickets}
            />
          ))}

          {/* BACKLOG SECTION */}

          <Card
            variant="outlined"
            sx={{ mb: 2, borderRadius: `${RADIUS.card}px` }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <IconButton
                size="small"
                onClick={() => setBacklogExpanded((prev) => !prev)}
              >
                {backlogExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>

              <InboxIcon fontSize="small" color="action" />

              <Checkbox
                size="small"
                checked={
                  backlogTickets.length > 0 &&
                  backlogTickets.every((ticket) =>
                    selectedTicketIds.includes(ticket.id),
                  )
                }
                indeterminate={
                  backlogTickets.some((ticket) =>
                    selectedTicketIds.includes(ticket.id),
                  ) &&
                  !backlogTickets.every((ticket) =>
                    selectedTicketIds.includes(ticket.id),
                  )
                }
                onChange={(event) =>
                  handleSelectAllTickets(
                    backlogTickets.map((ticket) => ticket.id),
                    event.target.checked,
                  )
                }
                onClick={(event) => event.stopPropagation()}
                disabled={backlogTickets.length === 0}
              />

              <Typography variant="subtitle1" fontWeight={700}>
                Backlog
              </Typography>

              <Typography variant="body2" color="text.secondary">
                · {backlogTickets.length} ticket
                {backlogTickets.length === 1 ? "" : "s"} ·{" "}
                {sumEstimation(backlogTickets)} sp
              </Typography>
            </Box>

            <Collapse in={backlogExpanded} timeout="auto" unmountOnExit>
              <Divider />

              <Box
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => handleDropOnSprint(e, null)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  transition: "background-color 160ms ease",
                  "&:hover": { backgroundColor: "action.hover" },
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  minHeight: 80,
                }}
              >
                {backlogTickets.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 3 }}
                  >
                    The backlog is empty.{" "}
                    {orderedOpenSprints.length === 0 &&
                      "Create a sprint to start planning."}
                  </Typography>
                ) : (
                  visibleBacklogTickets.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      onDragStart={handleDragStart}
                      onOpen={handleOpenTicket}
                      selectable
                      selected={selectedTicketIds.includes(ticket.id)}
                      onSelect={handleTicketSelection}
                    />
                  ))
                )}
              </Box>
            </Collapse>
          </Card>

          {/* PAST SPRINTS */}

          {pastSprints.length > 0 && (
            <Card variant="outlined" sx={{ borderRadius: `${RADIUS.card}px` }}>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setPastExpanded((prev) => !prev)}
                >
                  {pastExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>

                <HistoryIcon fontSize="small" color="action" />

                <Typography variant="subtitle1" fontWeight={700}>
                  Past sprints
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  · {pastSprints.length}
                </Typography>
              </Box>

              <Collapse in={pastExpanded} timeout="auto" unmountOnExit>
                <Divider />

                <Stack spacing={1} sx={{ p: 1.5 }}>
                  {pastSprints.map((sprint) => {
                    const sprintTickets = ticketsBySprint.get(sprint.id) || [];
                    const statusMeta =
                      STATUS_LABELS[sprint.status] || STATUS_LABELS.PLANNED;

                    return (
                      <Stack
                        key={sprint.id}
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{
                          p: 1,
                          borderRadius: `${RADIUS.card}px`,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {sprint.name}
                        </Typography>

                        <Chip
                          size="small"
                          label={statusMeta.label}
                          color={statusMeta.color}
                        />

                        <Typography variant="caption" color="text.secondary">
                          {formatDateRange(sprint.startDate, sprint.endDate)} ·{" "}
                          {sprintTickets.length} ticket
                          {sprintTickets.length === 1 ? "" : "s"} ·{" "}
                          {sumEstimation(sprintTickets)} sp
                        </Typography>

                        <Box sx={{ flex: 1 }} />

                        <Tooltip title="View burndown">
                          <IconButton
                            size="small"
                            onClick={() => setBurndownSprint(sprint)}
                          >
                            <ShowChartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Sprint analytics">
                          <IconButton
                            size="small"
                            onClick={() => setAnalyticsSprint(sprint)}
                          >
                            <AssessmentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete sprint">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteSprint(sprint)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    );
                  })}
                </Stack>
              </Collapse>
            </Card>
          )}
        </Box>
      )}

      {/* DIALOGS */}

      <QuickTicketCreateDialog
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        projectId={selectedProjectId}
        ownerId={user?.id || user?.userId}
        onCreated={() => loadProjectData(selectedProjectId)}
      />

      <SprintFormDialog
        open={sprintDialogOpen}
        mode={sprintDialogMode}
        form={sprintForm}
        onChange={handleSprintFormChange}
        onClose={closeSprintDialog}
        onSave={saveSprint}
        saving={savingSprint}
      />

      <StartSprintDialog
        open={Boolean(startDialogSprint)}
        sprint={startDialogSprint}
        onClose={() => (!startingSprint ? setStartDialogSprint(null) : null)}
        onConfirm={handleConfirmStart}
        saving={startingSprint}
      />

      <CompleteSprintDialog
        open={Boolean(completeDialogSprint)}
        sprint={completeDialogSprint}
        incompleteCount={
          completeDialogSprint
            ? (ticketsBySprint.get(completeDialogSprint.id) || []).filter(
                (t) => !isDoneCategory(t.statusName),
              ).length
            : 0
        }
        otherSprints={orderedOpenSprints.filter(
          (s) =>
            s.id !== completeDialogSprint?.id &&
            (s.status === "PLANNED" || s.status === "ACTIVE"),
        )}
        onClose={() =>
          !completingSprint ? setCompleteDialogSprint(null) : null
        }
        onConfirm={handleConfirmComplete}
        saving={completingSprint}
      />

      <BurndownDialog
        open={Boolean(burndownSprint)}
        sprintId={burndownSprint?.id}
        sprintName={burndownSprint?.name}
        onClose={() => setBurndownSprint(null)}
      />

      <SprintAnalyticsDialog
        open={Boolean(analyticsSprint)}
        projectId={selectedProjectId}
        sprint={analyticsSprint}
        onClose={() => setAnalyticsSprint(null)}
      />
    </Box>
  );
}

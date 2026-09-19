import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupsIcon from "@mui/icons-material/Groups";
import SaveIcon from "@mui/icons-material/Save";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";
import MemberAvatar from "../../components/common/MemberAvatar";

import {
  EventAvailable as AvailableIcon,
  EventBusy as BusyIcon,
  BeachAccess as HolidayIcon,
  TodayOutlined as TodayIcon,
  WorkOff as WorkOffIcon,
} from "@mui/icons-material";

import {
  createMemberAvailability,
  deleteMemberAvailability,
  getProjectAvailability,
  getProjectWorkingHours,
  saveProjectWorkingHours,
  updateMemberAvailability,
} from "../../api/memberAvailabilityApi";
import {
  getProjectUsers,
  setAvailabilitySelfUpdate,
} from "../../api/projectUserApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const TYPE_META = {
  AVAILABLE: {
    label: "Available",
    color: "success",
    icon: AvailableIcon,
    description: "Normal working availability",
  },
  HALF_DAY: {
    label: "Half Day",
    color: "warning",
    icon: TodayIcon,
    description: "Partial working day (4 hours)",
  },
  HOLIDAY: {
    label: "Holiday",
    color: "info",
    icon: HolidayIcon,
    description:
      "Project holiday; applies to everyone when no member is selected",
  },
  UNAVAILABLE: {
    label: "Unavailable",
    color: "error",
    icon: BusyIcon,
    description: "Member is unavailable for the day",
  },
};

const pad = (value) => String(value).padStart(2, "0");
const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const monthStart = (value) =>
  new Date(value.getFullYear(), value.getMonth(), 1);
const monthEnd = (value) =>
  new Date(value.getFullYear(), value.getMonth() + 1, 0);

const formatDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function todayString() {
  return dateKey(new Date());
}

const initialForm = {
  userId: "",
  startDate: dateKey(new Date()),
  endDate: dateKey(new Date()),
  availabilityType: "HOLIDAY",
  availableHours: "8",
  reason: "",
};

export default function MemberAvailability() {
  const {
    user,
    isSystemAdmin,
    hasProjectRole,
    getProjectMembership,
    getPrimaryProjectId,
  } = useAuth();
  const { success, error: showError } = useToast();

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [members, setMembers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [month, setMonth] = useState(monthStart(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [filterUserId, setFilterUserId] = useState("ALL");
  const [workingHourHistory, setWorkingHourHistory] = useState([]);
  const [workingHours, setWorkingHours] = useState("8");
  const [workingHoursEffectiveFrom, setWorkingHoursEffectiveFrom] =
    useState(todayString());
  const [workingHoursSaving, setWorkingHoursSaving] = useState(false);

  const currentUserId = Number(user?.userId ?? user?.id);
  const selectedProject = projects.find(
    (project) => Number(project.id) === Number(projectId),
  );

  const canManage = useMemo(() => {
    if (!selectedProject) return false;
    return (
      isSystemAdmin() || hasProjectRole(selectedProject.id, ["PROJECT_ADMIN"])
    );
  }, [selectedProject, currentUserId, isSystemAdmin, hasProjectRole]);

  const isProjectMember = useMemo(() => {
    if (!selectedProject || isSystemAdmin()) return false;
    const membership = getProjectMembership(selectedProject.id);
    return ["DEVELOPER", "TEAM_LEAD", "MEMBER"].includes(
      String(membership?.role || "").toUpperCase(),
    );
  }, [selectedProject, isSystemAdmin, getProjectMembership]);

  const selectedMembership = useMemo(() => {
    if (!selectedProject || isSystemAdmin()) return null;
    return getProjectMembership(selectedProject.id);
  }, [selectedProject, isSystemAdmin, getProjectMembership]);

  const selectedMemberRecord = useMemo(() => {
    if (!selectedProject || !currentUserId) return null;
    return (
      members.find((member) => Number(member.userId) === currentUserId) || null
    );
  }, [members, selectedProject, currentUserId]);

  const selfUpdateOpen = canManage
    ? true
    : Boolean(
        selectedMembership?.availabilitySelfUpdateOpen ??
        selectedMemberRecord?.availabilitySelfUpdateOpen,
      );

  const canSubmitOwnAvailability =
    canManage || (isProjectMember && selfUpdateOpen);

  const range = useMemo(
    () => ({
      startDate: dateKey(monthStart(month)),
      endDate: dateKey(monthEnd(month)),
    }),
    [month],
  );

  const loadProjects = async () => {
    try {
      const memberships = Array.isArray(user?.projectMemberships)
        ? user.projectMemberships
        : [];
      const activeId = getPrimaryProjectId();
      const list = memberships
        .filter((m) => m?.projectId && Number(m.projectId) === Number(activeId))
        .map((m) => ({
          id: Number(m.projectId),
          name: m.projectName || m.project?.name || `Project #${m.projectId}`,
        }));
      setProjects(list);
      if (list.length) setProjectId(String(list[0].id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load projects.");
    }
  };

  const loadData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError("");

      const [availability, projectMembers, hoursHistory] = await Promise.all([
        getProjectAvailability(projectId, range.startDate, range.endDate),
        getProjectUsers(projectId),
        getProjectWorkingHours(projectId),
      ]);

      setEntries(Array.isArray(availability) ? availability : []);
      const memberList = Array.isArray(projectMembers) ? projectMembers : [];
      const history = Array.isArray(hoursHistory) ? hoursHistory : [];
      setMembers(memberList);
      setWorkingHourHistory(history);
      const effective = history
        .filter((item) => item.effectiveFrom <= range.endDate)
        .sort((a, b) =>
          String(b.effectiveFrom).localeCompare(String(a.effectiveFrom)),
        )[0];
      setWorkingHours(String(effective?.workingHours ?? 8));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load member availability.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user, getPrimaryProjectId]);

  useEffect(() => {
    loadData();
  }, [projectId, range.startDate, range.endDate]);

  const visibleEntries = useMemo(() => {
    if (filterUserId === "ALL") return entries;
    if (filterUserId === "PROJECT") {
      return entries.filter((entry) => !entry.userId);
    }
    return entries.filter(
      (entry) =>
        entry.userId == null || Number(entry.userId) === Number(filterUserId),
    );
  }, [entries, filterUserId]);

  const entriesByDate = useMemo(() => {
    const map = new Map();
    visibleEntries.forEach((entry) => {
      if (!map.has(entry.availabilityDate)) map.set(entry.availabilityDate, []);
      map.get(entry.availabilityDate).push(entry);
    });
    return map;
  }, [visibleEntries]);

  const summary = useMemo(() => {
    const holidays = visibleEntries.filter(
      (entry) => entry.availabilityType === "HOLIDAY",
    ).length;
    const unavailable = visibleEntries.filter(
      (entry) => entry.availabilityType === "UNAVAILABLE",
    ).length;
    const halfDays = visibleEntries.filter(
      (entry) => entry.availabilityType === "HALF_DAY",
    ).length;
    const hours = visibleEntries.reduce(
      (sum, entry) => sum + Number(entry.availableHours || 0),
      0,
    );
    return { holidays, unavailable, halfDays, hours };
  }, [visibleEntries]);

  const saveWorkingHours = async () => {
    if (!canManage || !projectId || !workingHoursEffectiveFrom) return;
    const value = Number(workingHours);
    if (!Number.isFinite(value) || value < 0 || value > 24) {
      showError("Working hours must be between 0 and 24.");
      return;
    }
    try {
      setWorkingHoursSaving(true);
      await saveProjectWorkingHours(projectId, {
        effectiveFrom: workingHoursEffectiveFrom,
        workingHours: value,
      });
      success(
        `Working hours set to ${value}h from ${formatDate(workingHoursEffectiveFrom)}.`,
      );
      await loadData();
    } catch (err) {
      showError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to save working hours.",
      );
    } finally {
      setWorkingHoursSaving(false);
    }
  };

  const toggleMemberSelfUpdate = async (member) => {
    if (!canManage || !member?.id) return;
    const next = !member.availabilitySelfUpdateOpen;
    try {
      await setAvailabilitySelfUpdate(member.id, next);
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id
            ? { ...item, availabilitySelfUpdateOpen: next }
            : item,
        ),
      );
      success(
        next
          ? "Member availability submission opened."
          : "Member availability submission closed.",
      );
    } catch (err) {
      showError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update member availability access.",
      );
    }
  };

  const openCreate = (date = dateKey(new Date())) => {
    setEditing(null);
    setForm({
      ...initialForm,
      startDate: date,
      endDate: date,
      availabilityType: canManage ? "HOLIDAY" : "UNAVAILABLE",
      userId: canManage ? "" : String(currentUserId || ""),
    });
    setDialogOpen(true);
  };

  const canEditEntry = (entry) => {
    if (canManage) return true;
    return (
      isProjectMember &&
      entry?.userId != null &&
      Number(entry.userId) === currentUserId &&
      entry.availabilityType !== "HOLIDAY" &&
      entry.availabilityDate >= today
    );
  };

  const openEdit = (entry) => {
    if (!canEditEntry(entry)) return;
    setEditing(entry);
    setForm({
      userId: entry.userId ? String(entry.userId) : "",
      startDate: entry.availabilityDate,
      endDate: entry.availabilityDate,
      availabilityType: entry.availabilityType,
      availableHours: String(entry.availableHours ?? 8),
      reason: entry.reason || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saving) setDialogOpen(false);
  };

  const save = async () => {
    if (
      !projectId ||
      !form.startDate ||
      !form.endDate ||
      !form.availabilityType
    )
      return;

    if (form.availabilityType !== "HOLIDAY" && !form.userId) {
      showError("Select a project member for member-specific availability.");
      return;
    }

    if (form.endDate < form.startDate) {
      showError("End date cannot be earlier than start date.");
      return;
    }

    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);
    const dates = [];

    for (
      const cursor = new Date(start);
      cursor <= end;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      dates.push(dateKey(cursor));
    }

    if (dates.length > 366) {
      showError("Availability range cannot exceed 366 days.");
      return;
    }

    try {
      setSaving(true);

      const payloadBase = {
        userId: form.userId ? Number(form.userId) : null,
        availabilityType: form.availabilityType,
        availableHours:
          form.availabilityType === "AVAILABLE"
            ? Number(form.availableHours || 0)
            : null,
        reason: form.reason.trim() || null,
      };

      if (editing) {
        await updateMemberAvailability(projectId, editing.id, {
          ...payloadBase,
          availabilityDate: form.startDate,
        });
        success("Availability updated successfully.");
      } else {
        // The database stores one availability record per calendar date.
        // A range is therefore expanded into daily entries so sprint capacity
        // can calculate each day's working hours correctly.
        const existing = await getProjectAvailability(
          projectId,
          form.startDate,
          form.endDate,
        );

        const targetUserId = form.userId ? Number(form.userId) : null;
        const existingDates = new Set(
          (Array.isArray(existing) ? existing : [])
            .filter((entry) => {
              const entryUserId =
                entry.userId == null ? null : Number(entry.userId);
              return entryUserId === targetUserId;
            })
            .map((entry) => entry.availabilityDate),
        );

        const conflicts = dates.filter((date) => existingDates.has(date));
        if (conflicts.length) {
          const preview = conflicts.slice(0, 5).map(formatDate).join(", ");
          const suffix =
            conflicts.length > 5 ? ` and ${conflicts.length - 5} more` : "";
          showError(
            `Availability already exists for ${preview}${suffix}. Edit the existing entries instead.`,
          );
          return;
        }

        for (const availabilityDate of dates) {
          await createMemberAvailability(projectId, {
            ...payloadBase,
            availabilityDate,
          });
        }

        success(
          dates.length === 1
            ? "Availability added successfully."
            : `Availability added for ${dates.length} days.`,
        );

        // Show the month containing the first day of the newly created range.
        setMonth(monthStart(start));
      }

      setDialogOpen(false);
      await loadData();
    } catch (err) {
      showError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to save availability.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entry) => {
    if (
      !requestConfirm(
        `Delete ${TYPE_META[entry.availabilityType]?.label || "availability"} for ${formatDate(entry.availabilityDate)}?`,
      )
    )
      return;

    try {
      await deleteMemberAvailability(projectId, entry.id);
      success("Availability entry deleted.");
      await loadData();
    } catch (err) {
      showError(
        err.response?.data?.message || "Failed to delete availability.",
      );
    }
  };

  const effectiveWorkingHoursForDate = (key) => {
    const match = [...workingHourHistory]
      .filter((item) => item.effectiveFrom <= key)
      .sort((a, b) =>
        String(b.effectiveFrom).localeCompare(String(a.effectiveFrom)),
      )[0];
    return Number(match?.workingHours ?? 8);
  };

  const selectedMember = useMemo(() => {
    if (filterUserId === "ALL" || filterUserId === "PROJECT") return null;
    return (
      members.find(
        (member) => Number(member.userId) === Number(filterUserId),
      ) || null
    );
  }, [filterUserId, members]);

  const getDefaultDayStatus = (date) => {
    if (!selectedMember && !isProjectMember) return null;

    const joinedAt =
      selectedMember?.createdAt || selectedMemberRecord?.createdAt;
    const joinedDate = joinedAt ? String(joinedAt).slice(0, 10) : null;
    if (joinedDate && keyCompare(dateKey(date), joinedDate) < 0) return null;

    if (date.getDay() === 0 || date.getDay() === 6) {
      return { type: "OFF", hours: 0, label: "Off" };
    }

    return {
      type: "AVAILABLE",
      hours: effectiveWorkingHoursForDate(dateKey(date)),
      label: "Available",
    };
  };

  const keyCompare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  const calendarDays = useMemo(() => {
    const first = monthStart(month);
    const last = monthEnd(month);
    const leading = first.getDay();
    const total = Math.ceil((leading + last.getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, index) => {
      const date = new Date(first);
      date.setDate(1 - leading + index);
      return date;
    });
  }, [month]);

  const today = dateKey(new Date());

  return (
    <Box className="app-page pm-fade-up">
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ letterSpacing: "-0.02em" }}
          >
            Member Availability
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Manage project holidays and member working availability.
          </Typography>
        </Box>

        {isProjectMember && !selfUpdateOpen && !canManage && (
          <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
            Availability submission is currently closed by the project
            administrator. You can view your availability and project holidays.
          </Alert>
        )}

        {canSubmitOwnAvailability && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openCreate()}
          >
            {canManage ? "Add Availability" : "Submit Availability"}
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(240px, 1fr) 220px auto",
              },
              gap: 2,
              alignItems: "center",
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel id="availability-project-label">Project</InputLabel>
              <Select
                labelId="availability-project-label"
                value={projectId}
                label="Project"
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setFilterUserId("ALL");
                }}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {canManage ? (
              <FormControl fullWidth size="small">
                <InputLabel id="availability-member-label">Member</InputLabel>
                <Select
                  labelId="availability-member-label"
                  value={filterUserId}
                  label="Member"
                  onChange={(event) => setFilterUserId(event.target.value)}
                >
                  <MenuItem value="ALL">All entries</MenuItem>
                  <MenuItem value="PROJECT">Project holidays</MenuItem>
                  {members.map((member) => (
                    <MenuItem key={member.userId} value={member.userId}>
                      {member.userName || member.userEmail}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box
                sx={{
                  minHeight: 40,
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  color: "text.secondary",
                  fontSize: 14,
                }}
              >
                My availability & project holidays
              </Box>
            )}

            <Button
              variant="outlined"
              onClick={loadData}
              sx={{ minHeight: 40, whiteSpace: "nowrap" }}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {canManage && (
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <SettingsIcon color="primary" />
                <Box>
                  <Typography fontWeight={800}>
                    Project Working Hours
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    The selected hours apply from the effective date until the
                    next update.
                  </Typography>
                </Box>
              </Stack>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ sm: "center" }}
              >
                <TextField
                  label="Effective from"
                  type="date"
                  size="small"
                  value={workingHoursEffectiveFrom}
                  onChange={(e) => setWorkingHoursEffectiveFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: today }}
                />
                <TextField
                  label="Working hours"
                  type="number"
                  size="small"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  inputProps={{ min: 0, max: 24, step: 0.5 }}
                  sx={{ width: 150 }}
                />
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveWorkingHours}
                  disabled={workingHoursSaving}
                >
                  {workingHoursSaving ? "Saving…" : "Save"}
                </Button>
              </Stack>
            </Stack>
            {workingHourHistory.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
                {workingHourHistory.map((item) => (
                  <Chip
                    key={item.id}
                    size="small"
                    variant="outlined"
                    label={`${formatDate(item.effectiveFrom)} · ${item.workingHours}h`}
                  />
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {canManage && members.length > 0 && (
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
            <Typography fontWeight={800} sx={{ mb: 1.5 }}>
              Member Availability Submission
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 1.5,
              }}
            >
              {members.map((member) => (
                <Stack
                  key={member.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    py: 1,
                    px: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1.5,
                    minWidth: 0,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ minWidth: 0 }}
                  >
                    <MemberAvatar
                      userId={member.userId}
                      name={member.userName || member.userEmail}
                      hasProfileImage={member.hasProfileImage}
                      sx={{
                        width: 30,
                        height: 30,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    />

                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {member.userName || member.userEmail}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {member.role === "MEMBER"
                          ? "Member self-entry"
                          : member.role}
                      </Typography>
                    </Box>
                  </Stack>

                  {["DEVELOPER", "TEAM_LEAD", "MEMBER"].includes(
                    String(member.role).toUpperCase(),
                  ) && (
                    <Button
                      size="small"
                      variant={
                        member.availabilitySelfUpdateOpen
                          ? "outlined"
                          : "contained"
                      }
                      onClick={() => toggleMemberSelfUpdate(member)}
                      sx={{
                        ml: 1,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {member.availabilitySelfUpdateOpen
                        ? "Close Member Entry"
                        : "Open Member Entry"}
                    </Button>
                  )}
                </Stack>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            label="Holiday entries"
            value={summary.holidays}
            icon={<HolidayIcon />}
            tone="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            label="Half days"
            value={summary.halfDays}
            icon={<TodayIcon />}
            tone="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            label="Unavailable"
            value={summary.unavailable}
            icon={<BusyIcon />}
            tone="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            label="Planned hours"
            value={summary.hours}
            icon={<AvailableIcon />}
            tone="success"
          />
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2.5,
              py: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box>
              <Typography fontWeight={800}>
                {month.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {canManage
                  ? "Project and member calendar"
                  : "Your availability and project holidays"}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                onClick={() =>
                  setMonth(
                    (value) =>
                      new Date(value.getFullYear(), value.getMonth() - 1, 1),
                  )
                }
                aria-label="Previous"
              >
                <ChevronLeftIcon />
              </IconButton>
              <Button
                size="small"
                onClick={() => setMonth(monthStart(new Date()))}
              >
                Today
              </Button>
              <IconButton
                onClick={() =>
                  setMonth(
                    (value) =>
                      new Date(value.getFullYear(), value.getMonth() + 1, 1),
                  )
                }
                aria-label="Next"
              >
                <ChevronRightIcon />
              </IconButton>
            </Stack>
          </Stack>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 760 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <Typography
                        key={day}
                        variant="caption"
                        fontWeight={800}
                        color="text.secondary"
                        sx={{ px: 1.5, py: 1.25 }}
                      >
                        {day}
                      </Typography>
                    ),
                  )}
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                  }}
                >
                  {calendarDays.map((date) => {
                    const key = dateKey(date);
                    const inMonth = date.getMonth() === month.getMonth();
                    const dayEntries = entriesByDate.get(key) || [];
                    const isWeekend =
                      date.getDay() === 0 || date.getDay() === 6;
                    const defaultStatus =
                      inMonth && dayEntries.length === 0
                        ? getDefaultDayStatus(date)
                        : null;
                    const isToday = key === today;

                    return (
                      <Box
                        key={key}
                        sx={{
                          minHeight: 125,
                          p: 1,
                          borderRight: "1px solid",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          bgcolor: inMonth
                            ? "background.paper"
                            : "action.hover",
                          opacity: inMonth ? 1 : 0.55,
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.75 }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              display: "grid",
                              placeItems: "center",
                              borderRadius: "50%",
                              bgcolor: isToday ? "primary.main" : "transparent",
                              color: isToday
                                ? "primary.contrastText"
                                : "text.primary",
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {date.getDate()}
                          </Box>
                          {canSubmitOwnAvailability &&
                            inMonth &&
                            !isWeekend && (
                              <Tooltip
                                title={
                                  canManage
                                    ? "Add availability"
                                    : "Submit availability"
                                }
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => openCreate(key)}
                                  aria-label="Add"
                                >
                                  <AddIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            )}
                        </Stack>

                        <Stack spacing={0.5}>
                          {dayEntries.slice(0, 3).map((entry) => (
                            <AvailabilityChip
                              key={entry.id}
                              entry={entry}
                              canEdit={canEditEntry(entry)}
                              canDelete={canManage}
                              onEdit={() => openEdit(entry)}
                              onDelete={() => remove(entry)}
                            />
                          ))}
                          {defaultStatus && (
                            <DefaultStatusChip status={defaultStatus} />
                          )}
                          {dayEntries.length > 3 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ px: 0.5 }}
                            >
                              +{dayEntries.length - 3} more
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
        <CardContent>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <GroupsIcon color="primary" />
            <Box>
              <Typography fontWeight={800}>How availability works</Typography>
              <Typography variant="body2" color="text.secondary">
                Project holidays apply to everyone. Member entries override the
                normal working day for one person.
              </Typography>
            </Box>
          </Stack>
          <Divider sx={{ mb: 1.5 }} />
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {Object.entries(TYPE_META).map(([type, meta]) => {
              const Icon = meta.icon;
              return (
                <Chip
                  key={type}
                  icon={<Icon sx={{ fontSize: 16 }} />}
                  label={meta.label}
                  color={meta.color}
                  variant="outlined"
                />
              );
            })}
            <Chip
              icon={<WorkOffIcon sx={{ fontSize: 16 }} />}
              label="Weekend Off"
              variant="outlined"
            />
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editing ? "Edit Availability" : "Add Availability"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.25} sx={{ pt: 0.5 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={editing ? "Date" : "Start date"}
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                    ...(editing ? { endDate: event.target.value } : {}),
                  }))
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: canManage ? undefined : today,
                  max: form.endDate || undefined,
                }}
                fullWidth
                size="small"
              />

              {!editing && (
                <TextField
                  label="End date"
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: canManage ? form.startDate || undefined : today,
                  }}
                  fullWidth
                  size="small"
                />
              )}
            </Stack>

            {!editing && (
              <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
                Select a date range to apply the same availability to every day
                in that period. For example, <strong>24 Sep – 28 Sep</strong>{" "}
                creates five daily entries.
              </Alert>
            )}

            <FormControl fullWidth size="small">
              <InputLabel id="availability-type-label">
                Availability type
              </InputLabel>
              <Select
                labelId="availability-type-label"
                value={form.availabilityType}
                label="Availability type"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    availabilityType: event.target.value,
                  }))
                }
              >
                {Object.entries(TYPE_META)
                  .filter(
                    ([type]) =>
                      canManage || ["HALF_DAY", "UNAVAILABLE"].includes(type),
                  )
                  .map(([type, meta]) => (
                    <MenuItem key={type} value={type}>
                      <Stack>
                        <Typography variant="body2" fontWeight={600}>
                          {meta.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {meta.description}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {canManage ? (
              <FormControl fullWidth size="small">
                <InputLabel id="availability-member-select-label">
                  Applies to
                </InputLabel>
                <Select
                  labelId="availability-member-select-label"
                  value={form.userId}
                  label="Applies to"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      userId: event.target.value,
                    }))
                  }
                >
                  {form.availabilityType === "HOLIDAY" && (
                    <MenuItem value="">Entire project</MenuItem>
                  )}
                  {members.map((member) => (
                    <MenuItem key={member.userId} value={String(member.userId)}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <MemberAvatar
                          userId={member.userId}
                          name={member.userName || member.userEmail}
                          hasProfileImage={member.hasProfileImage}
                          sx={{ width: 24, height: 24, fontSize: 11 }}
                        />
                        <span>{member.userName || member.userEmail}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                label="Member"
                value={user?.name || user?.email || "My availability"}
                fullWidth
                size="small"
                disabled
              />
            )}

            {form.availabilityType === "AVAILABLE" && (
              <TextField
                label="Available hours"
                type="number"
                value={form.availableHours}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    availableHours: event.target.value,
                  }))
                }
                inputProps={{ min: 0, max: 24, step: 0.5 }}
                fullWidth
                size="small"
              />
            )}

            <TextField
              label="Reason / note"
              value={form.reason}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              placeholder="e.g. Diwali holiday, planned leave, client workshop"
              multiline
              minRows={2}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving || !form.startDate || !form.endDate}
          >
            {saving ? "Saving…" : editing ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SummaryCard({ label, value, icon, tone }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: (theme) =>
                theme.palette[tone]?.light || theme.palette.action.hover,
              color: (theme) =>
                theme.palette[tone]?.dark || theme.palette.text.primary,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AvailabilityChip({ entry, canEdit, canDelete, onEdit, onDelete }) {
  const meta = TYPE_META[entry.availabilityType] || TYPE_META.UNAVAILABLE;
  const Icon = meta.icon;
  const label = entry.userName ? entry.userName : "Project holiday";

  return (
    <Box
      sx={{
        px: 0.75,
        py: 0.45,
        borderRadius: 1.25,
        bgcolor: `${meta.color}.50`,
        border: "1px solid",
        borderColor: `${meta.color}.200`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Icon sx={{ fontSize: 13 }} />
        <Typography variant="caption" fontWeight={700} noWrap sx={{ flex: 1 }}>
          {label}
        </Typography>
        {entry.availableHours != null &&
          entry.availabilityType !== "HOLIDAY" && (
            <Typography variant="caption" color="text.secondary">
              {entry.availableHours}h
            </Typography>
          )}
        {(canEdit || canDelete) && (
          <>
            {canEdit && (
              <IconButton
                size="small"
                onClick={onEdit}
                sx={{ p: 0.2 }}
                aria-label="Edit availability"
              >
                <EditIcon sx={{ fontSize: 13 }} />
              </IconButton>
            )}
            {canDelete && (
              <IconButton
                size="small"
                onClick={onDelete}
                sx={{ p: 0.2 }}
                aria-label="Delete availability"
              >
                <DeleteIcon sx={{ fontSize: 13 }} />
              </IconButton>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}

function DefaultStatusChip({ status }) {
  const isOff = status.type === "OFF";
  const Icon = isOff ? WorkOffIcon : AvailableIcon;
  return (
    <Box
      sx={{
        px: 0.75,
        py: 0.45,
        borderRadius: 1.25,
        bgcolor: isOff ? "action.hover" : "success.50",
        border: "1px solid",
        borderColor: isOff ? "divider" : "success.200",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Icon sx={{ fontSize: 13 }} />
        <Typography variant="caption" fontWeight={700} noWrap>
          {status.label}
        </Typography>
        {!isOff && (
          <Typography variant="caption" color="text.secondary">
            {status.hours}h
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

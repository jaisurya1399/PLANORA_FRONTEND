import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import VideoCallRoundedIcon from "@mui/icons-material/VideoCallRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getStoredUserId } from "../../api/axios";
import {
  attachMeetingDocument,
  createProjectMeeting,
  getDirectChatUsers,
  getDirectMessages,
  getMeetingDocuments,
  getMeetingMessages,
  getProjectMeetings,
  getProjectMessages,
  removeMeetingDocument,
  sendDirectMessage,
  sendMeetingMessage,
  sendProjectMessage,
  updateMeetingStatus,
} from "../../api/chatApi";
import { createDocument } from "../../api/documentApi";
import { getActiveEpicsByProject } from "../../api/epicApi";
import { getProjectUsers } from "../../api/projectUserApi";
import { useAuth } from "../../context/AuthContext";

const TAB = { DIRECT: 0, TEAM: 1, MEETINGS: 2 };

const EMPTY_MEETING = {
  title: "Team Meeting",
  agenda: "",
  startsAt: "",
  endsAt: "",
  meetingType: "ONLINE",
  meetingUrl: "",
  location: "",
  epicId: "",
  inviteAllTeam: true,
  attendeeIds: [],
};

const localDate = (d) => (d ? new Date(d).toLocaleString() : "");
const toIso = (value) => (value ? new Date(value).toISOString() : null);

function initialsOf(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

/* -----------------------------------------------------------------------
   Small shared presentational helpers
----------------------------------------------------------------------- */

function EmptyState({ icon: Icon, message }) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{ height: "100%", minHeight: 200, color: "text.secondary" }}
    >
      <Icon sx={{ fontSize: 32, opacity: 0.4 }} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Stack>
  );
}

function LabeledSelect({ icon: Icon, label, value, onChange, children, sx }) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 240, ...sx }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, pl: 0.25 }}
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
              Icon ? (
                <InputAdornment position="start">
                  <Icon fontSize="small" color="action" />
                </InputAdornment>
              ) : undefined
            }
          />
        }
      >
        {children}
      </Select>
    </Stack>
  );
}

/* -----------------------------------------------------------------------
   Chat panel (messages + composer) — shared by Direct / Team / Meeting chat
----------------------------------------------------------------------- */

function ChatMessages({ messages, me, endRef }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 2,
        p: 2,
        height: 220,
        overflowY: "auto",
        borderRadius: 2.5,
        bgcolor: "grey.50",
      }}
    >
      {messages.length === 0 ? (
        <EmptyState
          icon={ChatBubbleOutlineRoundedIcon}
          message="No messages yet. Say hello!"
        />
      ) : (
        messages.map((m) => {
          const isMine = Number(m.senderId) === me;
          const senderLabel = isMine ? "You" : m.senderName || "Unknown user";
          return (
            <Stack
              key={m.id}
              direction="row"
              spacing={1}
              justifyContent={isMine ? "flex-end" : "flex-start"}
              sx={{ mb: 1.5 }}
            >
              {!isMine && (
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    bgcolor: "secondary.main",
                    flexShrink: 0,
                    mt: 0.5,
                  }}
                >
                  {initialsOf(m.senderName)}
                </Box>
              )}
              <Paper
                elevation={0}
                sx={{
                  p: 1.25,
                  maxWidth: "72%",
                  borderRadius: 3,
                  ...(isMine
                    ? { bgcolor: "primary.main", color: "primary.contrastText" }
                    : {
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                      }),
                }}
              >
                {!isMine && (
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    display="block"
                    sx={{ mb: 0.25 }}
                  >
                    {senderLabel}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {m.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.75, display: "block", mt: 0.5 }}
                >
                  {localDate(m.createdAt)}
                </Typography>
              </Paper>
            </Stack>
          );
        })
      )}
      <div ref={endRef} />
    </Paper>
  );
}

function Composer({ text, setText, onSend, disabled }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        size="small"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          disabled
            ? "Select a conversation to start chatting…"
            : "Write a message…"
        }
        multiline
        maxRows={3}
        disabled={disabled}
      />
      <Button
        variant="contained"
        onClick={onSend}
        endIcon={<SendRoundedIcon />}
        disabled={disabled || !text.trim()}
        sx={{ flexShrink: 0 }}
      >
        Send
      </Button>
    </Stack>
  );
}

/* -----------------------------------------------------------------------
   Meeting scheduler form
----------------------------------------------------------------------- */

function MeetingScheduler({ meeting, setMeeting, team, epics, onSchedule }) {
  const update = (patch) => setMeeting((prev) => ({ ...prev, ...patch }));

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, mt: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <EventRoundedIcon fontSize="small" color="primary" />
        <Typography variant="subtitle1" fontWeight={700}>
          Schedule a meeting
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <TextField
          label="Meeting title"
          size="small"
          value={meeting.title}
          onChange={(event) => update({ title: event.target.value })}
        />
        <TextField
          label="Agenda"
          size="small"
          multiline
          minRows={2}
          value={meeting.agenda}
          onChange={(event) => update({ agenda: event.target.value })}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            type="datetime-local"
            label="Starts"
            InputLabelProps={{ shrink: true }}
            value={meeting.startsAt}
            onChange={(event) => update({ startsAt: event.target.value })}
          />
          <TextField
            fullWidth
            size="small"
            type="datetime-local"
            label="Ends"
            InputLabelProps={{ shrink: true }}
            value={meeting.endsAt}
            onChange={(event) => update({ endsAt: event.target.value })}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <FormControl fullWidth size="small">
            <InputLabel>Meeting type</InputLabel>
            <Select
              value={meeting.meetingType}
              label="Meeting type"
              onChange={(event) => update({ meetingType: event.target.value })}
            >
              <MenuItem value="ONLINE">Online</MenuItem>
              <MenuItem value="OFFLINE">Offline</MenuItem>
            </Select>
          </FormControl>

          {meeting.meetingType === "ONLINE" ? (
            <TextField
              fullWidth
              size="small"
              label="Meeting URL"
              placeholder="https://…"
              value={meeting.meetingUrl}
              onChange={(event) => update({ meetingUrl: event.target.value })}
            />
          ) : (
            <TextField
              fullWidth
              size="small"
              label="Location / room"
              value={meeting.location}
              onChange={(event) => update({ location: event.target.value })}
            />
          )}
        </Stack>

        <FormControl fullWidth size="small">
          <InputLabel>Epic (optional)</InputLabel>
          <Select
            value={meeting.epicId}
            label="Epic (optional)"
            onChange={(event) => update({ epicId: event.target.value })}
          >
            <MenuItem value="">No epic</MenuItem>
            {epics.map((epic) => (
              <MenuItem key={epic.id} value={String(epic.id)}>
                {epic.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" alignItems="center">
          <Checkbox
            checked={meeting.inviteAllTeam}
            onChange={(event) =>
              update({ inviteAllTeam: event.target.checked })
            }
          />
          <Typography variant="body2">Invite whole team</Typography>
        </Stack>

        {!meeting.inviteAllTeam && (
          <FormControl fullWidth size="small">
            <InputLabel>Invite attendees</InputLabel>
            <Select
              multiple
              value={meeting.attendeeIds}
              onChange={(event) =>
                update({
                  attendeeIds:
                    typeof event.target.value === "string"
                      ? event.target.value.split(",")
                      : event.target.value,
                })
              }
              input={<OutlinedInput label="Invite attendees" />}
              renderValue={(selected) => (
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {selected.map((id) => (
                    <Chip
                      key={id}
                      size="small"
                      label={
                        team.find(
                          (u) => String(u.id ?? u.userId) === String(id),
                        )?.name || id
                      }
                    />
                  ))}
                </Stack>
              )}
            >
              {team.map((u) => {
                const id = String(u.id ?? u.userId);
                return (
                  <MenuItem key={id} value={id}>
                    <Checkbox
                      checked={meeting.attendeeIds.includes(id)}
                      size="small"
                    />
                    {u.name} — {u.email}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        )}

        <Button
          variant="contained"
          startIcon={<EventRoundedIcon />}
          onClick={onSchedule}
          sx={{ alignSelf: "flex-start" }}
        >
          Schedule meeting
        </Button>
      </Stack>
    </Paper>
  );
}

/* -----------------------------------------------------------------------
   Meeting list card
----------------------------------------------------------------------- */

function MeetingCard({ meeting: m, onOpenDiscussion, onComplete }) {
  const isScheduled = m.status === "SCHEDULED";

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography fontWeight={700}>{m.title}</Typography>
            <Chip
              size="small"
              label={m.status || "SCHEDULED"}
              sx={{
                fontWeight: 600,
                bgcolor: isScheduled
                  ? alpha("#1976d2", 0.12)
                  : alpha("#2e7d32", 0.12),
                color: isScheduled ? "primary.main" : "success.main",
              }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {localDate(m.startsAt)}
            {m.endsAt && ` – ${localDate(m.endsAt)}`}
          </Typography>

          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" variant="outlined" label={m.meetingType} />
            {m.epicName && (
              <Chip
                size="small"
                variant="outlined"
                label={`Epic: ${m.epicName}`}
              />
            )}
            <Chip
              size="small"
              variant="outlined"
              label={
                m.inviteAllTeam
                  ? "Whole team"
                  : `${m.attendees?.length || 0} invited`
              }
            />
          </Stack>

          {(m.meetingUrl || m.location) && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {m.meetingType === "ONLINE" ? m.meetingUrl : m.location}
            </Typography>
          )}
          {m.agenda && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {m.agenda}
            </Typography>
          )}
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-start"
          flexWrap="wrap"
          useFlexGap
        >
          <Button size="small" variant="outlined" onClick={onOpenDiscussion}>
            Discussion
          </Button>
          {m.meetingType === "ONLINE" && m.meetingUrl && (
            <Button
              size="small"
              component="a"
              href={m.meetingUrl}
              target="_blank"
              rel="noreferrer"
              startIcon={<VideoCallRoundedIcon />}
            >
              Join
            </Button>
          )}
          {isScheduled && (
            <Button
              size="small"
              startIcon={<CheckCircleRoundedIcon />}
              onClick={onComplete}
            >
              Complete
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

/* -----------------------------------------------------------------------
   Meeting discussion (chat + documents) panel
----------------------------------------------------------------------- */

function MeetingDiscussion({
  messages,
  me,
  endRef,
  text,
  setText,
  onSend,
  docs,
  onUpload,
  onRemoveDoc,
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, mt: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <ForumRoundedIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            Meeting discussion
          </Typography>
        </Stack>
        <Button
          component="label"
          size="small"
          startIcon={<AttachFileRoundedIcon />}
        >
          Add document
          <input hidden type="file" onChange={onUpload} />
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Discussion and documents are scoped to this meeting.
      </Typography>

      <ChatMessages messages={messages} me={me} endRef={endRef} />
      <Composer
        text={text}
        setText={setText}
        onSend={onSend}
        disabled={false}
      />

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <DescriptionOutlinedIcon fontSize="small" color="action" />
        <Typography variant="subtitle2" fontWeight={700}>
          Meeting documents
        </Typography>
      </Stack>

      {docs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No documents attached yet.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {docs.map((d) => (
            <Paper
              key={d.documentId}
              variant="outlined"
              sx={{
                px: 1.5,
                py: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" noWrap sx={{ mr: 2 }}>
                {d.originalName || d.name}
              </Typography>
              <Stack direction="row" spacing={0.5} flexShrink={0}>
                <Tooltip title="Open">
                  <IconButton
                    size="small"
                    component="a"
                    href={`/api/documents/${d.documentId}/download`}
                    target="_blank"
                  >
                    <OpenInNewRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={() => onRemoveDoc(d.documentId)}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

/* -----------------------------------------------------------------------
   Main page
----------------------------------------------------------------------- */

export default function CommunicationHub() {
  const { user, getPrimaryProjectId } = useAuth();
  const me = Number(getStoredUserId());

  const [tab, setTab] = useState(TAB.DIRECT);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [epics, setEpics] = useState([]);

  const [selectedUser, setSelectedUser] = useState("");
  const [projectId, setProjectId] = useState("");
  const [meetingId, setMeetingId] = useState("");

  const [messages, setMessages] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [meetingDocs, setMeetingDocs] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const [meeting, setMeeting] = useState(EMPTY_MEETING);

  const endRef = useRef();
  // Guards against out-of-order network responses: if the user switches
  // tabs/project/meeting quickly, an older in-flight request's response
  // must not be allowed to overwrite state set by a newer request.
  const requestIdRef = useRef(0);

  const visibleUsers = useMemo(
    () => users.filter((u) => Number(u.id ?? u.userId) !== me),
    [users, me],
  );

  useEffect(() => {
    const memberships = Array.isArray(user?.projectMemberships)
      ? user.projectMemberships
      : [];
    const activeId = getPrimaryProjectId();
    const activeMembership = memberships.find(
      (m) => Number(m?.projectId) === Number(activeId),
    );
    const projectList = activeMembership
      ? [
          {
            id: Number(activeMembership.projectId),
            name:
              activeMembership.projectName ||
              activeMembership.project?.name ||
              `Project #${activeMembership.projectId}`,
          },
        ]
      : [];
    setProjects(projectList);
    setProjectId(projectList.length ? String(projectList[0].id) : "");

    // Direct Chat users are project-scoped: System Admins + members of the
    // currently selected project. Do not call the global /users endpoint here.
    if (activeId) {
      getDirectChatUsers(activeId)
        .then((u) => {
          const userList = Array.isArray(u) ? u : [];
          setUsers(userList);
          const firstOther = userList.find(
            (x) => Number(x.id ?? x.userId) !== me,
          );
          setSelectedUser(
            firstOther ? String(firstOther.id ?? firstOther.userId) : "",
          );
        })
        .catch(() => {
          setUsers([]);
          setSelectedUser("");
        });
    } else {
      setUsers([]);
      setSelectedUser("");
    }
  }, [me, user, getPrimaryProjectId]);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      getProjectUsers(projectId),
      getActiveEpicsByProject(projectId),
    ])
      .then(([members, es]) => {
        setTeam(
          (members || []).map((x) =>
            x.user
              ? x.user
              : { id: x.userId, name: x.userName, email: x.userEmail },
          ),
        );
        setEpics(es || []);
      })
      .catch(() => {});
  }, [projectId]);

  // Reset attendee selections whenever the project changes — otherwise a
  // previously-picked attendee id could silently refer to a member of a
  // different project's team once `team` is swapped out.
  useEffect(() => {
    setMeeting((prev) => ({ ...prev, attendeeIds: [] }));
  }, [projectId]);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setError("");

      if (tab === TAB.DIRECT && selectedUser) {
        const data = await getDirectMessages(selectedUser);
        if (requestId !== requestIdRef.current) return;
        setMessages(data || []);
      } else if (tab === TAB.TEAM && projectId) {
        const data = await getProjectMessages(projectId);
        if (requestId !== requestIdRef.current) return;
        setMessages(data || []);
      } else if (tab === TAB.MEETINGS && projectId) {
        const ms = await getProjectMeetings(projectId);
        if (requestId !== requestIdRef.current) return;
        setMeetings(ms || []);

        if (meetingId) {
          const [msgs, docs] = await Promise.all([
            getMeetingMessages(meetingId),
            getMeetingDocuments(meetingId),
          ]);
          if (requestId !== requestIdRef.current) return;
          setMessages(msgs || []);
          setMeetingDocs(docs || []);
        } else {
          setMessages([]);
          setMeetingDocs([]);
        }
      }
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(
        e?.response?.data?.message || "Unable to load communication data.",
      );
    }
  }, [tab, selectedUser, projectId, meetingId]);

  useEffect(() => {
    load();
  }, [load]);

  // useEffect(() => {
  //   endRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  useEffect(() => {
    if (
      (tab === TAB.DIRECT && !selectedUser) ||
      (tab === TAB.TEAM && !projectId) ||
      (tab === TAB.MEETINGS && !meetingId)
    ) {
      return undefined;
    }
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [tab, selectedUser, projectId, meetingId, load]);

  const send = useCallback(async () => {
    if (!text.trim()) return;
    if (tab === TAB.DIRECT && !selectedUser) return;
    if (tab === TAB.TEAM && !projectId) return;
    if (tab === TAB.MEETINGS && !meetingId) return;

    try {
      if (tab === TAB.DIRECT) await sendDirectMessage(selectedUser, text);
      else if (tab === TAB.TEAM) await sendProjectMessage(projectId, text);
      else await sendMeetingMessage(meetingId, text);
      setText("");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Message could not be sent.");
    }
  }, [text, tab, selectedUser, projectId, meetingId, load]);

  const schedule = useCallback(async () => {
    if (!meeting.title.trim()) {
      setError("Meeting title is required.");
      return;
    }
    if (!meeting.startsAt) {
      setError("Meeting start time is required.");
      return;
    }
    if (!projectId) {
      setError("Select a project before scheduling a meeting.");
      return;
    }

    try {
      setError("");
      const payload = {
        ...meeting,
        startsAt: toIso(meeting.startsAt),
        endsAt: toIso(meeting.endsAt),
        epicId: meeting.epicId ? Number(meeting.epicId) : null,
        attendeeIds: meeting.attendeeIds.map(Number),
        meetingUrl:
          meeting.meetingType === "ONLINE" ? meeting.meetingUrl : null,
        location: meeting.meetingType === "OFFLINE" ? meeting.location : null,
      };
      const saved = await createProjectMeeting(projectId, payload);
      setMeetings(await getProjectMeetings(projectId));
      setMeetingId(String(saved.id));
      setMeeting(EMPTY_MEETING);
    } catch (e) {
      setError(e?.response?.data?.message || "Meeting could not be scheduled.");
    }
  }, [meeting, projectId]);

  const uploadDoc = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !meetingId) return;

      try {
        const doc = await createDocument(file.name, file);
        await attachMeetingDocument(meetingId, doc.id);
        setMeetingDocs(await getMeetingDocuments(meetingId));
      } catch (err) {
        setError(
          err?.response?.data?.message || "Document could not be attached.",
        );
      }
    },
    [meetingId],
  );

  const removeDoc = useCallback(
    async (documentId) => {
      try {
        await removeMeetingDocument(meetingId, documentId);
        setMeetingDocs(await getMeetingDocuments(meetingId));
      } catch (err) {
        setError(
          err?.response?.data?.message || "Document could not be removed.",
        );
      }
    },
    [meetingId],
  );

  const completeMeeting = useCallback(
    async (id) => {
      try {
        await updateMeetingStatus(id, "COMPLETED");
        setMeetings(await getProjectMeetings(projectId));
      } catch (err) {
        setError(
          err?.response?.data?.message || "Meeting could not be updated.",
        );
      }
    },
    [projectId],
  );

  const handleTabChange = (_, value) => {
    setTab(value);
    setMeetingId("");
    setMessages([]);
    setError("");
  };

  const composerDisabled =
    (tab === TAB.DIRECT && !selectedUser) ||
    (tab === TAB.TEAM && !projectId) ||
    (tab === TAB.MEETINGS && !meetingId);

  return (
    <Stack spacing={2.5} className="app-page pm-fade-up">
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            flexShrink: 0,
          }}
        >
          <ForumRoundedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
            Team Communication
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Direct chat, project/team chat and meeting workspace.
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card elevation={0} variant="outlined" sx={{ borderRadius: 3 }}>
        <Tabs value={tab} onChange={handleTabChange} sx={{ px: 1 }}>
          <Tab
            icon={<ChatBubbleOutlineRoundedIcon fontSize="small" />}
            iconPosition="start"
            label="Direct Chat"
          />
          <Tab
            icon={<GroupsRoundedIcon fontSize="small" />}
            iconPosition="start"
            label="Team Chat"
          />
          <Tab
            icon={<EventAvailableRoundedIcon fontSize="small" />}
            iconPosition="start"
            label="Meetings"
          />
        </Tabs>
        <Divider />

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {tab === TAB.DIRECT && (
            <LabeledSelect
              icon={ChatBubbleOutlineRoundedIcon}
              label="Teammate"
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
              sx={{ width: "100%" }}
            >
              <MenuItem value="">Select teammate</MenuItem>
              {visibleUsers.map((u) => (
                <MenuItem
                  key={u.id ?? u.userId}
                  value={String(u.id ?? u.userId)}
                >
                  {u.name} — {u.email}
                </MenuItem>
              ))}
            </LabeledSelect>
          )}

          {tab === TAB.TEAM && (
            <LabeledSelect
              icon={GroupsRoundedIcon}
              label="Project"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              sx={{ width: "100%" }}
            >
              {projects.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.name} ({p.ticketPrefix || "PROJECT"})
                </MenuItem>
              ))}
            </LabeledSelect>
          )}

          {tab === TAB.DIRECT || tab === TAB.TEAM ? (
            <>
              <ChatMessages messages={messages} me={me} endRef={endRef} />
              <Composer
                text={text}
                setText={setText}
                onSend={send}
                disabled={composerDisabled}
              />
            </>
          ) : (
            <>
              <LabeledSelect
                icon={GroupsRoundedIcon}
                label="Project"
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setMeetingId("");
                }}
                sx={{ width: "100%" }}
              >
                {projects.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </MenuItem>
                ))}
              </LabeledSelect>

              <MeetingScheduler
                meeting={meeting}
                setMeeting={setMeeting}
                team={team}
                epics={epics}
                onSchedule={schedule}
              />

              <Stack spacing={1.5} sx={{ mt: 2.5 }}>
                {meetings.length === 0 ? (
                  <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <EmptyState
                      icon={InboxOutlinedIcon}
                      message="No meetings scheduled yet."
                    />
                  </Paper>
                ) : (
                  meetings.map((m) => (
                    <MeetingCard
                      key={m.id}
                      meeting={m}
                      onOpenDiscussion={() => setMeetingId(String(m.id))}
                      onComplete={() => completeMeeting(m.id)}
                    />
                  ))
                )}
              </Stack>

              {meetingId && (
                <MeetingDiscussion
                  messages={messages}
                  me={me}
                  endRef={endRef}
                  text={text}
                  setText={setText}
                  onSend={send}
                  docs={meetingDocs}
                  onUpload={uploadDoc}
                  onRemoveDoc={removeDoc}
                />
              )}
            </>
          )}
        </Box>
      </Card>
    </Stack>
  );
}

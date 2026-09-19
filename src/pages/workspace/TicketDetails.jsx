import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CodeIcon from "@mui/icons-material/Code";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import ImageIcon from "@mui/icons-material/Image";
import LinkIcon from "@mui/icons-material/Link";
import PersonIcon from "@mui/icons-material/Person";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RedoIcon from "@mui/icons-material/Redo";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import UndoIcon from "@mui/icons-material/Undo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";
import TicketLinks from "../../components/tickets/TicketLinks";
import TicketWatchers from "../../components/tickets/TicketWatchers";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getTicketAuditEvents } from "../../api/auditApi";
import { getStoredUserId } from "../../api/axios";
import {
  addTicketComment,
  deleteTicketAttachment,
  deleteTicketComment,
  deleteTicketHours,
  downloadTicketAttachment,
  getTicketAttachments,
  getTicketById,
  getTicketComments,
  getTicketHours,
  logTicketHours,
  uploadTicketAttachment,
  viewTicketAttachment,
} from "../../api/ticketApi";
import MemberAvatar from "../../components/common/MemberAvatar";
import { useAuth } from "../../context/AuthContext";
import {
  BORDER,
  CANVAS_BACKGROUND,
  ISSUE_TYPE_COLORS,
  PRIMARY,
  PRIMARY_SUBTLE,
  PRIORITY_COLORS,
  RADIUS,
  STATUS_COLORS,
  SURFACE,
  TEXT_FAINT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../../theme/colors";
import { getWorkspaceBase } from "../../utils/navigation";

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  // ============================================================
  // Route Prefix (admin vs developer) — used for internal links
  // ============================================================

  const routePrefix = getWorkspaceBase(location.pathname);

  // ============================================================
  // Current Logged-in User
  // ============================================================

  // AuthProvider and axios both use sessionStorage. Do not read the
  // authenticated user from localStorage here, otherwise the ID can be
  // missing even though the user is successfully logged in.
  const { user: authUser } = useAuth();

  const getCurrentUserId = () => {
    const userId =
      authUser?.id ??
      authUser?.userId ??
      authUser?.sub ??
      authUser?.user?.id ??
      authUser?.user?.userId ??
      authUser?.data?.id ??
      authUser?.data?.userId ??
      getStoredUserId();

    const numericId = Number(userId);

    return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
  };

  const currentUserId = getCurrentUserId();

  // ============================================================
  // State
  // ============================================================

  const [ticket, setTicket] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("comments");

  const [comments, setComments] = useState([]);

  const [activities, setActivities] = useState([]);

  const [timeLogs, setTimeLogs] = useState([]);

  const [attachments, setAttachments] = useState([]);

  const [tabLoading, setTabLoading] = useState(false);

  const [comment, setComment] = useState("");

  const [commentLoading, setCommentLoading] = useState(false);

  const [timeDialogOpen, setTimeDialogOpen] = useState(false);

  const [timeLoading, setTimeLoading] = useState(false);

  const [timeForm, setTimeForm] = useState({
    hours: "",
    minutes: "",
    description: "",
  });

  const [uploadLoading, setUploadLoading] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  // ============================================================
  // Load Ticket
  // ============================================================

  const loadTicket = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const data = await getTicketById(id);

      setTicket(data);
    } catch (err) {
      console.error("TICKET DETAILS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load ticket details.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Normalize API List
  // ============================================================

  const normalizeList = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.content)) {
      return data.content;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.items)) {
      return data.items;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  };

  // ============================================================
  // Load Tab Data
  // ============================================================

  const loadTabData = async (tab) => {
    if (!id) return;

    try {
      setTabLoading(true);
      setError("");

      switch (tab) {
        case "comments": {
          const data = await getTicketComments(id);

          setComments(normalizeList(data));

          break;
        }

        case "time": {
          const data = await getTicketHours(id);

          setTimeLogs(normalizeList(data));

          break;
        }

        case "activities": {
          const data = await getTicketAuditEvents(id);

          setActivities(normalizeList(data));

          break;
        }

        case "attachments": {
          const data = await getTicketAttachments(id);

          setAttachments(normalizeList(data));

          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error(`FAILED TO LOAD ${tab}:`, err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          `Failed to load ${tab}.`,
      );
    } finally {
      setTabLoading(false);
    }
  };

  // ============================================================
  // Initial Load
  // ============================================================

  useEffect(() => {
    if (!id) return;

    loadTicket();
    loadTabData("comments");
    loadTabData("time");
  }, [id]);

  const handleViewAttachment = async (attachmentId, fileName) => {
    if (!attachmentId) return;

    try {
      setError("");

      const response = await viewTicketAttachment(attachmentId);

      const contentType =
        response?.headers?.["content-type"] || "application/octet-stream";

      const blob = new Blob([response.data], {
        type: contentType,
      });

      const url = window.URL.createObjectURL(blob);

      // Browser-supported files will open in a new tab
      const newWindow = window.open(url, "_blank");

      if (!newWindow) {
        setError("Popup blocked. Please allow popups to view the attachment.");
      }

      // Give browser enough time to load the blob
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);
    } catch (err) {
      console.error("VIEW ATTACHMENT ERROR:", err);
      console.error("STATUS:", err?.response?.status);
      console.error("RESPONSE:", err?.response?.data);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to view attachment.",
      );
    }
  };

  // ============================================================
  // Helpers
  // ============================================================

  const formatDateTime = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const now = new Date();

    const diff = now.getTime() - parsedDate.getTime();

    const minutes = Math.floor(diff / 60000);

    const hours = Math.floor(minutes / 60);

    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return "just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    return formatDateTime(date);
  };

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // ============================================================
  // Comment Helpers
  // ============================================================

  const getCommentUser = (item) => {
    return (
      item?.userName ||
      item?.createdByName ||
      item?.authorName ||
      item?.creatorName ||
      item?.user?.name ||
      item?.createdBy?.name ||
      "User"
    );
  };

  const getCommentUserId = (item) => {
    return (
      item?.userId ??
      item?.authorId ??
      item?.createdById ??
      item?.user?.id ??
      item?.author?.id ??
      item?.createdBy?.id ??
      null
    );
  };

  const getCommentContent = (item) => {
    return (
      item?.content || item?.comment || item?.text || item?.description || ""
    );
  };

  const getCommentDate = (item) => {
    return (
      item?.createdAt ||
      item?.createdDate ||
      item?.date ||
      item?.timestamp ||
      item?.updatedAt
    );
  };

  // ============================================================
  // Activity Helpers
  // ============================================================

  const getActivityUser = (item) => {
    return (
      item?.userName ||
      item?.createdByName ||
      item?.performedByName ||
      item?.actorName ||
      item?.user?.name ||
      item?.createdBy?.name ||
      "System"
    );
  };

  const getActivityMessage = (item) => {
    return (
      item?.description ||
      item?.message ||
      item?.activity ||
      item?.action ||
      item?.content ||
      "Ticket activity"
    );
  };

  const getActivityDate = (item) => {
    return (
      item?.createdAt ||
      item?.createdDate ||
      item?.date ||
      item?.timestamp ||
      item?.updatedAt
    );
  };

  // ============================================================
  // Attachment Helpers
  // ============================================================

  const getAttachmentName = (item) => {
    return (
      item?.originalName ||
      item?.originalFileName ||
      item?.fileName ||
      item?.filename ||
      item?.name ||
      "Attachment"
    );
  };

  const getAttachmentSize = (item) => {
    const size = Number(item?.fileSize ?? item?.size ?? item?.fileLength ?? 0);

    if (!Number.isFinite(size) || size <= 0) {
      return "";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getAttachmentDate = (item) => {
    return (
      item?.createdAt ||
      item?.uploadedAt ||
      item?.createdDate ||
      item?.updatedAt
    );
  };

  const getAttachmentUploader = (item) => {
    return (
      item?.uploadedByName ||
      item?.createdByName ||
      item?.userName ||
      item?.user?.name ||
      ""
    );
  };

  // ============================================================
  // Add Comment
  // ============================================================

  const handleAddComment = async () => {
    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      return;
    }

    if (!currentUserId) {
      setError("Logged-in user ID not found. Please login again.");

      console.error("CURRENT USER ID NOT FOUND");

      return;
    }

    try {
      setCommentLoading(true);
      setError("");

      const response = await addTicketComment(id, comment);

      const createdComment = response?.data || response;

      setComment("");

      if (
        createdComment &&
        typeof createdComment === "object" &&
        !Array.isArray(createdComment)
      ) {
        setComments((prev) => [...prev, createdComment]);
      } else {
        await loadTabData("comments");
      }
    } catch (err) {
      console.error("ADD COMMENT ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to add comment.",
      );
    } finally {
      setCommentLoading(false);
    }
  };

  // ============================================================
  // Delete Comment
  // ============================================================

  const handleDeleteComment = async (commentId) => {
    if (!commentId) return;

    const confirmed = await requestConfirm(
      "Are you sure you want to delete this comment?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(commentId);
      setError("");

      await deleteTicketComment(commentId);

      setComments((prev) =>
        prev.filter(
          (item) => Number(item?.id ?? item?.commentId) !== Number(commentId),
        ),
      );
    } catch (err) {
      console.error("DELETE COMMENT ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete comment.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // Open Time Dialog
  // ============================================================

  const openTimeDialog = () => {
    setError("");

    setTimeForm({
      hours: "",
      minutes: "",
      description: "",
    });

    setTimeDialogOpen(true);
  };

  // ============================================================
  // Log Time
  // ============================================================

  const handleLogTime = async () => {
    try {
      setError("");

      const ticketId = Number(id);

      if (!Number.isInteger(ticketId) || ticketId <= 0) {
        console.error("INVALID TICKET ID:", id);

        setError("Invalid ticket ID. Please open the ticket again.");

        return;
      }

      const userId = getCurrentUserId();

      if (!userId) {
        console.error("CURRENT USER ID NOT FOUND");

        setError("Logged-in user ID not found. Please login again.");

        return;
      }

      const hours = Number(timeForm.hours || 0);

      const minutes = Number(timeForm.minutes || 0);

      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        setError("Please enter valid hours and minutes.");

        return;
      }

      if (hours < 0) {
        setError("Hours cannot be negative.");

        return;
      }

      if (minutes < 0 || minutes > 59) {
        setError("Minutes must be between 0 and 59.");

        return;
      }

      if (hours === 0 && minutes === 0) {
        setError("Please enter time to log.");

        return;
      }

      const value = Number((hours + minutes / 60).toFixed(2));

      if (!Number.isFinite(value) || value <= 0) {
        setError("Invalid time value.");

        return;
      }

      const payload = {
        ticketId,
        userId,
        value,
        comment: timeForm.description?.trim() || null,
        activityId: null,
      };

      setTimeLoading(true);

      const createdTime = await logTicketHours(payload);

      setTimeDialogOpen(false);

      setTimeForm({
        hours: "",
        minutes: "",
        description: "",
      });

      const newTime = createdTime?.data || createdTime;

      if (newTime && typeof newTime === "object" && !Array.isArray(newTime)) {
        setTimeLogs((prev) => [...prev, newTime]);
      } else {
        await loadTabData("time");
      }
    } catch (err) {
      console.error("LOG TIME ERROR:", err);

      console.error("BACKEND RESPONSE:", err?.response?.data);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to log time.",
      );
    } finally {
      setTimeLoading(false);
    }
  };

  // ============================================================
  // Delete Time
  // ============================================================

  const handleDeleteTime = async (timeId) => {
    if (!timeId) return;

    const confirmed = await requestConfirm(
      "Are you sure you want to delete this time log?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(timeId);
      setError("");

      await deleteTicketHours(timeId);

      setTimeLogs((prev) =>
        prev.filter((item) => Number(item?.id) !== Number(timeId)),
      );
    } catch (err) {
      console.error("DELETE TIME ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete time log.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // Upload Attachment
  // ============================================================

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadLoading(true);
      setError("");

      const ticketId = Number(id);

      await uploadTicketAttachment(ticketId, file);

      await loadTabData("attachments");
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      console.error("STATUS:", err?.response?.status);
      console.error("RESPONSE:", err?.response?.data);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to upload attachment.",
      );
    } finally {
      setUploadLoading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ============================================================
  // Delete Attachment
  // ============================================================

  const handleDeleteAttachment = async (attachmentId) => {
    if (!attachmentId) return;

    const confirmed = await requestConfirm(
      "Are you sure you want to delete this attachment?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(attachmentId);
      setError("");

      await deleteTicketAttachment(attachmentId);

      setAttachments((prev) =>
        prev.filter(
          (item) =>
            Number(item?.id ?? item?.attachmentId) !== Number(attachmentId),
        ),
      );
    } catch (err) {
      console.error("DELETE ATTACHMENT ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete attachment.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // Download Attachment
  // ============================================================

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    if (!attachmentId) return;

    try {
      setError("");

      const response = await downloadTicketAttachment(attachmentId);

      const blob = new Blob([response.data], {
        type: response?.headers?.["content-type"] || "application/octet-stream",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = fileName || "attachment";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOWNLOAD ATTACHMENT ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to download attachment.",
      );
    }
  };

  // ============================================================
  // Total Logged Time
  // ============================================================

  const totalLoggedMinutes = Math.round(
    timeLogs.reduce((total, item) => total + Number(item?.value ?? 0), 0) * 60,
  );

  const totalLoggedHours = Math.floor(totalLoggedMinutes / 60);

  const totalLoggedRemainingMinutes = totalLoggedMinutes % 60;

  const totalLoggedText =
    totalLoggedHours > 0
      ? `${totalLoggedHours}h${
          totalLoggedRemainingMinutes > 0
            ? ` ${totalLoggedRemainingMinutes}m`
            : ""
        }`
      : `${totalLoggedRemainingMinutes}m`;

  // ============================================================
  // Estimation
  // ============================================================

  const rawEstimation =
    ticket?.estimation ?? ticket?.estimate ?? ticket?.estimatedHours ?? 0;

  const numericEstimation = Number(rawEstimation);

  const estimationText =
    ticket?.estimate ||
    ticket?.estimation ||
    ticket?.estimatedHours ||
    "8 hours";

  // ============================================================
  // Estimated Minutes
  // ============================================================

  const estimatedMinutes =
    Number.isFinite(numericEstimation) && numericEstimation > 0
      ? numericEstimation * 60
      : 0;

  // ============================================================
  // Progress
  // ============================================================

  const timeProgress =
    estimatedMinutes > 0
      ? Math.min(100, Math.round((totalLoggedMinutes / estimatedMinutes) * 100))
      : 0;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ============================================================
  // Error Without Ticket
  // ============================================================

  if (error && !ticket) {
    return (
      <Box className="app-page pm-fade-up">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>

        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // ============================================================
  // Ticket Not Found
  // ============================================================

  if (!ticket) {
    return (
      <Box className="app-page pm-fade-up">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>

        <Alert severity="warning">Ticket not found.</Alert>
      </Box>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <Box
      sx={{
        backgroundColor: CANVAS_BACKGROUND,
        minHeight: "100vh",
        p: {
          xs: 1,
          sm: 2,
        },
      }}
    >
      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <Box
          sx={{
            maxWidth: 1800,
            mx: "auto",
            mb: 1.5,
          }}
        >
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{
              fontSize: 12,
            }}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* ======================================================
          MAIN GRID
      ======================================================= */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 2fr) minmax(300px, 1fr)",
          },

          gap: 1.5,

          maxWidth: 1800,

          mx: "auto",
        }}
      >
        {/* ====================================================
            LEFT
        ===================================================== */}

        <Box>
          {/* ==================================================
              TICKET INFORMATION
          =================================================== */}

          <Paper
            elevation={0}
            sx={{
              minHeight: {
                xs: "auto",
                md: 470,
              },

              border: `1px solid ${BORDER}`,

              borderRadius: `${RADIUS.card}px`,

              px: {
                xs: 2,
                md: 2.2,
              },

              py: 1.8,

              backgroundColor: SURFACE,
            }}
          >
            {/* Project + Watch */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 0.7,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.8,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    color: PRIMARY,
                    fontWeight: 500,
                  }}
                >
                  ⚯ {ticket.projectCode}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: TEXT_FAINT,
                  }}
                >
                  |
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: TEXT_SECONDARY,
                  }}
                >
                  {ticket.projectName}
                </Typography>
              </Box>

              <TicketWatchers ticketId={id} currentUserId={currentUserId} />
            </Box>

            {/* Ticket Name */}

            <Typography
              sx={{
                fontSize: {
                  xs: 17,
                  md: 16,
                },

                color: TEXT_PRIMARY,

                fontWeight: 500,

                mb: 1.2,
              }}
            >
              {ticket.name || "Untitled Ticket"}
            </Typography>

            {/* Status */}

            <Stack
              direction="row"
              spacing={0.7}
              sx={{
                mb: 3,
                flexWrap: "wrap",
              }}
            >
              {ticket.statusName && (
                <Chip
                  label={ticket.statusName}
                  size="small"
                  sx={{
                    height: 20,
                    borderRadius: `${RADIUS.chip}px`,
                    backgroundColor:
                      ticket.statusColor || STATUS_COLORS.TODO.bg,
                    color: ticket.statusColor
                      ? "#fff"
                      : STATUS_COLORS.TODO.text,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}

              {ticket.priorityName && (
                <Chip
                  label={ticket.priorityName}
                  size="small"
                  sx={{
                    height: 20,
                    borderRadius: `${RADIUS.chip}px`,
                    backgroundColor:
                      ticket.priorityColor || PRIORITY_COLORS.MEDIUM,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}

              {ticket.typeName && (
                <Chip
                  label={`◉  ${ticket.typeName}`}
                  size="small"
                  sx={{
                    height: 20,
                    borderRadius: `${RADIUS.chip}px`,
                    backgroundColor: ticket.typeColor || ISSUE_TYPE_COLORS.TASK,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}
            </Stack>

            {/* Content */}

            <Box>
              <Typography
                sx={{
                  fontSize: 12,
                  color: TEXT_SECONDARY,
                  mb: 0.6,
                }}
              >
                Content
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  color: TEXT_PRIMARY,
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {ticket.content || "No description available."}
              </Typography>
            </Box>
          </Paper>

          {/* ==================================================
              TABS
          =================================================== */}

          <Paper
            elevation={0}
            sx={{
              mt: 2,

              border: `1px solid ${BORDER}`,

              borderRadius: `${RADIUS.card}px`,

              backgroundColor: SURFACE,

              overflow: "hidden",
            }}
          >
            {/* Tab Header */}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                px: 2,
                pt: 1,
                borderBottom: `1px solid ${BORDER}`,
                overflowX: "auto",
              }}
            >
              {[
                ["comments", "Comments"],
                ["activities", "Activities"],
                ["time", "Time logged"],
                ["attachments", "Attachments"],
                ["links", "Linked issues"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  onClick={() => {
                    setActiveTab(value);
                    loadTabData(value);
                  }}
                  disableRipple
                  sx={{
                    minWidth: "auto",

                    px: 1,

                    py: 1.2,

                    borderRadius: 0,

                    textTransform: "none",

                    fontSize: 14,

                    fontWeight: activeTab === value ? 500 : 400,

                    color: activeTab === value ? PRIMARY : TEXT_PRIMARY,

                    borderBottom:
                      activeTab === value
                        ? `2px solid ${PRIMARY}`
                        : "2px solid transparent",

                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>

            {/* Tab Loading */}

            {tabLoading ? (
              <Box
                sx={{
                  minHeight: 220,

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",
                }}
              >
                <CircularProgress size={26} />
              </Box>
            ) : (
              <>
                {/* =================================================
                    COMMENTS
                ================================================== */}

                {activeTab === "comments" && (
                  <Box sx={{ p: 2 }}>
                    {/* Toolbar */}

                    <Box
                      sx={{
                        display: "flex",

                        alignItems: "center",

                        gap: 0.5,

                        borderBottom: `1px solid ${BORDER}`,

                        pb: 0.6,

                        flexWrap: "wrap",
                      }}
                    >
                      <IconButton size="small" aria-label="Bold">
                        <FormatBoldIcon fontSize="small" />
                      </IconButton>

                      <IconButton size="small" aria-label="Italic">
                        <FormatItalicIcon fontSize="small" />
                      </IconButton>

                      <IconButton size="small" aria-label="Strikethrough">
                        <StrikethroughSIcon fontSize="small" />
                      </IconButton>

                      <IconButton size="small" aria-label="Add link">
                        <LinkIcon fontSize="small" />
                      </IconButton>

                      <Button
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: 0,

                          textTransform: "none",

                          fontSize: 11,

                          px: 1,
                        }}
                      >
                        Heading
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: 0,

                          textTransform: "none",

                          fontSize: 11,

                          px: 1,
                        }}
                      >
                        Subheading
                      </Button>

                      <IconButton size="small" aria-label="Quote">
                        <FormatQuoteIcon fontSize="small" />
                      </IconButton>

                      <IconButton size="small" aria-label="Code block">
                        <CodeIcon fontSize="small" />
                      </IconButton>

                      <IconButton size="small" aria-label="Bulleted list">
                        <FormatListBulletedIcon fontSize="small" />
                      </IconButton>

                      <IconButton size="small" aria-label="Numbered list">
                        <FormatListNumberedIcon fontSize="small" />
                      </IconButton>

                      <IconButton size="small" aria-label="Insert image">
                        <ImageIcon fontSize="small" />
                      </IconButton>

                      <Box sx={{ flex: 1 }} />

                      <IconButton size="small" aria-label="Undo">
                        <UndoIcon fontSize="small" />
                      </IconButton>

                      <IconButton size="small" aria-label="Redo">
                        <RedoIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Comment Input */}

                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder="Type a new comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      variant="outlined"
                      sx={{
                        mt: 0,

                        "& .MuiOutlinedInput-root": {
                          borderTopLeftRadius: 0,

                          borderTopRightRadius: 0,

                          fontSize: 12,

                          alignItems: "flex-start",
                        },
                      }}
                    />

                    {/* Add Comment */}

                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAddComment}
                      disabled={commentLoading || !comment.trim()}
                      sx={{
                        mt: 1,

                        textTransform: "none",

                        fontSize: 12,

                        boxShadow: "none",
                      }}
                    >
                      {commentLoading ? (
                        <CircularProgress
                          size={15}
                          sx={{
                            color: "#fff",
                          }}
                        />
                      ) : (
                        "Add comment"
                      )}
                    </Button>

                    {/* Existing Comments */}

                    <Box sx={{ mt: 3 }}>
                      {comments.length === 0 ? (
                        <Box
                          sx={{
                            py: 4,
                            textAlign: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 13,
                              color: TEXT_SECONDARY,
                            }}
                          >
                            No comments yet.
                          </Typography>
                        </Box>
                      ) : (
                        <Stack spacing={2}>
                          {comments.map((item, index) => {
                            const commentId = item?.id ?? item?.commentId;

                            const userName = getCommentUser(item);

                            const content = getCommentContent(item);

                            const date = getCommentDate(item);

                            return (
                              <Box
                                key={commentId || `comment-${index}`}
                                sx={{
                                  borderBottom:
                                    index !== comments.length - 1
                                      ? `1px solid ${BORDER}`
                                      : "none",

                                  pb: index !== comments.length - 1 ? 2 : 0,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",

                                    gap: 1,

                                    alignItems: "flex-start",
                                  }}
                                >
                                  {/* Avatar */}

                                  <MemberAvatar
                                    userId={getCommentUserId(item)}
                                    name={userName}
                                    hasProfileImage={
                                      item?.hasProfileImage ??
                                      item?.user?.hasProfileImage ??
                                      item?.author?.hasProfileImage ??
                                      item?.createdBy?.hasProfileImage
                                    }
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      fontSize: 10,
                                      fontWeight: 600,
                                      flexShrink: 0,
                                      backgroundColor: "#20b9a6",
                                    }}
                                  />

                                  {/* Content */}

                                  <Box
                                    sx={{
                                      flex: 1,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",

                                        alignItems: "center",

                                        gap: 0.8,

                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          fontSize: 11,

                                          color: PRIMARY,

                                          fontWeight: 500,
                                        }}
                                      >
                                        {userName}
                                      </Typography>

                                      {date && (
                                        <>
                                          <Divider
                                            orientation="vertical"
                                            flexItem
                                          />

                                          <Typography
                                            sx={{
                                              fontSize: 10,

                                              color: TEXT_SECONDARY,
                                            }}
                                          >
                                            {formatDateTime(date)}
                                          </Typography>
                                        </>
                                      )}
                                    </Box>

                                    <Typography
                                      sx={{
                                        mt: 0.8,

                                        fontSize: 12,

                                        color: TEXT_PRIMARY,

                                        lineHeight: 1.7,

                                        whiteSpace: "pre-wrap",
                                      }}
                                    >
                                      {content || "No comment content."}
                                    </Typography>
                                  </Box>

                                  {/* Delete */}

                                  {commentId && (
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleDeleteComment(commentId)
                                      }
                                      disabled={deletingId === commentId}
                                      sx={{
                                        color: TEXT_FAINT,

                                        "&:hover": {
                                          color: "#f44336",
                                        },
                                      }}
                                      aria-label="Delete"
                                    >
                                      {deletingId === commentId ? (
                                        <CircularProgress size={16} />
                                      ) : (
                                        <DeleteOutlineIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  )}
                                </Box>
                              </Box>
                            );
                          })}
                        </Stack>
                      )}
                    </Box>
                  </Box>
                )}

                {/* =================================================
                    ACTIVITIES
                ================================================== */}

                {activeTab === "activities" && (
                  <Box sx={{ p: 2 }}>
                    {activities.length === 0 ? (
                      <Box
                        sx={{
                          py: 5,
                          textAlign: "center",
                        }}
                      >
                        <ScheduleIcon
                          sx={{
                            fontSize: 38,
                            color: TEXT_FAINT,
                            mb: 1,
                          }}
                        />

                        <Typography
                          sx={{
                            fontSize: 13,
                            color: TEXT_SECONDARY,
                          }}
                        >
                          No activities available.
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 11,
                            color: TEXT_FAINT,
                            mt: 0.5,
                          }}
                        >
                          Activity API is not connected yet.
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        {activities.map((item, index) => {
                          const userName = getActivityUser(item);

                          const message = getActivityMessage(item);

                          const date = getActivityDate(item);

                          return (
                            <Box
                              key={item?.id || `activity-${index}`}
                              sx={{
                                display: "flex",

                                gap: 1.5,

                                position: "relative",

                                pb: index !== activities.length - 1 ? 3 : 0,
                              }}
                            >
                              {/* Timeline */}

                              <Box
                                sx={{
                                  display: "flex",

                                  flexDirection: "column",

                                  alignItems: "center",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 28,

                                    height: 28,

                                    borderRadius: "50%",

                                    backgroundColor: PRIMARY_SUBTLE,

                                    color: PRIMARY,

                                    display: "flex",

                                    alignItems: "center",

                                    justifyContent: "center",

                                    zIndex: 1,
                                  }}
                                >
                                  <ScheduleIcon
                                    sx={{
                                      fontSize: 15,
                                    }}
                                  />
                                </Box>

                                {index !== activities.length - 1 && (
                                  <Box
                                    sx={{
                                      width: 1,

                                      flex: 1,

                                      backgroundColor: BORDER,

                                      mt: 0.5,
                                    }}
                                  />
                                )}
                              </Box>

                              {/* Activity */}

                              <Box
                                sx={{
                                  flex: 1,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: 11,

                                    color: PRIMARY,

                                    fontWeight: 500,
                                  }}
                                >
                                  {userName}
                                </Typography>

                                <Typography
                                  sx={{
                                    fontSize: 12,

                                    color: TEXT_PRIMARY,

                                    mt: 0.3,

                                    lineHeight: 1.6,
                                  }}
                                >
                                  {message}
                                </Typography>

                                {date && (
                                  <Typography
                                    sx={{
                                      fontSize: 10,

                                      color: TEXT_FAINT,

                                      mt: 0.5,
                                    }}
                                  >
                                    {formatDateTime(date)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}

                {/* =================================================
                    TIME LOGGED
                ================================================== */}

                {activeTab === "time" && (
                  <Box sx={{ p: 2 }}>
                    {/* Header */}

                    <Box
                      sx={{
                        display: "flex",

                        justifyContent: "space-between",

                        alignItems: "center",

                        mb: 2,

                        gap: 1,

                        flexWrap: "wrap",
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 13,

                            fontWeight: 500,

                            color: TEXT_PRIMARY,
                          }}
                        >
                          Time logged
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 11,

                            color: TEXT_SECONDARY,

                            mt: 0.3,
                          }}
                        >
                          Total: {totalLoggedText}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrowIcon />}
                        onClick={openTimeDialog}
                        sx={{
                          textTransform: "none",

                          fontSize: 12,

                          boxShadow: "none",
                        }}
                      >
                        Log time
                      </Button>
                    </Box>

                    {/* Time List */}

                    {timeLogs.length === 0 ? (
                      <Box
                        sx={{
                          py: 5,

                          textAlign: "center",
                        }}
                      >
                        <ScheduleIcon
                          sx={{
                            fontSize: 38,

                            color: TEXT_FAINT,

                            mb: 1,
                          }}
                        />

                        <Typography
                          sx={{
                            fontSize: 13,

                            color: TEXT_SECONDARY,
                          }}
                        >
                          No time logs available.
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1}>
                        {timeLogs.map((item, index) => {
                          const value = Number(item?.value ?? 0);

                          const totalMinutes = Number.isFinite(value)
                            ? Math.round(value * 60)
                            : 0;

                          const hours = Math.floor(totalMinutes / 60);

                          const minutes = totalMinutes % 60;

                          const userName =
                            item?.userName ||
                            item?.createdByName ||
                            item?.loggedByName ||
                            item?.user?.name ||
                            "User";

                          const description = item?.comment || "";

                          const date = item?.createdAt || item?.updatedAt;

                          const timeId = item?.id;

                          return (
                            <Box
                              key={timeId || `time-${index}`}
                              sx={{
                                border: `1px solid ${BORDER}`,

                                borderRadius: `${RADIUS.card}px`,

                                p: 1.5,

                                display: "flex",

                                gap: 1.5,

                                alignItems: "center",
                              }}
                            >
                              {/* Icon */}

                              <Box
                                sx={{
                                  width: 38,

                                  height: 38,

                                  borderRadius: `${RADIUS.card}px`,

                                  backgroundColor: PRIMARY_SUBTLE,

                                  color: PRIMARY,

                                  display: "flex",

                                  alignItems: "center",

                                  justifyContent: "center",

                                  flexShrink: 0,
                                }}
                              >
                                <ScheduleIcon fontSize="small" />
                              </Box>

                              {/* Content */}

                              <Box
                                sx={{
                                  flex: 1,

                                  minWidth: 0,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",

                                    gap: 1,

                                    alignItems: "center",

                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: 12,

                                      color: TEXT_PRIMARY,

                                      fontWeight: 500,
                                    }}
                                  >
                                    {hours}h {minutes}m
                                  </Typography>

                                  <Typography
                                    sx={{
                                      fontSize: 10,

                                      color: PRIMARY,
                                    }}
                                  >
                                    {userName}
                                  </Typography>
                                </Box>

                                {description && (
                                  <Typography
                                    sx={{
                                      fontSize: 11,

                                      color: TEXT_SECONDARY,

                                      mt: 0.4,

                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {description}
                                  </Typography>
                                )}

                                {date && (
                                  <Typography
                                    sx={{
                                      fontSize: 10,

                                      color: TEXT_FAINT,

                                      mt: 0.4,
                                    }}
                                  >
                                    {formatDateTime(date)}
                                  </Typography>
                                )}
                              </Box>

                              {/* Delete */}

                              {timeId && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteTime(timeId)}
                                  disabled={deletingId === timeId}
                                  title="Delete time log"
                                  sx={{
                                    color: TEXT_FAINT,

                                    "&:hover": {
                                      color: "#f44336",
                                    },
                                  }}
                                >
                                  {deletingId === timeId ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <DeleteOutlineIcon fontSize="small" />
                                  )}
                                </IconButton>
                              )}
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                )}

                {/* =================================================
                    ATTACHMENTS
                ================================================== */}

                {activeTab === "attachments" && (
                  <Box sx={{ p: 2 }}>
                    {/* Header */}

                    <Box
                      sx={{
                        display: "flex",

                        justifyContent: "space-between",

                        alignItems: "center",

                        mb: 2,

                        gap: 1,

                        flexWrap: "wrap",
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 13,

                            fontWeight: 500,

                            color: TEXT_PRIMARY,
                          }}
                        >
                          Attachments
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 11,

                            color: TEXT_SECONDARY,

                            mt: 0.3,
                          }}
                        >
                          {attachments.length} attachment
                          {attachments.length !== 1 ? "s" : ""}
                        </Typography>
                      </Box>

                      <Box>
                        <input
                          ref={fileInputRef}
                          type="file"
                          hidden
                          onChange={handleFileSelect}
                        />

                        <Button variant="outlined" component="label">
                          Attach File
                          <input
                            type="file"
                            hidden
                            onChange={handleFileSelect}
                          />
                        </Button>
                      </Box>
                    </Box>

                    {/* Attachments */}

                    {attachments.length === 0 ? (
                      <Box
                        sx={{
                          py: 5,

                          textAlign: "center",

                          border: `1px dashed ${BORDER}`,

                          borderRadius: `${RADIUS.card}px`,
                        }}
                      >
                        <AttachFileIcon
                          sx={{
                            fontSize: 38,

                            color: TEXT_FAINT,

                            mb: 1,
                          }}
                        />

                        <Typography
                          sx={{
                            fontSize: 13,

                            color: TEXT_SECONDARY,
                          }}
                        >
                          No attachments available.
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 11,

                            color: TEXT_FAINT,

                            mt: 0.5,
                          }}
                        >
                          Upload a file to attach it to this ticket.
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1}>
                        {attachments.map((item, index) => {
                          const attachmentId = item?.id ?? item?.attachmentId;

                          const fileName = getAttachmentName(item);

                          const fileSize = getAttachmentSize(item);

                          const uploader = getAttachmentUploader(item);

                          const createdAt = getAttachmentDate(item);

                          return (
                            <Box
                              key={attachmentId || `attachment-${index}`}
                              sx={{
                                border: `1px solid ${BORDER}`,

                                borderRadius: `${RADIUS.card}px`,

                                p: 1.4,

                                display: "flex",

                                alignItems: "center",

                                gap: 1.2,

                                transition: "background-color 0.2s",

                                "&:hover": {
                                  backgroundColor: CANVAS_BACKGROUND,
                                },
                              }}
                            >
                              {/* File Icon */}
                              <Box
                                sx={{
                                  width: 38,

                                  height: 38,

                                  borderRadius: `${RADIUS.card}px`,

                                  backgroundColor: CANVAS_BACKGROUND,

                                  display: "flex",

                                  alignItems: "center",

                                  justifyContent: "center",

                                  flexShrink: 0,
                                }}
                              >
                                <DescriptionIcon
                                  sx={{
                                    color: TEXT_SECONDARY,
                                  }}
                                />
                              </Box>
                              {/* File Info */}
                              <Box
                                sx={{
                                  flex: 1,

                                  minWidth: 0,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: 12,

                                    color: PRIMARY,

                                    fontWeight: 500,

                                    overflow: "hidden",

                                    textOverflow: "ellipsis",

                                    whiteSpace: "nowrap",
                                  }}
                                  title={fileName}
                                >
                                  {fileName}
                                </Typography>

                                <Box
                                  sx={{
                                    display: "flex",

                                    gap: 1,

                                    mt: 0.3,

                                    flexWrap: "wrap",
                                  }}
                                >
                                  {uploader && (
                                    <Typography
                                      sx={{
                                        fontSize: 10,

                                        color: TEXT_SECONDARY,
                                      }}
                                    >
                                      {uploader}
                                    </Typography>
                                  )}

                                  {fileSize && (
                                    <Typography
                                      sx={{
                                        fontSize: 10,

                                        color: TEXT_SECONDARY,
                                      }}
                                    >
                                      {fileSize}
                                    </Typography>
                                  )}

                                  {createdAt && (
                                    <Typography
                                      sx={{
                                        fontSize: 10,

                                        color: TEXT_FAINT,
                                      }}
                                    >
                                      {formatDateTime(createdAt)}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              {/* View */}{" "}
                              {attachmentId && (
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleViewAttachment(attachmentId, fileName)
                                  }
                                  title="View attachment"
                                  sx={{
                                    color: "#20b9a6",
                                    "&:hover": { backgroundColor: "#e8faf7" },
                                  }}
                                >
                                  {" "}
                                  <VisibilityIcon fontSize="small" />{" "}
                                </IconButton>
                              )}
                              {/* Download */}
                              {attachmentId && (
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDownloadAttachment(
                                      attachmentId,
                                      fileName,
                                    )
                                  }
                                  title="Download attachment"
                                  sx={{
                                    color: PRIMARY,

                                    "&:hover": {
                                      backgroundColor: PRIMARY_SUBTLE,
                                    },
                                  }}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              )}
                              {/* Delete */}
                              {attachmentId && (
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDeleteAttachment(attachmentId)
                                  }
                                  disabled={deletingId === attachmentId}
                                  title="Delete attachment"
                                  sx={{
                                    color: TEXT_FAINT,

                                    "&:hover": {
                                      color: "#f44336",
                                      backgroundColor: "#fff1f1",
                                    },
                                  }}
                                >
                                  {deletingId === attachmentId ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <DeleteOutlineIcon fontSize="small" />
                                  )}
                                </IconButton>
                              )}
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                )}

                {/* =================================================
                    LINKED ISSUES
                ================================================== */}

                {activeTab === "links" && (
                  <Box sx={{ p: 2 }}>
                    <TicketLinks
                      ticketId={id}
                      projectId={ticket.projectId}
                      basePath={routePrefix}
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Box>

        {/* ======================================================
            RIGHT SIDEBAR
        ======================================================= */}

        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${BORDER}`,

            borderRadius: `${RADIUS.card}px`,

            backgroundColor: SURFACE,

            px: 2,

            py: 1.5,

            height: "fit-content",
          }}
        >
          {/* Owner */}

          <SidebarItem
            label="Owner"
            icon={<PersonIcon />}
            value={ticket.ownerName}
          />

          {/* Responsible */}

          <SidebarItem
            label="Responsible"
            icon={<PersonIcon />}
            value={ticket.responsibleName}
          />

          {/* Epic */}

          <SidebarItem
            label="Epic"
            icon={<AssignmentIcon />}
            value={ticket.epicName}
          />

          {/* Estimation */}

          <SidebarItem label="Estimation" value={estimationText} />

          {/* Total Time */}

          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: 11,

                color: TEXT_SECONDARY,

                mb: 0.5,
              }}
            >
              Total time logged
            </Typography>

            <Box
              sx={{
                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

                mb: 0.7,
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,

                  color: PRIMARY,
                }}
              >
                {totalLoggedText}
              </Typography>

              <Typography
                sx={{
                  fontSize: 11,

                  color: PRIMARY,
                }}
              >
                {timeProgress}%
              </Typography>
            </Box>

            {/* Progress Bar */}

            <Box
              sx={{
                height: 8,

                backgroundColor: BORDER,

                borderRadius: 5,

                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${timeProgress}%`,

                  height: "100%",

                  backgroundColor: PRIMARY,

                  borderRadius: 5,

                  transition: "width 0.3s ease",
                }}
              />
            </Box>
          </Box>

          {/* Creation Date */}

          <SidebarItem
            label="Creation date"
            value={ticket.createdAt ? formatDateTime(ticket.createdAt) : "-"}
            subValue={ticket.createdAt ? getRelativeTime(ticket.createdAt) : ""}
          />

          {/* Last Update */}

          <SidebarItem
            label="Last update"
            value={ticket.updatedAt ? formatDateTime(ticket.updatedAt) : "-"}
            subValue={ticket.updatedAt ? getRelativeTime(ticket.updatedAt) : ""}
          />
        </Paper>
      </Box>

      {/* ========================================================
          LOG TIME DIALOG
      ========================================================= */}

      <Dialog
        open={timeDialogOpen}
        onClose={() => {
          if (!timeLoading) {
            setTimeDialogOpen(false);
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontSize: 17,

            fontWeight: 500,
          }}
        >
          Log time
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {/* Hours / Minutes */}

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: "1fr 1fr",

                gap: 2,
              }}
            >
              <TextField
                label="Hours"
                type="number"
                value={timeForm.hours}
                onChange={(e) =>
                  setTimeForm((prev) => ({
                    ...prev,

                    hours: e.target.value,
                  }))
                }
                inputProps={{
                  min: 0,

                  step: 1,
                }}
                fullWidth
              />

              <TextField
                label="Minutes"
                type="number"
                value={timeForm.minutes}
                onChange={(e) =>
                  setTimeForm((prev) => ({
                    ...prev,

                    minutes: e.target.value,
                  }))
                }
                inputProps={{
                  min: 0,

                  max: 59,

                  step: 1,
                }}
                fullWidth
              />
            </Box>

            {/* Description */}

            <TextField
              label="Description"
              placeholder="What did you work on?"
              multiline
              minRows={3}
              value={timeForm.description}
              onChange={(e) =>
                setTimeForm((prev) => ({
                  ...prev,

                  description: e.target.value,
                }))
              }
              fullWidth
            />

            {/* Preview */}

            {(timeForm.hours !== "" || timeForm.minutes !== "") && (
              <Typography
                sx={{
                  fontSize: 11,

                  color: TEXT_SECONDARY,
                }}
              >
                Time to be logged:{" "}
                <strong>
                  {Number(timeForm.hours || 0)}h {Number(timeForm.minutes || 0)}
                  m
                </strong>
              </Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setTimeDialogOpen(false)}
            disabled={timeLoading}
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleLogTime}
            disabled={timeLoading}
            sx={{
              textTransform: "none",

              boxShadow: "none",
            }}
          >
            {timeLoading ? (
              <CircularProgress
                size={18}
                sx={{
                  color: "#fff",
                }}
              />
            ) : (
              "Log time"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// Sidebar Item
// ============================================================

function SidebarItem({ label, value, icon, subValue }) {
  return (
    <Box sx={{ mb: 2.7 }}>
      <Typography
        sx={{
          fontSize: 11,

          color: TEXT_SECONDARY,

          mb: 0.6,
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          display: "flex",

          alignItems: "flex-start",

          gap: 0.6,
        }}
      >
        {icon && (
          <Box
            sx={{
              width: 18,

              height: 18,

              borderRadius: "50%",

              backgroundColor: "#20b9a6",

              color: "#fff",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              flexShrink: 0,

              mt: 0.1,
            }}
          >
            {icon}
          </Box>
        )}

        <Typography
          sx={{
            fontSize: 12,

            color: PRIMARY,

            lineHeight: 1.5,

            wordBreak: "break-word",
          }}
        >
          {value || "-"}
        </Typography>
      </Box>

      {subValue && (
        <Typography
          sx={{
            fontSize: 10,

            color: TEXT_SECONDARY,

            mt: 0.3,
          }}
        >
          {subValue}
        </Typography>
      )}
    </Box>
  );
}

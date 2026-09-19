import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";

import { useEffect, useMemo, useRef, useState } from "react";
import { ticketApi, viewTicketAttachment } from "../../api/ticketApi";
import {
  getCommentAttachments,
  getMentionSuggestions,
  uploadCommentAttachment,
} from "../../api/ticketCommentApi";
import {
  getCommentReactions,
  toggleCommentReaction,
} from "../../api/ticketCommentReactionApi";
import { RADIUS } from "../../theme/colors";
import MemberAvatar from "../common/MemberAvatar";

const REACTIONS = ["👍", "❤️", "😂", "🎉", "🚀", "👀"];

export default function TicketComments({ ticketId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [mentions, setMentions] = useState([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [reactionMap, setReactionMap] = useState({});
  const [attachmentMap, setAttachmentMap] = useState({});
  const fileRef = useRef(null);

  async function loadComments() {
    if (!ticketId) return;
    try {
      setLoading(true);
      setError("");
      const result = await ticketApi.getComments(ticketId);
      const rows = Array.isArray(result)
        ? result
        : result?.content || result?.data || [];
      setComments(rows);
      const reactions = {};
      const attachments = {};
      await Promise.all(
        rows.map(async (c) => {
          const id = c.id || c.commentId;
          try {
            reactions[id] = await getCommentReactions(id);
          } catch {
            // One comment's reactions failing shouldn't block the rest of the list.
          }
          try {
            attachments[id] = await getCommentAttachments(id);
          } catch {
            // One comment's attachments failing shouldn't block the rest of the list.
          }
        }),
      );
      setReactionMap(reactions);
      setAttachmentMap(attachments);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load comments.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadComments();
  }, [ticketId]);

  const mentionToken = useMemo(() => {
    const m = comment.match(/(?:^|\s)@([^\s@]*)$/);
    return m ? m[1] : null;
  }, [comment]);
  useEffect(() => {
    if (!ticketId || mentionToken === null) {
      setMentions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setMentionLoading(true);
        const r = await getMentionSuggestions(ticketId, mentionToken);
        if (!cancelled) setMentions(Array.isArray(r) ? r : []);
      } catch {
        if (!cancelled) setMentions([]);
      } finally {
        if (!cancelled) setMentionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId, mentionToken]);

  function insertMention(user) {
    const match = comment.match(/(?:^|\s)@([^\s@]*)$/);
    if (!match) return;
    const start = match.index + (match[0].startsWith(" ") ? 1 : 0);
    setComment(comment.slice(0, start) + user.mention + " ");
    setMentions([]);
  }
  async function handleAddComment() {
    const value = comment.trim();
    if (!value) return;
    try {
      setSaving(true);
      setError("");
      const created = await ticketApi.createComment(ticketId, value);
      const id = created?.id || created?.commentId;
      for (const f of files) {
        if (id) await uploadCommentAttachment(id, f);
      }
      setComment("");
      setFiles([]);
      await loadComments();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to post comment.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleUpdateComment(id) {
    const value = editingText.trim();
    if (!value) return;
    try {
      setSaving(true);
      await ticketApi.updateComment(ticketId, id, value);
      setEditingId(null);
      setEditingText("");
      await loadComments();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update comment.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleDeleteComment(id) {
    if (!(await requestConfirm("Delete this comment?"))) return;
    try {
      setSaving(true);
      await ticketApi.deleteComment(ticketId, id);
      await loadComments();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete comment.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleReaction(id, reaction) {
    try {
      const result = await toggleCommentReaction(id, reaction);
      setReactionMap((prev) => {
        const rows = [...(prev[id] || [])];
        const idx = rows.findIndex((x) => x.reaction === reaction);
        if (result) {
          rows.push(result);
        } else {
          const currentUserId =
            result?.userId; /* server toggle returns 204; reload below */
        }
        return { ...prev, [id]: rows };
      });
      const fresh = await getCommentReactions(id);
      setReactionMap((prev) => ({ ...prev, [id]: fresh }));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update reaction.",
      );
    }
  }
  function author(item) {
    return (
      item.authorName ||
      item.author?.name ||
      item.userName ||
      item.user?.name ||
      "User"
    );
  }

  function authorId(item) {
    return (
      item.authorId ??
      item.userId ??
      item.author?.id ??
      item.user?.id ??
      item.createdById ??
      item.createdBy?.id ??
      null
    );
  }
  function text(item) {
    return item.content || item.comment || item.body || "";
  }
  async function openAttachment(id) {
    try {
      const blob = await viewTicketAttachment(ticketId, id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to open attachment.",
      );
    }
  }
  function date(item) {
    const v = item.createdAt || item.createdDate || item.timestamp;
    const d = v && new Date(v);
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleString() : "";
  }

  if (!ticketId)
    return <Alert severity="info">Select a ticket to view comments.</Alert>;
  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Comments
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 3, borderRadius: `${RADIUS.card}px` }}
      >
        <Stack spacing={1.5}>
          <Box sx={{ position: "relative" }}>
            <TextField
              multiline
              minRows={3}
              maxRows={8}
              fullWidth
              placeholder="Write a comment... Use @ to mention a project member"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={saving}
            />
            {mentionToken !== null &&
              (mentionLoading || mentions.length > 0) && (
                <Paper
                  elevation={6}
                  sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "100%",
                    zIndex: 20,
                    maxHeight: 260,
                    overflow: "auto",
                  }}
                >
                  <List dense>
                    {mentionLoading ? (
                      <ListItemButton disabled>
                        <ListItemText primary="Searching members..." />{" "}
                      </ListItemButton>
                    ) : (
                      mentions.map((u) => (
                        <ListItemButton
                          key={u.id}
                          onClick={() => insertMention(u)}
                        >
                          <MemberAvatar
                            userId={u.id}
                            name={u.name || u.email}
                            hasProfileImage={u.hasProfileImage}
                            sx={{ width: 28, height: 28, mr: 1 }}
                          />
                          <ListItemText primary={u.name} secondary={u.email} />
                        </ListItemButton>
                      ))
                    )}
                  </List>
                </Paper>
              )}
          </Box>
          {files.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {files.map((f, i) => (
                <Chip
                  key={i}
                  label={f.name}
                  onDelete={() =>
                    setFiles((prev) => prev.filter((_, x) => x !== i))
                  }
                />
              ))}
            </Stack>
          )}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Button
              size="small"
              startIcon={<AttachFileIcon />}
              onClick={() => fileRef.current?.click()}
              disabled={saving}
            >
              Attach files
            </Button>
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleAddComment}
              disabled={saving || !comment.trim()}
            >
              {saving ? "Posting..." : "Comment"}
            </Button>
          </Box>
        </Stack>
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : comments.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={5}>
          No comments yet.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {comments.map((item) => {
            const id = item.id || item.commentId;
            const isEditing = editingId === id;
            const reactions = reactionMap[id] || [];
            const attachments = attachmentMap[id] || [];
            const counts = REACTIONS.map((r) => ({
              r,
              n: reactions.filter((x) => x.reaction === r).length,
            })).filter((x) => x.n > 0);
            return (
              <Box key={id}>
                <Stack direction="row" spacing={1.5}>
                  <MemberAvatar
                    userId={authorId(item)}
                    name={author(item)}
                    hasProfileImage={
                      item.hasProfileImage ??
                      item.author?.hasProfileImage ??
                      item.user?.hasProfileImage
                    }
                  />
                  <Box flex={1}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography fontWeight={700}>{author(item)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {date(item)}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingId(id);
                            setEditingText(text(item));
                          }}
                          aria-label="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteComment(id)}
                          aria-label="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    {isEditing ? (
                      <Stack spacing={1} mt={1}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                        />
                        <Box>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleUpdateComment(id)}
                            sx={{ mr: 1 }}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditingId(null);
                              setEditingText("");
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Stack>
                    ) : (
                      <Typography sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
                        {text(item)}
                      </Typography>
                    )}
                    {attachments.length > 0 && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                        {attachments.map((a) => (
                          <Chip
                            key={a.id}
                            icon={<AttachFileIcon />}
                            label={`${a.originalName} (${Math.ceil((a.fileSize || 0) / 1024)} KB)`}
                            clickable
                            onClick={() => openAttachment(a.id)}
                          />
                        ))}
                      </Stack>
                    )}
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      mt={1}
                    >
                      <Tooltip title="React">
                        <IconButton size="small" aria-label="Add reaction">
                          <EmojiEmotionsOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {REACTIONS.map((r) => (
                        <Button
                          key={r}
                          size="small"
                          onClick={() => handleReaction(id, r)}
                          sx={{ minWidth: 32, p: 0.4 }}
                        >
                          {r}
                        </Button>
                      ))}
                      {counts.map((x) => (
                        <Chip key={x.r} size="small" label={`${x.r} ${x.n}`} />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
                <Divider sx={{ mt: 2 }} />
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

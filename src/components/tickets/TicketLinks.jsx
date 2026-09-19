import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestConfirm } from "../../components/common/ConfirmDialogProvider";

import { getTicketById, searchTickets } from "../../api/ticketApi";
import {
  createTicketRelation,
  deleteTicketRelation,
  getTicketRelationsByRelated,
  getTicketRelationsByTicket,
} from "../../api/ticketRelationApi";
import { useToast } from "../../context/ToastContext";
import {
  BORDER,
  PRIMARY,
  RADIUS,
  STATUS_COLORS,
  TEXT_FAINT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../../theme/colors";

// ============================================================
// Relation Type Labels (Jira-style forward / inverse phrasing)
// ============================================================

const RELATION_TYPES = [
  {
    value: "BLOCKS",
    forwardLabel: "blocks",
    inverseLabel: "is blocked by",
  },
  {
    value: "DUPLICATES",
    forwardLabel: "duplicates",
    inverseLabel: "is duplicated by",
  },
  {
    value: "RELATES_TO",
    forwardLabel: "relates to",
    inverseLabel: "relates to",
  },
  {
    value: "CLONES",
    forwardLabel: "clones",
    inverseLabel: "is cloned by",
  },
];

function getRelationMeta(type) {
  const key = String(type || "").toUpperCase();

  return (
    RELATION_TYPES.find((item) => item.value === key) || {
      value: key,
      forwardLabel: key ? key.toLowerCase().replace(/_/g, " ") : "relates to",
      inverseLabel: key ? key.toLowerCase().replace(/_/g, " ") : "relates to",
    }
  );
}

// ============================================================
// Ticket Links ("Linked issues")
// ============================================================

export default function TicketLinks({
  ticketId,
  projectId,
  basePath = "/member/developer",
}) {
  const [links, setLinks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [relationType, setRelationType] = useState("BLOCKS");

  const [searchQuery, setSearchQuery] = useState("");

  const [searchOptions, setSearchOptions] = useState([]);

  const [searchLoading, setSearchLoading] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);

  const navigate = useNavigate();

  const toast = useToast();

  const debounceRef = useRef(null);

  const normalizeList = (data) => {
    if (Array.isArray(data)) return data;

    return data?.content || data?.data || [];
  };

  // ==========================================================
  // Load Links (both directions)
  // ==========================================================

  async function loadLinks() {
    if (!ticketId) return;

    try {
      setLoading(true);

      const [forward, backward] = await Promise.all([
        getTicketRelationsByTicket(ticketId),
        getTicketRelationsByRelated(ticketId),
      ]);

      const forwardRows = normalizeList(forward).map((row) => {
        const meta = getRelationMeta(row.type);

        return {
          rowId: row.id,
          type: row.type,
          label: meta.forwardLabel,
          linkedTicketId: row.relationId,
          linkedTicketCode: row.relationCode,
          linkedTicketName: row.relationName,
        };
      });

      const backwardRows = normalizeList(backward).map((row) => {
        const meta = getRelationMeta(row.type);

        return {
          rowId: row.id,
          type: row.type,
          label: meta.inverseLabel,
          linkedTicketId: row.ticketId,
          linkedTicketCode: row.ticketCode,
          linkedTicketName: row.ticketName,
        };
      });

      const merged = [...forwardRows, ...backwardRows];

      setLinks(merged);

      // Best-effort enrichment with current status/type of each linked ticket.
      const enriched = await Promise.all(
        merged.map(async (row) => {
          try {
            const linkedTicket = await getTicketById(row.linkedTicketId);

            return {
              ...row,
              statusName: linkedTicket?.statusName,
              typeName: linkedTicket?.typeName,
            };
          } catch {
            return row;
          }
        }),
      );

      setLinks(enriched);
    } catch (err) {
      console.error("LOAD TICKET LINKS ERROR:", err);

      toast?.error?.(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load linked issues.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  // ==========================================================
  // Ticket Search (debounced)
  // ==========================================================

  useEffect(() => {
    if (!dialogOpen) return;

    if (!searchQuery.trim()) {
      setSearchOptions([]);

      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const results = await searchTickets(searchQuery, projectId);

        const normalized = normalizeList(results).filter(
          (item) => Number(item.id) !== Number(ticketId),
        );

        setSearchOptions(normalized);
      } catch (err) {
        console.error("SEARCH TICKETS ERROR:", err);

        setSearchOptions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, dialogOpen, projectId, ticketId]);

  function openDialog() {
    setRelationType("BLOCKS");
    setSelectedTicket(null);
    setSearchQuery("");
    setSearchOptions([]);
    setDialogOpen(true);
  }

  // ==========================================================
  // Create Link
  // ==========================================================

  async function handleCreateLink() {
    if (!selectedTicket) return;

    try {
      setSaving(true);

      await createTicketRelation({
        ticketId: Number(ticketId),
        relationId: Number(selectedTicket.id),
        type: relationType,
      });

      toast?.success?.("Linked issue added.");

      setDialogOpen(false);

      await loadLinks();
    } catch (err) {
      console.error("CREATE TICKET LINK ERROR:", err);

      toast?.error?.(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to add linked issue.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // Delete Link
  // ==========================================================

  async function handleDeleteLink(rowId) {
    const confirmed = await requestConfirm("Remove this link?");

    if (!confirmed) return;

    try {
      setDeletingId(rowId);

      await deleteTicketRelation(rowId);

      setLinks((prev) => prev.filter((item) => item.rowId !== rowId));

      toast?.success?.("Link removed.");
    } catch (err) {
      console.error("DELETE TICKET LINK ERROR:", err);

      toast?.error?.(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to remove link.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>
          Linked issues
        </Typography>

        <Button
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={openDialog}
          sx={{
            textTransform: "none",
            fontSize: 12,
            color: PRIMARY,
          }}
        >
          Add link
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={22} />
        </Box>
      ) : links.length === 0 ? (
        <Typography
          sx={{ fontSize: 12, color: TEXT_FAINT, textAlign: "center", py: 3 }}
        >
          No linked issues yet.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {links.map((row, index) => (
            <Box
              key={`${row.rowId}-${row.linkedTicketId}-${index}`}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                border: `1px solid ${BORDER}`,
                borderRadius: `${RADIUS.card}px`,
                px: 1.5,
                py: 1,
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ minWidth: 0 }}
              >
                <LinkIcon sx={{ fontSize: 16, color: TEXT_FAINT }} />

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: TEXT_SECONDARY,
                      textTransform: "capitalize",
                    }}
                  >
                    {row.label}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.7,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      component="span"
                      onClick={() =>
                        navigate(`${basePath}/tickets/${row.linkedTicketId}`)
                      }
                      sx={{
                        fontSize: 12,
                        color: PRIMARY,
                        fontWeight: 600,
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {row.linkedTicketCode || `#${row.linkedTicketId}`}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 12,
                        color: TEXT_PRIMARY,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.linkedTicketName}
                    </Typography>

                    {row.statusName && (
                      <Chip
                        label={row.statusName}
                        size="small"
                        sx={{
                          height: 18,
                          borderRadius: `${RADIUS.chip}px`,
                          backgroundColor: STATUS_COLORS.TODO.bg,
                          color: STATUS_COLORS.TODO.text,
                          fontSize: 9,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Stack>

              <IconButton
                size="small"
                onClick={() => handleDeleteLink(row.rowId)}
                disabled={deletingId === row.rowId}
                title="Remove link"
                sx={{
                  color: TEXT_FAINT,
                  "&:hover": { color: "#f44336", backgroundColor: "#fff1f1" },
                }}
              >
                {deletingId === row.rowId ? (
                  <CircularProgress size={15} />
                ) : (
                  <DeleteOutlineIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}

      {/* ========================================================
          ADD LINK DIALOG
      ========================================================= */}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (!saving) setDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontSize: 17, fontWeight: 500 }}>
          Link issue
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Relation type"
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              fullWidth
            >
              {RELATION_TYPES.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.forwardLabel.charAt(0).toUpperCase() +
                    item.forwardLabel.slice(1)}
                </MenuItem>
              ))}
            </TextField>

            <Autocomplete
              options={searchOptions}
              value={selectedTicket}
              loading={searchLoading}
              filterOptions={(options) => options}
              getOptionLabel={(option) =>
                option?.code
                  ? `${option.code} — ${option.name || ""}`
                  : option?.name || ""
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => setSelectedTicket(value)}
              onInputChange={(_, value) => setSearchQuery(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search issue"
                  placeholder="Type to search tickets..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {searchLoading ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleCreateLink}
            disabled={saving || !selectedTicket}
            sx={{ textTransform: "none", boxShadow: "none" }}
          >
            {saving ? (
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : (
              "Link"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardReturnRoundedIcon from "@mui/icons-material/KeyboardReturnRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BORDER, SURFACE_SUBTLE, TEXT_SECONDARY } from "../../theme/colors";

const DEFAULT_ITEMS = [
  ["Dashboard", "/admin"],
  ["Projects", "/admin/projects"],
  ["Tickets", "/admin/tickets"],
  ["Backlog", "/admin/backlog"],
  ["Board", "/admin/board"],
  ["Roadmap", "/admin/roadmap"],
  ["Reports", "/admin/enterprise-reports"],
  ["Users", "/admin/users"],
  ["Notifications", "/admin/notifications"],
  ["AI Project Manager", "/admin/ai-pm"],
  ["Timesheet", "/admin/timesheet"],
].map(([label, path]) => ({ label, path, group: "Navigate" }));

export default function CommandSearch({
  open,
  onClose,
  items = DEFAULT_ITEMS,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? items.filter((item) =>
          `${item.label} ${item.group}`.toLowerCase().includes(q),
        )
      : items;
  }, [items, query]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    const handler = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="command-search-heading"
    >
      <DialogContent sx={{ p: 1.5 }}>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, pb: 1 }}
        >
          <SearchRoundedIcon sx={{ color: TEXT_SECONDARY }} />
          <TextField
            className="pm-command-search-input"
            autoFocus
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, projects, tickets and people..."
            variant="standard"
            InputProps={{
              disableUnderline: true,
              "aria-label": "Search application",
            }}
          />
          <IconButton onClick={onClose} aria-label="Close search">
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            border: `1px solid ${BORDER}`,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 1,
              bgcolor: SURFACE_SUBTLE,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Typography
              id="command-search-heading"
              variant="caption"
              color="text.secondary"
            >
              Quick navigation
            </Typography>
            <Chip size="small" label="Esc to close" sx={{ height: 22 }} />
          </Box>
          <List disablePadding sx={{ maxHeight: 420, overflowY: "auto" }}>
            {filtered.map((item) => (
              <ListItemButton
                key={item.path}
                onClick={() => {
                  onClose?.();
                  navigate(item.path);
                }}
                sx={{ minHeight: 48 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <SearchRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={item.group}
                  primaryTypographyProps={{ fontWeight: 650, fontSize: 14 }}
                  secondaryTypographyProps={{ fontSize: 11 }}
                />
                <KeyboardReturnRoundedIcon
                  sx={{ color: "text.disabled", fontSize: 17 }}
                />
              </ListItemButton>
            ))}
            {!filtered.length && (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography fontWeight={700}>No results</Typography>
                <Typography variant="body2" color="text.secondary">
                  Try a different search term.
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

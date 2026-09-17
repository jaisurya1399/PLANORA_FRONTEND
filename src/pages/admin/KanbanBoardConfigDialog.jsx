import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import {
  Button,
  Checkbox,
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
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";

export default function KanbanBoardConfigDialog({
  open,
  config,
  columns,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    swimlaneType: "NONE",
    enforceWip: false,
    activeSprintOnly: true,
    showEpic: true,
  });
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      swimlaneType: config?.swimlaneType || "NONE",
      enforceWip: Boolean(config?.enforceWip),
      activeSprintOnly: config?.activeSprintOnly !== false,
      showEpic: config?.showEpic !== false,
    });
    setRows(
      (columns || []).map((c, i) => ({
        ...c,
        displayOrder: c.displayOrder ?? i,
        enabled: c.enabled !== false,
        wipLimit: c.wipLimit ?? "",
      })),
    );
  }, [open, config, columns]);

  const move = (index, delta) => {
    const next = [...rows];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next.map((r, i) => ({ ...r, displayOrder: i })));
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(
        form,
        rows.map((r, i) => ({
          statusId: r.statusId,
          displayName: r.displayName,
          displayOrder: i,
          enabled: Boolean(r.enabled),
          wipLimit: r.wipLimit === "" ? null : Number(r.wipLimit),
        })),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Kanban Board Configuration</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <FormControl fullWidth>
            <InputLabel>Swimlanes</InputLabel>
            <Select
              value={form.swimlaneType}
              label="Swimlanes"
              onChange={(e) =>
                setForm({ ...form, swimlaneType: e.target.value })
              }
            >
              <MenuItem value="NONE">No swimlanes</MenuItem>
              <MenuItem value="ASSIGNEE">By assignee</MenuItem>
              <MenuItem value="EPIC">By epic</MenuItem>
              <MenuItem value="PRIORITY">By priority</MenuItem>
            </Select>
          </FormControl>
          <Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.enforceWip}
                  onChange={(e) =>
                    setForm({ ...form, enforceWip: e.target.checked })
                  }
                />
              }
              label="Enforce WIP limits when moving tickets"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.activeSprintOnly}
                  onChange={(e) =>
                    setForm({ ...form, activeSprintOnly: e.target.checked })
                  }
                />
              }
              label="Show only active sprint tickets when an active sprint exists"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.showEpic}
                  onChange={(e) =>
                    setForm({ ...form, showEpic: e.target.checked })
                  }
                />
              }
              label="Show epic on ticket cards"
            />
          </Stack>
          <Divider />
          <Typography variant="subtitle1" fontWeight={700}>
            Custom Board Columns
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rename, hide, reorder columns and optionally set a WIP limit.
            Zero/blank means unlimited.
          </Typography>
          <Stack spacing={1}>
            {rows.map((row, index) => (
              <Stack
                key={row.statusId}
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ sm: "center" }}
              >
                <FormControlLabel
                  sx={{ minWidth: 125 }}
                  control={
                    <Checkbox
                      checked={Boolean(row.enabled)}
                      onChange={(e) =>
                        setRows(
                          rows.map((r, i) =>
                            i === index
                              ? { ...r, enabled: e.target.checked }
                              : r,
                          ),
                        )
                      }
                    />
                  }
                  label={row.statusName}
                />
                <TextField
                  size="small"
                  label="Column name"
                  value={row.displayName || ""}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, i) =>
                        i === index ? { ...r, displayName: e.target.value } : r,
                      ),
                    )
                  }
                  fullWidth
                />
                <TextField
                  size="small"
                  label="WIP"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={row.wipLimit}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, i) =>
                        i === index ? { ...r, wipLimit: e.target.value } : r,
                      ),
                    )
                  }
                  sx={{ width: { sm: 110 } }}
                />
                <Stack direction="row">
                  <IconButton
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                  >
                    <ArrowUpwardIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => move(index, 1)}
                    disabled={index === rows.length - 1}
                  >
                    <ArrowDownwardIcon />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

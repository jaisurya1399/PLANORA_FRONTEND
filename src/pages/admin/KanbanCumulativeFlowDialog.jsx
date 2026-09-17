import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";
import { getCumulativeFlow } from "../../api/boardApi";

export default function KanbanCumulativeFlowDialog({
  open,
  projectId,
  columns,
  onClose,
}) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open || !projectId) return;
    (async () => {
      setLoading(true);
      try {
        setData(await getCumulativeFlow(projectId, days));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, projectId, days]);
  const max = useMemo(
    () =>
      Math.max(
        1,
        ...data.map((d) =>
          Object.values(d.counts || {}).reduce((a, b) => a + b, 0),
        ),
      ),
    [data],
  );
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Kanban Cumulative Flow Diagram</DialogTitle>
      <DialogContent dividers>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            Ticket count by workflow column over time.
          </Typography>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Range</InputLabel>
            <Select
              value={days}
              label="Range"
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <MenuItem value={14}>14 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
              <MenuItem value={60}>60 days</MenuItem>
              <MenuItem value={90}>90 days</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "end",
              gap: "2px",
              height: 320,
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflowX: "auto",
            }}
          >
            {data.map((point) => {
              return (
                <Box
                  key={point.date}
                  title={point.date}
                  sx={{
                    minWidth: Math.max(10, 900 / data.length),
                    height: "100%",
                    display: "flex",
                    alignItems: "end",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column-reverse",
                      justifyContent: "flex-start",
                    }}
                  >
                    {columns.map((c) => {
                      const n = Number(point.counts?.[c.statusId] || 0);
                      const h = (n / max) * 260;
                      return (
                        <Box
                          key={c.statusId}
                          sx={{
                            height: h,
                            width: "100%",
                            minHeight: n ? 1 : 0,
                            backgroundColor: c.statusColor || "grey.500",
                            opacity: 0.8,
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 2 }}>
          {columns.map((c) => (
            <Stack
              key={c.statusId}
              direction="row"
              spacing={0.75}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: 1,
                  backgroundColor: c.statusColor || "grey.500",
                }}
              />
              <Typography variant="caption">
                {c.displayName || c.statusName}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

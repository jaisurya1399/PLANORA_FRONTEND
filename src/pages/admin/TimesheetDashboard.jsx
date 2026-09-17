import { Alert, Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { getActiveTimeSheets, getTimeSheets } from "../../api/timeSheetApi";
import { getTimeSheetCells } from "../../api/timeSheetCellApi";

export default function TimesheetDashboard() {
  const [sheets, setSheets] = useState([]);
  const [active, setActive] = useState([]);
  const [cells, setCells] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getTimeSheets(), getActiveTimeSheets(), getTimeSheetCells()])
      .then(([all, activeSheets, cellList]) => {
        setSheets(Array.isArray(all) ? all : []);
        setActive(Array.isArray(activeSheets) ? activeSheets : []);
        setCells(Array.isArray(cellList) ? cellList : []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Unable to load dashboard.");
      });
  }, []);

  const totalHours = useMemo(
    () =>
      cells.reduce((sum, cell) => sum + Number(cell.value || 0), 0).toFixed(2),
    [cells],
  );

  return (
    <Box className="app-page pm-fade-up">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Timesheet Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of timesheet activity
        </Typography>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Hours
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                {totalHours}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Entries
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                {sheets.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                {active.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Logged cells
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                {cells.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

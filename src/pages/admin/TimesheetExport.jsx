import DownloadIcon from "@mui/icons-material/Download";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { getTimeSheets } from "../../api/timeSheetApi";

export default function TimesheetExport() {
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError("");
      const sheets = await getTimeSheets();
      const rows = Array.isArray(sheets) ? sheets : [];
      const header = [
        "id",
        "userName",
        "userEmail",
        "projectName",
        "task",
        "createdAt",
      ];
      const csv = [
        header.join(","),
        ...rows.map((row) =>
          header
            .map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`)
            .join(","),
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "timesheets.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to export timesheets.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box className="app-page pm-fade-up">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Timesheet Export
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Export timesheet records
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? "Exporting..." : "Export"}
        </Button>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export Timesheets
          </Typography>
          <Typography color="text.secondary">
            Downloads all timesheet rows from `/api/time-sheets` as CSV.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

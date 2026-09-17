import {
  Alert,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";
import { getProjectDashboardAnalytics } from "../../api/dashboardAnalyticsApi";
import { getProjects } from "../../api/projectApi";
const Metric = ({ label, value }) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={800}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);
export default function EnterpriseReports() {
  const [projects, setProjects] = useState([]),
    [pid, setPid] = useState(""),
    [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    getProjects()
      .then((p) => {
        const x = Array.isArray(p) ? p : p?.content || [];
        setProjects(x);
        if (x[0]) setPid(String(x[0].id));
      })
      .catch((e) =>
        setError(e?.response?.data?.message || "Unable to load projects."),
      );
  }, []);
  useEffect(() => {
    if (pid)
      getProjectDashboardAnalytics(pid, 90)
        .then(setData)
        .catch((e) =>
          setError(e?.response?.data?.message || "Unable to load reports."),
        );
  }, [pid]);
  const summary = useMemo(() => {
    const er = data?.estimationSummary || {};
    return {
      created: (data?.createdResolved || []).reduce(
        (a, x) => a + Number(x.created || 0),
        0,
      ),
      resolved: (data?.createdResolved || []).reduce(
        (a, x) => a + Number(x.resolved || 0),
        0,
      ),
      estimated: er.totalEstimated || 0,
      remaining: er.remainingEstimated || 0,
      assignees: (data?.assigneeWorkload || []).length,
      aged: (data?.issueAging || []).reduce(
        (a, x) => a + Number(x.count || 0),
        0,
      ),
    };
  }, [data]);
  return (
    <Stack spacing={2} className="app-page pm-fade-up">
      <Typography variant="h4" fontWeight={800}>
        Enterprise Reports
      </Typography>
      <Typography color="text.secondary">
        Executive, delivery, workload, flow and issue-health reporting.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Select
        value={pid}
        onChange={(e) => setPid(e.target.value)}
        sx={{ maxWidth: 500 }}
      >
        {projects.map((p) => (
          <MenuItem key={p.id} value={String(p.id)}>
            {p.name}
          </MenuItem>
        ))}
      </Select>
      <Grid container spacing={2}>
        {[
          ["Created", summary.created],
          ["Resolved", summary.resolved],
          ["Estimated", summary.estimated],
          ["Remaining", summary.remaining],
          ["Assignees", summary.assignees],
          ["Open aged issues", summary.aged],
        ].map(([l, v]) => (
          <Grid item xs={6} md={2} key={l}>
            <Metric label={l} value={v} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        {[
          ["Status distribution", data?.statusDistribution],
          ["Priority distribution", data?.priorityDistribution],
          ["Assignee workload", data?.assigneeWorkload],
          ["Issue aging", data?.issueAging],
        ].map(([title, rows]) => (
          <Grid item xs={12} md={6} key={title}>
            <Card variant="outlined">
              <CardContent>
                <Typography fontWeight={700}>{title}</Typography>
                {(rows || []).map((r, i) => (
                  <Stack
                    key={i}
                    direction="row"
                    justifyContent="space-between"
                    sx={{ py: 0.75 }}
                  >
                    <Typography>
                      {r.status || r.priority || r.assignee || r.bucket}
                    </Typography>
                    <Typography fontWeight={700}>
                      {r.count ?? r.issues}
                    </Typography>
                  </Stack>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

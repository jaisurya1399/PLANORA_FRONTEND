import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useState } from "react";
import { analyzeProjectWithAiPm } from "../../api/aiPmApi";

export default function AiPmAssistant() {
  const [projectId, setProjectId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      setData(await analyzeProjectWithAiPm(projectId));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Box className="app-page pm-fade-up">
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <AutoAwesomeIcon />
        <Typography variant="h5" fontWeight={700}>
          AI Project Manager
        </Typography>
      </Stack>
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              type="number"
              label="Project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={run}
              disabled={!projectId || loading}
            >
              {loading ? <CircularProgress size={22} /> : `Analyze Project`}
            </Button>
          </Stack>
        </CardContent>
      </Card>
      {data && (
        <Stack spacing={2} mt={2}>
          <Alert severity="info">{data.summary}</Alert>
          <Card>
            <CardContent>
              <Typography variant="h6">Risk Signals</Typography>
              <List>
                {data.risks.map((x, i) => (
                  <ListItem key={i}>
                    <Chip label="Risk" size="small" sx={{ mr: 1 }} />
                    <ListItemText primary={x} />
                  </ListItem>
                ))}
              </List>
              <Divider />
              <Typography variant="h6" mt={2}>
                Recommendations
              </Typography>
              <List>
                {data.recommendations.map((x, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={x} />
                  </ListItem>
                ))}
              </List>
              <Divider />
              <Typography variant="h6" mt={2}>
                Next Actions
              </Typography>
              <List>
                {data.nextActions.map((x, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={x} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Stack>
      )}
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mt={2}
      >
        AI PM currently uses explainable project-data analysis; no external AI
        provider or project data is sent outside the application.
      </Typography>
    </Box>
  );
}

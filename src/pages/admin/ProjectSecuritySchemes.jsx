import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";
import { getActiveProjects } from "../../api/projectApi";
import {
  getIssueSecurityScheme,
  getPermissionScheme,
  getPriorityScheme,
  saveIssueSecurityScheme,
  savePermissionScheme,
  savePriorityScheme,
} from "../../api/projectSchemeApi";
export default function ProjectSecuritySchemes() {
  const [p, setP] = useState([]),
    [pid, setPid] = useState(""),
    [error, setError] = useState(""),
    [priority, setPriority] = useState({
      name: "Default Priority Scheme",
      priorityIds: [],
    }),
    [permission, setPermission] = useState({
      name: "Default Permission Scheme",
      grantsJson:
        '{"PROJECT_ADMIN":["*"] ,"MEMBER":["ticket.view","ticket.update"] ,"VIEWER":["project.view","ticket.view"]}',
    }),
    [security, setSecurity] = useState({
      name: "Default Issue Security",
      defaultLevel: "PROJECT",
    });
  useEffect(() => {
    getActiveProjects()
      .then(setP)
      .catch((e) =>
        setError(e.response?.data?.message || "Unable to load projects"),
      );
  }, []);
  useEffect(() => {
    if (!pid) return;
    Promise.all([
      getPriorityScheme(pid),
      getPermissionScheme(pid),
      getIssueSecurityScheme(pid),
    ])
      .then(([a, b, c]) => {
        setPriority(a);
        setPermission(b);
        setSecurity(c);
      })
      .catch((e) =>
        setError(
          e.response?.data?.message ||
            "No scheme exists yet; save to create it",
        ),
      );
  }, [pid]);
  return (
    <Box className="app-page pm-fade-up">
      <Typography variant="h5" mb={2}>
        Project Permission / Priority / Issue Security Schemes
      </Typography>
      <TextField
        select
        label="Project"
        value={pid}
        onChange={(e) => setPid(e.target.value)}
        sx={{ minWidth: 300 }}
      >
        {p.map((x) => (
          <MenuItem key={x.id} value={x.id}>
            {x.name}
          </MenuItem>
        ))}
      </TextField>
      {pid && (
        <Stack spacing={3} mt={3}>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Priority scheme name"
              value={priority.name || ""}
              onChange={(e) =>
                setPriority({ ...priority, name: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Ordered priority IDs (JSON)"
              value={JSON.stringify(priority.priorityIds || [])}
              onChange={(e) => {
                try {
                  setPriority({
                    ...priority,
                    priorityIds: JSON.parse(e.target.value),
                  });
                } catch {
                  // Ignore invalid JSON while the user is still typing.
                }
              }}
            />
            <Button
              variant="contained"
              onClick={() =>
                savePriorityScheme({
                  projectId: Number(pid),
                  name: priority.name,
                  priorityIds: priority.priorityIds || [],
                })
              }
            >
              Save
            </Button>
          </Stack>
          <Stack spacing={1}>
            <TextField
              label="Permission scheme name"
              value={permission.name || ""}
              onChange={(e) =>
                setPermission({ ...permission, name: e.target.value })
              }
            />
            <TextField
              multiline
              minRows={5}
              label="Role → permissions JSON"
              value={permission.grantsJson || ""}
              onChange={(e) =>
                setPermission({ ...permission, grantsJson: e.target.value })
              }
            />
            <Button
              variant="contained"
              onClick={() =>
                savePermissionScheme({
                  projectId: Number(pid),
                  name: permission.name,
                  grantsJson: permission.grantsJson,
                })
              }
            >
              Save Permission Scheme
            </Button>
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Issue security scheme name"
              value={security.name || ""}
              onChange={(e) =>
                setSecurity({ ...security, name: e.target.value })
              }
            />
            <TextField
              select
              fullWidth
              label="Default level"
              value={security.defaultLevel || "PROJECT"}
              onChange={(e) =>
                setSecurity({ ...security, defaultLevel: e.target.value })
              }
            >
              {["PROJECT", "MEMBERS", "ASSIGNEE", "REPORTER"].map((x) => (
                <MenuItem key={x} value={x}>
                  {x}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              onClick={() =>
                saveIssueSecurityScheme({
                  projectId: Number(pid),
                  name: security.name,
                  defaultLevel: security.defaultLevel,
                })
              }
            >
              Save Security Scheme
            </Button>
          </Stack>
        </Stack>
      )}
      {error && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";
import * as api from "../../api/enterpriseManagementApi";
import { getProjects } from "../../api/projectApi";

export default function EnterpriseManagement() {
  const [projects, setProjects] = useState([]),
    [projectId, setProjectId] = useState(""),
    [tab, setTab] = useState(0),
    [data, setData] = useState(null),
    [msg, setMsg] = useState("");
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setMsg("Unable to load projects"));
  }, []);
  useEffect(() => {
    if (projectId) load();
  }, [projectId, tab]);
  const load = async () => {
    try {
      let d =
        tab === 0
          ? await api.getAutomationRules(projectId)
          : tab === 1
            ? await api.getNotificationScheme(projectId)
            : tab === 2
              ? await api.getSlaPolicies(projectId)
              : tab === 3
                ? await api.getWikiPages(projectId)
                : tab === 5
                  ? await api.getRisks(projectId)
                  : tab === 6
                    ? await api.getDependencies(projectId)
                    : await api.getEnterpriseReport(projectId);
      setData(d);
    } catch (e) {
      setMsg(e.response?.data?.message || "Unable to load data");
    }
  };
  return (
    <Box className="app-page pm-fade-up">
      <Typography variant="h4" gutterBottom>
        Enterprise Management Suite
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Project</InputLabel>
        <Select
          value={projectId}
          label="Project"
          onChange={(e) => setProjectId(e.target.value)}
        >
          {projects.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {msg && (
        <Alert severity="warning" onClose={() => setMsg("")}>
          {msg}
        </Alert>
      )}
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab label="Automation" />
          <Tab label="Notifications" />
          <Tab label="SLA" />
          <Tab label="Knowledge Base" />
          <Tab label="Portfolio" />
          <Tab label="Risks & Health" />
          <Tab label="Dependencies" />
          <Tab label="Reports" />
        </Tabs>
        <Divider />
        <CardContent>
          {!projectId && <Typography>Select a project.</Typography>}
          {projectId && tab === 0 && (
            <Automation data={data} reload={load} projectId={projectId} />
          )}{" "}
          {projectId && tab === 1 && (
            <Notifications data={data} reload={load} />
          )}{" "}
          {projectId && tab === 2 && (
            <Sla data={data} reload={load} projectId={projectId} />
          )}{" "}
          {projectId && tab === 3 && (
            <Wiki data={data} reload={load} projectId={projectId} />
          )}{" "}
          {tab === 4 && <Portfolio projectId={projectId} />}{" "}
          {projectId && tab === 5 && (
            <Risks data={data} reload={load} projectId={projectId} />
          )}{" "}
          {projectId && tab === 6 && (
            <Dependencies data={data} reload={load} projectId={projectId} />
          )}{" "}
          {projectId && tab === 7 && <Reports data={data} />}
        </CardContent>
      </Card>
    </Box>
  );
}
function Automation({ data, reload, projectId }) {
  const [f, setF] = useState({
    name: "",
    triggerEvent: "TICKET_UPDATED",
    conditionExpression: "ALWAYS",
    actionType: "NOTIFY_ASSIGNEE",
    actionValue: "",
  });
  return (
    <>
      <Stack spacing={1}>
        <TextField
          label="Rule name"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
        <TextField
          label="Trigger event"
          value={f.triggerEvent}
          onChange={(e) => setF({ ...f, triggerEvent: e.target.value })}
        />
        <TextField
          label="Condition (ALWAYS / PRIORITY=HIGH / STATUS=Open)"
          value={f.conditionExpression}
          onChange={(e) => setF({ ...f, conditionExpression: e.target.value })}
        />
        <TextField
          label="Action (NOTIFY_ASSIGNEE / NOTIFY_OWNER)"
          value={f.actionType}
          onChange={(e) => setF({ ...f, actionType: e.target.value })}
        />
        <Button
          variant="contained"
          onClick={async () => {
            await api.createAutomationRule({
              ...f,
              projectId: Number(projectId),
            });
            reload();
          }}
        >
          Create Rule
        </Button>
      </Stack>
      <Divider sx={{ my: 2 }} />
      {(data || []).map((r) => (
        <Card key={r.id} variant="outlined" sx={{ mb: 1 }}>
          <CardContent>
            <b>{r.name}</b> — {r.triggerEvent} — {r.conditionExpression} →{" "}
            {r.actionType}
            <br />
            <Button
              size="small"
              onClick={async () => {
                await api.toggleAutomationRule(r.id);
                reload();
              }}
            >
              {r.enabled ? "Disable" : "Enable"}
            </Button>{" "}
            <Button
              size="small"
              onClick={async () => {
                await api.runAutomationRule(r.id);
                reload();
              }}
            >
              Test Run
            </Button>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
function Notifications({ data, reload }) {
  const [scheme, setScheme] = useState({
    name: data?.name || "Project Notification Scheme",
  });
  useEffect(() => {
    setScheme({
      name: data?.name || "Project Notification Scheme",
    });
  }, [data]);
  const [r, setR] = useState({
    eventType: "ISSUE_ASSIGNED",
    recipientType: "ASSIGNEE",
    inAppEnabled: true,
    emailEnabled: true,
  });
  return (
    <Stack spacing={2}>
      <TextField
        label="Scheme name"
        value={scheme.name}
        onChange={(e) => setScheme({ name: e.target.value })}
      />
      <Button
        variant="contained"
        onClick={async () => {
          await api.saveNotificationScheme({
            projectId: data?.projectId,
            name: scheme.name,
          });
          reload();
        }}
      >
        Save Scheme
      </Button>
      {data?.id && (
        <>
          <TextField
            label="Event"
            value={r.eventType}
            onChange={(e) => setR({ ...r, eventType: e.target.value })}
          />
          <TextField
            label="Recipient"
            value={r.recipientType}
            onChange={(e) => setR({ ...r, recipientType: e.target.value })}
          />
          <Button
            onClick={async () => {
              await api.addNotificationRule(data.id, r);
              reload();
            }}
          >
            Add Event Rule
          </Button>
        </>
      )}
      <Typography variant="body2">
        Events can be configured per project: assignment, mention, comment,
        status change, due date, sprint, meeting and automation events.
      </Typography>
    </Stack>
  );
}
function Sla({ data, reload, projectId }) {
  const [f, setF] = useState({
    name: "Default SLA",
    targetHours: 24,
    priorityFilter: "",
  });

  const [evalData, setEvalData] = useState([]);

  const policies = Array.isArray(data) ? data : data ? [data] : [];

  return (
    <Stack spacing={2}>
      <TextField
        label="Policy name"
        value={f.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
      />

      <TextField
        type="number"
        label="Target hours"
        value={f.targetHours}
        onChange={(e) =>
          setF({
            ...f,
            targetHours: Number(e.target.value),
          })
        }
      />

      <TextField
        label="Priority filter (optional)"
        value={f.priorityFilter}
        onChange={(e) =>
          setF({
            ...f,
            priorityFilter: e.target.value,
          })
        }
      />

      <Button
        variant="contained"
        onClick={async () => {
          try {
            await api.saveSlaPolicy({
              ...f,
              projectId: Number(projectId),
            });

            reload();
          } catch (e) {
            console.error("Failed to create SLA policy:", e);
          }
        }}
      >
        Create SLA Policy
      </Button>

      <Button
        onClick={async () => {
          try {
            const result = await api.evaluateSla(projectId);

            setEvalData(
              Array.isArray(result) ? result : result ? [result] : [],
            );
          } catch (e) {
            console.error("Failed to evaluate SLA:", e);
            setEvalData([]);
          }
        }}
      >
        Evaluate Current SLAs
      </Button>

      <Divider />

      <Typography variant="h6">SLA Policies</Typography>

      {policies.length === 0 ? (
        <Typography color="text.secondary">
          No SLA policies configured.
        </Typography>
      ) : (
        policies.map((x) => (
          <Card key={x.id} variant="outlined">
            <CardContent>
              <Typography variant="subtitle1">{x.name}</Typography>

              <Typography variant="body2">
                Target: {x.targetHours} hours
              </Typography>

              {x.priorityFilter && (
                <Typography variant="body2">
                  Priority: {x.priorityFilter}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Typography variant="h6">SLA Evaluation</Typography>

      {evalData.length === 0 ? (
        <Typography color="text.secondary">No SLA evaluation data.</Typography>
      ) : (
        evalData.map((x) => (
          <Alert
            key={x.ticketId}
            severity={x.breached ? "error" : x.resolved ? "success" : "warning"}
          >
            <strong>{x.ticketCode}</strong>:{" "}
            {x.breached
              ? "BREACHED"
              : x.resolved
                ? "Resolved"
                : `${x.remainingMinutes} min remaining`}
          </Alert>
        ))
      )}
    </Stack>
  );
}
function Wiki({ data, reload, projectId }) {
  const [f, setF] = useState({ title: "", content: "" });
  return (
    <Stack spacing={2}>
      <TextField
        label="Page title"
        value={f.title}
        onChange={(e) => setF({ ...f, title: e.target.value })}
      />
      <TextField
        multiline
        minRows={8}
        label="Content / Markdown"
        value={f.content}
        onChange={(e) => setF({ ...f, content: e.target.value })}
      />
      <Button
        variant="contained"
        onClick={async () => {
          await api.saveWikiPage({ ...f, projectId });
          setF({ title: "", content: "" });
          reload();
        }}
      >
        Create Page
      </Button>
      {(data || []).map((p) => (
        <Card key={p.id} variant="outlined">
          <CardContent>
            <Typography variant="h6">{p.title}</Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>{p.content}</Typography>
            <Typography variant="caption">
              v{p.version} · {p.updatedBy || "Unknown"}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
function Portfolio({ projectId }) {
  const [items, setItems] = useState([]),
    [f, setF] = useState({ name: "", description: "" });
  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        const result = await api.getPortfolios();

        setItems(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Failed to load portfolios:", error);
        setItems([]);
      }
    };

    loadPortfolios();
  }, []);
  return (
    <Stack spacing={2}>
      <TextField
        label="Portfolio name"
        value={f.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
      />
      <TextField
        label="Description"
        value={f.description}
        onChange={(e) => setF({ ...f, description: e.target.value })}
      />
      <Button
        variant="contained"
        onClick={async () => {
          const p = await api.createPortfolio(f);
          await api.addPortfolioProject(p.id, {
            projectId: Number(projectId),
            targetPercent: 100,
          });
          setItems(await api.getPortfolios());
        }}
      >
        Create Portfolio with Current Project
      </Button>
      {items.map((p) => (
        <Card key={p.id} variant="outlined">
          <CardContent>
            <b>{p.name}</b> —{" "}
            {(p.projects || [])
              .map((x) => x.project?.name || `Project #${x.project?.id}`)
              .join(", ")}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
function Risks({ data, reload, projectId }) {
  const [f, setF] = useState({
    title: "",
    description: "",
    probability: "MEDIUM",
    impact: "MEDIUM",
    status: "OPEN",
    owner: "",
    mitigation: "",
  });
  const [h, setH] = useState(null);
  return (
    <>
      <Button onClick={async () => setH(await api.getHealth(projectId))}>
        Calculate Project Health
      </Button>
      {h && (
        <Alert
          severity={
            h.health === "HEALTHY"
              ? "success"
              : h.health === "AT_RISK"
                ? "warning"
                : "error"
          }
          sx={{ my: 2 }}
        >
          {h.projectName}: {h.health} ({h.score}/100) · overdue{" "}
          {h.overdueTickets} · high risks {h.openHighRisks} · blocked{" "}
          {h.blockedDependencies} · SLA breaches {h.breachedSla}
        </Alert>
      )}
      <Stack spacing={1}>
        <TextField
          label="Risk"
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
        />
        <TextField
          label="Probability"
          value={f.probability}
          onChange={(e) => setF({ ...f, probability: e.target.value })}
        />
        <TextField
          label="Impact"
          value={f.impact}
          onChange={(e) => setF({ ...f, impact: e.target.value })}
        />
        <TextField
          label="Mitigation"
          value={f.mitigation}
          onChange={(e) => setF({ ...f, mitigation: e.target.value })}
        />
        <Button
          variant="contained"
          onClick={async () => {
            await api.saveRisk({ ...f, projectId });
            reload();
          }}
        >
          Add Risk
        </Button>
      </Stack>
      <Divider sx={{ my: 2 }} />
      {(Array.isArray(data) ? data : []).map((r) => (
        <Typography key={r.id}>
          ⚠ {r.title} — {r.probability}/{r.impact} — {r.status}
        </Typography>
      ))}
    </>
  );
}

function Dependencies({ data, reload, projectId }) {
  const [f, setF] = useState({
    sourceTicketId: "",
    targetTicketId: "",
    type: "BLOCKS",
    description: "",
  });

  const dependencies = Array.isArray(data) ? data : data ? [data] : [];

  return (
    <Stack spacing={1}>
      <TextField
        label="Source ticket ID"
        value={f.sourceTicketId}
        onChange={(e) =>
          setF({
            ...f,
            sourceTicketId: e.target.value,
          })
        }
      />

      <TextField
        label="Target ticket ID"
        value={f.targetTicketId}
        onChange={(e) =>
          setF({
            ...f,
            targetTicketId: e.target.value,
          })
        }
      />

      <TextField
        label="Type (BLOCKS / RELATES / DUPLICATES)"
        value={f.type}
        onChange={(e) =>
          setF({
            ...f,
            type: e.target.value,
          })
        }
      />

      <TextField
        label="Description"
        value={f.description}
        onChange={(e) =>
          setF({
            ...f,
            description: e.target.value,
          })
        }
      />

      <Button
        variant="contained"
        onClick={async () => {
          try {
            await api.saveDependency({
              sourceTicketId: Number(f.sourceTicketId),
              targetTicketId: Number(f.targetTicketId),
              type: f.type,
              description: f.description,
            });

            setF({
              sourceTicketId: "",
              targetTicketId: "",
              type: "BLOCKS",
              description: "",
            });

            reload();
          } catch (e) {
            console.error("Failed to save dependency:", e);
          }
        }}
      >
        Add Dependency
      </Button>

      <Divider sx={{ my: 2 }} />

      {dependencies.length === 0 ? (
        <Typography color="text.secondary">No dependencies found.</Typography>
      ) : (
        dependencies.map((d) => (
          <Typography key={d.id}>
            {d.sourceCode || `Ticket #${d.sourceTicketId}`} — {d.type} →{" "}
            {d.targetCode || `Ticket #${d.targetTicketId}`}
          </Typography>
        ))
      )}
    </Stack>
  );
}

function Reports({ data }) {
  if (!data) return <Typography>Loading report…</Typography>;
  return (
    <Grid container spacing={2}>
      {[
        ["Health", `${data.health} (${data.healthScore}/100)`],
        ["Issues", data.totalIssues],
        ["Open", data.openIssues],
        ["Resolved", data.resolvedIssues],
        ["Overdue", data.overdueIssues],
        ["High Risks", data.highRisks],
        ["Blocked Dependencies", data.blockedDependencies],
        ["SLA Breaches", data.slaBreaches],
      ].map(([a, b]) => (
        <Grid item xs={12} sm={6} md={3} key={a}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption">{a}</Typography>
              <Typography variant="h5">{b}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

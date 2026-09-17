import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SecurityIcon from "@mui/icons-material/Security";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";
import {
  confirmMfaApi,
  disableMfaApi,
  getMfaStatusApi,
  getSessionsApi,
  revokeAllSessionsApi,
  revokeSessionApi,
  setupMfaApi,
} from "../../api/authSecurityApi";
import { useAuth } from "../../context/AuthContext";

export default function SecuritySettings() {
  const { user } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [status, currentSessions] = await Promise.all([
        getMfaStatusApi(),
        getSessionsApi(),
      ]);
      setMfaEnabled(status);
      setSessions(currentSessions || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load security settings.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startMfa = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      setSetup(await setupMfaApi());
      setCode("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start MFA setup.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!/^\d{6}$/.test(code)) return setError("Enter a valid 6-digit code.");
    setBusy(true);
    setError("");
    try {
      const result = await confirmMfaApi(code);
      setMfaEnabled(true);
      setRecoveryCodes(result.recoveryCodes || []);
      setSetup(null);
      setCode("");
      setMessage("Two-factor authentication is enabled.");
    } catch (err) {
      setError(err.response?.data?.message || "MFA confirmation failed.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!/^\d{6}$/.test(code))
      return setError("Enter your current 6-digit MFA code.");
    setBusy(true);
    setError("");
    try {
      await disableMfaApi(code);
      setMfaEnabled(false);
      setCode("");
      setMessage("Two-factor authentication is disabled.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to disable MFA.");
    } finally {
      setBusy(false);
    }
  };

  const copyRecovery = async () => {
    await navigator.clipboard?.writeText(recoveryCodes.join("\n"));
    setMessage("Recovery codes copied.");
  };

  if (loading)
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box className="app-page pm-fade-up" sx={{ maxWidth: 1000, mx: "auto" }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Authentication & Security
          </Typography>
          <Typography color="text.secondary">
            Manage MFA and active JWT sessions for {user?.email}.
          </Typography>
        </Box>
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" onClose={() => setMessage("")}>
            {message}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <SecurityIcon color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  Two-factor authentication
                </Typography>
                <Typography color="text.secondary">
                  Use an authenticator app with TOTP codes.
                </Typography>
              </Box>
              <Chip
                label={mfaEnabled ? "Enabled" : "Disabled"}
                color={mfaEnabled ? "success" : "default"}
              />
            </Stack>
            {!mfaEnabled && !setup && (
              <Button variant="contained" onClick={startMfa} disabled={busy}>
                Set up MFA
              </Button>
            )}
            {setup && !mfaEnabled && (
              <Stack spacing={2}>
                <Typography>
                  1. Add this account to Google Authenticator, Microsoft
                  Authenticator, Authy, or another TOTP app.
                </Typography>
                <TextField
                  label="Secret key"
                  value={setup.secret || ""}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="OTPAuth URL"
                  value={setup.otpauthUrl || ""}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  multiline
                />
                <Typography color="text.secondary">
                  2. Enter the 6-digit code generated by your app.
                </Typography>
                <TextField
                  label="6-digit code"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputProps={{ maxLength: 6, inputMode: "numeric" }}
                />
                <Button variant="contained" onClick={confirm} disabled={busy}>
                  Confirm & Enable MFA
                </Button>
              </Stack>
            )}
            {mfaEnabled && (
              <Stack spacing={2}>
                <TextField
                  label="Current 6-digit code"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputProps={{ maxLength: 6, inputMode: "numeric" }}
                />
                <Button
                  color="error"
                  variant="outlined"
                  onClick={disable}
                  disabled={busy}
                >
                  Disable MFA
                </Button>
              </Stack>
            )}
            {recoveryCodes.length > 0 && (
              <Alert severity="warning">
                <Typography fontWeight={700}>
                  Save these recovery codes now.
                </Typography>
                <Typography component="pre" sx={{ whiteSpace: "pre-wrap" }}>
                  {recoveryCodes.join("\n")}
                </Typography>
                <Button startIcon={<ContentCopyIcon />} onClick={copyRecovery}>
                  Copy codes
                </Button>
              </Alert>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Active sessions
              </Typography>
              <Typography color="text.secondary">
                Each JWT refresh token represents a login session. Revoke
                sessions you no longer recognize.
              </Typography>
            </Box>
            <Divider />
            {sessions.length === 0 ? (
              <Typography color="text.secondary">
                No active sessions found.
              </Typography>
            ) : (
              sessions.map((session) => (
                <Stack
                  key={session.id}
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems={{ md: "center" }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={600}>
                      {session.userAgent || "Unknown device"}{" "}
                      {session.current && (
                        <Chip
                          size="small"
                          label="Current"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      IP: {session.ipAddress || "Unknown"} · Created:{" "}
                      {session.createdAt
                        ? new Date(session.createdAt).toLocaleString()
                        : "-"}
                    </Typography>
                  </Box>
                  <Button
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={async () => {
                      await revokeSessionApi(session.id);
                      load();
                    }}
                  >
                    Revoke
                  </Button>
                </Stack>
              ))
            )}
            {sessions.length > 0 && (
              <Button
                color="error"
                variant="outlined"
                onClick={async () => {
                  await revokeAllSessionsApi();
                  load();
                }}
              >
                Revoke all sessions
              </Button>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

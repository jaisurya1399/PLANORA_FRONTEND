import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { verifyMfaApi } from "../../api/authApi";
import { CURRENT_USER_KEY, persistAuthTokens } from "../../api/axios";
import AuthShell from "../../components/auth/AuthShell";
import {
  DISPLAY_FONT,
  TEXT_INK,
  TEXT_MUTED,
  authButtonSx,
  authFieldSx,
} from "../../components/auth/authTokens";
import { useAuth } from "../../context/AuthContext";

export default function MfaVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeLogin } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const mfaToken = location.state?.mfaToken;
  const email = location.state?.email || "your account";

  if (!mfaToken) {
    navigate("/login", { replace: true });
    return null;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    try {
      const data = await verifyMfaApi(mfaToken, code.trim());
      persistAuthTokens(data);
      sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
      completeLogin(data);
      const role = String(
        data?.role ?? data?.user?.role ?? data?.data?.role ?? "",
      ).toUpperCase();

      navigate(role === "ADMIN" ? "/admin" : "/member", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired MFA code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Just checking."
      highlight="It's really you."
      description="Two-factor authentication keeps your workspace locked down, even if a password leaks."
      errorKey={error ? `form-${error}` : ""}
    >
      <Stack component="form" onSubmit={submit} noValidate spacing={0}>
        <Typography
          sx={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 500,
            fontSize: { xs: "1.7rem", sm: "1.95rem" },
            color: TEXT_INK,
            letterSpacing: "-0.01em",
          }}
        >
          Two-factor authentication
        </Typography>
        <Typography sx={{ mt: 0.75, color: TEXT_MUTED, fontSize: "0.92rem" }}>
          Enter the 6-digit code for {email}.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mt: 3, borderRadius: 1.5, fontSize: "0.88rem" }}
          >
            {error}
          </Alert>
        )}

        <Stack spacing={2.5} sx={{ mt: 3.5 }}>
          <TextField
            label="Authentication code"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputProps={{ inputMode: "numeric", maxLength: 6 }}
            autoFocus
            fullWidth
            sx={authFieldSx}
          />
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={authButtonSx(false)}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "#F7F6F2" }} />
            ) : (
              "Verify & sign in"
            )}
          </Button>
        </Stack>
      </Stack>
    </AuthShell>
  );
}

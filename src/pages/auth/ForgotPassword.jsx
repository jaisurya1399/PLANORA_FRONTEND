import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";

import { requestPasswordResetApi } from "../../api/authApi";
import AuthShell from "../../components/auth/AuthShell";
import {
  DISPLAY_FONT,
  TEXT_INK,
  TEXT_MUTED,
  authButtonSx,
  authFieldSx,
  authLinkSx,
} from "../../components/auth/authTokens";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Generic message shown regardless of whether the account exists,
  // so this endpoint can't be used to enumerate registered emails.
  const GENERIC_SUCCESS_MESSAGE =
    "If an account exists for that email, we've sent a password reset link. Please check your inbox.";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordResetApi(normalizedEmail);
      if (response?.status === 204 || response?.status === 200) {
        setSuccess(GENERIC_SUCCESS_MESSAGE);
      } else {
        setError(
          "Unable to process the password reset request. Please try again.",
        );
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      const status = error.response?.status;
      const serverMessage =
        error.response?.data?.message || error.response?.data?.error;
      if (status === 429)
        setError("Too many reset requests. Please wait and try again later.");
      else if (status >= 500)
        setError(
          "Password reset service is temporarily unavailable. Please try again later.",
        );
      else if (error.code === "ERR_NETWORK")
        setError(
          "Cannot connect to the backend. Make sure Spring Boot is running.",
        );
      else if (serverMessage) setError(serverMessage);
      else
        setError(
          "Unable to process the password reset request. Please try again.",
        );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Forgot something?"
      highlight="It happens."
      description="Enter your email and we'll send a secure link so you can pick a new password and get right back to it."
      errorKey={error ? `form-${error}` : ""}
    >
      <Stack
        className="auth-password-reset"
        component="form"
        onSubmit={handleSubmit}
        noValidate
        spacing={0}
      >
        <Typography
          sx={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 500,
            fontSize: { xs: "1.7rem", sm: "1.95rem" },
            color: TEXT_INK,
            letterSpacing: "-0.01em",
          }}
        >
          Reset your password
        </Typography>
        <Typography sx={{ mt: 0.75, color: TEXT_MUTED, fontSize: "0.92rem" }}>
          We'll email you a secure reset link.
        </Typography>

        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{ mt: 3, borderRadius: 1.5, fontSize: "0.88rem" }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mt: 3, borderRadius: 1.5, fontSize: "0.88rem" }}
          >
            {success}
          </Alert>
        )}

        <Stack spacing={2.5} sx={{ mt: 3.5 }}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
            autoFocus
            autoComplete="email"
            placeholder="you@company.com"
            disabled={loading}
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
              "Send reset link"
            )}
          </Button>

          <Typography
            sx={{ textAlign: "center", fontSize: "0.85rem", color: TEXT_MUTED }}
          >
            Remembered your password?{" "}
            <Link to="/login" style={{ ...authLinkSx, fontSize: "0.85rem" }}>
              Back to sign in
            </Link>
          </Typography>
        </Stack>
      </Stack>
    </AuthShell>
  );
}

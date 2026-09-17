import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  confirmEmailVerificationApi,
  resendEmailVerificationApi,
} from "../../api/authApi";
import AuthShell from "../../components/auth/AuthShell";
import {
  DISPLAY_FONT,
  TEXT_INK,
  TEXT_MUTED,
  authButtonSx,
  authLinkSx,
} from "../../components/auth/authTokens";
import { useAuth } from "../../context/AuthContext";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuth();

  // "pending" | "success" | "error" | "missing-token"
  const [status, setStatus] = useState(token ? "pending" : "missing-token");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Guard against React 18/19 StrictMode double-invoking effects,
  // which would otherwise fire the confirm request twice.
  const hasConfirmed = useRef(false);

  useEffect(() => {
    if (!token || hasConfirmed.current) return;
    hasConfirmed.current = true;

    confirmEmailVerificationApi(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        console.error("Email verification error:", err);
        const message = err.response?.data?.message;
        setError(
          message ||
            "This verification link is invalid or has expired. Please request a new one.",
        );
        setStatus("error");
      });
  }, [token]);

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setResendMessage("");
    try {
      await resendEmailVerificationApi();
      setResendMessage("A new verification email has been sent.");
    } catch (err) {
      console.error("Resend verification error:", err);
      const message = err.response?.data?.message;
      setResendMessage(
        message || "Failed to resend verification email. Please try again.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      headline="One more step."
      highlight="Confirm your email."
      description="Verifying your email keeps your account secure and unlocks the full workspace."
    >
      <Stack spacing={0}>
        <Typography
          sx={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 500,
            fontSize: { xs: "1.7rem", sm: "1.95rem" },
            color: TEXT_INK,
            letterSpacing: "-0.01em",
          }}
        >
          Verify your email
        </Typography>

        <Stack spacing={2.5} sx={{ mt: 3.5 }}>
          {status === "pending" && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                py: 2,
              }}
            >
              <CircularProgress size={28} />
              <Typography sx={{ color: TEXT_MUTED, fontSize: "0.9rem" }}>
                Verifying your email address...
              </Typography>
            </Box>
          )}

          {status === "missing-token" && (
            <Alert
              severity="error"
              sx={{ borderRadius: 1.5, fontSize: "0.88rem" }}
            >
              This verification link is missing or invalid. Please use the link
              from your verification email, or resend it below.
            </Alert>
          )}

          {status === "success" && (
            <Alert
              severity="success"
              sx={{ borderRadius: 1.5, fontSize: "0.88rem" }}
            >
              Your email address has been verified successfully.
            </Alert>
          )}

          {status === "error" && (
            <Alert
              severity="error"
              sx={{ borderRadius: 1.5, fontSize: "0.88rem" }}
            >
              {error}
            </Alert>
          )}

          {resendMessage && (
            <Alert
              severity="info"
              sx={{ borderRadius: 1.5, fontSize: "0.88rem" }}
            >
              {resendMessage}
            </Alert>
          )}

          {(status === "error" || status === "missing-token") &&
            (user ? (
              <Button
                variant="outlined"
                fullWidth
                disabled={resending}
                onClick={handleResend}
                sx={{
                  height: 44,
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {resending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Resend verification email"
                )}
              </Button>
            ) : (
              <Typography
                sx={{
                  textAlign: "center",
                  fontSize: "0.85rem",
                  color: TEXT_MUTED,
                }}
              >
                Please sign in to resend the verification email.
              </Typography>
            ))}

          {status === "success" ? (
            <Button
              component={Link}
              to="/login"
              fullWidth
              sx={authButtonSx(false)}
            >
              Go to sign in
            </Button>
          ) : (
            <Typography
              sx={{
                textAlign: "center",
                fontSize: "0.85rem",
                color: TEXT_MUTED,
              }}
            >
              <Link to="/login" style={{ ...authLinkSx, fontSize: "0.85rem" }}>
                Back to sign in
              </Link>
            </Typography>
          )}
        </Stack>
      </Stack>
    </AuthShell>
  );
}

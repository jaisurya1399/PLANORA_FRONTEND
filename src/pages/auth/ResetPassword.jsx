import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { confirmPasswordResetApi } from "../../api/authApi";
import AuthShell from "../../components/auth/AuthShell";
import {
  DISPLAY_FONT,
  TEXT_INK,
  TEXT_MUTED,
  authButtonSx,
  authFieldSx,
  authLinkSx,
} from "../../components/auth/authTokens";

/*
 * Password Policy
 *
 * Minimum 10 characters
 * At least 1 uppercase letter
 * At least 1 lowercase letter
 * At least 1 number
 * At least 1 special character
 */
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  /*
   * Individual password rules.
   * These are used to show live validation to the user.
   */
  const passwordRules = {
    minLength: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  /*
   * Complete password validation.
   *
   * This is the actual validation used before
   * sending the password to the backend.
   */
  const isPasswordValid = PASSWORD_REGEX.test(password);

  /*
   * Password rule UI component
   */
  const PasswordRule = ({ valid, children }) => {
    return (
      <Typography
        component="div"
        sx={{
          fontSize: "0.82rem",
          color: valid ? "success.main" : TEXT_MUTED,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          transition: "color 0.2s ease",
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.9rem",
            width: "16px",
            display: "inline-block",
          }}
        >
          {valid ? "✓" : "○"}
        </span>

        {children}
      </Typography>
    );
  };

  /*
   * Submit handler
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    /*
     * Password empty
     */
    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    /*
     * Regex validation
     *
     * Do not call backend if password policy fails.
     */
    if (!PASSWORD_REGEX.test(password)) {
      setError(
        "Password must contain at least 10 characters, including uppercase, lowercase, number, and special character.",
      );
      return;
    }

    /*
     * Confirm password empty
     */
    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    /*
     * Confirm password mismatch
     */
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    /*
     * Reset token validation
     */
    if (!token) {
      setError(
        "This reset link is missing or invalid. Please request a new one.",
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * Backend API call
       */
      await confirmPasswordResetApi(token, password);

      setSuccess(true);
      setError("");
    } catch (error) {
      console.error("Password reset confirm error:", error);

      const status = error.response?.status;
      const message = error.response?.data?.message;

      /*
       * Invalid / expired reset token
       */
      if (status === 400 || status === 404) {
        setError(
          "This reset link is invalid or has expired. Please request a new one.",
        );
      } else if (error.code === "ERR_NETWORK") {
        /*
         * Backend unavailable
         */
        setError(
          "Cannot connect to backend. Make sure Spring Boot is running.",
        );
      } else if (message) {
        /*
         * Backend returned custom error
         */
        setError(message);
      } else {
        /*
         * Generic error
         */
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const missingToken = !token;

  return (
    <AuthShell
      headline="Almost there."
      highlight="New password, new start."
      description="Choose a strong new password to keep your workspace secure."
      errorKey={error ? `form-${error}` : ""}
    >
      <Stack
        className="auth-password-reset"
        component={missingToken || success ? "div" : "form"}
        onSubmit={missingToken || success ? undefined : handleSubmit}
        spacing={0}
      >
        {/* Page title */}
        <Typography
          sx={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 500,
            fontSize: {
              xs: "1.7rem",
              sm: "1.95rem",
            },
            color: TEXT_INK,
            letterSpacing: "-0.01em",
          }}
        >
          Reset password
        </Typography>

        {/* Page description */}
        {!missingToken && !success && (
          <Typography
            sx={{
              mt: 0.75,
              color: TEXT_MUTED,
              fontSize: "0.92rem",
            }}
          >
            Choose a new password for your account.
          </Typography>
        )}

        <Stack
          spacing={2.5}
          sx={{
            mt: 3.5,
          }}
        >
          {/* ============================================
              MISSING TOKEN
          ============================================ */}
          {missingToken ? (
            <>
              <Alert
                severity="error"
                sx={{
                  borderRadius: 1.5,
                  fontSize: "0.88rem",
                }}
              >
                This reset link is missing or invalid. Please request a new
                password reset link.
              </Alert>

              <Button
                component={Link}
                to="/forgot-password"
                fullWidth
                sx={authButtonSx(false)}
              >
                Request new link
              </Button>
            </>
          ) : success ? (
            /* ============================================
               SUCCESS
            ============================================ */
            <>
              <Alert
                severity="success"
                sx={{
                  borderRadius: 1.5,
                  fontSize: "0.88rem",
                }}
              >
                Your password has been reset successfully. You can now sign in
                with your new password.
              </Alert>

              <Button
                component={Link}
                to="/login"
                fullWidth
                sx={authButtonSx(false)}
              >
                Go to sign in
              </Button>
            </>
          ) : (
            /* ============================================
               PASSWORD RESET FORM
            ============================================ */
            <>
              {/* Error Alert */}
              {error && (
                <Alert
                  severity="error"
                  onClose={() => setError("")}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: "0.88rem",
                  }}
                >
                  {error}
                </Alert>
              )}

              {/* ========================================
                  NEW PASSWORD
              ======================================== */}
              <TextField
                label="New password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                required
                fullWidth
                autoFocus
                autoComplete="new-password"
                disabled={loading}
                error={Boolean(password) && !isPasswordValid}
                sx={authFieldSx}
              />

              {/* ========================================
                  PASSWORD POLICY
              ======================================== */}
              <Stack
                spacing={0.65}
                sx={{
                  mt: -1.25,
                  px: 0.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: TEXT_INK,
                    mb: 0.25,
                  }}
                >
                  Password must contain:
                </Typography>

                <PasswordRule valid={passwordRules.minLength}>
                  At least 10 characters
                </PasswordRule>

                <PasswordRule valid={passwordRules.uppercase}>
                  At least 1 uppercase letter (A–Z)
                </PasswordRule>

                <PasswordRule valid={passwordRules.lowercase}>
                  At least 1 lowercase letter (a–z)
                </PasswordRule>

                <PasswordRule valid={passwordRules.number}>
                  At least 1 number (0–9)
                </PasswordRule>

                <PasswordRule valid={passwordRules.special}>
                  At least 1 special character (@, #, $, %, etc.)
                </PasswordRule>
              </Stack>

              {/* ========================================
                  CONFIRM PASSWORD
              ======================================== */}
              <TextField
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                required
                fullWidth
                autoComplete="new-password"
                disabled={loading}
                error={Boolean(confirmPassword) && password !== confirmPassword}
                helperText={
                  confirmPassword && password !== confirmPassword
                    ? "Passwords do not match."
                    : ""
                }
                sx={authFieldSx}
              />

              {/* ========================================
                  RESET BUTTON
              ======================================== */}
              <Button
                type="submit"
                fullWidth
                disabled={
                  loading ||
                  !isPasswordValid ||
                  !confirmPassword ||
                  password !== confirmPassword
                }
                sx={authButtonSx(false)}
              >
                {loading ? (
                  <CircularProgress
                    size={20}
                    sx={{
                      color: "#F7F6F2",
                    }}
                  />
                ) : (
                  "Reset password"
                )}
              </Button>
            </>
          )}

          {/* ==========================================
              BACK TO LOGIN
          ========================================== */}
          <Typography
            sx={{
              textAlign: "center",
              fontSize: "0.85rem",
              color: TEXT_MUTED,
            }}
          >
            Remembered your password?{" "}
            <Link
              to="/login"
              style={{
                ...authLinkSx,
                fontSize: "0.85rem",
              }}
            >
              Back to sign in
            </Link>
          </Typography>
        </Stack>
      </Stack>
    </AuthShell>
  );
}

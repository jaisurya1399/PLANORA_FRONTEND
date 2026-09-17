import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthShell from "../../components/auth/AuthShell";
import {
  DISPLAY_FONT,
  GOLD,
  TEXT_INK,
  TEXT_MUTED,
  UI_FONT,
  authButtonSx,
  authFieldSx,
  authLinkSx,
} from "../../components/auth/authTokens";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setLoading(true);
    try {
      const loggedInUser = await login(email.trim(), password, rememberMe);
      if (loggedInUser?.mfaRequired && loggedInUser?.mfaToken) {
        navigate("/mfa-verify", {
          replace: true,
          state: { mfaToken: loggedInUser.mfaToken, email: loggedInUser.email },
        });
        return;
      }
      setSuccess(true);
      await new Promise((res) => setTimeout(res, 650));
      const role = String(
        loggedInUser?.role ??
          loggedInUser?.user?.role ??
          loggedInUser?.data?.role ??
          "",
      ).toUpperCase();

      navigate(role === "ADMIN" ? "/admin" : "/member", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 401) setError("That email or password isn't right.");
      else if (status === 403) setError("You're not authorized to log in.");
      else if (status === 404)
        setError("Login API was not found. Check the backend.");
      else if (err.code === "ERR_NETWORK")
        setError(
          "Unable to connect to the server. The server may be unavailable. Please try again later.",
        );
      else if (message) setError(message);
      else setError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Plan today."
      highlight="Rise tomorrow."
      description="Every milestone, priority, and deadline — laid out where you can see the whole horizon."
      errorKey={error ? `form-${error}` : ""}
    >
      <Stack component="form" onSubmit={handleSubmit} noValidate spacing={0}>
        <Typography
          sx={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 500,
            fontSize: { xs: "1.7rem", sm: "1.95rem" },
            color: TEXT_INK,
            letterSpacing: "-0.01em",
          }}
        >
          Welcome back
        </Typography>
        <Typography sx={{ mt: 0.75, color: TEXT_MUTED, fontSize: "0.92rem" }}>
          Sign in to continue to your workspace.
        </Typography>

        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{
              mt: 3,
              borderRadius: 1.5,
              fontFamily: UI_FONT,
              fontSize: "0.88rem",
              backgroundColor: "rgba(196,89,63,0.07)",
              color: "#8C3A26",
              border: "1px solid rgba(196,89,63,0.22)",
              boxShadow: "none",
              "& .MuiAlert-icon": { color: "#C4593F" },
            }}
          >
            {error}
          </Alert>
        )}

        <Stack spacing={2.5} sx={{ mt: 3.5 }}>
          <TextField
            variant="outlined"
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoFocus
            autoComplete="email"
            placeholder="you@company.com"
            sx={authFieldSx}
          />
          <TextField
            variant="outlined"
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            placeholder="Enter your password"
            sx={authFieldSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    size="small"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((p) => !p)}
                    sx={{ color: TEXT_MUTED }}
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Stack
            direction="row"
            flexWrap="wrap"
            rowGap={0.5}
            alignItems="center"
            justifyContent="space-between"
          >
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: "rgba(24,26,46,0.28)",
                    "&.Mui-checked": { color: GOLD },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: "0.85rem", color: TEXT_MUTED }}>
                  Remember me
                </Typography>
              }
            />
            <Link
              to="/forgot-password"
              style={{ ...authLinkSx, fontSize: "0.85rem" }}
            >
              Forgot password?
            </Link>
          </Stack>

          <Button
            type="submit"
            fullWidth
            disabled={loading || success}
            sx={authButtonSx(success)}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "#F7F6F2" }} />
            ) : success ? (
              <CheckCircleIcon
                sx={{
                  fontSize: 22,
                  animation: "popIn 0.4s cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            ) : (
              "Sign in"
            )}
          </Button>

          {/* <Typography
            sx={{ textAlign: "center", fontSize: "0.85rem", color: TEXT_MUTED }}
          >
            New here?{" "}
            <Link to="/signup" style={{ ...authLinkSx, fontSize: "0.85rem" }}>
              Create an account
            </Link>
          </Typography> */}
        </Stack>
      </Stack>
    </AuthShell>
  );
}

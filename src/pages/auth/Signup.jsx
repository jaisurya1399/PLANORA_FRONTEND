import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { signupApi } from "../../api/authApi";
import AuthShell from "../../components/auth/AuthShell";
import {
  DISPLAY_FONT,
  TEXT_INK,
  TEXT_MUTED,
  authButtonSx,
  authFieldSx,
  authLinkSx,
} from "../../components/auth/authTokens";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await signupApi({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (error) {
      console.error("Signup error:", error);
      const message = error.response?.data?.message;
      if (message) setError(message);
      else if (error.response?.status === 409)
        setError("An account with this email already exists.");
      else if (error.code === "ERR_NETWORK")
        setError(
          "Cannot connect to backend. Make sure Spring Boot is running.",
        );
      else setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Join the team."
      highlight="Build the horizon."
      description="Set up your workspace in a minute — projects, sprints, and every teammate in one clear view."
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
          Create your account
        </Typography>
        <Typography sx={{ mt: 0.75, color: TEXT_MUTED, fontSize: "0.92rem" }}>
          Join Planora and start planning today.
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
            label="Full name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            fullWidth
            autoFocus
            sx={authFieldSx}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            fullWidth
            autoComplete="email"
            placeholder="you@company.com"
            sx={authFieldSx}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            fullWidth
            autoComplete="new-password"
            helperText="Minimum 10 characters"
            sx={authFieldSx}
          />
          <TextField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            fullWidth
            autoComplete="new-password"
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
              "Create account"
            )}
          </Button>

          <Typography
            sx={{ textAlign: "center", fontSize: "0.85rem", color: TEXT_MUTED }}
          >
            Already have an account?{" "}
            <Link to="/login" style={{ ...authLinkSx, fontSize: "0.85rem" }}>
              Sign in
            </Link>
          </Typography>
        </Stack>
      </Stack>
    </AuthShell>
  );
}

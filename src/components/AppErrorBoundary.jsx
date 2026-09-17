import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // SPA-safe fallback: do not trigger a browser reload.
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          p: 3,
          bgcolor: "#F6F7FB",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 560,
            p: 4,
            border: "1px solid #E2E8F0",
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" fontWeight={800} gutterBottom>
            We couldn't load this page
          </Typography>

          <Alert severity="error" sx={{ mb: 2 }}>
            Something went wrong while opening this page. Your saved work and
            account are not affected by this message.
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please try reloading the page. If the problem continues, go back and
            try the action again or contact your administrator.
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button variant="contained" onClick={this.handleGoBack}>
              Reload page
            </Button>
            <Button variant="outlined" onClick={this.handleGoBack}>
              Go back
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
}

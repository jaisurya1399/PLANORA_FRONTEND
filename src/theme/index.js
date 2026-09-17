import { createTheme } from "@mui/material/styles";

import {
  BORDER,
  CANVAS_BACKGROUND,
  ELEVATION_SHADOW,
  MOTION,
  PRIMARY,
  PRIMARY_HOVER,
  RADIUS,
  SEMANTIC_COLORS,
  SHADOW,
  SURFACE,
  SURFACE_SUBTLE,
  TEXT_FAINT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TOPBAR,
} from "./colors";

// Reads the CURRENT (live) values of the tokens above and builds a fresh
// MUI theme from them. Call this again after applyPalette() switches the
// active mood theme — the imports above are live bindings, so by the time
// this function runs it always sees the latest colors.
export function buildTheme() {
  return createTheme({
    palette: {
      mode: "light",
      primary: {
        main: PRIMARY,
        dark: PRIMARY_HOVER,
        light: "#8B8DF0",
        contrastText: "#FFFFFF",
      },
      secondary: { main: "#C8A15A", contrastText: "#17213D" },
      success: { main: SEMANTIC_COLORS.success.main },
      info: { main: SEMANTIC_COLORS.info.main },
      warning: { main: SEMANTIC_COLORS.warning.main },
      error: { main: SEMANTIC_COLORS.error.main },
      background: { default: CANVAS_BACKGROUND, paper: SURFACE },
      text: {
        primary: TEXT_PRIMARY,
        secondary: TEXT_SECONDARY,
        disabled: TEXT_FAINT,
      },
      divider: BORDER,
    },
    typography: {
      fontFamily:
        '"Inter", "Inter var", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      h1: {
        fontSize: "1.875rem",
        lineHeight: 1.22,
        fontWeight: 760,
        letterSpacing: "-0.03em",
      },
      h2: {
        fontSize: "1.5rem",
        lineHeight: 1.28,
        fontWeight: 760,
        letterSpacing: "-0.025em",
      },
      h3: {
        fontSize: "1.25rem",
        lineHeight: 1.32,
        fontWeight: 720,
        letterSpacing: "-0.015em",
      },
      h4: { fontSize: "1.125rem", lineHeight: 1.4, fontWeight: 700 },
      h5: { fontSize: "1rem", lineHeight: 1.45, fontWeight: 700 },
      h6: { fontSize: "0.9375rem", lineHeight: 1.45, fontWeight: 700 },
      body1: {
        fontSize: "0.9375rem",
        lineHeight: 1.6,
        letterSpacing: "-0.006em",
      },
      body2: {
        fontSize: "0.8125rem",
        lineHeight: 1.55,
        letterSpacing: "-0.003em",
      },
      button: {
        fontSize: "0.8125rem",
        fontWeight: 650,
        letterSpacing: "-0.006em",
      },
      caption: { fontSize: "0.75rem", lineHeight: 1.45 },
      overline: {
        fontSize: "0.6875rem",
        fontWeight: 720,
        letterSpacing: "0.06em",
      },
    },
    shape: { borderRadius: RADIUS.card },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { backgroundColor: CANVAS_BACKGROUND },
          body: {
            backgroundColor: CANVAS_BACKGROUND,
            color: TEXT_PRIMARY,
            minWidth: 320,
          },
          "::selection": { backgroundColor: "#BFDBFE" },
          "::-webkit-scrollbar": { width: 9, height: 9 },
          "::-webkit-scrollbar-thumb": {
            background: "#B9C3D8",
            borderRadius: 8,
            border: "2px solid transparent",
            backgroundClip: "padding-box",
          },
          "::-webkit-scrollbar-thumb:hover": { background: "#8B96B0" },
          "::-webkit-scrollbar-track": { background: "transparent" },
          "*:focus-visible": {
            outline: `2px solid ${PRIMARY}`,
            outlineOffset: 2,
            borderRadius: 4,
            transition: `outline-offset ${MOTION.fast} ${MOTION.easing}`,
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
              scrollBehavior: "auto !important",
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: PRIMARY,
            fontWeight: 600,
            textUnderlineOffset: "3px",
            "&:hover": { color: PRIMARY_HOVER },
          },
        },
      },
      MuiIconButton: {
        defaultProps: { size: "medium" },
        styleOverrides: { root: { minWidth: 40, minHeight: 40 } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: 38,
            textTransform: "none",
            borderRadius: RADIUS.button,
            fontWeight: 650,
            paddingInline: 16,
            transition: `background-color ${MOTION.base} ${MOTION.easing}, border-color ${MOTION.base} ${MOTION.easing}, box-shadow ${MOTION.base} ${MOTION.easing}, transform ${MOTION.fast} ${MOTION.easingOut}`,
            "&:active": { transform: "translateY(1px) scale(0.99)" },
          },
          containedPrimary: {
            boxShadow: "0 1px 2px rgba(29,78,216,.18)",
            "&:hover": {
              boxShadow: "0 6px 16px rgba(29,78,216,.24)",
              transform: "translateY(-1px)",
            },
            "&:active": { transform: "translateY(0) scale(0.99)" },
          },
          outlined: {
            borderColor: BORDER,
            backgroundColor: SURFACE,
            "&:hover": {
              borderColor: "#A9B4C8",
              backgroundColor: SURFACE_SUBTLE,
            },
          },
          text: {
            "&:hover": { backgroundColor: SURFACE_SUBTLE },
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: "small", variant: "outlined" },
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: RADIUS.input,
              backgroundColor: SURFACE,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS.input,
            "& fieldset": { borderColor: BORDER },
            "&:hover fieldset": { borderColor: "#94A3B8" },
            "&.Mui-focused fieldset": { borderWidth: 1.5 },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontWeight: 550, color: TEXT_SECONDARY },
        },
      },
      MuiSelect: { styleOverrides: { select: { minHeight: "unset" } } },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS.card,
            border: `1px solid ${BORDER}`,
            boxShadow:
              "0 1px 2px rgba(16,24,40,.03), 0 8px 24px rgba(16,24,40,.035)",
            backgroundImage: "none",
            overflow: "hidden",
            transition: `box-shadow ${MOTION.base} ${MOTION.easing}, border-color ${MOTION.base} ${MOTION.easing}, transform ${MOTION.base} ${MOTION.easingOut}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none", borderRadius: RADIUS.panel },
          elevation1: { boxShadow: ELEVATION_SHADOW },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            minHeight: 28,
            height: 28,
            borderRadius: RADIUS.chip,
            fontWeight: 650,
            transition: `background-color ${MOTION.fast} ${MOTION.easing}, box-shadow ${MOTION.fast} ${MOTION.easing}`,
          },
          label: { paddingInline: 9 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: RADIUS.dialog,
            border: `1px solid ${BORDER}`,
            boxShadow: SHADOW.lg,
            backgroundImage: "none",
            margin: 16,
            maxHeight: "calc(100% - 32px)",
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { padding: "20px 24px 12px", fontWeight: 750 },
        },
      },
      MuiDialogContent: {
        styleOverrides: { root: { padding: "12px 24px 20px" } },
      },
      MuiDialogActions: {
        styleOverrides: { root: { padding: "12px 24px 20px", gap: 8 } },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            border: `1px solid ${BORDER}`,
            borderRadius: RADIUS.card,
            backgroundColor: SURFACE,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: BORDER, padding: "13px 14px" },
          head: {
            backgroundColor: "#F8F9FC",
            color: TEXT_SECONDARY,
            fontWeight: 720,
            fontSize: "0.75rem",
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: `background-color ${MOTION.fast} ${MOTION.easing}`,
            "&:last-child td": { borderBottom: 0 },
            "&:hover": { backgroundColor: "#F8F9FC" },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 44 },
          indicator: { height: 2.5, borderRadius: 3 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 44,
            textTransform: "none",
            fontWeight: 650,
            fontSize: "0.8125rem",
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: RADIUS.card, alignItems: "flex-start" },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { fontSize: 12, borderRadius: 6, padding: "7px 10px" },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: TOPBAR.background,
            borderBottom: `1px solid ${TOPBAR.border}`,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${BORDER}`,
            boxShadow: SHADOW.md,
            borderRadius: 12,
            marginTop: 6,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            minHeight: 40,
            borderRadius: 8,
            margin: "2px 4px",
            transition: `background-color ${MOTION.fast} ${MOTION.easing}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            transition: `background-color ${MOTION.fast} ${MOTION.easing}, color ${MOTION.fast} ${MOTION.easing}, border-color ${MOTION.base} ${MOTION.easing}`,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 999, height: 6 },
        },
      },
    },
  });
}

const theme = buildTheme();
export default theme;

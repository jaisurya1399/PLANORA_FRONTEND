import { Box, Card, CardContent, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const TONES = {
  primary: {
    bg: "linear-gradient(135deg, rgba(91,92,226,.14), rgba(91,92,226,.03))",
    fg: "var(--pm-primary)",
  },
  success: {
    bg: "linear-gradient(135deg, rgba(21,128,61,.14), rgba(21,128,61,.03))",
    fg: "#15803D",
  },
  warning: {
    bg: "linear-gradient(135deg, rgba(180,83,9,.14), rgba(180,83,9,.03))",
    fg: "#B45309",
  },
  danger: {
    bg: "linear-gradient(135deg, rgba(185,28,28,.14), rgba(185,28,28,.03))",
    fg: "#B91C1C",
  },
  neutral: {
    bg: "linear-gradient(135deg, rgba(100,116,139,.14), rgba(100,116,139,.03))",
    fg: "#475569",
  },
};

/**
 * Premium stat card: value + trend/hint, a soft gradient icon badge, and an
 * optional click-through. Used on every dashboard so metrics read
 * consistently across admin and workspace.
 */
export default function MetricCard({
  title,
  value,
  icon,
  tone = "primary",
  hint,
  path,
}) {
  const navigate = useNavigate();
  const t = TONES[tone] || TONES.primary;
  return (
    <Card
      className="pm-hover-lift"
      onClick={() => path && navigate(path)}
      sx={{
        height: "100%",
        cursor: path ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: t.fg,
          opacity: 0.85,
        }}
      />
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: 11,
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                mt: 0.75,
                fontSize: 32,
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: "-.03em",
              }}
            >
              {value}
            </Typography>
            {hint && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                {hint}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 46,
              height: 46,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: 2.5,
              background: t.bg,
              color: t.fg,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

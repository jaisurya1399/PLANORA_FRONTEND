import { Box, Typography } from "@mui/material";

/**
 * A compact circular progress indicator with the percentage centered
 * inside. Used to show "share active" style metrics without leaning on
 * flat linear progress bars everywhere.
 */
export default function ProgressRing({
  value = 0,
  size = 88,
  stroke = 9,
  color = "var(--pm-primary)",
  label,
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--pm-border)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: "stroke-dashoffset 500ms cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </svg>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: size * 0.24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            {Math.round(clamped)}%
          </Typography>
        </Box>
      </Box>
      {label && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 650, textAlign: "center" }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
}

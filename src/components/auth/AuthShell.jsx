import { Box, Divider, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import {
  AUTH_KEYFRAMES,
  CARD,
  DISPLAY_FONT,
  GOLD,
  HAIRLINE,
  INK,
  PAPER,
  SLATE,
  UI_FONT,
} from "./authTokens";

/* ---------------------------------------------------------
   Night panel — quiet, premium dusk backdrop for the branding side
--------------------------------------------------------- */
export function NightScene() {
  const stars = [
    { cx: 70, cy: 60, r: 1.2, d: 0 },
    { cx: 160, cy: 36, r: 0.9, d: 0.9 },
    { cx: 230, cy: 84, r: 1.3, d: 1.7 },
    { cx: 310, cy: 48, r: 1, d: 0.5 },
    { cx: 366, cy: 110, r: 1.1, d: 2.2 },
    { cx: 110, cy: 140, r: 0.9, d: 1.3 },
    { cx: 335, cy: 168, r: 1.2, d: 2.6 },
  ];
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox="0 0 420 420"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="lpGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.55" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lpBg" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor={INK} />
            <stop offset="100%" stopColor={SLATE} />
          </linearGradient>
        </defs>

        <rect width="420" height="420" fill="url(#lpBg)" />

        {stars.map((s, i) => (
          <circle
            key={i}
            className="lp-anim"
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="#EDE9DF"
            style={{ animation: `twinkle 8s ease-in-out ${s.d}s infinite` }}
          />
        ))}

        <circle
          className="lp-anim"
          cx="210"
          cy="150"
          r="110"
          fill="url(#lpGlow)"
          style={{ animation: "breathe 10s ease-in-out 1.6s infinite" }}
        />
        <circle
          className="lp-anim"
          cx="210"
          cy="150"
          r="24"
          fill={GOLD}
          style={{
            transformOrigin: "210px 150px",
            animation: "glowIn 1.6s cubic-bezier(0.16,1,0.3,1) 0.3s both",
          }}
        />

        <path
          className="lp-anim"
          d="M 100 210 A 115 115 0 0 1 320 210"
          fill="none"
          stroke="rgba(200,161,90,0.25)"
          strokeWidth="1"
          strokeDasharray="420"
          strokeDashoffset="420"
          style={{ animation: "arcIn 2.4s ease-out 0.3s forwards" }}
        />
        <line
          className="lp-anim"
          x1="0"
          y1="210"
          x2="420"
          y2="210"
          stroke="rgba(200,161,90,0.35)"
          strokeWidth="1"
          style={{
            transformOrigin: "center",
            transform: "scaleX(0)",
            animation: "lineIn 1.2s ease-out 1.5s forwards",
          }}
        />
      </svg>
    </Box>
  );
}

/* ---------------------------------------------------------
   PlanoraMark — premium gold monogram
--------------------------------------------------------- */
export function PlanoraMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden>
      <defs>
        <linearGradient id="pmGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5D78E" />
          <stop offset="50%" stopColor={GOLD} />
          <stop offset="100%" stopColor="#8C6D1F" />
        </linearGradient>
      </defs>
      <circle
        cx="17"
        cy="17"
        r="15.5"
        stroke="url(#pmGold)"
        strokeWidth="1.6"
      />
      <circle
        cx="17"
        cy="17"
        r="12.5"
        stroke={GOLD}
        strokeWidth="0.6"
        opacity="0.45"
      />
      <g stroke="url(#pmGold)" fill="none" strokeLinecap="round">
        <path d="M 12 24 L 12 10" strokeWidth="2.4" />
        <path
          d="M 12 10.5 C 19 9, 22 12, 22 15.5 C 22 19, 19 21, 12 20"
          strokeWidth="2.4"
        />
        <path
          d="M 12 19 C 15.5 18.5, 17.5 20, 17.5 22.5"
          strokeWidth="1.5"
          opacity="0.85"
        />
      </g>
      <path
        d="M 26 7 L 27 9.5 L 29.5 10.5 L 27 11.5 L 26 14 L 25 11.5 L 22.5 10.5 L 25 9.5 Z"
        fill="#F5D78E"
      />
    </svg>
  );
}

/**
 * AuthShell — the split-screen frame every auth page sits inside.
 * Left: animated night panel with brand mark + a headline/description
 * you customize per page. Right: centered form card (your children).
 */
export default function AuthShell({
  headline = "Plan today.",
  highlight = "Rise tomorrow.",
  description = "Every milestone, priority, and deadline — laid out where you can see the whole horizon.",
  children,
  errorKey,
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const reveal = (delay) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 0.42s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.42s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        backgroundColor: PAPER,
        fontFamily: UI_FONT,
      }}
    >
      <style>{AUTH_KEYFRAMES}</style>

      {/* NIGHT PANEL */}
      <Box
        sx={{
          position: "relative",
          width: { xs: "100%", md: "42%" },
          minHeight: { xs: 260, sm: 300, md: "100vh" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          px: { xs: 4, sm: 6, md: 7 },
          py: { xs: 4, sm: 5, md: 7 },
          overflow: "hidden",
        }}
      >
        <NightScene />
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: 1.3,
            ...reveal(0),
          }}
        >
          <PlanoraMark />
          <Typography
            sx={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 500,
              fontSize: "1.35rem",
              color: PAPER,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
            }}
          >
            Planora
          </Typography>
        </Box>
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            ...reveal(0.12),
            pb: { xs: 0, md: 4 },
          }}
        >
          <Typography
            sx={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 400,
              fontSize: { xs: "1.35rem", sm: "1.6rem", md: "2rem" },
              lineHeight: 1.3,
              color: PAPER,
              maxWidth: 340,
              letterSpacing: "-0.01em",
            }}
          >
            {headline}{" "}
            <Box component="span" sx={{ fontStyle: "italic", color: GOLD }}>
              {highlight}
            </Box>
          </Typography>
          <Divider
            sx={{
              my: { xs: 1.5, md: 2.5 },
              width: 48,
              borderColor: "rgba(200,161,90,0.5)",
            }}
          />
          <Typography
            sx={{
              fontSize: "0.85rem",
              lineHeight: 1.7,
              color: "rgba(247,246,242,0.55)",
              maxWidth: 300,
              display: { xs: "none", sm: "block" },
            }}
          >
            {description}
          </Typography>
        </Box>
      </Box>

      {/* FORM PANEL */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "center",
          px: { xs: 2.5, sm: 6 },
          py: { xs: 4, sm: 6, md: 4 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 420, mx: "auto" }}>
          <Box
            key={errorKey}
            sx={{
              backgroundColor: CARD,
              border: `1px solid ${HAIRLINE}`,
              borderRadius: { xs: 2.5, sm: 3 },
              px: { xs: 2.5, sm: 5 },
              py: { xs: 3.5, sm: 5 },
              boxShadow:
                "0 1px 2px rgba(16,18,35,0.04), 0 12px 40px rgba(16,18,35,0.07)",
              animation: errorKey ? "shake 0.45s ease" : "none",
              ...(errorKey ? {} : reveal(0.1)),
            }}
          >
            {children}
          </Box>
          <Typography
            sx={{
              mt: 3,
              textAlign: "center",
              fontSize: "0.75rem",
              color: "rgba(113,114,127,0.7)",
              ...reveal(0.4),
            }}
          >
            Protected by enterprise-grade security.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

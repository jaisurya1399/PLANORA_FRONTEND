/* ---------------------------------------------------------
   PlanoraLogo — reusable premium brand logo component
   Matches the golden metallic emblem: bold "P" with elegant
   leg + four-pointed star, inside thick double golden ring.
   Use on any page: <PlanoraLogo /> or <PlanoraLogo size={40} showText />
--------------------------------------------------------- */
import { Box, Typography } from "@mui/material";

const GOLD = "#C8A15A";
const PAPER = "#F7F6F2";
const DISPLAY_FONT = "'Fraunces', Georgia, serif";

/* ---------------------------------------------------------
   Icon only — golden metallic "P" emblem (matches brand image)
--------------------------------------------------------- */
export function PlanoraMark({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
    >
      <defs>
        {/* gold gradient matching metallic sheen */}
        <linearGradient id="plGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9E7A0" />
          <stop offset="35%" stopColor="#E9C766" />
          <stop offset="60%" stopColor="#C8A15A" />
          <stop offset="100%" stopColor="#9A742B" />
        </linearGradient>
        <linearGradient id="plGoldDeep" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F2D98C" />
          <stop offset="100%" stopColor="#B8893B" />
        </linearGradient>
      </defs>

      {/* thick outer ring + thin inner ring */}
      <circle cx="60" cy="60" r="54" fill="url(#plGold)" />
      <circle
        cx="60"
        cy="60"
        r="45.5"
        fill="#101223"
        stroke="url(#plGoldDeep)"
        strokeWidth="1.4"
      />

      {/* bold P: thick stem with rounded ends */}
      <g fill="none" stroke="url(#plGold)" strokeLinecap="round">
        <path d="M 44 88 L 44 34" strokeWidth="10" />
        {/* upper bowl — wide elegant loop */}
        <path
          d="M 44 34 C 72 30, 86 40, 86 52 C 86 65, 71 72, 46 70"
          strokeWidth="10"
        />
        {/* lower elegant leg sweeping right, tapering */}
        <path
          d="M 46 70 C 62 70, 72 76, 72 86 C 72 91, 68 95, 63 95"
          strokeWidth="7"
        />
      </g>

      {/* four-pointed star, upper right */}
      <path
        d="M 82 26 L 84.5 33.5 L 92 36 L 84.5 38.5 L 82 46 L 79.5 38.5 L 72 36 L 79.5 33.5 Z"
        fill="url(#plGold)"
      />
    </svg>
  );
}

/* ---------------------------------------------------------
   Full logo — icon + wordmark, light & dark variants
--------------------------------------------------------- */
export default function PlanoraLogo({
  size = 34,
  dark = false, // dark = for dark backgrounds (gold/cream), light = for white pages (ink)
  showText = true,
  textSize = "1.35rem",
  gap = 1.3,
}) {
  const textColor = dark ? PAPER : "#101223";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap }}>
      <PlanoraMark size={size} />
      {showText && (
        <Typography
          sx={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 500,
            fontSize: textSize,
            color: textColor,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
          }}
        >
          Planora
        </Typography>
      )}
    </Box>
  );
}

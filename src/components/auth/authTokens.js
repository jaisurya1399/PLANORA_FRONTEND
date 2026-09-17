/* ---------------------------------------------------------
   Shared design tokens — refined, editorial, used across
   every auth screen (login, signup, password reset, MFA...)

   These are plain constants/functions, not components, so they
   live in their own module. Keeping them in the same file as
   AuthShell would break React Fast Refresh, since a file that
   mixes component and non-component exports can't be hot-reloaded
   as a component.
--------------------------------------------------------- */
export const INK = "#101223";
export const SLATE = "#1C1F33";
export const GOLD = "#C8A15A";
export const GOLD_SOFT = "rgba(200,161,90,0.16)";
export const PAPER = "#F7F6F2";
export const CARD = "#FFFFFF";
export const TEXT_INK = "#181A2E";
export const TEXT_MUTED = "#71727F";
export const HAIRLINE = "rgba(24,26,46,0.10)";
export const DISPLAY_FONT = "'Fraunces', Georgia, serif";
export const UI_FONT = "'Inter', 'Work Sans', system-ui, sans-serif";

export const AUTH_KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@400;500;600&display=swap');
  @keyframes glowIn {
    0%   { opacity: 0; transform: scale(0.75); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes arcIn {
    to { stroke-dashoffset: 0; }
  }
  @keyframes lineIn {
    to { transform: scaleX(1); }
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0.1; }
    50%      { opacity: 0.55; }
  }
  @keyframes breathe {
    0%, 100% { transform: scale(1);    opacity: 0.35; }
    50%      { transform: scale(1.08); opacity: 0.55; }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(5px); }
    60%      { transform: translateX(-3px); }
    80%      { transform: translateX(2px); }
  }
  @keyframes popIn {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.12); }
    100% { transform: scale(1);   opacity: 1; }
  }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-text-fill-color: ${TEXT_INK};
    -webkit-box-shadow: 0 0 0 1000px #FCFBF9 inset;
    transition: background-color 9999s ease-in-out 0s;
    caret-color: ${TEXT_INK};
  }
  @media (prefers-reduced-motion: reduce) {
    .lp-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
  }
`;

/* ---------------------------------------------------------
   Shared premium text field styling
--------------------------------------------------------- */
export const authFieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#FCFBF9",
    borderRadius: 1.5,
    fontFamily: UI_FONT,
    fontSize: "0.95rem",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
    "& fieldset": { borderColor: HAIRLINE },
    "&:hover fieldset": { borderColor: "rgba(24,26,46,0.22)" },
    "&.Mui-focused fieldset": {
      borderColor: GOLD,
      borderWidth: 1,
      boxShadow: "0 0 0 3px " + GOLD_SOFT,
    },
    "& .MuiInputBase-input": {
      py: 1.75,
      minHeight: 52,
      boxSizing: "border-box",
    },
  },
  "& .MuiInputLabel-root": {
    color: TEXT_MUTED,
    fontFamily: UI_FONT,
    fontSize: "0.9rem",
  },
  "& .MuiInputLabel-root.Mui-focused": { color: SLATE },
};

/* Shared "ink" primary button look used on every auth form. */
export const authButtonSx = (success) => ({
  height: 48,
  borderRadius: 1.5,
  fontSize: "0.95rem",
  fontWeight: 600,
  textTransform: "none",
  letterSpacing: "0.01em",
  fontFamily: UI_FONT,

  // Normal
  backgroundColor: INK,
  color: PAPER,

  boxShadow: "none",
  mt: 0.5,

  transition:
    "background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",

  // Hover: swap background and text colors
  "&:hover": {
    backgroundColor: PAPER,
    color: INK,
    boxShadow: "0 4px 12px rgba(16, 18, 35, 0.12)",
    transform: "translateY(-1px)",
  },

  // Click
  "&:active": {
    backgroundColor: "#E9E8E3",
    color: INK,
    boxShadow: "none",
    transform: "translateY(0)",
  },

  // Focus
  "&:focus-visible": {
    backgroundColor: PAPER,
    color: INK,
    boxShadow: `0 0 0 3px ${GOLD_SOFT}`,
    outline: `2px solid ${GOLD}`,
    outlineOffset: "2px",
  },

  // Disabled
  "&.Mui-disabled": {
    backgroundColor: success ? "#005f36" : "rgba(16,18,35,0.35)",
    color: PAPER,
    boxShadow: "none",
    transform: "none",
    opacity: 1,
  },
});

export const authLinkSx = {
  color: SLATE,
  textDecoration: "none",
  fontWeight: 600,
  borderBottom: "1px solid rgba(28,31,51,0.3)",
  paddingBottom: 1,
};

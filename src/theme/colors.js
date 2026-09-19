// Central design tokens for the application.
//
// Two kinds of tokens live here:
// 1. MOOD tokens (brand color, surfaces, borders, text, sidebar/topbar,
//    radius, shadow) — these change when the user switches the app theme
//    (Elevated light / Dark modern / Minimal luxury). They are declared
//    with `let` (or, for objects, mutated in place) so that every module
//    that imported them gets the live, current value via ES module live
//    bindings — no need to re-import or re-render to "see" a theme change,
//    as long as the consuming component re-renders at some point after
//    applyPalette() runs (the layouts force this on switch).
// 2. SEMANTIC tokens (status/priority/issue-type/success-warning-error) —
//    these stay constant across every theme so meaning never shifts.
import { DEFAULT_PALETTE_KEY, PALETTES } from "./palettes";

export let PRIMARY = PALETTES[DEFAULT_PALETTE_KEY].PRIMARY;
export let PRIMARY_HOVER = PALETTES[DEFAULT_PALETTE_KEY].PRIMARY_HOVER;
export let PRIMARY_SUBTLE = PALETTES[DEFAULT_PALETTE_KEY].PRIMARY_SUBTLE;
export let PRIMARY_TINT = PALETTES[DEFAULT_PALETTE_KEY].PRIMARY_TINT;
export let SECONDARY = PALETTES[DEFAULT_PALETTE_KEY].SECONDARY;
export let ACCENT_PURPLE = PALETTES[DEFAULT_PALETTE_KEY].ACCENT_PURPLE;
export let PRIMARY_LIGHT = PALETTES[DEFAULT_PALETTE_KEY].PRIMARY_LIGHT;
export let SECONDARY_CONTRAST =
  PALETTES[DEFAULT_PALETTE_KEY].SECONDARY_CONTRAST;
export let INPUT_HOVER_BORDER =
  PALETTES[DEFAULT_PALETTE_KEY].INPUT_HOVER_BORDER;
export let BUTTON_SHADOW = PALETTES[DEFAULT_PALETTE_KEY].BUTTON_SHADOW;
export let BUTTON_HOVER_SHADOW =
  PALETTES[DEFAULT_PALETTE_KEY].BUTTON_HOVER_SHADOW;
export let SELECTION_BACKGROUND =
  PALETTES[DEFAULT_PALETTE_KEY].SELECTION_BACKGROUND;
export let SCROLLBAR_THUMB = PALETTES[DEFAULT_PALETTE_KEY].SCROLLBAR_THUMB;
export let SCROLLBAR_THUMB_HOVER =
  PALETTES[DEFAULT_PALETTE_KEY].SCROLLBAR_THUMB_HOVER;

export let CANVAS_BACKGROUND = PALETTES[DEFAULT_PALETTE_KEY].CANVAS_BACKGROUND;
export let SURFACE = PALETTES[DEFAULT_PALETTE_KEY].SURFACE;
export let SURFACE_SUBTLE = PALETTES[DEFAULT_PALETTE_KEY].SURFACE_SUBTLE;
export let BORDER = PALETTES[DEFAULT_PALETTE_KEY].BORDER;
export let BORDER_STRONG = PALETTES[DEFAULT_PALETTE_KEY].BORDER_STRONG;

export let TEXT_PRIMARY = PALETTES[DEFAULT_PALETTE_KEY].TEXT_PRIMARY;
export let TEXT_SECONDARY = PALETTES[DEFAULT_PALETTE_KEY].TEXT_SECONDARY;
export let TEXT_FAINT = PALETTES[DEFAULT_PALETTE_KEY].TEXT_FAINT;

// Semantic tokens: intentionally NOT theme-dependent. Success is always
// green, danger always red, etc., regardless of which mood theme is active.
export const SEMANTIC_COLORS = {
  success: { main: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
  info: { main: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  warning: { main: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  error: { main: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
  neutral: { main: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
  critical: { main: "#C2410C", bg: "#FFF7ED", border: "#FED7AA" },
};

export const STATUS_COLORS = {
  TODO: { bg: "#F1F5F9", text: "#475569" },
  IN_PROGRESS: { bg: "#EFF6FF", text: "#1D4ED8" },
  DONE: { bg: "#F0FDF4", text: "#15803D" },
  COMPLETED: { bg: "#F0FDF4", text: "#15803D" },
  PENDING: { bg: "#FFFBEB", text: "#B45309" },
  FAILED: { bg: "#FEF2F2", text: "#B91C1C" },
  OVERDUE: { bg: "#FFF7ED", text: "#C2410C" },
  DRAFT: { bg: "#F8FAFC", text: "#64748B" },
};

export const PRIORITY_COLORS = {
  HIGHEST: "#B91C1C",
  HIGH: "#C2410C",
  MEDIUM: "#B45309",
  LOW: "#2563EB",
  LOWEST: "#64748B",
};

export const ISSUE_TYPE_COLORS = {
  STORY: "#15803D",
  TASK: "#1D4ED8",
  BUG: "#B91C1C",
  EPIC: "#6366F1",
  SUBTASK: "#2563EB",
};

// Objects: keep the same reference forever, just mutate properties in
// applyPalette(). Anything that destructures `TOPBAR.background` etc. at
// render time will always see the latest value.
export const TOPBAR = {
  ...PALETTES[DEFAULT_PALETTE_KEY].TOPBAR,
  textPrimary: TEXT_PRIMARY,
  iconSecondary: TEXT_SECONDARY,
};
export const SIDEBAR = { ...PALETTES[DEFAULT_PALETTE_KEY].SIDEBAR };
export const RADIUS = { ...PALETTES[DEFAULT_PALETTE_KEY].RADIUS };
export const SHADOW = { ...PALETTES[DEFAULT_PALETTE_KEY].SHADOW };
export let ELEVATION_SHADOW = PALETTES[DEFAULT_PALETTE_KEY].ELEVATION_SHADOW;

export const MOTION = {
  fast: "140ms",
  base: "200ms",
  slow: "320ms",
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  easingOut: "cubic-bezier(0, 0, 0.2, 1)",
};

export const THEME_STORAGE_KEY = "planora-theme";

// Applies a named palette: updates every mood token above (live bindings +
// in-place object mutation) and pushes the matching CSS variables onto
// <html data-theme="..."> so global.css can react without any JS re-render.
// Returns true if applied, false if the key is unknown.
export function applyPalette(key) {
  const palette = PALETTES[key];
  if (!palette) return false;

  PRIMARY = palette.PRIMARY;
  PRIMARY_HOVER = palette.PRIMARY_HOVER;
  PRIMARY_SUBTLE = palette.PRIMARY_SUBTLE;
  PRIMARY_TINT = palette.PRIMARY_TINT;
  SECONDARY = palette.SECONDARY;
  ACCENT_PURPLE = palette.ACCENT_PURPLE;
  PRIMARY_LIGHT = palette.PRIMARY_LIGHT;
  SECONDARY_CONTRAST = palette.SECONDARY_CONTRAST;
  INPUT_HOVER_BORDER = palette.INPUT_HOVER_BORDER;
  BUTTON_SHADOW = palette.BUTTON_SHADOW;
  BUTTON_HOVER_SHADOW = palette.BUTTON_HOVER_SHADOW;
  SELECTION_BACKGROUND = palette.SELECTION_BACKGROUND;
  SCROLLBAR_THUMB = palette.SCROLLBAR_THUMB;
  SCROLLBAR_THUMB_HOVER = palette.SCROLLBAR_THUMB_HOVER;

  CANVAS_BACKGROUND = palette.CANVAS_BACKGROUND;
  SURFACE = palette.SURFACE;
  SURFACE_SUBTLE = palette.SURFACE_SUBTLE;
  BORDER = palette.BORDER;
  BORDER_STRONG = palette.BORDER_STRONG;

  TEXT_PRIMARY = palette.TEXT_PRIMARY;
  TEXT_SECONDARY = palette.TEXT_SECONDARY;
  TEXT_FAINT = palette.TEXT_FAINT;

  Object.assign(TOPBAR, palette.TOPBAR, {
    textPrimary: TEXT_PRIMARY,
    iconSecondary: TEXT_SECONDARY,
  });
  Object.assign(SIDEBAR, palette.SIDEBAR);
  Object.assign(RADIUS, palette.RADIUS);
  Object.assign(SHADOW, palette.SHADOW);
  ELEVATION_SHADOW = palette.ELEVATION_SHADOW;

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = key;
    const root = document.documentElement.style;
    Object.entries(palette.cssVars).forEach(([varName, value]) => {
      root.setProperty(varName, value);
    });
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, key);
    } catch {
      // Storage can be unavailable (private mode, quota) — theme still
      // applies for this session, it just won't persist.
    }
  }
  return true;
}

export function getStoredPaletteKey() {
  if (typeof window === "undefined") return DEFAULT_PALETTE_KEY;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored && PALETTES[stored] ? stored : DEFAULT_PALETTE_KEY;
  } catch {
    return DEFAULT_PALETTE_KEY;
  }
}

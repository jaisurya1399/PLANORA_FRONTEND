// Single source of truth for the brand accent used across the sidebar,
// topbar avatar ring, and the MUI theme's primary color. Change it here
// once instead of editing multiple components.
//
// The FULL Jira design-token set (status/priority/issue-type colors,
// surface/border/text colors, top bar/sidebar tokens, radius, shadow)
// lives in ./colors.js — that file is the single source of truth for all
// future work. This file re-exports the primary-brand subset under its
// original names so existing imports keep working unchanged.

import { PRIMARY, PRIMARY_HOVER, ELEVATION_SHADOW } from "./colors";

export const ACCENT_START = PRIMARY;
export const ACCENT_END = PRIMARY_HOVER;

// Jira doesn't use gradients for its brand color — this is now a flat
// color, kept as a CSS `background` value so existing
// `background: ACCENT_GRADIENT` usages keep working unchanged.
export const ACCENT_GRADIENT = PRIMARY;

// A restrained, low-opacity elevation shadow instead of a "glow" — matches
// Jira's minimal, border-first elevation style.
export const ACCENT_GLOW = ELEVATION_SHADOW;

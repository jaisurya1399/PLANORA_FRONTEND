import { CssBaseline, ThemeProvider } from "@mui/material";
import { createContext, useContext, useMemo, useState } from "react";

import { applyPalette, getStoredPaletteKey } from "./colors";
import { buildTheme } from "./index";
import { PALETTES } from "./palettes";

const ThemeModeContext = createContext(null);

// Apply the stored (or default) palette synchronously, before first paint,
// so there's no flash of the wrong theme on load.
const initialKey = getStoredPaletteKey();
applyPalette(initialKey);

export function ThemeModeProvider({ children }) {
  const [paletteKey, setPaletteKeyState] = useState(initialKey);
  // Bumped on every switch. Consumers that key a subtree on this value get
  // remounted, which is what makes components that import mood tokens as
  // plain module-level constants (rather than through this hook) pick up
  // the new colors — they simply re-run from scratch.
  const [version, setVersion] = useState(0);

  const muiTheme = useMemo(() => buildTheme(paletteKey), [paletteKey, version]);

  const setPaletteKey = (key) => {
    if (!PALETTES[key] || key === paletteKey) return;
    applyPalette(key);
    setPaletteKeyState(key);
    setVersion((v) => v + 1);
  };

  const options = useMemo(
    () =>
      Object.entries(PALETTES).map(([key, palette]) => ({
        key,
        label: palette.label,
        swatch: palette.swatch,
      })),
    [],
  );

  const value = useMemo(
    () => ({ paletteKey, setPaletteKey, options, version }),
    [paletteKey, version, options],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error("useThemeMode must be used within a ThemeModeProvider");
  }
  return ctx;
}

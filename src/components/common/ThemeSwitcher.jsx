import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { useThemeMode } from "../../theme/ThemeModeContext";

export default function ThemeSwitcher() {
  const { paletteKey, setPaletteKey, options } = useThemeMode();
  const [anchor, setAnchor] = useState(null);

  return (
    <>
      <Tooltip title="Change theme">
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="Change theme"
        >
          <PaletteOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {options.map((opt) => (
          <MenuItem
            key={opt.key}
            selected={opt.key === paletteKey}
            onClick={() => {
              setPaletteKey(opt.key);
              setAnchor(null);
            }}
            sx={{ gap: 1.25, minWidth: 200 }}
          >
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {opt.swatch.map((c, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    bgcolor: c,
                    border: "1px solid rgba(0,0,0,.08)",
                  }}
                />
              ))}
            </Box>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {opt.label}
            </Typography>
            {opt.key === paletteKey && (
              <CheckRoundedIcon fontSize="small" color="primary" />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

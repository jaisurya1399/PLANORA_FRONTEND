import { Box } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar, { DRAWER_WIDTH } from "../components/workspace/Sidebar";
import Topbar from "../components/workspace/Topbar";
import { useThemeMode } from "../theme/ThemeModeContext";

export default function ViewerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { version } = useThemeMode();
  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  return (
    <Box
      key={version}
      sx={{
        display: "flex",
        height: "100dvh",
        minHeight: 0,
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
      <Box
        component="main"
        id="main-content"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Topbar onMenuClick={handleDrawerToggle} />
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            p: { xs: 1.5, sm: 2.5, md: 3.5 },
            "& > *": { minWidth: 0, width: "100%", maxWidth: 1480, mx: "auto" },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

"use client";

import { Box, Tooltip, Typography } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { useEffect, useState } from "react";

//* Sun/moon pill switch. `withLabel` adds a "Dark mode" caption (mobile menu).
const ATTR = "data-mui-color-scheme";
const readDark = () => document.documentElement.getAttribute(ATTR) === "dark";

const ThemeToggle = ({ withLabel = false }: { withLabel?: boolean }) => {
  const { setMode } = useColorScheme();
  const [isDark, setIsDark] = useState(false);

  //* The <html> attribute is the source of truth, so every toggle on the page stays in sync with what is shown
  useEffect(() => {
    setIsDark(readDark());
    const observer = new MutationObserver(() => setIsDark(readDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [ATTR] });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const next = readDark() ? "light" : "dark";
    setMode(next);
    //* Fallback if the provider did not react (e.g. a stale dev hot-reload): apply and persist directly
    requestAnimationFrame(() => {
      if (readDark() !== (next === "dark")) {
        document.documentElement.setAttribute(ATTR, next);
        try {
          localStorage.setItem("mui-mode", next);
        } catch {}
      }
    });
  };

  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  const pill = (
    <Box
      component="button"
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      onClick={toggle}
      sx={{
        position: "relative",
        width: 64,
        height: 32,
        flexShrink: 0,
        borderRadius: 999,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: isDark ? "#0F2A2E" : "var(--pf-peach)",
        cursor: "pointer",
        p: 0,
        transition: "background-color .3s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: "8px",
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
      }}
    >
      <LightModeRoundedIcon sx={{ fontSize: 16, color: "#E8793A", opacity: isDark ? 0.5 : 0 }} />
      <DarkModeRoundedIcon sx={{ fontSize: 16, color: "#3BB8C2", opacity: isDark ? 0 : 0.5 }} />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 24,
          height: 24,
          borderRadius: "50%",
          bgcolor: isDark ? "primary.main" : "secondary.main",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          transform: isDark ? "translateX(32px)" : "translateX(0)",
          transition: "transform .3s cubic-bezier(0.22, 1, 0.36, 1), background-color .3s ease",
          boxShadow: "0 2px 6px rgba(0,0,0,.25)",
        }}
      >
        {isDark ? <DarkModeRoundedIcon sx={{ fontSize: 15 }} /> : <LightModeRoundedIcon sx={{ fontSize: 15 }} />}
      </Box>
    </Box>
  );

  if (withLabel) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, px: 2, py: 1.5 }}>
        <Typography sx={{ fontWeight: 700 }}>Dark mode</Typography>
        {pill}
      </Box>
    );
  }

  return <Tooltip title={label}>{pill}</Tooltip>;
};

export default ThemeToggle;

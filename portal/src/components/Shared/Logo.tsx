"use client";

import { Box, Typography } from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import Link from "next/link";

const Logo = ({ light = false }: { light?: boolean }) => (
  <Box component={Link} href="/" aria-label="Petfinder home" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        bgcolor: light ? "rgba(255,255,255,.15)" : "primary.main",
        color: "#fff",
        transform: "rotate(-12deg)",
        transition: "transform .3s ease",
        "a:hover &": { transform: "rotate(8deg) scale(1.05)" },
      }}
    >
      <PetsIcon sx={{ fontSize: 20 }} />
    </Box>
    <Typography
      component="span"
      sx={{
        fontFamily: "var(--font-heading), sans-serif",
        fontWeight: 800,
        fontSize: 22,
        letterSpacing: "-0.02em",
        color: light ? "#fff" : "primary.main",
      }}
    >
      Petfinder
    </Typography>
  </Box>
);

export default Logo;

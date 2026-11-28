"use client";

import { Box } from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import { Fragment } from "react";

type Props = {
  items: string[];
  //* Seconds for one full loop; larger is slower
  duration?: number;
  reverse?: boolean;
};

//* Endless horizontal strip of short phrases. Pauses on hover; static under prefers-reduced-motion.
const Marquee = ({ items, duration = 40, reverse = false }: Props) => {
  const row = (hidden: boolean) => (
    <Box
      component="ul"
      aria-hidden={hidden || undefined}
      sx={{ display: "flex", alignItems: "center", gap: { xs: 3, md: 5 }, pr: { xs: 3, md: 5 }, m: 0, p: 0, listStyle: "none", flexShrink: 0 }}
    >
      {items.map((item) => (
        <Fragment key={item}>
          <Box component="li" sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontStyle: "italic", fontSize: { xs: 22, md: 32 }, whiteSpace: "nowrap", color: "text.primary" }}>
            {item}
          </Box>
          <Box component="li" aria-hidden sx={{ color: "secondary.main", display: "flex" }}>
            <PetsIcon fontSize="small" />
          </Box>
        </Fragment>
      ))}
    </Box>
  );

  return (
    <Box
      className="pf-marquee"
      sx={{
        overflow: "hidden",
        py: { xs: 2, md: 3 },
        borderBlock: "1px solid",
        borderColor: "divider",
        maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <Box
        className="pf-marquee-track"
        sx={{ display: "flex", width: "max-content", animation: `pf-marquee ${duration}s linear infinite`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {row(false)}
        {row(true)}
      </Box>
    </Box>
  );
};

export default Marquee;

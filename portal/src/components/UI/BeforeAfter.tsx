"use client";

import { Box } from "@mui/material";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import Image from "next/image";
import { useState } from "react";

type Props = {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  alt: string;
  ratio?: string;
};

const label = (text: string, side: "left" | "right") => (
  <Box
    sx={{
      position: "absolute",
      top: 12,
      [side]: 12,
      px: 1.5,
      py: 0.5,
      borderRadius: 999,
      bgcolor: "rgba(30, 27, 24, .65)",
      color: "#fff",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: ".08em",
      textTransform: "uppercase",
      pointerEvents: "none",
    }}
  >
    {text}
  </Box>
);

//* Drag (or use arrow keys on) the handle to compare a rescue photo with a "now" photo.
const BeforeAfter = ({ before, after, beforeLabel = "Rescue day", afterLabel = "Now", alt, ratio = "4 / 3" }: Props) => {
  const [pos, setPos] = useState(50);

  return (
    <Box
      sx={{
        position: "relative",
        aspectRatio: ratio,
        borderRadius: "var(--pf-radius-card)",
        overflow: "hidden",
        bgcolor: "var(--pf-sand)",
        userSelect: "none",
        //* The range input is invisible, so show keyboard focus on the frame
        "&:has(input:focus-visible)": { outline: "3px solid", outlineColor: "primary.main", outlineOffset: 3 },
      }}
    >
      <Image src={after} alt={`${alt} – ${afterLabel}`} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} />
      <Box sx={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={before} alt={`${alt} – ${beforeLabel}`} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} />
      </Box>
      {label(beforeLabel, "left")}
      {label(afterLabel, "right")}

      {/* Divider + handle (visual only; the range input below does the work) */}
      <Box sx={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 2, ml: "-1px", bgcolor: "#fff", pointerEvents: "none" }}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(90deg)",
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: "#fff",
            color: "#1E1B18",
            display: "grid",
            placeItems: "center",
            boxShadow: "var(--pf-shadow)",
          }}
        >
          <UnfoldMoreIcon fontSize="small" />
        </Box>
      </Box>

      <Box
        component="input"
        type="range"
        min={0}
        max={100}
        value={pos}
        aria-label="Compare before and after photos"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPos(Number(e.target.value))}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          m: 0,
          opacity: 0,
          cursor: "ew-resize",
        }}
      />
    </Box>
  );
};

export default BeforeAfter;

"use client";

import { Box } from "@mui/material";
import { ReactNode, useId } from "react";

type Props = {
  //* Repeated around the ring, e.g. "Adopt · Don't shop · "
  text: string;
  size?: number;
  //* Shown in the middle (icon, button or link); stays still while the ring rotates
  children?: ReactNode;
};

//* Rotating ring of text, used as a badge on hero CTAs.
const CircleText = ({ text, size = 140, children }: Props) => {
  const id = useId().replace(/:/g, "");
  const r = 40;

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <Box
        component="svg"
        viewBox="0 0 100 100"
        aria-hidden
        className="pf-spin"
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", color: "text.primary" }}
      >
        <defs>
          <path id={`pf-circle-${id}`} d={`M50,50 m-${r},0 a${r},${r} 0 1,1 ${r * 2},0 a${r},${r} 0 1,1 -${r * 2},0`} />
        </defs>
        <text style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", fill: "currentColor" }}>
          <textPath href={`#pf-circle-${id}`} textLength={2 * Math.PI * r - 2}>
            {text}
          </textPath>
        </text>
      </Box>
      <Box sx={{ position: "absolute", inset: "24%", display: "grid", placeItems: "center" }}>{children}</Box>
      <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {text}
      </Box>
    </Box>
  );
};

export default CircleText;

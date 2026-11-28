"use client";

import { Box } from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";

//* Square thumbnail with a paw fallback (listing images may be empty strings).
const Thumb = ({ src, size = 40, alt = "" }: { src?: string | null; size?: number; alt?: string }) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={size} height={size} style={{ objectFit: "cover", borderRadius: 8, width: size, height: size }} />
  ) : (
    <Box sx={{ width: size, height: size, borderRadius: 2, bgcolor: "action.hover", display: "grid", placeItems: "center", color: "text.secondary" }}>
      <PetsIcon fontSize="small" />
    </Box>
  );

export default Thumb;

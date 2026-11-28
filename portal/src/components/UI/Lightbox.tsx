"use client";

import { Box, Dialog, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Image from "next/image";
import { useEffect } from "react";

export type LightboxImage = { src: string; alt: string; caption?: string };

type Props = {
  images: LightboxImage[];
  //* Index of the open image; null closes the lightbox
  index: number | null;
  onChange: (index: number | null) => void;
};

const navSx = {
  position: "absolute" as const,
  top: "50%",
  transform: "translateY(-50%)",
  bgcolor: "rgba(255,255,255,.12)",
  color: "#fff",
  "&:hover": { bgcolor: "rgba(255,255,255,.24)" },
};

//* Full-screen photo viewer with arrow-key and button navigation. Escape closes (handled by Dialog).
const Lightbox = ({ images, index, onChange }: Props) => {
  const open = index !== null && images.length > 0;
  const current = open ? images[index] : null;
  const go = (step: number) => open && onChange((index + step + images.length) % images.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Dialog
      open={open}
      onClose={() => onChange(null)}
      fullScreen
      aria-label={current?.alt ?? "Photo viewer"}
      PaperProps={{ sx: { bgcolor: "rgba(16, 14, 12, .96)", color: "#fff" } }}
    >
      {current && (
        <Box sx={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}>
            <Typography sx={{ fontSize: 14, opacity: 0.8 }}>
              {index! + 1} / {images.length}
            </Typography>
            <IconButton aria-label="Close" onClick={() => onChange(null)} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ position: "relative", flex: 1, mx: { xs: 1, md: 10 } }}>
            <Image key={current.src} src={current.src} alt={current.alt} fill sizes="100vw" className="pf-fade-up" style={{ objectFit: "contain" }} />
          </Box>
          {current.caption && (
            <Typography sx={{ textAlign: "center", py: 2, px: 2, fontFamily: "var(--font-heading), Georgia, serif", fontStyle: "italic", fontSize: 18 }}>
              {current.caption}
            </Typography>
          )}
          {images.length > 1 && (
            <>
              <IconButton aria-label="Previous photo" onClick={() => go(-1)} sx={{ ...navSx, left: { xs: 8, md: 24 } }}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton aria-label="Next photo" onClick={() => go(1)} sx={{ ...navSx, right: { xs: 8, md: 24 } }}>
                <ChevronRightIcon />
              </IconButton>
            </>
          )}
        </Box>
      )}
    </Dialog>
  );
};

export default Lightbox;

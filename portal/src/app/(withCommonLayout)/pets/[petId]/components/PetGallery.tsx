"use client";

import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import Image from "next/image";
import Lightbox from "@/components/UI/Lightbox";

//* Main photo/video with round "swatch" thumbnails (Pawvelle colour-swatch hero) and a full-screen photo viewer.
//* Photos come first (cover photo at index 0), then videos (PetMedia type VIDEO).
const PetGallery = ({ photos, videos = [], name }: { photos: string[]; videos?: string[]; name: string }) => {
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const items = [...photos.map((src) => ({ src, video: false })), ...videos.map((src) => ({ src, video: true }))];
  const current = items[active];

  const frameSx = {
    position: "relative",
    display: "block",
    width: "100%",
    p: 0,
    border: 0,
    aspectRatio: { xs: "4 / 3.4", md: "16 / 11" },
    borderRadius: "var(--pf-radius-card)",
    overflow: "hidden",
    bgcolor: "var(--pf-sand)",
  } as const;

  return (
    <Box>
      {current?.video ? (
        <Box sx={frameSx}>
          <Box
            component="video"
            key={current.src}
            src={current.src}
            controls
            playsInline
            preload="metadata"
            aria-label={`${name}, video`}
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", bgcolor: "common.black" }}
          />
        </Box>
      ) : (
        <Box
          component="button"
          type="button"
          onClick={() => photos.length && setViewer(active)}
          aria-label={`Open ${name}'s photos full screen`}
          sx={{
            ...frameSx,
            cursor: "zoom-in",
            "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main", outlineOffset: 3 },
          }}
        >
          {current && (
            <Image
              key={current.src}
              src={current.src}
              alt={`${name}, photo ${active + 1}`}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 65vw"
              className="pf-fade-up"
              style={{ objectFit: "cover" }}
            />
          )}
          <IconButton
            component="span"
            aria-hidden
            tabIndex={-1}
            sx={{ position: "absolute", right: 16, bottom: 16, bgcolor: "background.paper", color: "text.primary", pointerEvents: "none" }}
          >
            <OpenInFullIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {items.length > 1 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2, flexWrap: "wrap" }} role="tablist" aria-label="Photos and videos">
          {items.map((item, i) => (
            <Box
              key={item.src}
              component="button"
              role="tab"
              aria-selected={i === active}
              aria-label={item.video ? `Play video ${i - photos.length + 1}` : `Show photo ${i + 1}`}
              onClick={() => setActive(i)}
              sx={(t) => ({
                position: "relative",
                width: 64,
                height: 64,
                borderRadius: "50%",
                overflow: "hidden",
                p: 0,
                border: 0,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                bgcolor: "var(--pf-sand)",
                color: "text.primary",
                boxShadow: i === active ? `0 0 0 3px ${t.vars.palette.background.default}, 0 0 0 5px ${t.vars.palette.secondary.main}` : "none",
                opacity: i === active ? 1 : 0.75,
                transition: "opacity .2s ease, box-shadow .2s ease, transform .2s ease",
                "&:hover": { opacity: 1, transform: "scale(1.05)" },
                "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 6 },
              })}
            >
              {item.video ? <PlayCircleOutlineIcon /> : <Image src={item.src} alt="" fill sizes="64px" style={{ objectFit: "cover" }} />}
            </Box>
          ))}
        </Box>
      )}

      <Lightbox images={photos.map((src, i) => ({ src, alt: `${name}, photo ${i + 1}` }))} index={viewer} onChange={setViewer} />
    </Box>
  );
};

export default PetGallery;

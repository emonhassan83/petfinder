"use client";

import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import Image from "next/image";
import Lightbox from "@/components/UI/Lightbox";

//* Main photo with round "swatch" thumbnails (Pawvelle colour-swatch hero) and a full-screen viewer
const PetGallery = ({ photos, name }: { photos: string[]; name: string }) => {
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const list = photos.length ? photos : [];

  return (
    <Box>
      <Box
        component="button"
        type="button"
        onClick={() => list.length && setViewer(active)}
        aria-label={`Open ${name}'s photos full screen`}
        sx={{
          position: "relative",
          display: "block",
          width: "100%",
          p: 0,
          border: 0,
          cursor: "zoom-in",
          aspectRatio: { xs: "4 / 3.4", md: "16 / 11" },
          borderRadius: "var(--pf-radius-card)",
          overflow: "hidden",
          bgcolor: "var(--pf-sand)",
          "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main", outlineOffset: 3 },
        }}
      >
        {list[active] && (
          <Image
            key={list[active]}
            src={list[active]}
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

      {list.length > 1 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2 }} role="tablist" aria-label="Photos">
          {list.map((src, i) => (
            <Box
              key={src}
              component="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show photo ${i + 1}`}
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
                boxShadow: i === active ? `0 0 0 3px ${t.vars.palette.background.default}, 0 0 0 5px ${t.vars.palette.secondary.main}` : "none",
                opacity: i === active ? 1 : 0.75,
                transition: "opacity .2s ease, box-shadow .2s ease, transform .2s ease",
                "&:hover": { opacity: 1, transform: "scale(1.05)" },
                "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 6 },
              })}
            >
              <Image src={src} alt="" fill sizes="64px" style={{ objectFit: "cover" }} />
            </Box>
          ))}
        </Box>
      )}

      <Lightbox images={list.map((src, i) => ({ src, alt: `${name}, photo ${i + 1}` }))} index={viewer} onChange={setViewer} />
    </Box>
  );
};

export default PetGallery;

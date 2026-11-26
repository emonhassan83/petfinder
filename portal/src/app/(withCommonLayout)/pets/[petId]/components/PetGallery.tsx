"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import Image from "next/image";

//* Main photo with clickable thumbnails
const PetGallery = ({ photos, name }: { photos: string[]; name: string }) => {
  const [active, setActive] = useState(0);
  const list = photos.length ? photos : [];

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          height: { xs: 300, sm: 420, md: 480 },
          borderRadius: 4,
          overflow: "hidden",
          bgcolor: "var(--pf-peach)",
          boxShadow: "var(--pf-shadow)",
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
      </Box>
      {list.length > 1 && (
        <Box sx={{ display: "flex", gap: 1.5, mt: 1.5 }} role="tablist" aria-label="Photos">
          {list.map((src, i) => (
            <Box
              key={src}
              component="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setActive(i)}
              sx={{
                position: "relative",
                width: 88,
                height: 68,
                borderRadius: 2,
                overflow: "hidden",
                p: 0,
                cursor: "pointer",
                border: "3px solid",
                borderColor: i === active ? "primary.main" : "transparent",
                opacity: i === active ? 1 : 0.7,
                transition: "all .2s ease",
                "&:hover": { opacity: 1 },
              }}
            >
              <Image src={src} alt="" fill sizes="88px" style={{ objectFit: "cover" }} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PetGallery;

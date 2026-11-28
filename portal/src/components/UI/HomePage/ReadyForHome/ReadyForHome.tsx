"use client";

import { useState } from "react";
import { Box, ClickAwayListener, Container, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import SectionHeading from "@/components/Shared/SectionHeading";
import { lifestyleHotspots, lifestyleImage } from "@/mock/stories";

//* Lifestyle photo with hotspots explaining what every listed pet comes with.
const ReadyForHome = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Container component="section" aria-labelledby="ready-title" sx={{ py: { xs: 6, md: 10 } }}>
      <SectionHeading
        id="ready-title"
        overline="Our standard"
        title={<>Every pet comes <em>ready</em> for home</>}
        sub="Verified shelters agree to the same care checklist before a pet is listed. Tap a marker to see what's included."
      />

      <ClickAwayListener onClickAway={() => setOpen(null)}>
        <Box sx={{ position: "relative", aspectRatio: { xs: "4 / 3", md: "21 / 9" }, borderRadius: "var(--pf-radius-card)", overflow: "hidden", bgcolor: "var(--pf-sand)" }}>
          <Image src={lifestyleImage} alt="Two adopted dogs running down a country path at sunset" fill sizes="(max-width: 1536px) 100vw, 1536px" style={{ objectFit: "cover" }} />

          {lifestyleHotspots.map((h, i) => (
            <Tooltip
              key={h.title}
              arrow
              open={open === i}
              onClose={() => setOpen(null)}
              disableHoverListener
              disableFocusListener
              disableTouchListener
              placement={h.y > 55 ? "top" : "bottom"}
              componentsProps={{
                tooltip: { sx: { bgcolor: "background.paper", color: "text.primary", boxShadow: "var(--pf-shadow)", borderRadius: 3, p: 2, maxWidth: 260 } },
                arrow: { sx: { color: "background.paper" } },
              }}
              title={
                <>
                  <Typography sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, fontSize: 18 }}>{h.title}</Typography>
                  <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5, lineHeight: 1.5 }}>{h.text}</Typography>
                </>
              }
            >
              <Box
                component="button"
                type="button"
                aria-label={h.title}
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
                onMouseEnter={() => setOpen(i)}
                sx={{
                  position: "absolute",
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "3px solid #fff",
                  bgcolor: open === i ? "secondary.main" : "rgba(255,255,255,.35)",
                  backdropFilter: "blur(4px)",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  "&::after": { content: '""', width: 10, height: 10, borderRadius: "50%", bgcolor: "#fff" },
                  "&::before": { content: '""', position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid rgba(255,255,255,.7)", animation: "pf-ping 2s ease-out infinite" },
                  "&:focus-visible": { outline: "3px solid", outlineColor: "secondary.main", outlineOffset: 3 },
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </ClickAwayListener>
    </Container>
  );
};

export default ReadyForHome;

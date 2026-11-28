"use client";

import { useState } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import VerifiedIcon from "@mui/icons-material/Verified";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ease } from "@/components/UI/Motion";
import HeroSearch from "./components/HeroSearch";
import ArchImage from "../../ArchImage";
import CircleText from "../../CircleText";
import { heroPetImage } from "@/mock/pets";
import { rehomeHeroImage } from "@/mock/stories";

type Audience = "adopt" | "rehome";

const copy: Record<Audience, { before: string; em: string; after: string; sub: string; image: string; alt: string; cta: { label: string; href: string }; alt2: { label: string; href: string }; ring: string }> = {
  adopt: {
    before: "Find the friend who",
    em: "chooses",
    after: "you back",
    sub: "Meet vet-checked dogs, cats and small pets from verified shelters and owners near you. Browsing is always free.",
    image: heroPetImage,
    alt: "Happy beagle waiting for adoption",
    cta: { label: "Find a pet", href: "/pets" },
    alt2: { label: "How adoption works", href: "#how-it-works" },
    ring: "Adopt · Don't shop · Adopt · Don't shop · ",
  },
  rehome: {
    before: "Give your pet a",
    em: "safe",
    after: "next chapter",
    sub: "List pets with photos and video, screen applicants, chat and book meet-and-greets, all in one place. Start free with 3 listings.",
    image: rehomeHeroImage,
    alt: "Dog on a walk with its owner",
    cta: { label: "List a pet", href: "/register" },
    alt2: { label: "See plans", href: "/pricing" },
    ring: "Rehome · Responsibly · Rehome · Responsibly · ",
  },
};

const HeroSection = () => {
  const [audience, setAudience] = useState<Audience>("adopt");
  const c = copy[audience];

  return (
    <Box component="section" sx={{ position: "relative", overflow: "hidden", pt: { xs: 4, md: 6 }, pb: { xs: 3, md: 5 } }}>
      {/* Soft sand shape behind the photo */}
      <Box aria-hidden className="pf-blob" sx={{ position: "absolute", width: { xs: 360, md: 620 }, height: { xs: 360, md: 620 }, right: { xs: -140, md: -80 }, top: { xs: 260, md: -60 }, bgcolor: "var(--pf-sand)", opacity: 0.7 }} />

      <Container sx={{ position: "relative" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" }, gap: { xs: 4, md: 8 }, alignItems: "center" }}>
          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            {/* Audience switch */}
            <Box
              role="radiogroup"
              aria-label="I want to"
              className="pf-fade-up"
              sx={{ display: "inline-flex", p: 0.5, borderRadius: 999, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", mb: 3 }}
            >
              {(["adopt", "rehome"] as Audience[]).map((a) => (
                <Box
                  key={a}
                  component="button"
                  type="button"
                  role="radio"
                  aria-checked={audience === a}
                  onClick={() => setAudience(a)}
                  sx={{
                    border: 0,
                    cursor: "pointer",
                    px: 2.25,
                    py: 0.9,
                    borderRadius: 999,
                    font: "inherit",
                    fontWeight: 700,
                    fontSize: 14,
                    position: "relative",
                    isolation: "isolate",
                    color: audience === a ? "background.default" : "text.secondary",
                    bgcolor: "transparent",
                    transition: "color .25s ease",
                    "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                  }}
                >
                  {/* Sliding pill behind the active option */}
                  {audience === a && (
                    <motion.span
                      layoutId="hero-audience-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      style={{ position: "absolute", inset: 0, borderRadius: 999, zIndex: -1, background: "var(--mui-palette-text-primary)" }}
                    />
                  )}
                  {a === "adopt" ? "I want to adopt" : "I'm rehoming a pet"}
                </Box>
              ))}
            </Box>

            {/* Copy cross-fades when the audience switch changes */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={audience}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease }}
              >
                <Typography
                  variant="h1"
                  className="pf-fade-up"
                  sx={{ fontSize: { xs: "2.5rem", sm: "3.2rem", md: "4.4rem" }, color: "text.primary" }}
                >
                  {c.before}{" "}
                  <Box component="em" sx={{ color: "secondary.main", fontStyle: "italic" }}>
                    {c.em}
                  </Box>{" "}
                  {c.after}
                </Typography>
                <Typography
                  className="pf-fade-up pf-delay-1"
                  sx={{ mt: 2.5, maxWidth: 480, mx: { xs: "auto", md: 0 }, color: "text.secondary", fontSize: { xs: 16, md: 18 }, lineHeight: 1.65 }}
                >
                  {c.sub}
                </Typography>
              </motion.div>
            </AnimatePresence>

            <Box className="pf-fade-up pf-delay-2" sx={{ display: "flex", gap: 1.5, mt: 4, flexWrap: "wrap", justifyContent: { xs: "center", md: "flex-start" } }}>
              <Button component={Link} href={c.cta.href} size="large" endIcon={<ArrowOutwardIcon />}>
                {c.cta.label}
              </Button>
              <Button component={Link} href={c.alt2.href} size="large" variant="outlined">
                {c.alt2.label}
              </Button>
            </Box>
          </Box>

          {/* Arched photo with rotating badge and trust chip */}
          <Box className="pf-fade-up pf-delay-2" sx={{ position: "relative", maxWidth: { xs: 340, md: 460 }, width: "100%", mx: "auto" }}>
            <ArchImage key={c.image} src={c.image} alt={c.alt} priority sizes="(max-width: 900px) 340px, 460px" />
            <Box sx={{ position: "absolute", left: { xs: -16, md: -56 }, bottom: { xs: 24, md: 48 }, bgcolor: "background.paper", borderRadius: "50%", boxShadow: "var(--pf-shadow)" }}>
              <CircleText text={c.ring} size={128}>
                <Box component={Link} href={c.cta.href} aria-label={c.cta.label} sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "secondary.main", color: "#fff", display: "grid", placeItems: "center", transition: "transform .25s ease", "&:hover": { transform: "rotate(45deg)" } }}>
                  <ArrowOutwardIcon />
                </Box>
              </CircleText>
            </Box>
            <Box
              className="pf-float"
              sx={{ position: "absolute", right: { xs: -8, md: -28 }, top: { xs: 28, md: 56 }, display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.25, borderRadius: 999, bgcolor: "background.paper", boxShadow: "var(--pf-shadow)" }}
            >
              <VerifiedIcon sx={{ color: "primary.main" }} fontSize="small" />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Verified shelters</Typography>
            </Box>
          </Box>
        </Box>

        {/* Search card (adopters) */}
        <Box className="pf-fade-up pf-delay-3" sx={{ maxWidth: 960, mx: "auto", mt: { xs: 5, md: 7 } }}>
          <HeroSearch />
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;

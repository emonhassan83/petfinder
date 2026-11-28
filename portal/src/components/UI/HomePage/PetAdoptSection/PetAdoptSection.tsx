"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, Container, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PetsIcon from "@mui/icons-material/Pets";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Image from "next/image";
import Link from "next/link";
import { previewPets } from "@/mock/pets";
import FavoriteButton from "../../FavoriteButton";
import QuickViewDrawer, { QuickViewPet } from "../../QuickViewDrawer";

type FeaturedPet = QuickViewPet & { species: string; gender: string };

//* "Pets available for adoption nearby" carousel: API pets when available, preview pets otherwise.
const PetAdoptSection = () => {
  const [pets, setPets] = useState<FeaturedPet[]>(previewPets);
  const [active, setActive] = useState(0);
  const [quick, setQuick] = useState<FeaturedPet | null>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (!url) return;
    fetch(`${url}/pets?limit=8`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.data?.length) setPets(d.data);
      })
      .catch(() => {});
  }, []);

  const cardWidth = () => {
    const el = track.current?.querySelector<HTMLElement>("[data-card]");
    return el ? el.offsetWidth + 24 : 300;
  };

  const scrollTo = (i: number) => {
    const next = Math.max(0, Math.min(pets.length - 1, i));
    track.current?.scrollTo({ left: next * cardWidth(), behavior: "smooth" });
  };

  const onScroll = () => {
    if (!track.current) return;
    setActive(Math.round(track.current.scrollLeft / cardWidth()));
  };

  return (
    <Container component="section" sx={{ py: { xs: 5, md: 8 } }} aria-labelledby="featured-pets">
      <Typography id="featured-pets" variant="h3" textAlign="center" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" }, mb: 1 }}>
        Pets Available for Adoption Nearby
      </Typography>
      <Typography textAlign="center" color="text.secondary" sx={{ mb: { xs: 3, md: 5 } }}>
        Wonderful dogs, cats and more are waiting for you right now.
      </Typography>

      <Box sx={{ position: "relative", px: { md: 7 } }}>
        <IconButton aria-label="Previous pets" onClick={() => scrollTo(active - 1)} sx={arrowSx("left")}>
          <ChevronLeftIcon />
        </IconButton>

        <Box
          ref={track}
          onScroll={onScroll}
          sx={{
            display: "flex",
            gap: 3,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            pb: 2,
            pt: 1,
          }}
        >
          {pets.map((pet) => (
            <Box
              key={pet.id}
              data-card
              className="pf-lift"
              sx={{
                flex: { xs: "0 0 82%", sm: "0 0 46%", md: "0 0 calc((100% - 72px) / 4)" },
                scrollSnapAlign: "start",
                bgcolor: "background.paper",
                borderRadius: "var(--pf-radius-card)",
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                "& img": { transition: "transform .6s cubic-bezier(0.22, 1, 0.36, 1)" },
                "&:hover img": { transform: "scale(1.07)" },
                "&:hover .pf-quick, &:focus-within .pf-quick": { opacity: 1, transform: "none" },
              }}
            >
              <Box sx={{ position: "relative", height: 230, overflow: "hidden" }}>
                <Link href={petHref(pet.id)} aria-label={`View ${pet.name}`}>
                  <Image src={pet.image} alt={pet.name} fill sizes="(max-width: 600px) 82vw, 25vw" style={{ objectFit: "cover" }} />
                </Link>
                <FavoriteButton pet={pet} />
                {/* Quick view: always visible on touch, revealed on hover/focus with a mouse */}
                <Button
                  className="pf-quick"
                  size="small"
                  startIcon={<VisibilityOutlinedIcon />}
                  onClick={() => setQuick(pet)}
                  aria-label={`Quick view ${pet.name}`}
                  sx={{
                    position: "absolute",
                    left: 12,
                    bottom: 12,
                    py: 0.5,
                    px: 1.75,
                    bgcolor: "background.paper",
                    color: "text.primary",
                    "&:hover": { bgcolor: "background.paper" },
                    "@media (hover: hover)": { opacity: 0, transform: "translateY(6px)", transition: "opacity .25s ease, transform .25s ease" },
                  }}
                >
                  Quick view
                </Button>
              </Box>
              <Box component={Link} href={petHref(pet.id)} sx={{ display: "block", p: 2 }}>
                <Typography variant="h6" sx={{ fontSize: 18 }}>
                  {pet.name}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                  {pet.age} {Number(pet.age) === 1 ? "year" : "years"}, {pet.gender}, {pet.species}
                </Typography>
                <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 700, mt: 0.5 }}>
                  {pet.location}
                </Typography>
              </Box>
            </Box>
          ))}
          {/* Closing tile, like petfinder.com's "more pets available" card */}
          <Box
            component={Link}
            href="/pets"
            data-card
            sx={{
              flex: { xs: "0 0 82%", sm: "0 0 46%", md: "0 0 calc((100% - 72px) / 4)" },
              scrollSnapAlign: "start",
              borderRadius: "var(--pf-radius-card)",
              bgcolor: "primary.main",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              minHeight: 330,
              textAlign: "center",
              p: 3,
              transition: "transform .25s ease, background-color .25s ease",
              "&:hover": { transform: "translateY(-6px)", bgcolor: "primary.dark" },
            }}
          >
            <PetsIcon sx={{ fontSize: 48 }} />
            <Typography sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, fontSize: 24 }}>
              Meet more pets
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>Hundreds more are waiting near you</Typography>
          </Box>
        </Box>

        <IconButton aria-label="Next pets" onClick={() => scrollTo(active + 1)} sx={arrowSx("right")}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Dots */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 2 }} role="tablist" aria-label="Featured pets">
        {pets.map((p, i) => (
          <Box
            key={p.id}
            component="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Show ${p.name}`}
            onClick={() => scrollTo(i)}
            sx={{
              width: i === active ? 22 : 8,
              height: 8,
              borderRadius: 8,
              border: 0,
              p: 0,
              cursor: "pointer",
              bgcolor: i === active ? "var(--pf-rust)" : "divider",
              transition: "all .3s ease",
            }}
          />
        ))}
      </Box>

      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Button component={Link} href="/pets" variant="outlined" sx={{ borderWidth: 2, "&:hover": { borderWidth: 2 } }}>
          View all pets
        </Button>
      </Box>

      <QuickViewDrawer pet={quick} onClose={() => setQuick(null)} />
    </Container>
  );
};

//* Pet detail URL (preview pets resolve from mock data)
const petHref = (id: string) => `/pets/${id}`;

const arrowSx = (side: "left" | "right") => ({
  display: { xs: "none", md: "inline-flex" },
  position: "absolute",
  top: "40%",
  [side]: 0,
  color: "text.primary",
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  "&:hover": { bgcolor: "primary.main", color: "#fff", borderColor: "primary.main" },
});

export default PetAdoptSection;

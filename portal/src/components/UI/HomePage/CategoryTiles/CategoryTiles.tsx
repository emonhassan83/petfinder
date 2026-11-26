"use client";

import { Box, Container, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { unsplash } from "@/mock/pets";

const tiles = [
  { label: "Dogs", href: "/pets?species=Dog", image: unsplash("1587300003388-59208cc962cb", 240) },
  { label: "Cats", href: "/pets?species=Cat", image: unsplash("1514888286974-6c03e2ca1dba", 240) },
  { label: "Other Animals", href: "/pets?species=Rabbit", image: unsplash("1585110396000-c9ffd4e4b308", 240) },
  { label: "Shelters & Rescues", href: "/shelters", image: unsplash("1583337130417-3346a1be7dee", 240) },
];

//* Quick-entry tiles (petfinder.com style) under the hero search
const CategoryTiles = () => (
  <Container component="section" aria-label="Browse by category" sx={{ pt: { xs: 4, md: 6 } }}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: { xs: 2, md: 3 }, maxWidth: 1000, mx: "auto" }}>
      {tiles.map(({ label, href, image }, i) => (
        <Box
          key={label}
          component={Link}
          href={href}
          className="pf-fade-up"
          style={{ animationDelay: `${0.1 * i}s` }}
          sx={{
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
            p: { xs: 2.5, md: 3 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            textAlign: "center",
            transition: "transform .25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow .25s ease, border-color .25s ease",
            "&:hover": { transform: "translateY(-6px)", boxShadow: "var(--pf-shadow)", borderColor: "primary.main" },
            "&:hover .tile-photo": { transform: "scale(1.08) rotate(-3deg)", boxShadow: "0 0 0 4px var(--pf-primary)" },
          }}
        >
          <Box
            className="tile-photo"
            sx={{
              position: "relative",
              width: { xs: 72, md: 88 },
              height: { xs: 72, md: 88 },
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow: "0 0 0 4px var(--pf-peach)",
              transition: "all .3s ease",
            }}
          >
            <Image src={image} alt="" fill sizes="88px" style={{ objectFit: "cover" }} />
          </Box>
          <Typography sx={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700, fontSize: { xs: 15, md: 17 }, color: "text.primary" }}>
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  </Container>
);

export default CategoryTiles;

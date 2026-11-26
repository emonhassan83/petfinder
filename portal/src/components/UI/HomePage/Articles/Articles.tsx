"use client";

import { Box, Chip, Container, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { previewArticles } from "@/mock/pets";

//* Dog & cat adoption articles (preview content until blog API is wired here)
const Articles = () => {
  const groups = ["Dog adoption", "Cat adoption"];
  return (
    <Box component="section" sx={{ bgcolor: "var(--pf-soft)", py: { xs: 6, md: 9 } }} aria-labelledby="articles">
      <Container>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 2, mb: 4 }}>
          <Box>
            <Typography id="articles" variant="h3" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" } }}>
              Adoption Articles
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Helpful advice from vets, trainers and adopters.
            </Typography>
          </Box>
          <Typography component={Link} href="/blogs" sx={{ color: "primary.main", fontWeight: 700 }}>
            View all articles →
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4 }}>
          {groups.map((g) => (
            <Box key={g} sx={{ display: "grid", gap: 2.5 }}>
              <Typography variant="h6" sx={{ color: "var(--pf-rust)" }}>
                {g} articles
              </Typography>
              {previewArticles
                .filter((a) => a.category === g)
                .map((a) => (
                  <Box
                    key={a.id}
                    component={Link}
                    href="/blogs"
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "110px 1fr", sm: "160px 1fr" },
                      gap: 2,
                      bgcolor: "background.paper",
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "box-shadow .25s ease, transform .25s ease",
                      "&:hover": { boxShadow: "var(--pf-shadow)", transform: "translateY(-3px)" },
                      "&:hover img": { transform: "scale(1.08)" },
                    }}
                  >
                    <Box sx={{ position: "relative", minHeight: 120, overflow: "hidden" }}>
                      <Image src={a.image} alt="" fill sizes="160px" style={{ objectFit: "cover", transition: "transform .6s ease" }} />
                    </Box>
                    <Box sx={{ py: 2, pr: 2 }}>
                      <Chip size="small" label={`${a.read} read`} sx={{ bgcolor: "primary.light", color: "primary.main", mb: 1 }} />
                      <Typography sx={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700, color: "text.primary", lineHeight: 1.3 }}>
                        {a.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: { xs: "none", sm: "block" } }}>
                        {a.excerpt}
                      </Typography>
                    </Box>
                  </Box>
                ))}
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Articles;

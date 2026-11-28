"use client";

import { Box, Button, Container, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Image from "next/image";
import Link from "next/link";
import SectionHeading from "@/components/Shared/SectionHeading";
import BeforeAfter from "../../BeforeAfter";
import { successStories } from "@/mock/stories";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

//* Home teaser: featured before/after story plus two story cards. Full lookbook lives at /stories (step 6).
const SuccessStories = () => {
  const [featured, ...others] = successStories;
  const rest = others.slice(0, 2);

  return (
    <Box component="section" aria-labelledby="stories-title" sx={{ bgcolor: "var(--pf-soft)", py: { xs: 6, md: 10 } }}>
      <Container>
        <SectionHeading id="stories-title" overline="Happy tails" title={<>Stories that started <em>here</em></>} sub="Real adoptions from our shelters and families. Drag the slider to see how far they've come." />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" }, gap: { xs: 3, md: 5 }, alignItems: "stretch" }}>
          {/* Featured */}
          <Box sx={{ bgcolor: "background.paper", borderRadius: "var(--pf-radius-card)", p: { xs: 2, md: 2.5 }, border: "1px solid", borderColor: "divider" }}>
            {featured.before && featured.after ? (
              <BeforeAfter before={featured.before} after={featured.after} alt={featured.petName} ratio="16 / 11" />
            ) : null}
            <Box sx={{ px: { xs: 1, md: 1.5 }, pt: 2.5, pb: 1 }}>
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                {featured.petName} · adopted {formatDate(featured.adoptedOn)}
              </Typography>
              <Typography variant="h4" component="h3" sx={{ fontSize: { xs: 24, md: 30 }, mt: 0.5 }}>
                {featured.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
                {featured.excerpt}
              </Typography>
              <Typography sx={{ mt: 2, fontWeight: 700 }}>
                {featured.family}, {featured.city}
              </Typography>
            </Box>
          </Box>

          {/* Other stories */}
          <Box sx={{ display: "grid", gap: 3, alignContent: "start" }}>
            {rest.map((s) => (
              <Box key={s.id} className="pf-lift" sx={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 2.5, alignItems: "center", bgcolor: "background.paper", borderRadius: "var(--pf-radius-card)", p: 2, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ position: "relative", aspectRatio: "1", borderRadius: "999px 999px 16px 16px", overflow: "hidden" }}>
                  <Image src={s.image} alt={s.petName} fill sizes="120px" style={{ objectFit: "cover" }} />
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                    {s.petName} · {s.city}
                  </Typography>
                  <Typography variant="h6" component="h3" sx={{ lineHeight: 1.3 }}>
                    {s.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 14, mt: 0.75, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {s.excerpt}
                  </Typography>
                </Box>
              </Box>
            ))}
            <Box>
              <Button component={Link} href="/stories" variant="outlined" endIcon={<ArrowForwardIcon />}>
                Read more stories
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default SuccessStories;

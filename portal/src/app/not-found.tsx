"use client";

import { Box, Button, Container, Typography } from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import Link from "next/link";

const NotFoundPage = () => (
  <Box sx={{ minHeight: "100vh", bgcolor: "var(--pf-peach)", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
    <PetsIcon className="pf-float" sx={{ position: "absolute", top: "18%", left: "12%", fontSize: 60, color: "secondary.main", opacity: 0.25 }} />
    <PetsIcon className="pf-float" sx={{ position: "absolute", bottom: "16%", right: "14%", fontSize: 80, color: "secondary.main", opacity: 0.2, animationDelay: "1s" }} />
    <Container sx={{ textAlign: "center", position: "relative" }}>
      <Typography className="pf-fade-up" sx={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 800, fontSize: { xs: "6rem", md: "9rem" }, lineHeight: 1, color: "var(--pf-rust)" }}>
        404
      </Typography>
      <Typography variant="h3" className="pf-fade-up pf-delay-1" sx={{ fontSize: { xs: "1.6rem", md: "2.4rem" }, mt: 2 }}>
        This page wandered off
      </Typography>
      <Typography color="text.secondary" className="pf-fade-up pf-delay-2" sx={{ mt: 1.5, mb: 4 }}>
        We couldn&apos;t find what you were looking for, but plenty of pets are waiting to meet you.
      </Typography>
      <Box className="pf-fade-up pf-delay-3" sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
        <Button component={Link} href="/pets">
          Find a pet
        </Button>
        <Button component={Link} href="/" variant="outlined">
          Back home
        </Button>
      </Box>
    </Container>
  </Box>
);

export default NotFoundPage;
